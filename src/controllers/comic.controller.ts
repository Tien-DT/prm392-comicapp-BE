import { Request, Response } from 'express';
import * as comicService from '../services/comic.service';
import { ComicStatus, Visibility } from '@prisma/client';
import { AuthRequest } from '../middlewares/auth.middleware';

const parseCategoryIds = (value: any): string[] | undefined => {
  if (!value) {
    return undefined;
  }

  if (Array.isArray(value)) {
    return value.map((v) => String(v));
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.map((v) => String(v));
      }
    } catch (error) {
      const list = value.split(',').map((item) => item.trim()).filter(Boolean);
      if (list.length > 0) {
        return list;
      }
    }
    return [value];
  }

  return undefined;
};

export const getAllComics = async (req: AuthRequest, res: Response) => {
  try {
    // Parse query parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const searchTerm = req.query.searchTerm as string | undefined;
    const categoryId = req.query.categoryId as string | undefined;
    const status = req.query.status as ComicStatus | undefined;
    const sort = req.query.sort as 'latest' | 'updated' | 'views' | 'trending' | undefined;
    const authorId = req.query.authorId as string | undefined;
    const visibility = req.query.visibility as Visibility | undefined;
    const currentUserId = req.user?.id;

    console.log('🔍 [getAllComics] Query params:', {
      authorId,
      currentUserId,
      hasAuth: !!req.user,
      userId: req.user?.id,
      visibility
    });

    const result = await comicService.getAllComics({
      page,
      limit,
      searchTerm,
      categoryId,
      status,
      sort,
      authorId,
      visibility,
      currentUserId,
    });

    console.log('✅ [getAllComics] Result:', {
      totalComics: result.data.length,
      authorId,
      currentUserId,
      comics: result.data.map(c => ({ id: c.id, title: c.title, visibility: c.visibility }))
    });

    res.status(200).json(result);
  } catch (error: any) {
    console.error('❌ [getAllComics] Error:', error);
    res.status(500).json({ message: 'Error fetching comics', error: error.message });
  }
};

export const getComicById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const comic = await comicService.getComicById(id);

    console.log('🔍 [getComicById]', {
      id,
      found: !!comic,
      title: comic?.title,
      imageUrl: comic?.imageUrl,
      updatedAt: comic?.updatedAt,
    });

    if (!comic) {
      return res.status(404).json({ message: 'Comic not found' });
    }

    res.status(200).json(comic);
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching comic details', error: error.message });
  }
};

export const createComic = async (req: AuthRequest, res: Response) => {
  try {
    const authorId = req.user?.id;

    if (!authorId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const title = req.body.title?.trim();
    const description = req.body.description?.trim();
    const imageUrl = req.body.imageUrl?.trim();
    const status = (req.body.status || 'ONGOING') as ComicStatus;
    const visibility = (req.body.visibility || Visibility.PUBLIC) as Visibility;
    const categoryIds = parseCategoryIds(req.body.categoryIds);

    if (!title || !description || !imageUrl || !categoryIds || categoryIds.length === 0) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const newComic = await comicService.createComic({
      title,
      description,
      imageUrl,
      status,
      authorId,
      categoryIds,
      visibility,
    });

    res.status(201).json(newComic);
  } catch (error: any) {
    res.status(500).json({ message: 'Error creating comic', error: error.message });
  }
};

export const updateComic = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const rawBody = req.body || {};
    let coverFile = (req as any).file as Express.Multer.File | undefined;

    console.log('🛠️ [updateComic] Incoming', {
      id,
      hasFile: !!coverFile,
      fileName: coverFile?.originalname,
      fileType: coverFile?.mimetype,
      rawKeys: Object.keys(rawBody || {}),
      status: rawBody?.status,
      visibility: rawBody?.visibility,
      categoryIdsRaw: rawBody?.categoryIds,
    });

    const updateData: any = {
      ...rawBody,
    };

    if (typeof rawBody.title === 'string') {
      updateData.title = rawBody.title.trim();
    }

    if (typeof rawBody.description === 'string') {
      updateData.description = rawBody.description.trim();
    }

    if (typeof rawBody.status === 'string') {
      updateData.status = rawBody.status.toUpperCase();
    }

    if (typeof rawBody.visibility === 'string') {
      updateData.visibility = rawBody.visibility.toUpperCase();
    }

    const parsedCategories = parseCategoryIds(rawBody.categoryIds);
    if (parsedCategories) {
      updateData.categoryIds = parsedCategories;
    }

    if (coverFile) {
      delete updateData.imageUrl;
    } else if (typeof updateData.imageUrl === 'string' && !updateData.imageUrl.trim()) {
      delete updateData.imageUrl;
    }

    console.log('🧮 [updateComic] Parsed', {
      id,
      updateKeys: Object.keys(updateData),
      categoryIds: updateData.categoryIds,
    });

    const updatedComic = await comicService.updateComic(id, updateData, coverFile);
    console.log('✅ [updateComic] Success', {
      id: updatedComic.id,
      title: updatedComic.title,
      imageUrl: updatedComic.imageUrl,
      updatedAt: updatedComic.updatedAt,
    });
    res.status(200).json(updatedComic);
  } catch (error: any) {
    console.error('❌ [updateComic] Error', error);
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

export const incrementView = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const comic = await comicService.incrementViewCount(id);
    res.json({ viewCount: comic.viewCount });
  } catch (error: any) {
    res.status(500).json({ message: 'Error incrementing view count', error: error.message });
  }
};

// Upload/replace only the cover image (like chapter upload flow)
export const uploadCover = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const coverFile = (req as any).file as Express.Multer.File | undefined;

    console.log('🖼️ [uploadCover] Incoming', {
      id,
      hasFile: !!coverFile,
      name: coverFile?.originalname,
      type: coverFile?.mimetype,
      size: coverFile?.size,
    });

    if (!coverFile) {
      return res.status(400).json({ message: 'No cover image file provided' });
    }

    const updated = await comicService.updateComic(id, {}, coverFile);
    console.log('✅ [uploadCover] Success', {
      id: updated.id,
      imageUrl: updated.imageUrl,
      updatedAt: updated.updatedAt,
    });
    res.status(200).json(updated);
  } catch (error: any) {
    console.error('❌ [uploadCover] Error', error);
    res.status(500).json({ message: 'Error uploading cover', error: error.message });
  }
};
