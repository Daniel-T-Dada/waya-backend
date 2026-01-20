import { Request, Response } from 'express';
import * as choreService from '../services/choreService';

export async function listChildChores(req: Request, res: Response) {
    try {
        const childId = (req as any).user.id; // Child ID from req.user object
        const { status } = req.query;

        const chores = await choreService.getChildChores(childId, status as string);

        return res.json({
            count: chores.length,
            results: chores
        });
    } catch (err: any) {
        return res.status(500).json({ error: err.message });
    }
}

export async function updateChoreStatus(req: Request, res: Response) {
    try {
        const childId = (req as any).user.id;
        const { id } = req.params;
        const { status } = req.body;

        if (status !== 'completed') {
            return res.status(400).json({ error: 'Children can only mark chores as completed' });
        }

        const result = await choreService.markChoreCompleted(id, childId);
        return res.json(result);
    } catch (err: any) {
        return res.status(400).json({ error: err.message });
    }
}

export async function redeemReward(req: Request, res: Response) {
    try {
        const childId = (req as any).user.id;
        const { id } = req.params;

        const result = await choreService.redeemChoreReward(id, childId);
        return res.json(result);
    } catch (err: any) {
        return res.status(400).json({ error: err.message });
    }
}
