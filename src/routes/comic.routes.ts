import { Router } from 'express';
import * as comicController from '../controllers/comic.controller';
import { protect } from '../middlewares/auth.middleware';
import { isAuthor } from '../middlewares/comic.middleware';
import chapterRouter from './chapter.routes';
import reviewRouter from './review.routes';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Comic:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         title:
 *           type: string
 *         description:
 *           type: string
 *         coverImage:
 *           type: string
 *         status:
 *           type: string
 *           enum: [ONGOING, COMPLETED]
 *         visibility:
 *           type: string
 *           enum: [PRIVATE, PUBLIC]
 *         author:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *             username:
 *               type: string
 *         categories:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               category:
 *                 $ref: '#/components/schemas/Category'
 */

/**
 * @swagger
 * tags:
 *   name: Comics
 *   description: API for managing comics
 */

router.route('/')
  /**
   * @swagger
   * /api/comics:
   *   get:
   *     summary: Retrieve a list of comics with pagination, filtering, and searching
   *     tags: [Comics]
   *     parameters:
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           default: 1
   *         description: Page number.
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 10
   *         description: Number of comics per page.
   *       - in: query
   *         name: searchTerm
   *         schema:
   *           type: string
   *         description: Search term for comic titles.
   *       - in: query
   *         name: categoryId
   *         schema:
   *           type: string
   *         description: ID of the category to filter by.
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *           enum: [ONGOING, COMPLETED]
   *         description: Filter by comic status.
   *       - in: query
   *         name: visibility
   *         schema:
   *           type: string
   *           enum: [PRIVATE, PUBLIC]
   *         description: Filter by visibility (PRIVATE comics only visible to owner).
   *     responses:
   *       200:
   *         description: A paginated list of comics.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/Comic'
   *                 pagination:
   *                   type: object
   *                   properties:
   *                     totalComics:
   *                       type: integer
   *                     totalPages:
   *                       type: integer
   *                     currentPage:
   *                       type: integer
   *                     limit:
   *                       type: integer
   */
  .get(comicController.getAllComics)
  /**
   * @swagger
   * /api/comics:
   *   post:
   *     summary: Create a new comic
   *     tags: [Comics]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - title
   *               - description
   *               - coverImage
   *               - status
   *               - categoryIds
   *             properties:
   *               title:
   *                 type: string
   *               description:
   *                 type: string
   *               coverImage:
   *                 type: string
   *               status:
   *                 type: string
   *                 enum: [ONGOING, COMPLETED]
   *               visibility:
   *                 type: string
   *                 enum: [PRIVATE, PUBLIC]
   *                 default: PUBLIC
   *               categoryIds:
   *                 type: array
   *                 items:
   *                   type: string
   *     responses:
   *       201:
   *         description: Comic created successfully.
   *       401:
   *         description: Not authenticated.
   */
  .post(protect, comicController.createComic);

router.route('/:id')
  /**
   * @swagger
   * /api/comics/{id}:
   *   get:
   *     summary: Get a single comic by ID
   *     tags: [Comics]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: The comic ID.
   *     responses:
   *       200:
   *         description: Detailed information about the comic.
   *       404:
   *         description: Comic not found.
   */
  .get(comicController.getComicById)
  /**
   * @swagger
   * /api/comics/{id}:
   *   put:
   *     summary: Update a comic
   *     tags: [Comics]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               title:
   *                 type: string
   *               description:
   *                 type: string
   *               coverImage:
   *                 type: string
   *               status:
   *                 type: string
   *                 enum: [ONGOING, COMPLETED]
   *               visibility:
   *                 type: string
   *                 enum: [PRIVATE, PUBLIC]
   *               categoryIds:
   *                 type: array
   *                 items:
   *                   type: string
   *     responses:
   *       200:
   *         description: Comic updated successfully.
   *       403:
   *         description: User is not the author.
   *       404:
   *         description: Comic not found.
   */
  .put(protect, isAuthor, comicController.updateComic)
  /**
   * @swagger
   * /api/comics/{id}:
   *   delete:
   *     summary: Delete a comic
   *     tags: [Comics]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       204:
   *         description: Comic deleted successfully.
   *       403:
   *         description: User is not the author.
   *       404:
   *         description: Comic not found.
   */
  .delete(protect, isAuthor, comicController.deleteComic);

// Nested routes
router.use('/:id/chapters', chapterRouter);
router.use('/:id/reviews', reviewRouter);

export default router;