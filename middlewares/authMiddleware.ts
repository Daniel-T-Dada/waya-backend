import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { jwtConfig } from '../config/jwt';
import * as authService from '../services/authService';

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
    let token = '';
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.slice(7);
    } else if (req.cookies && req.cookies.accessToken) {
        token = req.cookies.accessToken;
    }

    if (!token) return res.status(401).json({ error: 'Missing token' });

    try {
        const payload = jwt.verify(token, jwtConfig.accessTokenSecret) as any;

        // Try to find as parent first
        let user = await authService.findUserById(payload.sub);
        let userType = 'parent';

        if (!user) {
            // Try to find as child
            const { findChildById } = require('../services/childService'); // dynamic import to avoid circular dep if any
            user = await findChildById(payload.sub);
            userType = 'child';
        }

        if (!user) return res.status(401).json({ error: 'Invalid token or user not found' });

        (req as any).user = { ...user, type: userType };
        next();
    } catch (err: any) {
        return res.status(401).json({ error: 'Invalid token' });
    }
}

export function requireParent(req: Request, res: Response, next: NextFunction) {
    const user = (req as any).user;
    if (!user || user.type !== 'parent') {
        return res.status(403).json({ error: 'Forbidden: Parent access required' });
    }
    next();
}

export function requireChild(req: Request, res: Response, next: NextFunction) {
    const user = (req as any).user;
    if (!user || user.type !== 'child') {
        return res.status(403).json({ error: 'Forbidden: Child access required' });
    }
    next();
}
