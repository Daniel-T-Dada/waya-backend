import { Request, Response } from 'express';
import * as insightService from '../services/insightService';

export async function getChoreInsights(req: Request, res: Response) {
    try {
        const userId = (req as any).user.id;
        const insights = await insightService.getChoreInsights(userId);
        return res.json(insights);
    } catch (err: any) {
        return res.status(500).json({ error: err.message });
    }
}

export async function getRecentActivities(req: Request, res: Response) {
    try {
        const userId = (req as any).user.id;
        const activities = await insightService.getRecentActivities(userId);
        return res.json(activities);
    } catch (err: any) {
        return res.status(500).json({ error: err.message });
    }
}
