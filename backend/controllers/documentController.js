import Document from '../models/Document.js';
import { pdfQueue } from '../config/queue.js';
import { v2 as cloudinary } from 'cloudinary';
import mongoose from 'mongoose';

// Extract Cloudinary public ID from raw file URL
const getPublicIdFromUrl = (url) => {
  try {
    if (!url) return null;
    const parts = url.split('/upload/');
    if (parts.length < 2) return null;
    
    const pathParts = parts[1].split('/');
    // Remove version prefix if present (e.g., v1781347919)
    if (pathParts[0].startsWith('v')) {
      pathParts.shift();
    }
    return pathParts.join('/');
  } catch (error) {
    console.error('Error parsing Cloudinary URL:', error);
    return null;
  }
};

// Helper to format file sizes nicely
const formatBytes = (bytes, decimals = 1) => {
  if (bytes === 0 || !bytes) return '0 KB';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

// @desc    Get all documents for logged-in user
// @route   GET /api/documents
// @access  Private
export const getDocuments = async (req, res) => {
  try {
    const documents = await Document.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json(documents);
  } catch (error) {
    console.error('[getDocuments]', error);
    res.status(500).json({ message: 'Server error retrieving documents.' });
  }
};

// @desc    Create/Upload a document (Multipart file upload)
// @route   POST /api/documents
// @access  Private
export const createDocument = async (req, res) => {
  try {
    const { folderId } = req.body;

    // Validate that file is present (uploaded by multer)
    if (!req.file) {
      return res.status(400).json({ message: 'No PDF file uploaded.' });
    }

    const fileUrl = req.file.path; // Cloudinary URL
    const fullName = req.file.originalname;
    const sizeFormatted = formatBytes(req.file.size);

    // Form short display name
    const extension = fullName.endsWith('.pdf') ? '.pdf' : '';
    const nameWithoutExt = fullName.replace('.pdf', '');
    const shortName = nameWithoutExt.length > 15
      ? nameWithoutExt.slice(0, 15) + '...' + extension
      : fullName;

    // Create Document record in Mongo DB marked as 'queued'
    const doc = await Document.create({
      name: shortName,
      fullName,
      size: sizeFormatted,
      category: 'PDF Document',
      folder: folderId || null,
      user: req.user.id,
      url: fileUrl,
      status: 'queued',
    });

    // Enqueue the heavy job for background processing
    await pdfQueue.add(`process-${doc._id}`, {
      documentId: doc._id,
      pdfUrl: fileUrl,
      userId: req.user.id,
      folderId: folderId || null,
    });

    console.log(`[Controller] PDF enqueued for processing. Doc ID: ${doc._id}`);

    // Return 202 Accepted with the queued document details
    res.status(202).json(doc);
  } catch (error) {
    console.error('[createDocument]', error);
    res.status(500).json({ message: 'Server error starting PDF processing.' });
  }
};

// @desc    Rename a document
// @route   PUT /api/documents/:id
// @access  Private
export const renameDocument = async (req, res) => {
  try {
    const { fullName } = req.body;
    const { id } = req.params;

    if (!fullName || !fullName.trim()) {
      return res.status(400).json({ message: 'Document name is required.' });
    }

    const doc = await Document.findOne({ _id: id, user: req.user.id });
    if (!doc) {
      return res.status(404).json({ message: 'Document not found or unauthorized.' });
    }

    const extension = fullName.endsWith('.pdf') ? '.pdf' : '';
    const nameWithoutExt = fullName.replace('.pdf', '');
    const shortName = nameWithoutExt.length > 12 
      ? nameWithoutExt.slice(0, 12) + '...' + extension 
      : fullName;

    doc.fullName = fullName.trim();
    doc.name = shortName;
    await doc.save();

    res.status(200).json(doc);
  } catch (error) {
    console.error('[renameDocument]', error);
    res.status(500).json({ message: 'Server error renaming document.' });
  }
};

// @desc    Delete a document
// @route   DELETE /api/documents/:id
// @access  Private
export const deleteDocument = async (req, res) => {
  try {
    const { id } = req.params;

    const doc = await Document.findOne({ _id: id, user: req.user.id });
    if (!doc) {
      return res.status(404).json({ message: 'Document not found or unauthorized.' });
    }

    // 1. Delete from Cloudinary if URL is present
    if (doc.url) {
      const publicId = getPublicIdFromUrl(doc.url);
      if (publicId) {
        console.log(`[Delete] Deleting asset from Cloudinary: ${publicId}`);
        try {
          const result = await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });
          console.log('[Delete] Cloudinary delete result:', result);
        } catch (cloudinaryErr) {
          console.error('[Delete] Failed to delete from Cloudinary:', cloudinaryErr);
        }
      }
    }

    // 2. Delete associated chunks from the embeddings collection
    try {
      const dbCollection = mongoose.connection.db.collection('embeddings');
      const targetId = id.toString();
      const query = {
        $or: [
          { documentId: targetId },
          { 'metadata.documentId': targetId },
          { documentId: mongoose.Types.ObjectId.isValid(targetId) ? new mongoose.Types.ObjectId(targetId) : targetId },
          { 'metadata.documentId': mongoose.Types.ObjectId.isValid(targetId) ? new mongoose.Types.ObjectId(targetId) : targetId }
        ]
      };
      const deleteEmbeddingsResult = await dbCollection.deleteMany(query);
      console.log(`[Delete] Deleted ${deleteEmbeddingsResult.deletedCount} embeddings for document ${id}`);
    } catch (embeddingsErr) {
      console.error('[Delete] Failed to delete embeddings from MongoDB Atlas:', embeddingsErr);
    }

    // 3. Delete the metadata document
    await Document.deleteOne({ _id: id });

    res.status(200).json({ message: 'Document deleted successfully.' });
  } catch (error) {
    console.error('[deleteDocument]', error);
    res.status(500).json({ message: 'Server error deleting document.' });
  }
};

// @desc    Retry document processing for a failed document
// @route   POST /api/documents/:id/retry
// @access  Private
export const retryDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await Document.findOne({ _id: id, user: req.user.id });

    if (!doc) {
      return res.status(404).json({ message: 'Document not found or unauthorized.' });
    }

    // Update status to queued and clear error
    doc.status = 'queued';
    doc.processingError = null;
    await doc.save();

    // Re-enqueue the BullMQ job using existing URL
    await pdfQueue.add(`process-${doc._id}`, {
      documentId: doc._id,
      pdfUrl: doc.url,
      userId: req.user.id,
      folderId: doc.folder,
    });

    console.log(`[Controller] PDF processing retried. Doc ID: ${doc._id}`);

    res.status(200).json(doc);
  } catch (error) {
    console.error('[retryDocument]', error);
    res.status(500).json({ message: 'Server error retrying PDF processing.' });
  }
};

