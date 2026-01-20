import { Request, Response } from 'express';
import * as choreService from '../services/choreService';

export async function createChore(req: Request, res: Response) {
    try {
        const parentId = (req as any).user.id;
        const { title, description, assignedTo, reward, dueDate, category } = req.body;

        if (!title || !description || !assignedTo || reward === undefined) {
            return res.status(400).json({ error: 'title, description, assignedTo, and reward are required' });
        }

        const chore = await choreService.createChore(parentId, {
            title,
            description,
            assignedTo,
            reward,
            dueDate,
            category
        });

        return res.status(201).json(chore);
    } catch (err: any) {
        return res.status(400).json({ error: err.message });
    }
}

export async function listChores(req: Request, res: Response) {
    try {
        const parentId = (req as any).user.id;
        const { status, assignedTo, category } = req.query;

        const chores = await choreService.getChores(parentId, {
            status: status as string,
            assignedTo: assignedTo as string,
            category: category as string
        });

        return res.json({
            count: chores.length,
            next: null,
            previous: null,
            results: chores
        });
    } catch (err: any) {
        return res.status(500).json({ error: err.message });
    }
}

export async function getChore(req: Request, res: Response) {
    try {
        const parentId = (req as any).user.id;
        const { id } = req.params;

        const chore = await choreService.getChoreById(id, parentId);
        return res.json(chore);
    } catch (err: any) {
        return res.status(404).json({ error: err.message });
    }
}

export async function updateChore(req: Request, res: Response) {
    try {
        const parentId = (req as any).user.id;
        const { id } = req.params;
        const { title, description, reward, dueDate, category } = req.body;

        const updated = await choreService.updateChore(id, parentId, {
            title,
            description,
            reward,
            dueDate,
            category
        });

        return res.json(updated);
    } catch (err: any) {
        return res.status(400).json({ error: err.message });
    }
}

export async function deleteChore(req: Request, res: Response) {
    try {
        const parentId = (req as any).user.id;
        const { id } = req.params;

        await choreService.deleteChore(id, parentId);
        return res.status(204).send();
    } catch (err: any) {
        return res.status(400).json({ error: err.message });
    }
}

export async function updateChoreStatus(req: Request, res: Response) {
    try {
        const parentId = (req as any).user.id;
        const { id } = req.params;
        const { status } = req.body;

        if (!status) {
            return res.status(400).json({ error: 'status is required' });
        }

        const updated = await choreService.updateChoreStatus(id, parentId, status);
        return res.json(updated);
    } catch (err: any) {
        return res.status(400).json({ error: err.message });
    }
}

export async function getChoreSummary(req: Request, res: Response) {
    try {
        const parentId = (req as any).user.id;
        const summary = await choreService.getChoreSummary(parentId);
        return res.json(summary);
    } catch (err: any) {
        return res.status(500).json({ error: err.message });
    }
}
