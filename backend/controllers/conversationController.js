import Conversation from '../models/Conversation.js';
import mongoose from 'mongoose';
import { GoogleGenerativeAI } from '@google/generative-ai';

// @desc    Get all conversation titles for logged-in user
// @route   GET /api/conversations
// @access  Private
export const getConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({ user: req.user.id })
      .select('title updatedAt messages')
      .sort({ updatedAt: -1 });

    const mapped = conversations.map((c) => ({
      id: c._id,
      title: c.title,
      updatedAt: c.updatedAt,
      messageCount: c.messages.length,
    }));

    res.status(200).json(mapped);
  } catch (error) {
    console.error('[getConversations]', error);
    res.status(500).json({ message: 'Server error retrieving conversations.' });
  }
};

// @desc    Get a single conversation by ID with all messages
// @route   GET /api/conversations/:id
// @access  Private
export const getConversationById = async (req, res) => {
  try {
    const { id } = req.params;
    const conversation = await Conversation.findOne({ _id: id, user: req.user.id });
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found or unauthorized.' });
    }
    res.status(200).json(conversation);
  } catch (error) {
    console.error('[getConversationById]', error);
    res.status(500).json({ message: 'Server error retrieving conversation details.' });
  }
};

// @desc    Create a new conversation or update messages in an existing one
// @route   POST /api/conversations
// @access  Private
export const saveConversation = async (req, res) => {
  try {
    const { id, title, messages } = req.body;

    if (id) {
      // Update existing conversation
      const conversation = await Conversation.findOne({ _id: id, user: req.user.id });
      if (!conversation) {
        return res.status(404).json({ message: 'Conversation not found or unauthorized.' });
      }
      
      if (title) {
        conversation.title = title.trim();
      }
      if (messages) {
        conversation.messages = messages;
      }
      await conversation.save();
      return res.status(200).json(conversation);
    } else {
      // Create new conversation
      if (!messages || messages.length === 0) {
        return res.status(400).json({ message: 'Cannot save an empty conversation.' });
      }

      let finalTitle = title ? title.trim() : 'New Chat';
      if (!title) {
        const firstUserMsg = messages.find((m) => m.sender === 'user');
        if (firstUserMsg) {
          finalTitle = firstUserMsg.text.substring(0, 30);
          if (firstUserMsg.text.length > 30) finalTitle += '...';
        }
      }

      const conversation = await Conversation.create({
        user: req.user.id,
        title: finalTitle,
        messages,
      });

      return res.status(201).json(conversation);
    }
  } catch (error) {
    console.error('[saveConversation]', error);
    res.status(500).json({ message: 'Server error saving conversation.' });
  }
};

// @desc    Delete a conversation
// @route   DELETE /api/conversations/:id
// @access  Private
export const deleteConversation = async (req, res) => {
  try {
    const { id } = req.params;
    const conversation = await Conversation.findOne({ _id: id, user: req.user.id });
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found or unauthorized.' });
    }

    await Conversation.deleteOne({ _id: id });
    res.status(200).json({ message: 'Conversation deleted successfully.' });
  } catch (error) {
    console.error('[deleteConversation]', error);
    res.status(500).json({ message: 'Server error deleting conversation.' });
  }
};

