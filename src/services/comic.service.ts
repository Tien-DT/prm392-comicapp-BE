import prisma from '../lib/prisma';
import { ComicStatus } from '@prisma/client';

interface GetAllComicsOptions {
  page?: number;
  limit?: number;
  searchTerm?: string;
  categoryId?: string;
  status?: ComicStatus;
}

export const getAllComics = async (options: GetAllComicsOptions = {}) => {
  const { page = 1, limit = 10, searchTerm, categoryId, status } = options;

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
      orderBy: {
        updatedAt: 'desc',
      },
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
