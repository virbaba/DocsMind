# PDF Processing Pipeline Setup Guide (BullMQ, Redis, Gemini, & MongoDB)

This document provides a step-by-step installation and configuration plan for setting up a robust, asynchronous background PDF processing pipeline in your **DocsMind** project.

---

## Table of Contents
1. [Third-Party Services & Infrastructure Setup](#1-third-party-services--infrastructure-setup)
2. [Backend Package Installation](#2-backend-package-installation)
3. [Backend Configuration & Environment Setup](#3-backend-configuration--environment-setup)
4. [Backend Code Implementation Tasks](#4-backend-code-implementation-tasks)
5. [Frontend Integration](#5-frontend-integration)
6. [Development Workflow & How to Run](#6-development-workflow--how-to-run)

---

## 1. Third-Party Services & Infrastructure Setup

Before writing code, you need to configure the following services and retrieve their credentials.

### A. Cloudinary (PDF Storage)
1. Sign up for a free account at [Cloudinary](https://cloudinary.com/).
2. Navigate to your Dashboard and copy:
   - **Cloud Name**
   - **API Key**
   - **API Secret**

### B. Google Gemini API (Vector Embeddings)
1. Go to [Google AI Studio](https://aistudio.google.com/).
2. Create a free API Key.
3. Save the key as `GEMINI_API_KEY`.

### C. MongoDB Atlas Vector Search Index
1. Log in to your [MongoDB Atlas Dashboard](https://cloud.mongodb.com/).
2. Choose your cluster and click **Search** or **Atlas Search** on the left menu.
3. Click **Create Search Index**.
4. Select **JSON Editor** under **Atlas Vector Search** (do NOT choose Atlas Search).
5. Choose your database and the collection name where you will store vector chunks (e.g., `embeddings` or `chunks`).
6. Paste the following JSON configuration and click **Create Search Index**:
```json
{
  "fields": [
    {
      "type": "vector",
      "path": "embedding",
      "numDimensions": 768,
      "similarity": "cosine"
    },
    {
      "type": "filter",
      "path": "documentId"
    },
    {
      "type": "filter",
      "path": "folderId"
    },
    {
      "type": "filter",
      "path": "ownerId"
    }
  ]
}
```
*Note: `numDimensions: 768` matches the output size of Gemini's `text-embedding-004` model.*

### D. Redis (Queue Broker)
BullMQ requires a Redis server to manage jobs.
- **Local Development**:
  - Install Redis via Homebrew (macOS):
    ```bash
    brew install redis
    brew services start redis
    ```
  - Or run with Docker:
    ```bash
    docker run --name docsmind-redis -p 6379:6379 -d redis
    ```
- **Production Hosting**:
  - Provision a free Redis instance on [Upstash Redis](https://upstash.com/) or [Aiven](https://aiven.io/).
  - Copy the Redis Connection URL (e.g., `rediss://default:pwd@host:port`).

---

## 2. Backend Package Installation

In your backend directory (`/backend`), run the following command to install the required packages:

```bash
npm install multer cloudinary multer-storage-cloudinary pdf-parse axios bullmq ioredis @langchain/core @langchain/textsplitters @langchain/google-genai @langchain/mongodb
```

### What these packages do:
*   `multer`, `cloudinary`, `multer-storage-cloudinary`: Upload PDFs directly to Cloudinary from multi-part form requests.
*   `pdf-parse` & `axios`: Downloads the uploaded file from Cloudinary into a buffer and extracts the text content.
*   `bullmq` & `ioredis`: Manages the background processing queue and connects to the Redis broker.
*   `@langchain/textsplitters`: Splitting the text into smart, overlapping chunks using `RecursiveCharacterTextSplitter`.
*   `@langchain/google-genai`: Calls the Gemini Embeddings API using the `text-embedding-004` model.
*   `@langchain/mongodb`: Maps the chunks and embeddings into your MongoDB collection using Atlas Vector Search format.

---

## 3. Backend Configuration & Environment Setup

Add the following environment variables to your `backend/.env` file:

```env
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Gemini AI Studio Key
GEMINI_API_KEY=your_gemini_api_key

# Redis Configuration
# Use local redis URI for dev: redis://127.0.0.1:6379
REDIS_URL=redis://127.0.0.1:6379
```

---

## 4. Backend Code Implementation Tasks

Follow this layout to implement the code in your backend:

### Step A: Update the Document Model (`backend/models/Document.js`)
Add status monitoring columns to let the user track processing.

```javascript
// Add these fields inside your schema definition in backend/models/Document.js
status: {
  type: String,
  enum: ['queued', 'processing', 'completed', 'failed'],
  default: 'queued',
},
processingError: {
  type: String,
  default: null,
},
```

### Step B: Configure Cloudinary Storage Middleware (`backend/config/cloudinary.js`)
Create a new file `backend/config/cloudinary.js` to manage the Multer-Cloudinary connection:

```javascript
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import dotenv from 'dotenv';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'docsmind_pdfs',
    allowed_formats: ['pdf'],
    resource_type: 'raw', // Critical: Cloudinary handles PDFs as 'raw' or 'image' depending on config
  },
});

export const upload = multer({ storage });
```

### Step C: Configure BullMQ Queue (`backend/config/queue.js`)
Create `backend/config/queue.js` to initialize the job queue:

```javascript
import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const connection = new IORedis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', {
  maxRetriesPerRequest: null,
});

export const pdfQueue = new Queue('pdf-processing', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000, // wait 5s, 10s, 20s...
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
});
```

### Step D: Create the Background Worker (`backend/workers/pdfWorker.js`)
Create `backend/workers/pdfWorker.js`. This worker downloads the PDF, extracts text, chunks it, calls Gemini, and saves it to MongoDB.

```javascript
import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import axios from 'axios';
import pdfParse from 'pdf-parse';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { MongoDBAtlasVectorSearch } from '@langchain/mongodb';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

import Document from '../models/Document.js';

dotenv.config();

const connection = new IORedis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', {
  maxRetriesPerRequest: null,
});

const worker = new Worker(
  'pdf-processing',
  async (job) => {
    const { documentId, pdfUrl, userId, folderId } = job.data;
    console.log(`[Worker] Started processing document ID: ${documentId}`);

    // Update status to processing
    await Document.findByIdAndUpdate(documentId, { status: 'processing' });

    try {
      // 1. Download PDF Buffer
      const response = await axios.get(pdfUrl, { responseType: 'arraybuffer' });
      const pdfBuffer = Buffer.from(response.data);

      // 2. Extract Text
      const parsedData = await pdfParse(pdfBuffer);
      const rawText = parsedData.text;

      if (!rawText || rawText.trim().length === 0) {
        throw new Error('No readable text found in PDF.');
      }

      // 3. Chunk text
      const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 150,
      });
      const chunks = await splitter.createDocuments(
        [rawText],
        [
          {
            documentId: documentId.toString(),
            folderId: folderId ? folderId.toString() : null,
            ownerId: userId.toString(),
          },
        ]
      );

      // 4. Connect to MongoDB Atlas Vector collection
      // By default, langchain will store fields like 'text', 'embedding' and 'metadata'
      const collection = mongoose.connection.db.collection('embeddings');

      // Initialize Gemini Embeddings Model
      const embeddings = new GoogleGenerativeAIEmbeddings({
        apiKey: process.env.GEMINI_API_KEY,
        modelName: 'text-embedding-004',
      });

      // 5. Compute embeddings and batch upload vectors
      await MongoDBAtlasVectorSearch.fromDocuments(chunks, embeddings, {
        collection,
        indexName: 'default', // matches the name you set in Atlas Search UI
        textKey: 'text',
        embeddingKey: 'embedding',
      });

      // 6. Complete status updates
      await Document.findByIdAndUpdate(documentId, { status: 'completed' });
      console.log(`[Worker] Finished processing document ID: ${documentId}`);

    } catch (error) {
      console.error(`[Worker] Error on document ${documentId}:`, error);
      await Document.findByIdAndUpdate(documentId, {
        status: 'failed',
        processingError: error.message,
      });
      throw error; // Let BullMQ retry if there are attempts remaining
    }
  },
  { connection, concurrency: 2 }
);

export default worker;
```

### Step E: Update standard uploads in Controller (`backend/controllers/documentController.js`)
Integrate Multer + Cloudinary upload, then delegate the slow processes to the queue:

```javascript
import Document from '../models/Document.js';
import { pdfQueue } from '../config/queue.js';

// Update createDocument controller
export const createDocument = async (req, res) => {
  try {
    const { folderId } = req.body;

    // Check if file was uploaded by multer
    if (!req.file) {
      return res.status(400).json({ message: 'No PDF file uploaded.' });
    }

    const fileUrl = req.file.path; // Cloudinary URL
    const fullName = req.file.originalname;
    const sizeInBytes = req.file.size;
    const sizeFormatted = (sizeInBytes / 1024).toFixed(1) + ' KB';

    // Create Document record in Mongo DB marked as 'queued'
    const doc = await Document.create({
      name: fullName.length > 20 ? fullName.slice(0, 17) + '...' : fullName,
      fullName,
      size: sizeFormatted,
      category: 'PDF Document',
      folder: folderId || null,
      user: req.user.id,
      url: fileUrl,
      status: 'queued',
    });

    // Enqueue the heavy job
    await pdfQueue.add(`process-${doc._id}`, {
      documentId: doc._id,
      pdfUrl: fileUrl,
      userId: req.user.id,
      folderId: folderId || null,
    });

    // Instantly return 202 Accepted status
    res.status(202).json({
      message: 'PDF Uploaded. Background vector processing started.',
      document: doc,
    });
  } catch (error) {
    console.error('[createDocument]', error);
    res.status(500).json({ message: 'Server error uploading PDF.' });
  }
};
```

### Step F: Setup Route Handler Hook (`backend/routes/documentRoutes.js`)
Configure Multer middleware inside document routes:

```javascript
import express from 'express';
import { getDocuments, createDocument, renameDocument, deleteDocument } from '../controllers/documentController.js';
import protect from '../middleware/protect.js';
import { upload } from '../config/cloudinary.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getDocuments)
  // Use upload.single('file') middleware to capture 'file' multipart uploads
  .post(upload.single('file'), createDocument);

router.route('/:id')
  .put(renameDocument)
  .delete(deleteDocument);

export default router;
```

### Step G: Start the worker in `backend/index.js`
Import the worker in your main server file to kick off the listener:
```javascript
// Add to the top of backend/index.js
import './workers/pdfWorker.js';
```

---

## 5. Frontend Integration

On the React client, you need to handle:
1. Sending the raw PDF file in a `FormData` object instead of a JSON body.
2. Handling or polling document statuses (`'queued'`, `'processing'`, `'completed'`, `'failed'`).

### A. React File Upload Function (using Axios)
```javascript
import axios from 'axios';

const uploadPDF = async (file, folderId = null) => {
  const formData = new FormData();
  formData.append('file', file);
  if (folderId) {
    formData.append('folderId', folderId);
  }

  try {
    const response = await axios.post('/api/documents', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    // Status code will be 202 (Accepted)
    console.log('Upload started:', response.data.document);
    return response.data.document;
  } catch (error) {
    console.error('Upload failed:', error.response?.data?.message || error.message);
  }
};
```

### B. Displaying status on UI
Update your document list UI to display a custom chip based on `doc.status`:

```jsx
const StatusBadge = ({ status }) => {
  switch (status) {
    case 'queued':
      return <span className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded-full animate-pulse">Queued</span>;
    case 'processing':
      return <span className="px-2 py-1 text-xs bg-yellow-200 text-yellow-800 rounded-full animate-pulse">Processing...</span>;
    case 'completed':
      return <span className="px-2 py-1 text-xs bg-green-200 text-green-800 rounded-full">Ready</span>;
    case 'failed':
      return <span className="px-2 py-1 text-xs bg-red-200 text-red-800 rounded-full">Failed</span>;
    default:
      return null;
  }
};
```

---

## 6. Development Workflow & How to Run

1. **Start Redis**:
   Make sure Redis is running locally:
   ```bash
   redis-cli ping
   # Expected response: PONG
   ```
2. **Start Backend**:
   Run `npm run dev` in the `/backend` folder. The node process will connect to MongoDB, Redis, and bootstrap the `pdfWorker`.
3. **Start Frontend**:
   Run `npm run dev` in `/frontend`.
4. Test uploading a PDF. Monitor the backend command line logs—you will see `[Worker] Started processing document ID: ...` and finally `[Worker] Finished processing document`. Check your MongoDB Atlas Dashboard `embeddings` collection to see the stored vector chunks.
