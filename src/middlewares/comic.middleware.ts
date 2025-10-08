import { Response, NextFunction } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from './auth.middleware';

// This middleware checks if the logged-in user is the author of the comic
export const isAuthor = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const comicId = req.params.id; // Assumes comic ID is in the URL params
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const comic = await prisma.comic.findUnique({
      where: { id: comicId },
      select: { authorId: true },
    });

    if (!comic) {
      return res.status(404).json({ message: 'Comic not found' });
    }

    if (comic.authorId !== userId) {
      return res.status(403).json({ message: 'User is not the author of this comic' });
    }

    next();
  } catch (error) {
    res.status(500).json({ message: 'Error verifying author' });
  }
};
