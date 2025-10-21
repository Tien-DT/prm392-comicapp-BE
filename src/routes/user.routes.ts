import { Router } from 'express';
import { protect, AuthRequest } from '../middlewares/auth.middleware';
import * as comicService from '../services/comic.service';
import { Response } from 'express';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User-related operations
 */

/**
 * @swagger
 * /api/users/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user information
 *       401:
 *         description: Not authenticated
 */
router.get('/me', protect, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    res.status(200).json(user);
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching user profile', error: error.message });
  }
});

/**
 * @swagger
 * /api/users/me:
 *   put:
 *     summary: Update current user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               avatar:
 *                 type: string
 *     responses:
 *       200:
 *         description: User updated successfully
 *       401:
 *         description: Not authenticated
 */
router.put('/me', protect, async (req: AuthRequest, res: Response) => {
  try {
    // This would need a user service update method
    res.status(200).json({ message: 'Update user not implemented yet' });
  } catch (error: any) {
    res.status(500).json({ message: 'Error updating user profile', error: error.message });
  }
});

/**
 * @swagger
 * /api/users/{userId}/comics:
 *   get:
 *     summary: Get all comics by a specific user/author
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The user/author ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of comics per page
 *     responses:
 *       200:
 *         description: A list of comics by the specified user
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
 *       404:
 *         description: User not found
 */
router.get('/:userId/comics', async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const currentUserId = req.user?.id;

    console.log('🔍 [GET /users/:userId/comics]', {
      userId,
      currentUserId,
      hasAuth: !!req.user,
    });

    const result = await comicService.getAllComics({
      authorId: userId,
      currentUserId,
      page,
      limit,
    });

    console.log('✅ [GET /users/:userId/comics] Found comics:', result.data.length);

    res.status(200).json(result);
  } catch (error: any) {
    console.error('❌ [GET /users/:userId/comics] Error:', error);
    res.status(500).json({ message: 'Error fetching user comics', error: error.message });
  }
});

export default router;
