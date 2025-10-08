import { Router } from 'express';
import * as comicController from '../controllers/comic.controller';

const router = Router();

router.get('/', comicController.getAllComics);

export default router;
