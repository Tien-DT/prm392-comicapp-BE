import { Router } from 'express';
import * as categoryController from '../controllers/category.controller';
import { protect, admin } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', categoryController.getAllCategories);
router.post('/', protect, admin, categoryController.createCategory);

export default router;
