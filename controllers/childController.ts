import { Request, Response } from 'express';
import * as childService from '../services/childService';
import { jwtConfig } from '../config/jwt';
import jwt from 'jsonwebtoken';

export async function createChild(req: Request, res: Response) {
    try {
        const parentId = (req as any).user.id;
        const { username, name, pin } = req.body;

        const child = await childService.createChild(parentId, { username, name, pin });

        return res.status(201).json({
            id: child.id,
            username: child.username,
            name: child.name,
            avatar: child.avatar,
            createdAt: child.createdAt
        });
    } catch (err: any) {
        return res.status(400).json({ error: err.message });
    }
}

export async function listChildren(req: Request, res: Response) {
    try {
        const parentId = (req as any).user.id;
        const children = await childService.getChildrenByParent(parentId);

        return res.json({
            count: children.length,
            next: null,
            previous: null,
            results: children
        });
    } catch (err: any) {
        return res.status(500).json({ error: err.message });
    }
}

export async function getChild(req: Request, res: Response) {
    try {
        const parentId = (req as any).user.id;
        const { id } = req.params;

        const child = await childService.getChildById(id, parentId);
        return res.json(child);
    } catch (err: any) {
        return res.status(404).json({ error: err.message });
    }
}

export async function updateChild(req: Request, res: Response) {
    try {
        const parentId = (req as any).user.id;
        const { id } = req.params;
        const { username, name, pin } = req.body;

        const updated = await childService.updateChild(id, parentId, { username, name, pin });
        return res.json(updated);
    } catch (err: any) {
        return res.status(400).json({ error: err.message });
    }
}

export async function deleteChild(req: Request, res: Response) {
    try {
        const parentId = (req as any).user.id;
        const { id } = req.params;

        await childService.deleteChild(id, parentId);
        return res.status(204).send();
    } catch (err: any) {
        return res.status(400).json({ error: err.message });
    }
}

export async function childLogin(req: Request, res: Response) {
    try {
        const { username, pin } = req.body;

        const authResult = await childService.authenticateChild(username, pin);
        if (!authResult) {
            return res.status(401).json({ error: 'Invalid username or PIN' });
        }

        // Generate JWT tokens for child
        const accessToken = jwt.sign(
            {
                sub: authResult.childId,
                role: 'child',
                parentId: authResult.parentId,
                childUsername: authResult.childUsername
            },
            jwtConfig.accessTokenSecret,
            { expiresIn: jwtConfig.accessExpiresIn as any }
        );

        const refreshToken = jwt.sign(
            {
                sub: authResult.childId,
                role: 'child',
                parentId: authResult.parentId
            },
            jwtConfig.refreshTokenSecret,
            { expiresIn: jwtConfig.refreshExpiresIn as any }
        );

        // Set cookies
        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 24 * 60 * 60 * 1000 // 1 day
        });

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        return res.json({
            childId: authResult.childId,
            childUsername: authResult.childUsername,
            childName: authResult.childName,
            parentId: authResult.parentId,
            token: accessToken,
            refresh: refreshToken
        });
    } catch (err: any) {
        return res.status(400).json({ error: err.message });
    }
}
