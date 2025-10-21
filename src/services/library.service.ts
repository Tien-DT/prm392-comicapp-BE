import prisma from '../lib/prisma';
import { UserComicStatus } from '@prisma/client';

const defaultInclude = {
  comic: {
    include: {
      author: {
        select: {
          id: true,
          username: true,
          avatar: true,
        },
      },
      _count: {
        select: {
          chapters: true,
        },
      },
    },
  },
};

interface GetLibraryOptions {
  userId: string;
  status?: UserComicStatus;
  isFavorited?: boolean;
  isDownloaded?: boolean;
}

export const getLibrary = async (options: GetLibraryOptions) => {
  const { userId, status, isFavorited, isDownloaded } = options;
  const where: any = { userId };

  if (status) {
    where.status = status;
  }
  if (isFavorited !== undefined) {
    where.isFavorited = isFavorited;
  }
  if (isDownloaded !== undefined) {
    where.isDownloaded = isDownloaded;
  }

  const libraryEntries = await prisma.userComicLibrary.findMany({
    where,
    include: defaultInclude,
    orderBy: {
      updatedAt: 'desc',
    },
  });

  return libraryEntries;
};

interface UpsertData {
  userId: string;
  comicId: string;
  isFavorited?: boolean;
  status?: UserComicStatus;
  isDownloaded?: boolean;
  lastReadChapterId?: string | null;
}

export const upsertLibraryEntry = async ({
  userId,
  comicId,
  isFavorited,
  status,
  isDownloaded,
  lastReadChapterId,
}: UpsertData) => {
  const updateData: Record<string, any> = {};

  if (isFavorited !== undefined) {
    updateData.isFavorited = isFavorited;
  }
  if (status !== undefined) {
    updateData.status = status;
  }
  if (isDownloaded !== undefined) {
    updateData.isDownloaded = isDownloaded;
  }
  if (lastReadChapterId !== undefined) {
    updateData.lastReadChapterId = lastReadChapterId;
  }

  const entry = await prisma.userComicLibrary.upsert({
    where: { userId_comicId: { userId, comicId } },
    create: {
      userId,
      comicId,
      ...updateData,
    },
    update: updateData,
    include: defaultInclude,
  });

  return entry;
};

interface ProgressData {
  userId: string;
  comicId: string;
  lastReadChapterId: string;
}

export const updateReadingProgress = async (data: ProgressData) => {
  const { userId, comicId, lastReadChapterId } = data;

  const entry = await prisma.userComicLibrary.upsert({
    where: { userId_comicId: { userId, comicId } },
    create: {
      userId,
      comicId,
      lastReadChapterId,
      status: 'READING',
    },
    update: {
      lastReadChapterId,
      status: 'READING',
    },
    include: defaultInclude,
  });

  return entry;
};

interface GetLibraryEntryParams {
  userId: string;
  comicId: string;
}

export const getLibraryEntry = async ({ userId, comicId }: GetLibraryEntryParams) => {
  return prisma.userComicLibrary.findUnique({
    where: { userId_comicId: { userId, comicId } },
    include: defaultInclude,
  });
};
