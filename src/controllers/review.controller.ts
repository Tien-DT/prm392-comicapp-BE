import { Response } from 'express';
import * as reviewService from '../services/review.service';
import { AuthRequest } from '../middlewares/auth.middleware';

export const getReviewsForComic = async (req: AuthRequest, res: Response) => {
  try {
    const { comicId } = req.params;
    const reviews = await reviewService.getReviewsForComic(comicId);
    res.status(200).json(reviews);
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching reviews', error: error.message });
  }
};

export const createReview = async (req: AuthRequest, res: Response) => {
  try {
    const { comicId } = req.params;
    const userId = req.user?.id;
    const { rating, comment } = req.body;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    if (!rating || !comment) {
      return res.status(400).json({ message: 'Rating and comment are required' });
    }

    const newReview = await reviewService.createReview({
      comicId,
      userId,
      rating: parseInt(rating, 10),
      comment,
    });

    res.status(201).json(newReview);
  } catch (error: any) {
    res.status(500).json({ message: 'Error creating review', error: error.message });
  }
};

export const deleteReview = async (req: AuthRequest, res: Response) => {
  try {
    const { reviewId } = req.params;
    await reviewService.deleteReview(reviewId);
    res.status(204).send(); // 204 No Content is appropriate for a successful deletion
  } catch (error: any) {
    res.status(500).json({ message: 'Error deleting review', error: error.message });
  }
};
