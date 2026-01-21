import { Request, Response } from 'express';
import * as goalService from '../services/goalService';
import { prisma } from '../prisma';

export async function createGoal(req: Request, res: Response) {
    try {
        const childId = (req as any).user.id; // From child auth middleware
        const { title, description, targetAmount } = req.body;

        if (!title || !description || targetAmount === undefined) {
            return res.status(400).json({ error: 'title, description, and targetAmount are required' });
        }

        const goal = await goalService.createGoal(childId, {
            title,
            description,
            targetAmount
        });

        return res.status(201).json(goal);
    } catch (err: any) {
        return res.status(400).json({ error: err.message });
    }
}

export async function listGoals(req: Request, res: Response) {
    try {
        const childId = (req as any).user.id;
        const goals = await goalService.getChildGoals(childId);

        return res.json({
            count: goals.length,
            results: goals
        });
    } catch (err: any) {
        return res.status(500).json({ error: err.message });
    }
}

export async function addSavings(req: Request, res: Response) {
    try {
        const childId = (req as any).user.id;
        const { goal_id } = req.params;
        const { amount } = req.body;

        if (amount === undefined || amount <= 0) {
            return res.status(400).json({ error: 'A valid amount is required' });
        }

        const result = await goalService.addSavingsToGoal(childId, goal_id, amount);
        return res.json(result);
    } catch (err: any) {
        return res.status(400).json({ error: err.message });
    }
}

export async function getProgress(req: Request, res: Response) {
    try {
        const childId = (req as any).user.id;
        const progress = await goalService.getGoalProgress(childId);
        return res.json(progress);
    } catch (err: any) {
        return res.status(500).json({ error: err.message });
    }
}

export async function getLeaderboard(req: Request, res: Response) {
    try {
        // Leaderboard usually takes parent token as per docs 10.3
        // But let's check if the user is a child or parent
        const userId = (req as any).user.id;
        const userType = (req as any).user.type; // Assuming requireAuth middleware sets this

        let parentId: string;

        if (userType === 'child') {
            // If child, find their parentId
            const childId = userId;
            const childInfo = await prisma.child.findUnique({
                where: { id: childId },
                select: { parentId: true }
            });
            if (!childInfo) return res.status(404).json({ error: 'Child not found' });
            parentId = childInfo.parentId;
        } else {
            parentId = userId;
        }

        const leaderboard = await goalService.getLeaderboard(parentId);
        return res.json({ leaderboard });
    } catch (err: any) {
        return res.status(500).json({ error: err.message });
    }
}

export async function getRewards(req: Request, res: Response) {
    try {
        const childId = (req as any).user.id;
        const rewards = await goalService.getGoalRewards(childId);
        return res.json(rewards);
    } catch (err: any) {
        return res.status(500).json({ error: err.message });
    }
}
