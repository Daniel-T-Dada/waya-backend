import { Request, Response } from 'express';
import * as authService from '../services/authService';
import * as userService from '../services/userService';
import * as googleAuthService from '../services/googleAuthService';
import { jwtConfig } from '../config/jwt';
import jwt from 'jsonwebtoken';
import { hashPassword } from '../utils/hash';

export async function register(req: Request, res: Response) {
    try {
        const { name, email, password } = req.body;
        const user = await authService.registerUser({ name, email, password });
        const safe = { id: user.id, email: user.email, name: user.name, role: user.role };
        return res.status(201).json({ message: 'User registered successfully. Please check your email for the verification OTP.', user: safe });
    } catch (err: any) {
        return res.status(400).json({ error: err.message });
    }
}

export async function registerAutoVerify(req: Request, res: Response) {
    try {
        const { name, email, password } = req.body;

        // Check if user already exists
        const existingUser = await authService.findUserByEmail(email);
        if (existingUser) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        // Create user with auto-verification (for testing)
        const hashedPassword = await hashPassword(password);
        const user = await authService.createVerifiedUser({
            name,
            email,
            password: hashedPassword,
            role: 'parent'
        });

        // Generate JWT tokens
        const payload = { sub: user.id, role: user.role };
        const accessToken = jwt.sign(payload, jwtConfig.accessTokenSecret, { expiresIn: jwtConfig.accessExpiresIn as any });
        const refreshToken = jwt.sign(payload, jwtConfig.refreshTokenSecret, { expiresIn: jwtConfig.refreshExpiresIn as any });

        // Set httpOnly cookies
        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',  // Changed from 'strict' for localhost compatibility
            maxAge: 15 * 60 * 1000
        });
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',  // Changed from 'strict' for localhost compatibility
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        return res.status(201).json({
            message: 'User registered and verified successfully',
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                emailVerified: true
            },
            accessToken,
            refreshToken
        });
    } catch (err: any) {
        return res.status(400).json({ error: err.message });
    }
}

export async function login(req: Request, res: Response) {
    try {
        const { email, password } = req.body;
        const user = await authService.authenticateUser(email, password);
        if (!user) return res.status(401).json({ error: 'Invalid credentials' });


        const payload = { sub: user.id, role: user.role };
        const accessToken = jwt.sign(payload, jwtConfig.accessTokenSecret, { expiresIn: jwtConfig.accessExpiresIn as any });
        const refreshToken = jwt.sign(payload, jwtConfig.refreshTokenSecret, { expiresIn: jwtConfig.refreshExpiresIn as any });

        // Set Cookies
        res.cookie('accessToken', accessToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 15 * 60 * 1000 }); // 15m
        res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 7 * 24 * 60 * 60 * 1000 }); // 7d

        return res.json({
            user: { id: user.id, email: user.email, name: user.name, role: user.role },
            accessToken,
            refreshToken
        });
    } catch (err: any) {
        return res.status(400).json({ error: err.message });
    }
}

export async function passwordChange(req: Request, res: Response) {
    try {
        const userId = (req as any).user.id;
        const { old_password, new_password } = req.body;
        if (!old_password || !new_password) return res.status(400).json({ error: 'Missing fields' });

        await authService.changeUserPassword(userId, old_password, new_password);
        return res.json({ message: 'Password changed successfully' });
    } catch (err: any) {
        return res.status(400).json({ error: err.message });
    }
}

export async function verifyEmail(req: Request, res: Response) {
    try {
        const { email, otp } = req.body;
        const user = await authService.verifyEmail(email, otp);

        // Return tokens to support verify-otp-login behavior
        const payload = { sub: user.id, role: user.role };
        const accessToken = jwt.sign(payload, jwtConfig.accessTokenSecret, { expiresIn: jwtConfig.accessExpiresIn as any });
        const refreshToken = jwt.sign(payload, jwtConfig.refreshTokenSecret, { expiresIn: jwtConfig.refreshExpiresIn as any });

        res.cookie('accessToken', accessToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 15 * 60 * 1000 });
        res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 7 * 24 * 60 * 60 * 1000 });

        return res.json({
            message: 'Email verified successfully',
            user: { id: user.id, email: user.email, name: user.name },
            accessToken,
            refreshToken
        });
    } catch (err: any) {
        return res.status(400).json({ error: err.message });
    }
}

