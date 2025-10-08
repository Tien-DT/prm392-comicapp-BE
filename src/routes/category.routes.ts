import { Router } from 'express';
import * as categoryController from '../controllers/category.controller';
import { protect, admin } from '../middlewares/auth.middleware';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Category:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *   securitySchemes:
 *     bearerAuth: {
 *       type: "http",
 *       scheme: "bearer",
 *       bearerFormat: "JWT"
 *     }
 */

/**
 * @swagger
 * tags:
 *   name: Categories
 *   description: API for managing comic categories
 */

/**
 * @swagger
 * /api/categories:
 *   get:
 *     summary: Retrieve a list of all categories
 *     tags: [Categories]
 *     responses:
 *       200:
 *         description: A list of categories.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Category'
 */
router.get('/', categoryController.getAllCategories);

/**
 * @swagger
 * /api/categories:
 *   post:
 *     summary: Create a new category
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 description: The name of the new category.
 *     responses:
 *       201:
 *         description: Category created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Category'
 *       400:
 *         description: Category name is required.
 *       401:
 *         description: Not authorized, no token or token failed.
 *       403:
 *         description: Not authorized as an admin.
 *       409:
 *         description: Category already exists.
 */
router.post('/', protect, admin, categoryController.createCategory);

export default router;