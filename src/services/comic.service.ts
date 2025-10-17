import prisma from '../lib/prisma';
import { ComicStatus, Visibility } from '@prisma/client';

interface GetAllComicsOptions {
  page?: number;
  limit?: number;
  searchTerm?: string;
  categoryId?: string;
  status?: ComicStatus;
  sort?: 'latest' | 'updated';
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
  coverImage: string;
  status: ComicStatus;
  authorId: string;
  categoryIds: string[];
  visibility?: Visibility;
}

export const createComic = async (data: CreateComicData) => {
  const { title, description, coverImage, status, authorId, categoryIds, visibility } = data;

  const newComic = await prisma.comic.create({
    data: {
      title,
      description,
      coverImage,
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
  coverImage?: string;
  status?: ComicStatus;
  categoryIds?: string[];
  visibility?: Visibility;
}

export const updateComic = async (comicId: string, data: UpdateComicData) => {
  const { categoryIds, ...otherData } = data;

  const updatedComic = await prisma.comic.update({
    where: { id: comicId },
    data: {
      ...otherData,
      ...(categoryIds && {
        categories: {
          // Disconnect all existing categories first
          deleteMany: {},
          // Connect the new set of categories
          create: categoryIds.map((id) => ({
            category: {
              connect: { id },
            },
          })),
        },
      }),
    },
  });

  return updatedComic;
};

export const deleteComic = async (comicId: string) => {
  // Prisma's cascading delete (defined in the schema via relations) will handle related records.
  // However, you might need to manually delete objects in storage (e.g., Supabase) if required.
  // For now, we only delete the database record.
  await prisma.comic.delete({ where: { id: comicId } });
};
