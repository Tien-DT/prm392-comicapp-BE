import prisma from '../lib/prisma';
import { supabase } from '../lib/supabase';
import { ComicStatus, Visibility } from '@prisma/client';

interface GetAllComicsOptions {
  page?: number;
  limit?: number;
  searchTerm?: string;
  categoryId?: string;
  status?: ComicStatus;
  sort?: 'latest' | 'updated' | 'views' | 'trending';
  authorId?: string;
  visibility?: Visibility;
  currentUserId?: string;
}

export const getAllComics = async (options: GetAllComicsOptions = {}) => {
  const { page = 1, limit = 10, searchTerm, categoryId, status, sort, authorId, visibility, currentUserId } = options;

  const skip = (page - 1) * limit;
  const take = limit;

  // Dynamically build the where clause for filtering
  const where: any = {};

  if (searchTerm) {
    where.title = {
      contains: searchTerm,
      mode: 'insensitive',
    };
  }

  if (status) {
    where.status = status;
  }

  if (categoryId) {
    where.categories = {
      some: {
        categoryId: categoryId,
      },
    };
  }

  if (authorId) {
    where.authorId = authorId;
  }

  // Visibility filter logic
  if (visibility) {
    where.visibility = visibility;
  } else {
    // If no specific visibility requested, apply smart filtering:
    // - Show PUBLIC comics to everyone
    // - Show PRIVATE comics only if viewing own comics (authorId === currentUserId)
    if (authorId && currentUserId && authorId === currentUserId) {
      // User viewing their own comics - show all
    } else {
      // Public view or viewing other's comics - only PUBLIC
      where.visibility = Visibility.PUBLIC;
    }
  }

  // Determine sorting
  let orderBy: any = { updatedAt: 'desc' }; // default
  if (sort === 'latest') {
    orderBy = { createdAt: 'desc' };
  } else if (sort === 'updated') {
    orderBy = { updatedAt: 'desc' };
  } else if (sort === 'views') {
    orderBy = { viewCount: 'desc' };
  } else if (sort === 'trending') {
    // Trending: combination of recent views and updates
    // Sort by viewCount primarily, with updatedAt as secondary
    orderBy = [{ viewCount: 'desc' }, { updatedAt: 'desc' }];
  }

  // Fetch comics and total count in parallel
  const [comics, totalComics] = await Promise.all([
    prisma.comic.findMany({
      skip,
      take,
      where,
      include: {
        author: {
          select: { id: true, username: true },
        },
        categories: {
          include: {
            category: true,
          },
        },
        _count: {
          select: { chapters: true },
        },
      },
      orderBy,
    }),
    prisma.comic.count({ where }),
  ]);

  return {
    data: comics,
    pagination: {
      totalComics,
      totalPages: Math.ceil(totalComics / limit),
      currentPage: page,
      limit,
    },
  };
};

export const getComicById = async (id: string) => {
  const comic = await prisma.comic.findUnique({
    where: { id },
    include: {
      author: {
        select: { id: true, username: true, avatar: true },
      },
      categories: {
        select: {
          category: {
            select: { id: true, name: true },
          },
        },
      },
      chapters: {
        orderBy: {
          chapterNumber: 'asc',
        },
      },
    },
  });

  return comic;
};

interface CreateComicData {
  title: string;
  description: string;
  imageUrl: string;
  status: ComicStatus;
  authorId: string;
  categoryIds: string[];
  visibility?: Visibility;
}

export const createComic = async (data: CreateComicData) => {
  const { title, description, imageUrl, status, authorId, categoryIds, visibility } = data;

  const newComic = await prisma.comic.create({
    data: {
      title,
      description,
      imageUrl,
      status,
      visibility: visibility || Visibility.PUBLIC,
      author: {
        connect: { id: authorId },
      },
      categories: {
        create: categoryIds.map((id) => ({
          category: {
            connect: { id },
          },
        })),
      },
    },
  });

  return newComic;
};

interface UpdateComicData {
  title?: string;
  description?: string;
  imageUrl?: string;
  status?: ComicStatus;
  categoryIds?: string[];
  visibility?: Visibility;
}

