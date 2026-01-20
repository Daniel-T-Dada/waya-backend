import { Request, Response } from 'express';
import * as settingsService from '../services/settingsService';

export async function getProfile(req: Request, res: Response) {
    try {
        const userId = (req as any).user.id;
        const profile = await settingsService.getProfileSettings(userId);
        return res.json(profile);
    } catch (err: any) {
        return res.status(500).json({ error: err.message });
    }
}

export async function updateProfile(req: Request, res: Response) {
    try {
        const userId = (req as any).user.id;
        const { name, phoneNumber, image } = req.body;
        const updatedProfile = await settingsService.updateProfileSettings(userId, { name, phoneNumber, image });
        return res.json({ message: 'Profile updated successfully', profile: updatedProfile });
    } catch (err: any) {
        return res.status(400).json({ error: err.message });
    }
}

export async function getNotificationSettings(req: Request, res: Response) {
    try {
        const userId = (req as any).user.id;
        const settings = await settingsService.getNotificationSettings(userId);
        return res.json(settings);
    } catch (err: any) {
        return res.status(500).json({ error: err.message });
    }
}

export async function updateNotificationSettings(req: Request, res: Response) {
    try {
        const userId = (req as any).user.id;
        const result = await settingsService.updateNotificationSettings(userId, req.body);
        return res.json(result);
    } catch (err: any) {
        return res.status(400).json({ error: err.message });
    }
}
