import { Request, Response } from 'express';
import * as cloudinaryService from '../services/cloudinaryService';

export async function getSignature(req: Request, res: Response) {
    try {
        const userId = (req as any).user.id;
        const signatureData = cloudinaryService.generateSignature(userId);
        return res.json(signatureData);
    } catch (err: any) {
        return res.status(400).json({ error: err.message });
    }
}
