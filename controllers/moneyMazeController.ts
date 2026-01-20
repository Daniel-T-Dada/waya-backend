import { Request, Response } from 'express';
import * as moneyMazeService from '../services/moneyMazeService';

export async function listConcepts(req: Request, res: Response) {
    try {
        const concepts = await moneyMazeService.listConcepts();
        return res.json({
            count: concepts.length,
            results: concepts
        });
    } catch (err: any) {
        return res.status(500).json({ error: err.message });
    }
}

export async function getProgress(req: Request, res: Response) {
    try {
        const childId = (req as any).user.id;
        const progress = await moneyMazeService.getConceptProgress(childId);
        return res.json(progress);
    } catch (err: any) {
        return res.status(500).json({ error: err.message });
    }
}

export async function getQuiz(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const quiz = await moneyMazeService.getQuizDetails(id);
        return res.json(quiz);
    } catch (err: any) {
        return res.status(404).json({ error: err.message });
    }
}

export async function submitQuiz(req: Request, res: Response) {
    try {
        const childId = (req as any).user.id;
        const { quizId, answers } = req.body;

        if (!quizId || !answers) {
            return res.status(400).json({ error: 'Quiz ID and answers are required' });
        }

        const result = await moneyMazeService.submitQuiz(childId, quizId, answers);
        return res.json(result);
    } catch (err: any) {
        return res.status(400).json({ error: err.message });
    }
}

export async function listRewards(req: Request, res: Response) {
    try {
        const childId = (req as any).user.id;
        const rewards = await moneyMazeService.getRewards(childId);
        return res.json(rewards);
    } catch (err: any) {
        return res.status(500).json({ error: err.message });
    }
}

export async function getDashboard(req: Request, res: Response) {
    try {
        const childId = (req as any).user.id;
        const dashboard = await moneyMazeService.getDashboard(childId);
        return res.json(dashboard);
    } catch (err: any) {
        return res.status(500).json({ error: err.message });
    }
}
