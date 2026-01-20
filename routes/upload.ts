import { Router } from 'express';
import { getSignature } from '../controllers/uploadController';
import { requireAuth } from '../middlewares/authMiddleware';

const router = Router();

/**
 * @swagger
 * /uploads/cloudinary-signature:
 *   post:
 *     summary: Get signed params for direct Cloudinary upload
 *     tags: [Uploads]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Signature data for Cloudinary
 *       401:
 *         description: Unauthorized
 */
router.post('/cloudinary-signature', requireAuth, getSignature);

export default router;
