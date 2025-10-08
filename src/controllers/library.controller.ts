import { Response } from 'express';
import * as libraryService from '../services/library.service';
import { AuthRequest } from '../middlewares/auth.middleware';
import { UserComicStatus } from '@prisma/client';

export const getLibrary = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id!;
    const { status, isFavorited } = req.query;

    const options = {
      userId,
      status: status as UserComicStatus | undefined,
      isFavorited: isFavorited ? isFavorited === 'true' : undefined,
    };

    const library = await libraryService.getLibrary(options);
    res.status(200).json(library);
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching library', error: error.message });
  }
};

export const upsertLibraryEntry = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id!;
    const { comicId, isFavorited, status } = req.body;

    if (!comicId) {
      return res.status(400).json({ message: 'comicId is required' });
    }

    const entry = await libraryService.upsertLibraryEntry({ userId, comicId, isFavorited, status });
    res.status(200).json(entry);
  } catch (error: any) {
    res.status(500).json({ message: 'Error updating library', error: error.message });
  }
};

export const updateReadingProgress = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id!;
    const { comicId, lastReadChapterId } = req.body;

    if (!comicId || !lastReadChapterId) {
      return res.status(400).json({ message: 'comicId and lastReadChapterId are required' });
    }

    const entry = await libraryService.updateReadingProgress({ userId, comicId, lastReadChapterId });
    res.status(200).json(entry);
  } catch (error: any) {
    res.status(500).json({ message: 'Error updating reading progress', error: error.message });
  }
};
