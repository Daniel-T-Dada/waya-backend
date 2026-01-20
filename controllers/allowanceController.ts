import { Request, Response } from 'express';
import * as allowanceService from '../services/allowanceService';

export async function createAllowance(req: Request, res: Response) {
    try {
        const parentId = (req as any).user.id;
        const { childId, amount, frequency, status } = req.body;

        if (!childId || amount === undefined || !frequency) {
            return res.status(400).json({ error: 'childId, amount, and frequency are required' });
        }

        const allowance = await allowanceService.createAllowance(parentId, {
            childId,
            amount,
            frequency,
            status
        });

        return res.status(201).json(allowance);
    } catch (err: any) {
        return res.status(400).json({ error: err.message });
    }
}

export async function listAllowances(req: Request, res: Response) {
    try {
        const parentId = (req as any).user.id;
        const { status } = req.query;

        const allowances = await allowanceService.getAllowances(parentId, status as any);

        return res.json({
            count: allowances.length,
            results: allowances
        });
    } catch (err: any) {
        return res.status(500).json({ error: err.message });
    }
}

export async function getAllowance(req: Request, res: Response) {
    try {
        const parentId = (req as any).user.id;
        const { allowance_id } = req.params;

        const allowance = await allowanceService.getAllowanceById(allowance_id, parentId);
        return res.json(allowance);
    } catch (err: any) {
        return res.status(404).json({ error: err.message });
    }
}

export async function updateAllowance(req: Request, res: Response) {
    try {
        const parentId = (req as any).user.id;
        const { allowance_id } = req.params;
        const { amount, frequency, status } = req.body;

        const updated = await allowanceService.updateAllowance(allowance_id, parentId, {
            amount,
            frequency,
            status
        });

        return res.json(updated);
    } catch (err: any) {
        return res.status(400).json({ error: err.message });
    }
}

export async function deleteAllowance(req: Request, res: Response) {
    try {
        const parentId = (req as any).user.id;
        const { allowance_id } = req.params;

        await allowanceService.deleteAllowance(allowance_id, parentId);
        return res.status(204).send();
    } catch (err: any) {
        return res.status(400).json({ error: err.message });
    }
}

/**
 * Endpoint to manually trigger allowance processing (for testing or manual runs).
 * In production, this would be a internal task or cron job.
 */
export async function processAllowances(req: Request, res: Response) {
    try {
        // You might want to restrict this to system/admin only, but for now we'll allow authenticated parents to trigger it for testing
        const results = await allowanceService.processDueAllowances();
        return res.json({ message: 'Processed due allowances', results });
    } catch (err: any) {
        return res.status(500).json({ error: err.message });
    }
}
