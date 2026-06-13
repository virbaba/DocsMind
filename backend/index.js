import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import folderRoutes from './routes/folderRoutes.js';
import documentRoutes from './routes/documentRoutes.js';
import conversationRoutes from './routes/conversationRoutes.js';

// Import workers to start background queue processing
import './workers/pdfWorker.js';

// Load environment variables
dotenv.config();

// Connect to Database
connectDB();

const app = express();

// Security Headers
app.use(helmet());

// Rate Limiting Config
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 150, // Limit each IP to 150 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Too many requests from this IP, please try again after 15 minutes.',
  },
});

const chatQueryLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // Limit each IP to 10 queries per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Too many chat queries. Please wait a minute before asking another question.',
  },
});

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true, // allow cookies to be sent cross-origin
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Apply rate limiting
app.use('/api', generalLimiter);
app.use('/api/conversations/query', chatQueryLimiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/folders', folderRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/conversations', conversationRoutes);

app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Welcome to the DocMind API',
    version: '1.0.0',
    status: 'Healthy',
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 DocMind API running on http://localhost:${PORT}`);
});
