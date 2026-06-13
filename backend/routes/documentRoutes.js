import express from 'express';
import { getDocuments, createDocument, renameDocument, deleteDocument } from '../controllers/documentController.js';
import protect from '../middleware/protect.js';

const router = express.Router();

// Apply auth protection to all routes
router.use(protect);

router.route('/')
  .get(getDocuments)
  .post(createDocument);

router.route('/:id')
  .put(renameDocument)
  .delete(deleteDocument);

export default router;
