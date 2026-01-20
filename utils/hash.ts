import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export async function hashPassword(password: string) {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
}

export async function comparePassword(password: string, hashed: string) {
    return bcrypt.compare(password, hashed);
}

export function generateOTP(length = 6): string {
    const digits = '0123456789';
    let otp = '';
    for (let i = 0; i < length; i++) {
        otp += digits[Math.floor(Math.random() * 10)];
    }
    return otp;
}

export function generateToken(): string {
    return crypto.randomBytes(32).toString('hex');
}

// PIN-specific hashing for children (4-digit PINs)
export async function hashPin(pin: string): Promise<string> {
    return bcrypt.hash(pin, 10);
}

export async function comparePin(pin: string, hashedPin: string): Promise<boolean> {
    return bcrypt.compare(pin, hashedPin);
}

