import { Response } from 'express';
import * as libraryService from '../services/library.service';
import { AuthRequest } from '../middlewares/auth.middleware';
import { UserComicStatus } from '@prisma/client';

const USER_COMIC_STATUSES: UserComicStatus[] = ['NOT_STARTED', 'READING', 'FINISHED'];

export const getLibrary = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id!;
    const { status, isFavorited, isDownloaded } = req.query;

    let normalizedStatus: UserComicStatus | undefined;
    if (status) {
      const unsafeStatus = status as string;
      if (!USER_COMIC_STATUSES.includes(unsafeStatus as UserComicStatus)) {
        return res.status(400).json({ message: 'Invalid status value' });
      }
      normalizedStatus = unsafeStatus as UserComicStatus;
    }

    const options = {
      userId,
      status: normalizedStatus,
      isFavorited: isFavorited ? isFavorited === 'true' : undefined,
      isDownloaded: isDownloaded ? isDownloaded === 'true' : undefined,
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
    const { comicId, isFavorited, status, isDownloaded, lastReadChapterId } = req.body;

    if (!comicId) {
      return res.status(400).json({ message: 'comicId is required' });
    }

    let normalizedStatus: UserComicStatus | undefined;
    if (status !== undefined) {
      const unsafeStatus = status as string;
      if (!USER_COMIC_STATUSES.includes(unsafeStatus as UserComicStatus)) {
        return res.status(400).json({ message: 'Invalid status value' });
      }
      normalizedStatus = unsafeStatus as UserComicStatus;
    }

    let normalizedLastRead: string | null | undefined;
    if (lastReadChapterId !== undefined) {
      if (lastReadChapterId === null || typeof lastReadChapterId === 'string') {
        normalizedLastRead = lastReadChapterId;
      } else {
        return res.status(400).json({ message: 'Invalid lastReadChapterId value' });
      }
    }

    const entry = await libraryService.upsertLibraryEntry({
      userId,
      comicId,
      status: normalizedStatus,
      isFavorited: typeof isFavorited === 'boolean' ? isFavorited : undefined,
      isDownloaded: typeof isDownloaded === 'boolean' ? isDownloaded : undefined,
      lastReadChapterId: normalizedLastRead,
    });
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

export const getLibraryEntry = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id!;
    const { comicId } = req.params;

    if (!comicId) {
      return res.status(400).json({ message: 'comicId is required' });
    }

    const entry = await libraryService.getLibraryEntry({ userId, comicId });

    if (!entry) {
      return res.status(404).json({ message: 'Library entry not found' });
    }

    res.status(200).json(entry);
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching library entry', error: error.message });
  }
};
