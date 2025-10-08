import { Router } from 'express';
import * as reviewController from '../controllers/review.controller';
import { protect } from '../middlewares/auth.middleware';
import { isReviewOwner } from '../middlewares/review.middleware';

const router = Router({ mergeParams: true });

/**
 * @swagger
 * components:
 *   schemas:
 *     Review:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         rating:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *         comment:
 *           type: string
 *         user:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *             username:
 *               type: string
 *             avatar:
 *               type: string
 */

/**
 * @swagger
 * tags:
 *   name: Reviews
 *   description: API for managing comic reviews
 */

router.route('/')
  /**
   * @swagger
   * /api/comics/{comicId}/reviews:
   *   get:
   *     summary: Get all reviews for a specific comic
   *     tags: [Reviews]
   *     parameters:
   *       - in: path
   *         name: comicId
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: A list of reviews.
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/Review'
   */
  .get(reviewController.getReviewsForComic)
  /**
   * @swagger
   * /api/comics/{comicId}/reviews:
   *   post:
   *     summary: Create a new review for a comic
   *     tags: [Reviews]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: comicId
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - rating
   *               - comment
   *             properties:
   *               rating:
   *                 type: integer
   *                 minimum: 1
   *                 maximum: 5
   *               comment:
   *                 type: string
   *     responses:
   *       201:
   *         description: Review created successfully.
   *       401:
   *         description: Not authenticated.
   */
  .post(protect, reviewController.createReview);

router.route('/:reviewId')
  /**
   * @swagger
   * /api/reviews/{reviewId}:
   *   delete:
   *     summary: Delete a review
   *     tags: [Reviews]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: reviewId
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       204:
   *         description: Review deleted successfully.
   *       403:
   *         description: User is not the owner of the review.
   *       404:
   *         description: Review not found.
   */
  .delete(protect, isReviewOwner, reviewController.deleteReview);

export default router;
