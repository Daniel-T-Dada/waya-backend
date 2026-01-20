import rateLimit from 'express-rate-limit';

// Higher limits for development, stricter for production
const isDevelopment = process.env.NODE_ENV !== 'production';

export const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: isDevelopment ? 1000 : 500, // Much higher for dev
    message: 'Too many requests from this IP, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
});

export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: isDevelopment ? 200 : 10, // Higher for dev, strict for production
    message: 'Too many auth attempts from this IP, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: !isDevelopment, // Don't count successful requests in production
});
