import { Response } from 'express';
import * as reviewService from '../services/review.service';
import { AuthRequest } from '../middlewares/auth.middleware';

export const getReviewsForComic = async (req: AuthRequest, res: Response) => {
  try {
    // Route mounted as /comics/:id/reviews, so param is 'id' not 'comicId'
    const comicId = req.params.id || req.params.comicId;
    const reviews = await reviewService.getReviewsForComic(comicId);
    res.status(200).json(reviews);
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching reviews', error: error.message });
  }
};

export const createReview = async (req: AuthRequest, res: Response) => {
  try {
    // Route mounted as /comics/:id/reviews, so param is 'id' not 'comicId'
    const comicId = req.params.id || req.params.comicId;
    const userId = req.user?.id;
    const { rating, comment } = req.body;

    console.log('📝 [createReview] Request:', {
      comicId,
      userId,
      rating,
      ratingType: typeof rating,
      comment: comment?.substring(0, 50),
    });

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    if (!comicId) {
      return res.status(400).json({ message: 'Comic ID is required' });
    }

    if (!rating || !comment) {
      return res.status(400).json({ message: 'Rating and comment are required' });
    }

    // Ensure rating is a valid integer between 1-5
    const parsedRating = typeof rating === 'number' ? rating : parseInt(rating, 10);
    if (isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      return res.status(400).json({ message: 'Rating must be a number between 1 and 5' });
    }

    const newReview = await reviewService.createReview({
      comicId,
      userId,
      rating: parsedRating,
      comment,
    });

    console.log('✅ [createReview] Success:', { reviewId: newReview.id });
    res.status(201).json(newReview);
  } catch (error: any) {
    console.error('❌ [createReview] Error:', error);
    res.status(500).json({ message: 'Error creating review', error: error.message });
  }
};

export const deleteReview = async (req: AuthRequest, res: Response) => {
  try {
    const { reviewId } = req.params;
    
    console.log('🗑️ [deleteReview] Request:', { reviewId, userId: req.user?.id });
    
    if (!reviewId) {
      return res.status(400).json({ message: 'Review ID is required' });
    }
    
    await reviewService.deleteReview(reviewId);
    
    console.log('✅ [deleteReview] Success:', { reviewId });
    res.status(204).send(); // 204 No Content is appropriate for a successful deletion
  } catch (error: any) {
    console.error('❌ [deleteReview] Error:', error);
    res.status(500).json({ message: 'Error deleting review', error: error.message });
  }
};
