import { Response } from 'express';
import * as chapterService from '../services/chapter.service';
import { AuthRequest } from '../middlewares/auth.middleware';

export const createChapter = async (req: AuthRequest, res: Response) => {
  try {
    const comicId = req.params.id;
    const { title, chapterNumber } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: 'Chapter PDF file is required' });
    }

    if (!title || !chapterNumber) {
      return res.status(400).json({ message: 'Title and chapter number are required' });
    }

    const newChapter = await chapterService.createChapter({
      comicId,
      title,
      chapterNumber: parseFloat(chapterNumber),
      file,
    });

    res.status(201).json(newChapter);
  } catch (error: any) {
    console.error('Create Chapter Error:', error);
    res.status(500).json({ message: 'Error creating chapter', error: error.message });
  }
};
