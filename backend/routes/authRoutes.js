import express from 'express';
import {
  loginOrRegister,
  refreshAccessToken,
  logout,
  forgotPassword,
  resetPassword,
  getMe,
} from '../controllers/authController.js';
import protect from '../middleware/protect.js';

const router = express.Router();

// Public routes
router.post('/login', loginOrRegister);
router.post('/refresh', refreshAccessToken);
router.post('/logout', logout);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);

// Protected route — get current user
router.get('/me', protect, getMe);

export default router;
