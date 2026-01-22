import { Router } from 'express';
import * as paymentController from '../controllers/paymentController';
import { requireAuth, requireParent } from '../middlewares/authMiddleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Payments
 *   description: Paystack payment integration for wallet funding
 */

/**
 * @swagger
 * /payments/initialize:
 *   post:
 *     summary: Initialize a Paystack payment
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *             properties:
 *               amount:
 *                 type: number
 *                 description: Amount in Naira (minimum 100 NGN)
 *                 example: 5000
 *               pin:
 *                 type: string
 *                 description: Wallet PIN (required if PIN is set)
 *                 example: "1234"
 *     responses:
 *       200:
 *         description: Payment initialized successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Payment initialized successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     authorization_url:
 *                       type: string
 *                       description: Paystack payment URL
 *                     access_code:
 *                       type: string
 *                     reference:
 *                       type: string
 *                       description: Payment reference for verification
 *                     paymentId:
 *                       type: string
 *       400:
 *         description: Invalid request or PIN
 *       401:
 *         description: Unauthorized
 */
router.post('/initialize', requireAuth, requireParent, paymentController.initializePayment);

/**
 * @swagger
 * /payments/verify/{reference}:
 *   get:
 *     summary: Verify a payment and credit wallet
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reference
 *         required: true
 *         schema:
 *           type: string
 *         description: Payment reference from initialization
 *     responses:
 *       200:
 *         description: Payment verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     reference:
 *                       type: string
 *                     amount:
 *                       type: number
 *                     status:
 *                       type: string
 *                     walletBalance:
 *                       type: number
 *                     transactionId:
 *                       type: string
 *       400:
 *         description: Verification failed
 */
router.get('/verify/:reference', requireAuth, requireParent, paymentController.verifyPayment);

/**
 * @swagger
 * /payments/webhook:
 *   post:
 *     summary: Paystack webhook endpoint (no authentication required)
 *     tags: [Payments]
 *     description: This endpoint receives webhooks from Paystack. Configure this URL in your Paystack dashboard.
 *     responses:
 *       200:
 *         description: Webhook processed
 */
router.post('/webhook', paymentController.handleWebhook);

/**
 * @swagger
 * /payments/status/{reference}:
 *   get:
 *     summary: Get payment status
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reference
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payment status retrieved
 */
router.get('/status/:reference', requireAuth, requireParent, paymentController.getPaymentStatus);

/**
 * @swagger
 * /payments/history:
 *   get:
 *     summary: Get payment history
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of payments to return
 *     responses:
 *       200:
 *         description: Payment history retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 count:
 *                   type: integer
 *                 results:
 *                   type: array
 *                   items:
 *                     type: object
 */
router.get('/history', requireAuth, requireParent, paymentController.getPaymentHistory);

export default router;
