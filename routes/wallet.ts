import { Router } from 'express';
import * as walletController from '../controllers/walletController';
import * as allowanceController from '../controllers/allowanceController';
import { requireAuth, requireParent, requireChild } from '../middlewares/authMiddleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: FamilyWallet
 *   description: Family wallet management
 */

/**
 * @swagger
 * /familywallet/wallet:
 *   get:
 *     summary: Get wallet details
 *     tags: [FamilyWallet]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Wallet details
 */
router.get('/wallet', requireAuth, walletController.getWallet);

/**
 * @swagger
 * /familywallet/wallet/add_funds:
 *   post:
 *     summary: Add funds to wallet
 *     tags: [FamilyWallet]
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
 *               pin:
 *                 type: string
 *     responses:
 *       200:
 *         description: Funds added successfully
 */
router.post('/wallet/add_funds', requireAuth, requireParent, walletController.addFunds);

/**
 * @swagger
 * /familywallet/wallet/transfer:
 *   post:
 *     summary: Transfer funds to child
 *     tags: [FamilyWallet]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - child_id
 *               - amount
 *               - pin
 *             properties:
 *               child_id:
 *                 type: string
 *               amount:
 *                 type: number
 *               pin:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Transfer successful
 */
router.post('/wallet/transfer', requireAuth, requireParent, walletController.transferToChild);

/**
 * @swagger
 * /familywallet/wallet/set_pin:
 *   post:
 *     summary: Set wallet PIN
 *     tags: [FamilyWallet]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - pin
 *               - confirm_pin
 *             properties:
 *               pin:
 *                 type: string
 *               confirm_pin:
 *                 type: string
 *     responses:
 *       200:
 *         description: PIN set successfully
 */
router.post('/wallet/set_pin', requireAuth, requireParent, walletController.setPin);

/**
 * @swagger
 * /familywallet/wallet/make_payment:
 *   post:
 *     summary: Make payment (deduct from child wallet)
 *     tags: [FamilyWallet]
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
 *               - description
 *               - child_id
 *               - pin
 *             properties:
 *               amount:
 *                 type: number
 *               description:
 *                 type: string
 *               child_id:
 *                 type: string
 *               pin:
 *                 type: string
 *     responses:
 *       200:
 *         description: Payment successful
 */
router.post('/wallet/make_payment', requireAuth, requireChild, walletController.makePayment);

/**
 * @swagger
 * /familywallet/wallet/dashboard_stats:
 *   get:
 *     summary: Get wallet dashboard statistics
 *     tags: [FamilyWallet]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics
 */
router.get('/wallet/dashboard_stats', requireAuth, walletController.getDashboardStats);

/**
 * @swagger
 * /familywallet/wallet/dashboard:
 *   get:
 *     summary: Get enhanced wallet dashboard with family balance and rewards breakdown
 *     tags: [FamilyWallet]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Enhanced dashboard data with percentage changes
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalFamilyBalance:
 *                   type: number
 *                   description: Total balance across parent and all children wallets
 *                 percentageChange:
 *                   type: number
 *                   description: Percentage change in family balance (last 7 days vs previous 7 days)
 *                 rewardsSent:
 *                   type: number
 *                   description: Total rewards from completed chores (last 7 days)
 *                 rewardsSentChange:
 *                   type: number
 *                   description: Percentage change in rewards sent
 *                 rewardsPending:
 *                   type: number
 *                   description: Total rewards from chores awaiting approval
 *                 rewardsPendingChange:
 *                   type: number
 *                   description: Percentage change in pending rewards
 */
router.get('/wallet/dashboard', requireAuth, requireParent, walletController.getWalletDashboard);


/**
 * @swagger
 * /familywallet/wallet/earnings-chart-data:
 *   get:
 *     summary: Get earnings chart data
 *     tags: [FamilyWallet]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Earnings chart data
 */
router.get('/wallet/earnings-chart-data', requireAuth, requireParent, walletController.getEarningsChart);

/**
 * @swagger
 * /familywallet/wallet/savings-breakdown:
 *   get:
 *     summary: Get savings breakdown
 *     tags: [FamilyWallet]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Savings breakdown data
 */
router.get('/wallet/savings-breakdown', requireAuth, requireParent, walletController.getSavingsBreakdown);

/**
 * @swagger
 * /familywallet/wallet/reward-bar-chart:
 *   get:
 *     summary: Get reward bar chart data
 *     tags: [FamilyWallet]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Reward bar chart data
 */
router.get('/wallet/reward-bar-chart', requireAuth, requireParent, walletController.getRewardCharts);

/**
 * @swagger
 * /familywallet/wallet/reward-pie-chart:
 *   get:
 *     summary: Get reward pie chart data
 *     tags: [FamilyWallet]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Reward pie chart data
 */
