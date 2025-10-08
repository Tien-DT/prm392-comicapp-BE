import { Router } from 'express';
import * as comicController from '../controllers/comic.controller';

const router = Router();

import { protect } from '../middlewares/auth.middleware';

import chapterRouter from './chapter.routes';
import reviewRouter from './review.routes';

router.get('/', comicController.getAllComics);
router.get('/:id', comicController.getComicById);
router.post('/', protect, comicController.createComic);

// Nested routes
router.use('/:id/chapters', chapterRouter);
router.use('/:id/reviews', reviewRouter);

export default router;
