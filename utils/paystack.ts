import crypto from 'crypto';

/**
 * Verify Paystack webhook signature
 * @param payload - Raw request body as string
 * @param signature - x-paystack-signature header value
 * @param secret - Paystack webhook secret
 * @returns boolean indicating if signature is valid
 */
export function verifyWebhookSignature(
    payload: string,
    signature: string,
    secret: string
): boolean {
    const hash = crypto
        .createHmac('sha512', secret)
        .update(payload)
        .digest('hex');

    return hash === signature;
}

/**
 * Format Paystack API error for user-friendly message
 * @param error - Error from Paystack API
 * @returns Formatted error message
 */
export function formatPaystackError(error: any): string {
    if (error.response?.data?.message) {
        return error.response.data.message;
    }

    if (error.message) {
        return error.message;
    }

    return 'Payment processing failed. Please try again.';
}

/**
 * Generate payment metadata
 * @param userId - User ID
 * @param walletId - Wallet ID
 * @returns Metadata object for Paystack
 */
export function generatePaymentMetadata(userId: string, walletId: string) {
    return {
        userId,
        walletId,
        purpose: 'wallet_funding',
        timestamp: new Date().toISOString()
    };
}

/**
 * Validate payment amount
 * @param amount - Amount in kobo (Paystack uses kobo for NGN)
 * @param minimumAmount - Minimum allowed amount
 * @returns boolean indicating if amount is valid
 */
export function validatePaymentAmount(amount: number, minimumAmount: number = 100): boolean {
    return amount >= minimumAmount && amount > 0;
}

/**
 * Convert Naira to Kobo (Paystack uses kobo)
 * @param naira - Amount in Naira
 * @returns Amount in kobo
 */
export function nairaToKobo(naira: number): number {
    return Math.round(naira * 100);
}

/**
 * Convert Kobo to Naira
 * @param kobo - Amount in kobo
 * @returns Amount in Naira
 */
export function koboToNaira(kobo: number): number {
    return kobo / 100;
}
