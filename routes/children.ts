import { Router } from 'express';
import { createChild, listChildren, getChild, updateChild, deleteChild, childLogin } from '../controllers/childController';
import { requireAuth, requireParent } from '../middlewares/authMiddleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Children
 *   description: Child account management
 */

/**
 * @swagger
 * /children:
 *   post:
 *     summary: Create a new child account
 *     tags: [Children]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - pin
 *             properties:
 *               username:
 *                 type: string
 *                 description: Unique username for the child
 *               name:
 *                 type: string
 *                 description: Display name for the child
 *               pin:
 *                 type: string
 *                 description: 4-digit PIN for child login
 *                 pattern: '^\d{4}$'
 *     responses:
 *       201:
 *         description: Child created successfully
 */
router.post('/', requireAuth, requireParent, createChild);

/**
 * @swagger
 * /children:
 *   get:
 *     summary: List all children for the authenticated parent
 *     tags: [Children]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of children
 */
router.get('/', requireAuth, requireParent, listChildren);

/**
 * @swagger
 * /children/{id}:
 *   get:
 *     summary: Get child details by ID
 *     tags: [Children]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Child ID
 *     responses:
 *       200:
 *         description: Child details
 */
router.get('/:id', requireAuth, requireParent, getChild);

/**
 * @swagger
 * /children/{id}:
 *   put:
 *     summary: Update child details
 *     tags: [Children]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Child ID
 *     responses:
 *       200:
 *         description: Child updated successfully
 */
router.put('/:id', requireAuth, requireParent, updateChild);

/**
 * @swagger
 * /children/{id}:
 *   delete:
 *     summary: Delete a child account
 *     tags: [Children]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Child ID
 *     responses:
 *       204:
 *         description: Child deleted successfully
 */
router.delete('/:id', requireAuth, requireParent, deleteChild);

/**
 * @swagger
 * /children/login:
 *   post:
 *     summary: Child login with username and PIN
 *     tags: [Children]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - pin
 *             properties:
 *               username:
 *                 type: string
 *               pin:
 *                 type: string
 *                 pattern: '^\d{4}$'
 *     responses:
 *       200:
 *         description: Login successful
 */
router.post('/login', childLogin);

export default router;