const COVER_BUCKET = 'comic-covers';

export const updateComic = async (
  comicId: string,
  data: UpdateComicData,
  coverFile?: Express.Multer.File
) => {
  console.log('🛠️ [service.updateComic] start', {
    comicId,
    hasFile: !!coverFile,
    fields: Object.keys(data || {}),
  });
  const existing = await prisma.comic.findUnique({
    where: { id: comicId },
    select: { imageUrl: true },
  });

  if (!existing) {
    throw new Error('Comic not found');
  }

  let newCoverUrl: string | undefined;
  let uploadedFilePath: string | null = null;

  if (coverFile) {
    const extension = coverFile.originalname.split('.').pop() || 'jpg';
    const fileName = `${comicId}-${Date.now()}.${extension}`;
    const filePath = `${comicId}/${fileName}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from(COVER_BUCKET)
        .upload(filePath, coverFile.buffer, {
          contentType: coverFile.mimetype,
          upsert: false,
        });

      if (uploadError) {
        console.error('Supabase cover upload error:', uploadError);
        throw new Error(`Supabase upload error: ${uploadError.message}`);
      }

      uploadedFilePath = filePath;
      console.log('📤 [service.updateComic] cover uploaded', { filePath });
      const { data: urlData } = supabase.storage.from(COVER_BUCKET).getPublicUrl(filePath);
      if (!urlData || !urlData.publicUrl) {
        throw new Error('Could not get public URL for the uploaded cover.');
      }
      newCoverUrl = urlData.publicUrl;
      console.log('🔗 [service.updateComic] newCoverUrl', { newCoverUrl });
    } catch (error: any) {
      if (uploadedFilePath) {
        await supabase.storage.from(COVER_BUCKET).remove([uploadedFilePath]);
      }
      throw new Error(error.message || 'Failed to upload cover image.');
    }
  }

  const { categoryIds, ...otherData } = data;

  const updatePayload: any = {
    ...otherData,
  };

  if (newCoverUrl) {
    updatePayload.imageUrl = newCoverUrl;
  }

  if (categoryIds) {
    updatePayload.categories = {
      deleteMany: {},
      create: categoryIds.map((id) => ({
        category: { connect: { id } },
      })),
    };
  }

  // Always bump updatedAt to ensure list ordering reflects change
  updatePayload.updatedAt = new Date();

  console.log('🧱 [service.updateComic] payload', {
    comicId,
    keys: Object.keys(updatePayload),
    hasCategories: !!updatePayload.categories,
    coverChanged: !!newCoverUrl,
  });

  try {
    const updatedComic = await prisma.comic.update({
      where: { id: comicId },
      data: updatePayload,
    });

    console.log('✅ [service.updateComic] prisma.update ok', {
      id: updatedComic.id,
      title: updatedComic.title,
      imageUrl: updatedComic.imageUrl,
      updatedAt: updatedComic.updatedAt,
    });

    if (newCoverUrl && existing.imageUrl) {
      try {
        const url = new URL(existing.imageUrl);
        const pathMatch = url.pathname.match(new RegExp(`/object/public/${COVER_BUCKET}/(.+)$`));
        if (pathMatch && pathMatch[1]) {
          await supabase.storage.from(COVER_BUCKET).remove([pathMatch[1]]);
        }
      } catch (cleanupError) {
        console.warn('Failed to delete old cover image:', cleanupError);
      }
    }

    return updatedComic;
  } catch (error) {
    console.error('❌ [service.updateComic] prisma.update error', error);
    if (newCoverUrl && uploadedFilePath) {
      await supabase.storage.from(COVER_BUCKET).remove([uploadedFilePath]);
    }
    throw error;
  }
};

export const deleteComic = async (comicId: string) => {
  // Prisma's cascading delete (defined in the schema via relations) will handle related records.
  // However, you might need to manually delete objects in storage (e.g., Supabase) if required.
  // For now, we only delete the database record.
  await prisma.comic.delete({ where: { id: comicId } });
};

export const incrementViewCount = async (comicId: string) => {
  return await prisma.comic.update({
    where: { id: comicId },
    data: {
      viewCount: {
        increment: 1,
      },
    },
  });
};
