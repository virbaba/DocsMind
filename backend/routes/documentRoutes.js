import express from 'express';
import { getDocuments, createDocument, renameDocument, deleteDocument, retryDocument } from '../controllers/documentController.js';
import protect from '../middleware/protect.js';
import { upload } from '../config/cloudinary.js';

const router = express.Router();

// Apply auth protection to all routes
router.use(protect);

router.route('/')
  .get(getDocuments)
  .post(upload.single('file'), createDocument);

router.route('/:id/retry')
  .post(retryDocument);

router.route('/:id')
  .put(renameDocument)
  .delete(deleteDocument);

export default router;
