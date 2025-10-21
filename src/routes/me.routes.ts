import { Router } from 'express';
import { protect } from '../middlewares/auth.middleware';
import * as comicService from '../services/comic.service';
import { AuthRequest } from '../middlewares/auth.middleware';
import { Response } from 'express';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Me
 *   description: Current user's personal data and resources
 */

/**
 * @swagger
 * /api/me/comics:
 *   get:
 *     summary: Get all comics created by current authenticated user
 *     tags: [Me]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *           default: 100
 *         description: Number of comics per page
 *     responses:
 *       200:
 *         description: A list of comics created by the current user (both PUBLIC and PRIVATE)
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
 *       401:
 *         description: Not authenticated
 */
router.get('/comics', protect, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 100;
    
    console.log('🔍 [GET /me/comics] Request:', {
      userId,
      page,
      limit,
      hasUser: !!req.user,
      userEmail: req.user?.email,
    });
    
    if (!userId) {
      console.error('❌ [GET /me/comics] User not authenticated');
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Get all comics by this user (both PUBLIC and PRIVATE)
    const result = await comicService.getAllComics({
      authorId: userId,
      currentUserId: userId, // Same as authorId, so backend will show all
      limit,
      page,
    });

    console.log('✅ [GET /me/comics] Success:', {
      foundComics: result.data.length,
      totalComics: result.pagination.totalComics,
      comics: result.data.map(c => ({ id: c.id, title: c.title, visibility: c.visibility })),
    });

    res.status(200).json(result);
  } catch (error: any) {
    console.error('❌ [GET /me/comics] Error:', error);
    res.status(500).json({ message: 'Error fetching my comics', error: error.message });
  }
});

export default router;
