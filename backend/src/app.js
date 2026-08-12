import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { env } from './config/env.js';
import { requestId } from './middleware/requestId.js';
import { errorHandler } from './middleware/errorHandler.js';
import routes from './routes/index.js';
import { NotFoundError } from './utils/errors.js';

const app = express();

// Security HTTP headers
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many requests from this IP, please try again later.',
    },
  },
});
app.use(limiter);

// Request parsing with size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Attach Request ID middleware
app.use(requestId);

// Health check endpoints
app.get(['/health', '/api/v1/health'], (req, res) => {
  res.status(200).json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    env: env.NODE_ENV,
  });
});

// API Routes
app.use('/api/v1', routes);

// Handle 404 Not Found
app.use((req, res, next) => {
  next(new NotFoundError(`Cannot ${req.method} ${req.originalUrl}`));
});

// Centralized error handling middleware
app.use(errorHandler);

export default app;
