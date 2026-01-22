import { Request, Response } from 'express';
import * as paymentService from '../services/paymentService';
import * as walletService from '../services/walletService';

/**
 * Initialize a payment
 * POST /api/payments/initialize
 */
export async function initializePayment(req: Request, res: Response) {
    try {
        const userId = (req as any).user.id;
        const { amount, pin } = req.body;

        // Validate input
        if (!amount || amount <= 0) {
            return res.status(400).json({ error: 'Invalid amount' });
        }

        // Verify PIN if wallet has one set
        if (await walletService.hasWalletPin(userId)) {
            if (!pin) {
                return res.status(400).json({ error: 'Wallet PIN is required' });
            }

            const isValid = await walletService.verifyWalletPin(userId, pin);
            if (!isValid) {
                return res.status(400).json({ error: 'Invalid wallet PIN' });
            }
        }

        // Get user details
        const user = (req as any).user;
        const wallet = await walletService.getWalletByUserId(userId);

        // Initialize payment
        const result = await paymentService.initializePayment({
            email: user.email,
            amount,
            userId,
            walletId: wallet.id
        });

        return res.json(result);
    } catch (error: any) {
        console.error('Initialize payment error:', error);
        return res.status(400).json({ error: error.message });
    }
}

/**
 * Verify a payment
 * GET /api/payments/verify/:reference
 */
export async function verifyPayment(req: Request, res: Response) {
    try {
        const { reference } = req.params;
        const userId = (req as any).user.id;

        if (!reference) {
            return res.status(400).json({ error: 'Payment reference is required' });
        }

        // Verify payment
        const result = await paymentService.verifyPayment(reference);

        return res.json(result);
    } catch (error: any) {
        console.error('Verify payment error:', error);
        return res.status(400).json({ error: error.message });
    }
}

/**
 * Handle Paystack webhook
 * POST /api/payments/webhook
 */
export async function handleWebhook(req: Request, res: Response) {
    try {
        // Get raw body and signature
        const signature = req.headers['x-paystack-signature'] as string;

        if (!signature) {
            return res.status(400).json({ error: 'Missing signature' });
        }

        // Get raw body as string
        const payload = JSON.stringify(req.body);

        // Process webhook
        await paymentService.handleWebhook(payload, signature);

        // Always return 200 to Paystack
        return res.status(200).json({ status: 'success' });
    } catch (error: any) {
        console.error('Webhook error:', error);
        // Still return 200 to prevent Paystack from retrying
        return res.status(200).json({ status: 'error', message: error.message });
    }
}

/**
 * Get payment status
 * GET /api/payments/status/:reference
 */
export async function getPaymentStatus(req: Request, res: Response) {
    try {
        const { reference } = req.params;
        const userId = (req as any).user.id;

        const status = await paymentService.getPaymentStatus(reference, userId);

        return res.json(status);
    } catch (error: any) {
        console.error('Get payment status error:', error);
        return res.status(400).json({ error: error.message });
    }
}

/**
 * Get payment history
 * GET /api/payments/history
 */
export async function getPaymentHistory(req: Request, res: Response) {
    try {
        const userId = (req as any).user.id;
        const limit = parseInt(req.query.limit as string) || 20;

        const payments = await paymentService.getPaymentHistory(userId, limit);

        return res.json({
            count: payments.length,
            results: payments
        });
    } catch (error: any) {
        console.error('Get payment history error:', error);
        return res.status(500).json({ error: error.message });
    }
}
