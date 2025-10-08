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

export const getComicById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const comic = await comicService.getComicById(id);

    if (!comic) {
      return res.status(404).json({ message: 'Comic not found' });
    }

    res.status(200).json(comic);
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching comic details', error: error.message });
  }
};

import { AuthRequest } from '../middlewares/auth.middleware';

export const createComic = async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, coverImage, status, categoryIds } = req.body;
    const authorId = req.user?.id;

    if (!authorId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    if (!title || !description || !coverImage || !categoryIds || !status) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const newComic = await comicService.createComic({
      title,
      description,
      coverImage,
      status,
      authorId,
      categoryIds,
    });

    res.status(201).json(newComic);
  } catch (error: any) {
    res.status(500).json({ message: 'Error creating comic', error: error.message });
  }
};

export const updateComic = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const updatedComic = await comicService.updateComic(id, updateData);
    res.status(200).json(updatedComic);
  } catch (error: any) {
    res.status(500).json({ message: 'Error updating comic', error: error.message });
  }
};

export const deleteComic = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    // Note: Add logic here to delete associated files from Supabase if needed
    await comicService.deleteComic(id);
    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ message: 'Error deleting comic', error: error.message });
  }
};
