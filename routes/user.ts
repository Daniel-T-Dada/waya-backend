import { Router } from 'express';
import { getProfile, updateProfile, updateProfileImage, uploadProfileImage } from '../controllers/userController';
import { requireAuth, requireParent } from '../middlewares/authMiddleware';
import multer from 'multer';

const upload = multer({ storage: multer.memoryStorage() });

const router = Router();

/**
 * @swagger
 * tags:
 *   name: User
 *   description: User profile management
 */

/**
 * @swagger
 * /user/profile:
 *   get:
 *     summary: Get current user profile
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile details
 */
router.get('/profile', requireAuth, requireParent, getProfile);

/**
 * @swagger
 * /user/profile:
 *   put:
 *     summary: Update user profile
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               phone_number:
 *                 type: string
 *               image:
 *                 type: string
 *               notification_preferences:
 *                 type: object
 *     responses:
 *       200:
 *         description: Profile updated successfully
 */
router.put('/profile', requireAuth, requireParent, updateProfile);

/**
 * @swagger
 * /user/profile/profile-image:
 *   put:
 *     summary: Persist profile image public_id from direct Cloudinary upload
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - profileImagePublicId
 *             properties:
 *               profileImagePublicId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile image updated
 */
router.put('/profile/profile-image', requireAuth, requireParent, updateProfileImage);

/**
 * @swagger
 * /user/profile/profile-image:
 *   post:
 *     summary: Upload profile image via multipart/form-data (Fallback)
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Profile image uploaded and updated
 */
router.post('/profile/profile-image', requireAuth, requireParent, upload.single('file'), uploadProfileImage);

export default router;
