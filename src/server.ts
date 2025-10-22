import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware';

dotenv.config();

const app: Express = express();
const port = parseInt(process.env.PORT || '3000', 10);

// Middlewares
app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
// Increase body limits to support base64 image uploads as JSON fallback
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Health check route
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'UP', timestamp: new Date().toISOString() });
});

// API Routes
import authRouter from './routes/auth.routes';
import categoryRouter from './routes/category.routes';
import comicRouter from './routes/comic.routes';
import libraryRouter from './routes/library.routes';
import reviewRouter from './routes/review.routes';
import userRouter from './routes/user.routes';
import meRouter from './routes/me.routes';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';

app.use('/api/auth', authRouter);
app.use('/api/categories', categoryRouter);
app.use('/api/comics', comicRouter);
app.use('/api/users', userRouter);
app.use('/api/reviews', reviewRouter);
// IMPORTANT: Specific routes must come before general routes
app.use('/api/me/library', libraryRouter);  // More specific - must be first
app.use('/api/me', meRouter);               // General /me routes - must be after /me/library

// Swagger UI Route
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Error handling - must be after all routes
app.use(notFoundHandler);
app.use(errorHandler);

app.listen(port, '0.0.0.0', () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
  console.log(`⚡️[server]: Also accessible at http://192.168.2.238:${port}`);
  console.log(`📚[server]: API Documentation at http://localhost:${port}/api-docs`);
});
