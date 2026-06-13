import express from 'express';
import { getFolders, createFolder, renameFolder, deleteFolder } from '../controllers/folderController.js';
import protect from '../middleware/protect.js';

const router = express.Router();

// Apply auth protection to all routes
router.use(protect);

router.route('/')
  .get(getFolders)
  .post(createFolder);

router.route('/:id')
  .put(renameFolder)
  .delete(deleteFolder);

export default router;
