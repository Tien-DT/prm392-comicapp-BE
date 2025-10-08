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

  // Optional: Check if user has already reviewed this comic and handle it (e.g., allow update or prevent new review)
  // For now, we allow multiple reviews.

  const newReview = await prisma.review.create({
    data: {
      rating,
      comment,
      comic: { connect: { id: comicId } },
      user: { connect: { id: userId } },
    },
  });

  return newReview;
};
