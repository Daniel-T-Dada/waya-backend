import { Router } from 'express';
import * as moneyMazeController from '../controllers/moneyMazeController';
import { requireAuth, requireChild } from '../middlewares/authMiddleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: MoneyMaze
 *   description: Educational financial system for children
 */

/**
 * @swagger
 * /moneymaze/concepts:
 *   get:
 *     summary: List all financial concepts
 *     tags: [MoneyMaze]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of concepts
 */
router.get('/concepts', requireAuth, requireChild, moneyMazeController.listConcepts);

/**
 * @swagger
 * /moneymaze/concepts/progress:
 *   get:
 *     summary: Get overall learning progress
 *     tags: [MoneyMaze]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Progress details
 */
router.get('/concepts/progress', requireAuth, requireChild, moneyMazeController.getProgress);

/**
 * @swagger
 * /moneymaze/quizzes/{id}:
 *   get:
 *     summary: Get quiz details with questions
 *     tags: [MoneyMaze]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Quiz details
 */
router.get('/quizzes/:id', requireAuth, requireChild, moneyMazeController.getQuiz);

/**
 * @swagger
 * /moneymaze/quizzes/submit:
 *   post:
 *     summary: Submit quiz answers
 *     tags: [MoneyMaze]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [quiz_id, answers]
 *             properties:
 *               quiz_id:
 *                 type: string
 *               answers:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     question_id:
 *                       type: string
 *                     selected_choice_id:
 *                       type: string
 *     responses:
 *       200:
 *         description: Quiz result and reward info
 */
router.post('/quizzes/submit', requireAuth, requireChild, moneyMazeController.submitQuiz);

/**
 * @swagger
 * /moneymaze/rewards:
 *   get:
 *     summary: List earned learning rewards
 *     tags: [MoneyMaze]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of rewards
 */
router.get('/rewards', requireAuth, requireChild, moneyMazeController.listRewards);

/**
 * @swagger
 * /moneymaze/dashboard:
 *   get:
 *     summary: Get learning dashboard summary with daily streaks
 *     tags: [MoneyMaze]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard summary including current streak and weekly activity checks
 */
router.get('/dashboard', requireAuth, requireChild, moneyMazeController.getDashboard);

export default router;
