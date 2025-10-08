import { Router } from 'express';
import * as reviewController from '../controllers/review.controller';
import { protect } from '../middlewares/auth.middleware';

const router = Router({ mergeParams: true }); // mergeParams is important for nested routes

router.route('/')
  .get(reviewController.getReviewsForComic)
  .post(protect, reviewController.createReview);

export default router;
