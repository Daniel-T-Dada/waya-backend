export const paystackConfig = {
    secretKey: process.env.PAYSTACK_SECRET_KEY!,
    publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY!,
    baseUrl: 'https://api.paystack.co',
    callbackUrl: process.env.PAYSTACK_CALLBACK_URL || `${process.env.FRONTEND_BASE_URL}/wallet/payment/callback`,
    // Paystack uses the secret key for webhook verification (no separate webhook secret)
    webhookSecret: process.env.PAYSTACK_SECRET_KEY!,
    minimumAmount: 100, // Minimum 100 NGN (Paystack requirement)
    currency: 'NGN'
};

// Validate required environment variables
if (!paystackConfig.secretKey) {
    throw new Error('PAYSTACK_SECRET_KEY is required in environment variables');
}

if (!paystackConfig.publicKey) {
    throw new Error('NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY is required in environment variables');
}
