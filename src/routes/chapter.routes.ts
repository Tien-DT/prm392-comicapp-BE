import { Router } from 'express';
import multer from 'multer';
import * as chapterController from '../controllers/chapter.controller';
import { protect } from '../middlewares/auth.middleware';
import { isAuthor } from '../middlewares/comic.middleware';

const router = Router({ mergeParams: true });

// Configure Multer for in-memory file storage and PDF filter
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed!'));
    }
  },
});

/**
 * @swagger
 * components:
 *   schemas:
 *     Chapter:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         title:
 *           type: string
 *         chapterNumber:
 *           type: number
 *         pdfUrl:
 *           type: string
 */

/**
 * @swagger
 * tags:
 *   name: Chapters
 *   description: API for managing comic chapters
 */

router.route('/')
  /**
   * @swagger
   * /api/comics/{id}/chapters:
   *   post:
   *     summary: Upload a new chapter for a comic
   *     tags: [Chapters]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: The ID of the comic.
   *     requestBody:
   *       required: true
   *       content:
   *         multipart/form-data:
   *           schema:
   *             type: object
   *             required:
   *               - title
   *               - chapterNumber
   *               - chapterPdf
   *             properties:
   *               title:
   *                 type: string
   *               chapterNumber:
   *                 type: number
   *               chapterPdf:
   *                 type: string
   *                 format: binary
   *                 description: The PDF file for the chapter.
   *     responses:
   *       201:
   *         description: Chapter uploaded successfully.
   *       403:
   *         description: User is not the author.
   */
  .post(protect, isAuthor, upload.single('chapterPdf'), chapterController.createChapter);

router.route('/:chapterId')
  /**
   * @swagger
   * /api/comics/{id}/chapters/{chapterId}:
   *   put:
   *     summary: Update a chapter's details
   *     tags: [Chapters]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: The comic ID.
   *       - in: path
   *         name: chapterId
   *         required: true
   *         schema:
   *           type: string
   *         description: The chapter ID.
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               title:
   *                 type: string
   *               chapterNumber:
   *                 type: number
   *     responses:
   *       200:
   *         description: Chapter updated successfully.
   *       403:
   *         description: User is not the author.
   */
  .put(protect, isAuthor, chapterController.updateChapter)
  /**
   * @swagger
   * /api/comics/{id}/chapters/{chapterId}:
   *   delete:
   *     summary: Delete a chapter
   *     tags: [Chapters]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: The comic ID.
   *       - in: path
   *         name: chapterId
   *         required: true
   *         schema:
   *           type: string
   *         description: The chapter ID.
   *     responses:
   *       204:
   *         description: Chapter deleted successfully.
   *       403:
   *         description: User is not the author.
   */
  .delete(protect, isAuthor, chapterController.deleteChapter);

export default router;