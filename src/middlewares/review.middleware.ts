import { Response, NextFunction } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from './auth.middleware';

// This middleware checks if the logged-in user is the owner of the review or an admin
export const isReviewOwner = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const reviewId = req.params.reviewId;
    const user = req.user;

    console.log('🔍 [isReviewOwner] Check:', { reviewId, userId: user?.id, params: req.params });

    if (!user) {
      console.log('❌ [isReviewOwner] User not authenticated');
      return res.status(401).json({ message: 'User not authenticated' });
    }

    if (!reviewId) {
      console.log('❌ [isReviewOwner] Review ID missing');
      return res.status(400).json({ message: 'Review ID is required' });
    }

    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      select: { userId: true },
    });

    if (!review) {
      console.log('❌ [isReviewOwner] Review not found:', reviewId);
      return res.status(404).json({ message: 'Review not found' });
    }

    // Allow if user is the owner or if the user is an admin
    if (review.userId === user.id || user.role === 'ADMIN') {
      console.log('✅ [isReviewOwner] Authorized:', { isOwner: review.userId === user.id, isAdmin: user.role === 'ADMIN' });
      next();
    } else {
      console.log('❌ [isReviewOwner] Not authorized:', { reviewUserId: review.userId, currentUserId: user.id });
      return res.status(403).json({ message: 'User is not authorized to delete this review' });
    }
  } catch (error) {
    console.error('❌ [isReviewOwner] Error:', error);
    res.status(500).json({ message: 'Error verifying review ownership' });
  }
};