// @desc    Query RAG pipeline with real-time SSE stream responses
// @route   POST /api/conversations/query
// @access  Private
export const queryRAG = async (req, res) => {
  try {
    const { message, conversationId, filters } = req.body;
    const targetUserId = req.user.id;

    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'Query message is required.' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ message: 'Gemini API key is not configured on the server.' });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    // 1. Generate query vector using gemini-embedding-001 (768 dimensions)
    let queryVector;
    try {
      const embeddingModel = genAI.getGenerativeModel({ model: 'gemini-embedding-001' });
      const embeddingResult = await embeddingModel.embedContent({
        content: { parts: [{ text: message }] },
        outputDimensionality: 768,
      });
      queryVector = embeddingResult.embedding.values;
    } catch (embError) {
      console.error('[queryRAG] Embedding generation failed:', embError);
      return res.status(500).json({ message: 'Failed to generate query embedding: ' + embError.message });
    }

    // 2. Build Vector Search filter to scope by ownerId and optional folderId / documentId
    const searchFilter = {
      $or: [
        { ownerId: targetUserId.toString() },
        { ownerId: mongoose.Types.ObjectId.isValid(targetUserId) ? new mongoose.Types.ObjectId(targetUserId) : targetUserId }
      ]
    };

    if (filters) {
      if (filters.documentIds && filters.documentIds.length > 0) {
        const docFilterList = [];
        filters.documentIds.forEach(id => {
          if (id) {
            docFilterList.push({ documentId: id.toString() });
            if (mongoose.Types.ObjectId.isValid(id)) {
              docFilterList.push({ documentId: new mongoose.Types.ObjectId(id) });
            }
          }
        });
        if (docFilterList.length > 0) {
          searchFilter.$and = [{ $or: docFilterList }];
        }
      } else if (filters.folderIds && filters.folderIds.length > 0) {
        const folderFilterList = [];
        filters.folderIds.forEach(id => {
          if (id) {
            folderFilterList.push({ folderId: id.toString() });
            if (mongoose.Types.ObjectId.isValid(id)) {
              folderFilterList.push({ folderId: new mongoose.Types.ObjectId(id) });
            }
          }
        });
        if (folderFilterList.length > 0) {
          searchFilter.$and = [{ $or: folderFilterList }];
        }
      }
    }

    // 3. Query MongoDB Atlas Vector index
    let chunks = [];
    try {
      const dbCollection = mongoose.connection.db.collection('embeddings');
      const pipeline = [
        {
          $vectorSearch: {
            index: "pdf_vector_index",
            path: "embedding",
            queryVector: queryVector,
            numCandidates: 100,
            limit: 10,
            filter: searchFilter
          }
        },
        {
          $project: {
            text: 1,
            score: { $meta: "vectorSearchScore" }
          }
        }
      ];
      chunks = await dbCollection.aggregate(pipeline).toArray();
      console.log(`[RAG Query] Retrieved ${chunks.length} chunks from database.`);
    } catch (dbError) {
      console.error('[queryRAG] Atlas Vector Search failed:', dbError);
      // Fallback: we will proceed with no context rather than failing the whole request
    }

    // 4. Construct system context
    const contextText = chunks && chunks.length > 0
      ? chunks.map(c => c.text).join('\n\n')
      : 'No relevant documents or context found in the user database.';

    // 5. Retrieve conversation history
    let conversation = null;
    let chatHistory = [];
    if (conversationId && mongoose.Types.ObjectId.isValid(conversationId)) {
      conversation = await Conversation.findOne({ _id: conversationId, user: req.user.id });
      if (conversation) {
        chatHistory = conversation.messages || [];
      }
    }

    // 6. Build turns list for Gemini
    const contents = [];
    chatHistory.forEach(msg => {
      contents.push({
        role: msg.sender === 'ai' ? 'model' : 'user',
        parts: [{ text: msg.text }]
      });
    });
    contents.push({
      role: 'user',
      parts: [{ text: message }]
    });

    // 7. Initialize Gemini Model with system instruction
    const chatModel = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: `You are DocsMind AI, an intelligent and friendly document assistant.

1. GREETINGS:
- If the user greets you (e.g., "hello", "hi", "hey", "buddy", "how are you", etc.), respond with a warm, polite greeting as DocsMind AI. Ask how you can help them with their documents today. Do not mention missing context or PDFs for simple greetings.

2. QUESTIONS & CONTEXT:
- Answer the user's questions based on the provided Context retrieved from their uploaded PDF files.
- If the answer is found in the Context, answer it accurately, clearly, and concisely, formatted nicely in Markdown.
- If the query is a question but the answer cannot be found in the Context (or no Context is available), politely state: "I couldn't find this information in your uploaded documents. However, based on general knowledge..." and provide a brief general answer.

Context:
${contextText}`
    });

    // 8. Stream Response Headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    if (res.flushHeaders) res.flushHeaders();

    // 9. Call Gemini Generate Stream
    const result = await chatModel.generateContentStream({ contents });
    
    let fullResponseText = '';
    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      fullResponseText += chunkText;
      res.write(`data: ${JSON.stringify({ text: chunkText })}\n\n`);
    }

    // 10. Save Conversation history to Database
    const userMsgObj = { sender: 'user', text: message };
    const aiMsgObj = { sender: 'ai', text: fullResponseText };

    if (conversation) {
      conversation.messages.push(userMsgObj);
      conversation.messages.push(aiMsgObj);
      await conversation.save();
    } else {
      let finalTitle = message.substring(0, 30);
      if (message.length > 30) finalTitle += '...';
      
      conversation = await Conversation.create({
        user: req.user.id,
        title: finalTitle,
        messages: [userMsgObj, aiMsgObj]
      });
    }

    // 11. Send final packet and terminate response stream
    res.write(`data: ${JSON.stringify({ done: true, conversationId: conversation._id })}\n\n`);
    res.end();

  } catch (error) {
    console.error('[queryRAG] Streaming handler error:', error);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Server error running RAG query: ' + error.message });
    } else {
      res.write(`data: ${JSON.stringify({ error: error.message || 'Stream error occurred.' })}\n\n`);
      res.end();
    }
  }
};
