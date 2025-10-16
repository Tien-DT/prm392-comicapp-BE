import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app: Express = express();
const port = parseInt(process.env.PORT || '3000', 10);

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';

app.use('/api/auth', authRouter);
app.use('/api/categories', categoryRouter);
app.use('/api/comics', comicRouter);
app.use('/api/me/library', libraryRouter);
app.use('/api/reviews', reviewRouter);
app.use('/api/users', userRouter);

// Swagger UI Route
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec)); // For top-level review actions like DELETE


app.listen(port, '0.0.0.0', () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
  console.log(`⚡️[server]: Also accessible at http://192.168.2.238:${port}`);
});
