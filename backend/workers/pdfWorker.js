import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import axios from 'axios';
import { PDFParse } from 'pdf-parse';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { Embeddings } from '@langchain/core/embeddings';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { MongoDBAtlasVectorSearch } from '@langchain/mongodb';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

import Document from '../models/Document.js';

dotenv.config();

class CustomGeminiEmbeddings extends Embeddings {
  constructor(fields) {
    super(fields ?? {});
    this.apiKey = fields?.apiKey || process.env.GEMINI_API_KEY;
    this.modelName = fields?.modelName || 'gemini-embedding-001';
    this.dimensions = fields?.dimensions || 768;
    this.genAI = new GoogleGenerativeAI(this.apiKey);
  }

  async embedDocuments(texts) {
    const model = this.genAI.getGenerativeModel({ model: this.modelName });
    const promises = texts.map(async (text) => {
      const result = await model.embedContent({
        content: { parts: [{ text }] },
        outputDimensionality: this.dimensions,
      });
      return result.embedding.values;
    });
    return Promise.all(promises);
  }

  async embedQuery(text) {
    const model = this.genAI.getGenerativeModel({ model: this.modelName });
    const result = await model.embedContent({
      content: { parts: [{ text }] },
      outputDimensionality: this.dimensions,
    });
    return result.embedding.values;
  }
}

const connection = new IORedis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null,
});

connection.on('error', (err) => {
  console.error('[-] Worker Redis Connection Error:', err.message);
});

console.log('[*] Initializing Background PDF Processing Worker...');

const worker = new Worker(
  'pdf-processing',
  async (job) => {
    const { documentId, pdfUrl, userId, folderId } = job.data;
    console.log(`[Worker] Job ${job.id} started: Processing document ${documentId}`);

    // Update document status to processing
    await Document.findByIdAndUpdate(documentId, {
      status: 'processing',
      processingError: null,
    });

    try {
      // 1. Download PDF file buffer
      console.log(`[Worker] Downloading PDF from Cloudinary: ${pdfUrl}`);
      const response = await axios.get(pdfUrl, { responseType: 'arraybuffer' });
      const pdfBuffer = Buffer.from(response.data);

      // 2. Extract raw text
      console.log(`[Worker] Extracting text from PDF buffer...`);
      const parser = new PDFParse({ data: pdfBuffer });
      const parsedData = await parser.getText();
      const textContent = parsedData.text;
      await parser.destroy(); // clean up resources

      if (!textContent || textContent.trim().length === 0) {
        throw new Error('PDF file has no extractable or readable text content.');
      }

      console.log(`[Worker] Text extracted. Length: ${textContent.length} characters.`);

      // 3. Chunk text into overlapping segments
      console.log(`[Worker] Splitting text into chunks...`);
      const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 150,
      });

      const docs = await splitter.createDocuments(
        [textContent],
        [
          {
            documentId: documentId.toString(),
            folderId: folderId ? folderId.toString() : null,
            ownerId: userId.toString(),
          },
        ]
      );

      console.log(`[Worker] Created ${docs.length} overlapping text chunks.`);

      // 4. Connect to MongoDB Atlas Vector collection
      // langChain needs the raw MongoDB collection object
      const dbCollection = mongoose.connection.db.collection('embeddings');

      // 5. Generate Vector Embeddings and store in Atlas
      console.log(`[Worker] Generating embeddings with Google Gemini (gemini-embedding-001) & uploading to Atlas Search index...`);
      const embeddings = new CustomGeminiEmbeddings({
        apiKey: process.env.GEMINI_API_KEY,
        modelName: 'gemini-embedding-001',
        dimensions: 768,
      });

      await MongoDBAtlasVectorSearch.fromDocuments(docs, embeddings, {
        collection: dbCollection,
        indexName: 'pdf_vector_index', // Name of Vector Search index in MongoDB Atlas UI
        textKey: 'text',
        embeddingKey: 'embedding',
      });

      // 6. Complete status updates
      await Document.findByIdAndUpdate(documentId, {
        status: 'completed',
        processingError: null,
      });

      console.log(`[Worker] Job ${job.id} succeeded: Document ${documentId} is now Ready.`);

    } catch (error) {
      console.error(`[Worker] Job ${job.id} failed:`, error.message);

      // Save error details to database
      await Document.findByIdAndUpdate(documentId, {
        status: 'failed',
        processingError: error.message || 'Unknown processing error.',
      });

      // Re-throw so BullMQ can attempt retries
      throw error;
    }
  },
  {
    connection,
    concurrency: 2, // Process up to 2 PDFs concurrently
  }
);

worker.on('failed', (job, err) => {
  console.error(`[Worker] Job ${job?.id} failed permanently: ${err.message}`);
});

worker.on('completed', (job) => {
  console.log(`[Worker] Job ${job.id} marked as completed.`);
});

export default worker;
