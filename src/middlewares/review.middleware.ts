import { Response, NextFunction } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from './auth.middleware';

// This middleware checks if the logged-in user is the owner of the review or an admin
export const isReviewOwner = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const reviewId = req.params.reviewId;
    const user = req.user;

    if (!user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      select: { userId: true },
    });

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    // Allow if user is the owner or if the user is an admin
    if (review.userId === user.id || user.role === 'ADMIN') {
      next();
    } else {
      return res.status(403).json({ message: 'User is not authorized to delete this review' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error verifying review ownership' });
  }
};
