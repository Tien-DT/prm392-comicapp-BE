import prisma from '../lib/prisma';
import { UserComicStatus } from '@prisma/client';

interface GetLibraryOptions {
  userId: string;
  status?: UserComicStatus;
  isFavorited?: boolean;
}

export const getLibrary = async (options: GetLibraryOptions) => {
  const { userId, status, isFavorited } = options;
  const where: any = { userId };

  if (status) {
    where.status = status;
  }
  if (isFavorited !== undefined) {
    where.isFavorited = isFavorited;
  }

  const libraryEntries = await prisma.userComicLibrary.findMany({
    where,
    include: {
      comic: true, // Include the full comic details
    },
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
}

export const upsertLibraryEntry = async (data: UpsertData) => {
  const { userId, comicId, ...updateData } = data;

  const entry = await prisma.userComicLibrary.upsert({
    where: { userId_comicId: { userId, comicId } },
    create: {
      userId,
      comicId,
      ...updateData,
    },
    update: updateData,
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
  });

  return entry;
};