router.get('/wallet/reward-pie-chart', requireAuth, requireParent, walletController.getRewardCharts);


/**
 * @swagger
 * /familywallet/child-wallets:
 *   get:
 *     summary: List all child wallets
 *     tags: [FamilyWallet]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of child wallets
 */
router.get('/child-wallets', requireAuth, walletController.getChildWallets);

/**
 * @swagger
 * /familywallet/child-wallets/analysis:
 *   get:
 *     summary: Get child wallet analysis
 *     tags: [FamilyWallet]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Child wallet analytics
 */
router.get('/child-wallets/analysis', requireAuth, walletController.getChildWalletAnalysis);

/**
 * @swagger
 * /familywallet/transactions:
 *   get:
 *     summary: List transactions
 *     tags: [FamilyWallet]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *       - in: query
 *         name: child_id
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of transactions
 */
router.get('/transactions', requireAuth, walletController.listTransactions);

/**
 * @swagger
 * /familywallet/transactions:
 *   post:
 *     summary: Create transaction
 *     tags: [FamilyWallet]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - amount
 *               - description
 *             properties:
 *               type:
 *                 type: string
 *               amount:
 *                 type: number
 *               description:
 *                 type: string
 *               child:
 *                 type: string
 *               status:
 *                 type: string
 *     responses:
 *       201:
 *         description: Transaction created
 */
router.post('/transactions', requireAuth, walletController.createTransaction);

/**
 * @swagger
 * /familywallet/transactions/{id}:
 *   get:
 *     summary: Get transaction details
 *     tags: [FamilyWallet]
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
 *         description: Transaction details
 */
router.get('/transactions/:id', requireAuth, walletController.getTransaction);

/**
 * @swagger
 * /familywallet/transactions/{id}/complete:
 *   post:
 *     summary: Complete transaction
 *     tags: [FamilyWallet]
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
 *         description: Transaction completed
 */
router.post('/transactions/:id/complete', requireAuth, walletController.completeTransaction);

/**
 * @swagger
 * /familywallet/transactions/{id}/cancel:
 *   post:
 *     summary: Cancel transaction
 *     tags: [FamilyWallet]
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
 *         description: Transaction cancelled
 */
router.post('/transactions/:id/cancel', requireAuth, walletController.cancelTransaction);

/**
 * @swagger
 * /familywallet/allowances:
 *   post:
 *     summary: Create allowance
 *     tags: [FamilyWallet]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - child_id
 *               - amount
 *               - frequency
 *             properties:
 *               child_id:
 *                 type: string
 *               amount:
 *                 type: number
 *               frequency:
 *                 type: string
 *                 enum: [daily, weekly, monthly]
 *               status:
 *                 type: string
 *                 enum: [active, paused, inactive]
 *     responses:
 *       201:
 *         description: Allowance created
 */
router.post('/allowances', requireAuth, requireParent, allowanceController.createAllowance);

/**
 * @swagger
 * /familywallet/allowances:
 *   get:
 *     summary: List allowances
 *     tags: [FamilyWallet]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, paused, inactive]
 *     responses:
 *       200:
 *         description: List of allowances
 */
router.get('/allowances', requireAuth, requireParent, allowanceController.listAllowances);

/**
 * @swagger
 * /familywallet/allowances/{allowance_id}:
 *   get:
 *     summary: Get allowance details
 *     tags: [FamilyWallet]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: allowance_id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Allowance details
 */
router.get('/allowances/:allowance_id', requireAuth, requireParent, allowanceController.getAllowance);

/**
 * @swagger
 * /familywallet/allowances/{allowance_id}:
 *   put:
 *     summary: Update allowance
 *     tags: [FamilyWallet]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: allowance_id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *               frequency:
 *                 type: string
 *                 enum: [daily, weekly, monthly]
 *               status:
 *                 type: string
 *                 enum: [active, paused, inactive]
 *     responses:
 *       200:
 *         description: Allowance updated
 */
router.put('/allowances/:allowance_id', requireAuth, requireParent, allowanceController.updateAllowance);

/**
 * @swagger
 * /familywallet/allowances/{allowance_id}:
 *   delete:
 *     summary: Delete allowance
 *     tags: [FamilyWallet]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: allowance_id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Allowance deleted
 */
router.delete('/allowances/:allowance_id', requireAuth, requireParent, allowanceController.deleteAllowance);

/**
 * @swagger
 * /familywallet/allowances/process:
 *   post:
 *     summary: Process due allowances (Manually trigger)
 *     tags: [FamilyWallet]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Processed allowances
 */
router.post('/allowances/process', requireAuth, requireParent, allowanceController.processAllowances);

export default router;
