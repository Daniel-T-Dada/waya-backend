import { prisma } from '../lib/prisma';
import { hashPassword, comparePassword } from '../utils/hash';
import { generateOtp } from '../utils/otp';
import { sendEmail } from '../utils/email';
import { addMinutes, isBefore } from 'date-fns';

export async function registerUser(data: any) {
    const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
    if (existingUser) {
        throw new Error('Email already registered');
    }

    const hashedPassword = await hashPassword(data.password);
    const otp = generateOtp();
    const otpExpires = addMinutes(new Date(), 30);

    const user = await prisma.user.create({
        data: {
            ...data,
            password: hashedPassword,
            verificationOtp: otp,
            verificationOtpExpires: otpExpires
        }
    });

    try {
        await sendEmail(
            user.email,
            'Verify your email - Waya',
            `Your verification code is: ${otp}. It expires in 30 minutes.`
        );
    } catch (error) {
        console.error("Failed to send email", error);
    }

    return user;
}

export async function authenticateUser(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.password === null) return null;

    const isValid = await comparePassword(password, user.password);
    if (!isValid) return null;

    return user;
}

export async function findUserById(id: string) {
    return prisma.user.findUnique({ where: { id } });
}

export async function verifyEmail(email: string, otp: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new Error('User not found');

    if (user.verificationOtp !== otp) {
        throw new Error('Invalid OTP');
    }

    if (user.verificationOtpExpires && isBefore(user.verificationOtpExpires, new Date())) {
        throw new Error('OTP expired');
    }

    return prisma.user.update({
        where: { id: user.id },
        data: {
            emailVerified: true,
            verificationOtp: null,
            verificationOtpExpires: null
        }
    });
}

export async function forgotPassword(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new Error('User not found');

    const otp = generateOtp();
    const otpExpires = addMinutes(new Date(), 30);

    await prisma.user.update({
        where: { id: user.id },
        data: {
            resetToken: otp,
            resetTokenExpiresAt: otpExpires
        }
    });

    await sendEmail(
        user.email,
        'Reset Password - Waya',
        `Your password reset code is: ${otp}. It expires in 30 minutes.`
    );
}

export async function resetPassword(email: string, otp: string, newPassword: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new Error('User not found');

    if (user.resetToken !== otp) {
        throw new Error('Invalid OTP');
    }

    if (user.resetTokenExpiresAt && isBefore(user.resetTokenExpiresAt, new Date())) {
        throw new Error('OTP expired');
    }

    const hashedPassword = await hashPassword(newPassword);

    return prisma.user.update({
        where: { id: user.id },
        data: {
            password: hashedPassword,
            resetToken: null,
            resetTokenExpiresAt: null
        }
    });
}

export async function changeUserPassword(userId: string, oldPass: string, newPass: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.password) throw new Error('User not found');

    const isValid = await comparePassword(oldPass, user.password);
    if (!isValid) throw new Error('Invalid old password');

    const hashedPassword = await hashPassword(newPass);
    return prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword }
    });
}

export async function findUserByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
}

export async function createVerifiedUser(data: { name: string; email: string; password: string; role: string }) {
    return prisma.user.create({
        data: {
            name: data.name,
            email: data.email,
            password: data.password,
            role: data.role,
            emailVerified: true  // Auto-verify for testing
        }
    });
}
