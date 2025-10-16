import { Response } from 'express';
import * as chapterService from '../services/chapter.service';
import { AuthRequest } from '../middlewares/auth.middleware';

export const getChaptersForComic = async (req: AuthRequest, res: Response) => {
  try {
    const comicId = req.params.id;
    const chapters = await chapterService.getChaptersForComic(comicId);
    res.status(200).json(chapters);
  } catch (error: any) {
    console.error('Get Chapters Error:', error);
    res.status(500).json({ message: 'Error fetching chapters', error: error.message });
  }
};

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

export const updateChapter = async (req: AuthRequest, res: Response) => {
  try {
    const { chapterId } = req.params;
    const { title, chapterNumber } = req.body;
    const updatedChapter = await chapterService.updateChapter(chapterId, { 
      title, 
      chapterNumber: chapterNumber ? parseFloat(chapterNumber) : undefined 
    });
    res.status(200).json(updatedChapter);
  } catch (error: any) {
    res.status(500).json({ message: 'Error updating chapter', error: error.message });
  }
};

export const deleteChapter = async (req: AuthRequest, res: Response) => {
  try {
    const { chapterId } = req.params;
    await chapterService.deleteChapter(chapterId);
    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ message: 'Error deleting chapter', error: error.message });
  }
};
