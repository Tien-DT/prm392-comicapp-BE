import { Router } from 'express';
import * as libraryController from '../controllers/library.controller';
import { protect } from '../middlewares/auth.middleware';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     LibraryEntry:
 *       type: object
 *       properties:
 *         userId:
 *           type: string
 *         comicId:
 *           type: string
 *         isFavorited:
 *           type: boolean
 *         status:
 *           type: string
 *           enum: [NOT_STARTED, READING, FINISHED]
 *         lastReadChapterId:
 *           type: string
 *         updatedAt:
 *           type: string
 *           format: date-time
 *         comic:
 *           $ref: '#/components/schemas/Comic'
 */

/**
 * @swagger
 * tags:
 *   name: User Library
 *   description: API for managing the authenticated user's personal library
 */

// All routes in this file are protected
router.use(protect);

/**
 * @swagger
 * /api/me/library:
 *   get:
 *     summary: Get the current user's library
 *     tags: [User Library]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [NOT_STARTED, READING, FINISHED]
 *         description: Filter by reading status.
 *       - in: query
 *         name: isFavorited
 *         schema:
 *           type: boolean
 *         description: Filter by favorite status.
 *     responses:
 *       200:
 *         description: A list of the user's library entries.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/LibraryEntry'
 *       401:
 *         description: Not authenticated.
 */
router.get('/', libraryController.getLibrary);

/**
 * @swagger
 * /api/me/library:
 *   post:
 *     summary: Add or update a comic in the user's library
 *     description: Use this to add a comic, set its favorite status, or reading status.
 *     tags: [User Library]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - comicId
 *             properties:
 *               comicId:
 *                 type: string
 *               isFavorited:
 *                 type: boolean
 *               status:
 *                 type: string
 *                 enum: [NOT_STARTED, READING, FINISHED]
 *     responses:
 *       200:
 *         description: Library entry updated successfully.
 *       400:
 *         description: comicId is required.
 *       401:
 *         description: Not authenticated.
 */
router.post('/', libraryController.upsertLibraryEntry);

/**
 * @swagger
 * /api/me/library/progress:
 *   put:
 *     summary: Update reading progress for a comic
 *     tags: [User Library]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - comicId
 *               - lastReadChapterId
 *             properties:
 *               comicId:
 *                 type: string
 *               lastReadChapterId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Progress updated successfully.
 *       400:
 *         description: comicId and lastReadChapterId are required.
 *       401:
 *         description: Not authenticated.
 */
router.put('/progress', libraryController.updateReadingProgress);

export default router;