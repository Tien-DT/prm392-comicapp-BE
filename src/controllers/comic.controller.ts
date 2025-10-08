import { Request, Response } from 'express';
import * as comicService from '../services/comic.service';
import { ComicStatus } from '@prisma/client';

export const getAllComics = async (req: Request, res: Response) => {
  try {
    // Parse query parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const searchTerm = req.query.searchTerm as string | undefined;
    const categoryId = req.query.categoryId as string | undefined;
    const status = req.query.status as ComicStatus | undefined;

    const result = await comicService.getAllComics({
      page,
      limit,
      searchTerm,
      categoryId,
      status,
    });

    res.status(200).json(result);
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching comics', error: error.message });
  }
};