export async function refresh(req: Request, res: Response) {
    try {
        const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
        if (!refreshToken) return res.status(400).json({ error: 'Refresh token required' });

        const decoded = jwt.verify(refreshToken, jwtConfig.refreshTokenSecret) as any;
        const payload = { sub: decoded.sub, role: decoded.role };

        const newAccessToken = jwt.sign(payload, jwtConfig.accessTokenSecret, { expiresIn: jwtConfig.accessExpiresIn as any });

        res.cookie('accessToken', newAccessToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 15 * 60 * 1000 });

        return res.json({ accessToken: newAccessToken });
    } catch (err: any) {
        return res.status(401).json({ error: 'Invalid refresh token' });
    }
}

export async function googleLogin(req: Request, res: Response) {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({ error: 'Google ID token is required' });
        }

        // Verify Google token
        const googleProfile = await googleAuthService.verifyGoogleToken(token);

        // Find or create user
        const user = await googleAuthService.findOrCreateGoogleUser(googleProfile);

        // Generate JWT tokens
        const payload = { sub: user.id, role: user.role };
        const accessToken = jwt.sign(payload, jwtConfig.accessTokenSecret, { expiresIn: jwtConfig.accessExpiresIn as any });
        const refreshToken = jwt.sign(payload, jwtConfig.refreshTokenSecret, { expiresIn: jwtConfig.refreshExpiresIn as any });

        // Set cookies
        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 24 * 60 * 60 * 1000
        });

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        return res.json({
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                image: user.image
            },
            accessToken,
            refreshToken
        });
    } catch (err: any) {
        return res.status(400).json({ error: err.message });
    }
}

export async function setPassword(req: Request, res: Response) {
    try {
        const userId = (req as any).user.id;
        const { password, confirm_password } = req.body;

        if (!password || !confirm_password) {
            return res.status(400).json({ error: 'password and confirm_password are required' });
        }

        if (password !== confirm_password) {
            return res.status(400).json({ error: 'Passwords do not match' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        // Hash and update password
        const hashedPassword = await hashPassword(password);
        await userService.updateUser(userId, { password: hashedPassword });

        return res.json({ message: 'Password set successfully. You can now login with email and password.' });
    } catch (err: any) {
        return res.status(400).json({ error: err.message });
    }
}

export async function forgotPassword(req: Request, res: Response) {
    try {
        const { email } = req.body;
        await authService.forgotPassword(email);
        return res.json({ message: 'OTP sent to email' });
    } catch (err: any) {
        return res.status(400).json({ error: err.message });
    }
}

export async function resetPassword(req: Request, res: Response) {
    try {
        const { email, otp, new_password } = req.body;
        await authService.resetPassword(email, otp, new_password);
        return res.json({ message: 'Password reset successful' });
    } catch (err: any) {
        return res.status(400).json({ error: err.message });
    }
}

export async function getSession(req: Request, res: Response) {
    try {
        const userId = (req as any).user?.id;

        if (!userId) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const user = await authService.findUserById(userId);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        return res.json({
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                emailVerified: user.emailVerified,
                image: user.image
            }
        });
    } catch (err: any) {
        return res.status(500).json({ error: err.message });
    }
}

export async function logout(req: Request, res: Response) {
    try {
        // Clear the httpOnly cookies
        res.clearCookie('accessToken', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax'
        });

        res.clearCookie('refreshToken', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax'
        });

        return res.json({ message: 'Logged out successfully' });
    } catch (err: any) {
        return res.status(500).json({ error: err.message });
    }
}
