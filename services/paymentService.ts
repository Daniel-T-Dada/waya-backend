import axios from 'axios';
import { prisma } from '../prisma';
import { paystackConfig } from '../config/paystack';
import {
    verifyWebhookSignature,
    formatPaystackError,
    generatePaymentMetadata,
    nairaToKobo,
    koboToNaira
} from '../utils/paystack';
import * as walletService from './walletService';
import * as notificationService from './notificationService';
import { notifyUser } from '../utils/socket';

interface InitializePaymentData {
    email: string;
    amount: number; // Amount in Naira
    userId: string;
    walletId: string;
}

interface PaystackInitializeResponse {
    status: boolean;
    message: string;
    data: {
        authorization_url: string;
        access_code: string;
        reference: string;
    };
}

interface PaystackVerifyResponse {
    status: boolean;
    message: string;
    data: {
        id: number;
        domain: string;
        status: string;
        reference: string;
        amount: number; // In kobo
        message: string | null;
        gateway_response: string;
        paid_at: string;
        created_at: string;
        channel: string;
        currency: string;
        ip_address: string;
        metadata: any;
        customer: {
            id: number;
            email: string;
        };
    };
}

/**
 * Initialize a Paystack payment
 */
export async function initializePayment(data: InitializePaymentData) {
    try {
        const { email, amount, userId, walletId } = data;

        // Validate amount (minimum 100 NGN)
        if (amount < paystackConfig.minimumAmount) {
            throw new Error(`Minimum amount is ${paystackConfig.minimumAmount} NGN`);
        }

        // Convert amount to kobo (Paystack uses kobo for NGN)
        const amountInKobo = nairaToKobo(amount);

        // Generate metadata
        const metadata = generatePaymentMetadata(userId, walletId);

        // Call Paystack Initialize Transaction API
        const response = await axios.post<PaystackInitializeResponse>(
            `${paystackConfig.baseUrl}/transaction/initialize`,
            {
                email,
                amount: amountInKobo,
                currency: paystackConfig.currency,
                callback_url: paystackConfig.callbackUrl,
                metadata
            },
            {
                headers: {
                    Authorization: `Bearer ${paystackConfig.secretKey}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        if (!response.data.status) {
            throw new Error(response.data.message || 'Failed to initialize payment');
        }

        // Store payment record in database
        const payment = await prisma.payment.create({
            data: {
                userId,
                reference: response.data.data.reference,
                amount,
                currency: paystackConfig.currency,
                status: 'pending',
                metadata: metadata as any
            }
        });

        return {
            status: true,
            message: 'Payment initialized successfully',
            data: {
                authorization_url: response.data.data.authorization_url,
                access_code: response.data.data.access_code,
                reference: response.data.data.reference,
                paymentId: payment.id
            }
        };
    } catch (error: any) {
        console.error('Initialize payment error:', error);
        throw new Error(formatPaystackError(error));
    }
}

/**
 * Verify a Paystack payment
 */
export async function verifyPayment(reference: string) {
    try {
        // Call Paystack Verify Transaction API
        const response = await axios.get<PaystackVerifyResponse>(
            `${paystackConfig.baseUrl}/transaction/verify/${reference}`,
            {
                headers: {
                    Authorization: `Bearer ${paystackConfig.secretKey}`
                }
            }
        );

        if (!response.data.status) {
            throw new Error(response.data.message || 'Payment verification failed');
        }

        const paymentData = response.data.data;

        // Get payment record from database
        const payment = await prisma.payment.findUnique({
            where: { reference },
            include: { user: true }
        });

        if (!payment) {
            throw new Error('Payment record not found');
        }

        // Check if already processed
        if (payment.status === 'success' && payment.verifiedAt) {
            return {
                status: true,
                message: 'Payment already processed',
                data: {
                    reference: payment.reference,
                    amount: Number(payment.amount),
                    status: payment.status,
                    alreadyProcessed: true
                }
            };
        }

        // Verify payment status
        if (paymentData.status !== 'success') {
            // Update payment status
            await prisma.payment.update({
                where: { reference },
                data: {
                    status: paymentData.status,
                    channel: paymentData.channel,
                    paystackResponse: paymentData as any
                }
            });

            throw new Error(`Payment ${paymentData.status}: ${paymentData.gateway_response}`);
        }

        // Verify amount matches
        const amountInNaira = koboToNaira(paymentData.amount);
        if (Math.abs(amountInNaira - Number(payment.amount)) > 0.01) {
            throw new Error('Payment amount mismatch');
        }

        // Credit wallet and update payment status
        const result = await creditWalletFromPayment(
            payment.userId,
            amountInNaira,
            reference,
            paymentData
        );

        return {
            status: true,
            message: 'Payment verified and wallet credited successfully',
            data: {
                reference: payment.reference,
                amount: amountInNaira,
                status: 'success',
                walletBalance: result.newBalance,
                transactionId: result.transactionId
            }
        };
    } catch (error: any) {
        console.error('Verify payment error:', error);
        throw new Error(formatPaystackError(error));
    }
}

/**
 * Handle Paystack webhook
 */
export async function handleWebhook(payload: string, signature: string) {
    try {
        // Verify webhook signature
        if (!paystackConfig.webhookSecret) {
            throw new Error('Webhook secret not configured');
        }

        const isValid = verifyWebhookSignature(payload, signature, paystackConfig.webhookSecret);
        if (!isValid) {
            throw new Error('Invalid webhook signature');
        }

        // Parse payload
        const event = JSON.parse(payload);

        // Handle different event types
        switch (event.event) {
            case 'charge.success':
                await handleSuccessfulCharge(event.data);
                break;

            case 'charge.failed':
                await handleFailedCharge(event.data);
                break;

            default:
                console.log(`Unhandled webhook event: ${event.event}`);
        }

        return { status: true, message: 'Webhook processed successfully' };
    } catch (error: any) {
        console.error('Webhook handling error:', error);
        throw error;
    }
}

/**
 * Handle successful charge webhook
 */
async function handleSuccessfulCharge(data: any) {
    const reference = data.reference;

    // Get payment record
    const payment = await prisma.payment.findUnique({
        where: { reference }
    });

    if (!payment) {
        console.error(`Payment not found for reference: ${reference}`);
        return;
    }

    // Check if already processed
    if (payment.status === 'success' && payment.verifiedAt) {
        console.log(`Payment ${reference} already processed`);
        return;
    }

    // Credit wallet
    const amountInNaira = koboToNaira(data.amount);
    await creditWalletFromPayment(payment.userId, amountInNaira, reference, data);

    console.log(`Webhook: Successfully processed payment ${reference}`);
}

/**
 * Handle failed charge webhook
 */
async function handleFailedCharge(data: any) {
    const reference = data.reference;

    // Update payment status
    await prisma.payment.updateMany({
        where: { reference },
        data: {
            status: 'failed',
            channel: data.channel,
            paystackResponse: data as any
        }
    });

    console.log(`Webhook: Payment ${reference} failed`);
}

/**
 * Credit wallet from successful payment
 */
async function creditWalletFromPayment(
    userId: string,
    amount: number,
    paymentReference: string,
    paymentData: any
) {
    // Use transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
        // Get wallet
        const wallet = await tx.wallet.findUnique({
            where: { userId }
        });

        if (!wallet) {
            throw new Error('Wallet not found');
        }

        // Update wallet balance
        const newBalance = Number(wallet.balance) + amount;
        const updatedWallet = await tx.wallet.update({
            where: { id: wallet.id },
            data: { balance: newBalance }
        });

        // Create transaction record
        const transaction = await tx.transaction.create({
            data: {
                type: 'credit',
                amount,
                status: 'completed',
                description: `Wallet funding via Paystack - ${paymentReference}`,
                walletId: wallet.id,
                paymentReference
            }
        });

        // Update payment record
        await tx.payment.update({
            where: { reference: paymentReference },
            data: {
                status: 'success',
                channel: paymentData.channel,
                paystackResponse: paymentData as any,
                transactionId: transaction.id,
                verifiedAt: new Date()
            }
        });

        return {
            newBalance: updatedWallet.balance,
            transactionId: transaction.id
        };
    });

    // Send notification
    await notificationService.createNotification({
        userId,
        type: 'payment_success',
        title: 'Payment Successful',
        message: `Your wallet has been credited with ₦${amount.toLocaleString()}`,
        relatedObjectType: 'payment',
        relatedObjectId: paymentReference
    });

    // Real-time notification
    notifyUser(userId, 'payment_success', {
        amount,
        newBalance: result.newBalance,
        reference: paymentReference
    });

    return result;
}

/**
 * Get payment status
 */
export async function getPaymentStatus(reference: string, userId: string) {
    const payment = await prisma.payment.findUnique({
        where: { reference }
    });

    if (!payment) {
        throw new Error('Payment not found');
    }

    if (payment.userId !== userId) {
        throw new Error('Unauthorized');
    }

    return {
        reference: payment.reference,
        amount: Number(payment.amount),
        currency: payment.currency,
        status: payment.status,
        channel: payment.channel,
        createdAt: payment.createdAt,
        verifiedAt: payment.verifiedAt
    };
}

/**
 * Get payment history for user
 */
export async function getPaymentHistory(userId: string, limit: number = 20) {
    const payments = await prisma.payment.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit
    });

    return payments.map(p => ({
        id: p.id,
        reference: p.reference,
        amount: Number(p.amount),
        currency: p.currency,
        status: p.status,
        channel: p.channel,
        createdAt: p.createdAt,
        verifiedAt: p.verifiedAt
    }));
}
