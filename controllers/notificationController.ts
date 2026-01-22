import { Request, Response } from 'express';
import * as notificationService from '../services/notificationService';

export async function listNotifications(req: Request, res: Response) {
    try {
        const userId = (req as any).user.id;
        const userType = (req as any).user.type;

        let results;
        if (userType === 'parent') {
            results = await notificationService.getNotifications(userId, undefined);
        } else {
            results = await notificationService.getNotifications(undefined, userId);
        }

        return res.json(results);
    } catch (err: any) {
        return res.status(500).json({ error: err.message });
    }
}

export async function markRead(req: Request, res: Response) {
    try {
        const userId = (req as any).user.id;
        const userType = (req as any).user.type;
        const { id } = req.params;

        let notification;
        if (userType === 'parent') {
            notification = await notificationService.markAsRead(id, userId, undefined);
        } else {
            notification = await notificationService.markAsRead(id, undefined, userId);
        }

        return res.json({
            message: 'Notification marked as read',
            notification
        });
    } catch (err: any) {
        return res.status(400).json({ error: err.message });
    }
}

export async function markAllRead(req: Request, res: Response) {
    try {
        const userId = (req as any).user.id;
        const userType = (req as any).user.type;

        if (userType === 'parent') {
            await notificationService.markAllAsRead(userId, undefined);
        } else {
            await notificationService.markAllAsRead(undefined, userId);
        }

        return res.json({ message: 'All notifications marked as read' });
    } catch (err: any) {
        return res.status(500).json({ error: err.message });
    }
}

export async function removeNotification(req: Request, res: Response) {
    try {
        const userId = (req as any).user.id;
        const userType = (req as any).user.type;
        const { id } = req.params;

        if (userType === 'parent') {
            await notificationService.deleteNotification(id, userId, undefined);
        } else {
            await notificationService.deleteNotification(id, undefined, userId);
        }

        return res.status(204).send();
    } catch (err: any) {
        return res.status(400).json({ error: err.message });
    }
}

export async function clearAll(req: Request, res: Response) {
    try {
        const userId = (req as any).user.id;
        const userType = (req as any).user.type;

        if (userType === 'parent') {
            await notificationService.clearAll(userId, undefined);
        } else {
            await notificationService.clearAll(undefined, userId);
        }

        return res.json({ message: 'All notifications cleared' });
    } catch (err: any) {
        return res.status(500).json({ error: err.message });
    }
}

