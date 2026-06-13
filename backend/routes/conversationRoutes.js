import express from 'express';
import {
  getConversations,
  getConversationById,
  saveConversation,
  deleteConversation,
  queryRAG,
} from '../controllers/conversationController.js';
import protect from '../middleware/protect.js';

const router = express.Router();

// Apply auth protection to all routes
router.use(protect);

router.post('/query', queryRAG);

router.route('/')
  .get(getConversations)
  .post(saveConversation);

router.route('/:id')
  .get(getConversationById)
  .delete(deleteConversation);

export default router;
