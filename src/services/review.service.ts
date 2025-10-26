import prisma from '../lib/prisma';

export const getReviewsForComic = async (comicId: string) => {
  const reviews = await prisma.review.findMany({
    where: { comicId },
    include: {
      user: {
        select: { id: true, username: true, avatar: true },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
  return reviews;
};

interface CreateReviewData {
  comicId: string;
  userId: string;
  rating: number;
  comment: string;
}

export const createReview = async (data: CreateReviewData) => {
  const { comicId, userId, rating, comment } = data;

  console.log('🔍 [createReview service] Data:', { comicId, userId, rating, comment: comment?.substring(0, 50) });

  // Check if comic exists
  const comic = await prisma.comic.findUnique({
    where: { id: comicId },
  });

  if (!comic) {
    throw new Error('Comic not found');
  }

  // Check if user already reviewed this comic
  const existingReview = await prisma.review.findUnique({
    where: {
      userId_comicId: {
        userId,
        comicId,
      },
    },
  });

  if (existingReview) {
    throw new Error('You have already reviewed this comic');
  }

  const newReview = await prisma.review.create({
    data: {
      rating,
      comment,
      comic: { connect: { id: comicId } },
      user: { connect: { id: userId } },
    },
    include: {
      user: {
        select: { id: true, username: true, avatar: true },
      },
    },
  });

  console.log('✅ [createReview service] Success:', { reviewId: newReview.id });
  return newReview;
};

export const deleteReview = async (reviewId: string) => {
  console.log('🗑️ [deleteReview service] Deleting:', reviewId);
  
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
  });

  if (!review) {
    throw new Error('Review not found');
  }

  await prisma.review.delete({
    where: { id: reviewId },
  });
  
  console.log('✅ [deleteReview service] Success:', reviewId);
};
