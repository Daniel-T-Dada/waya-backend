import { Request, Response } from 'express';
import * as walletService from '../services/walletService';
import * as transactionService from '../services/transactionService';

export async function getWallet(req: Request, res: Response) {
    try {
        const userId = (req as any).user.id;
        const wallet = await walletService.getWalletByUserId(userId);
        return res.json(wallet);
    } catch (err: any) {
        return res.status(500).json({ error: err.message });
    }
}

export async function addFunds(req: Request, res: Response) {
    try {
        const userId = (req as any).user.id;
        const { amount, pin } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({ error: 'Invalid amount' });
        }

        const result = await walletService.addFunds(userId, amount, pin);
        return res.json({
            message: 'Funds added successfully!',
            new_balance: result.new_balance
        });
    } catch (err: any) {
        return res.status(400).json({ error: err.message });
    }
}

export async function transferToChild(req: Request, res: Response) {
    try {
        const userId = (req as any).user.id;
        const { childId, amount, pin, description } = req.body;

        if (!childId || !amount || !pin) {
            return res.status(400).json({ error: 'childId, amount, and pin are required' });
        }

        const result = await walletService.transferToChild(userId, childId, amount, pin, description);
        return res.json({
            message: 'Transfer successful!',
            transaction_id: result.transaction_id,
            parent_balance: result.parent_balance,
            child_balance: result.child_balance
        });
    } catch (err: any) {
        return res.status(400).json({ error: err.message });
    }
}

export async function setPin(req: Request, res: Response) {
    try {
        const userId = (req as any).user.id;
        const { pin, confirm_pin } = req.body;

        if (!pin || !confirm_pin) {
            return res.status(400).json({ error: 'pin and confirm_pin are required' });
        }

        await walletService.setWalletPin(userId, pin, confirm_pin);
        return res.json({ message: 'PIN set successfully!' });
    } catch (err: any) {
        return res.status(400).json({ error: err.message });
    }
}

export async function makePayment(req: Request, res: Response) {
    try {
        const userId = (req as any).user.id;
        const { amount, description, childId, pin } = req.body;

        if (!amount || !childId || !pin || !description) {
            return res.status(400).json({ error: 'amount, childId, pin, and description are required' });
        }

        const result = await walletService.makePayment(userId, childId, amount, pin, description);
        return res.json({
            message: 'Payment successful!',
            transaction_id: result.transaction_id,
            new_balance: result.new_balance
        });
    } catch (err: any) {
        return res.status(400).json({ error: err.message });
    }
}

export async function getDashboardStats(req: Request, res: Response) {
    try {
        const userId = (req as any).user.id;
        const stats = await walletService.getDashboardStats(userId);
        return res.json(stats);
    } catch (err: any) {
        return res.status(500).json({ error: err.message });
    }
}

export async function getWalletDashboard(req: Request, res: Response) {
    try {
        const userId = (req as any).user.id;
        const dashboard = await walletService.getWalletDashboard(userId);
        return res.json(dashboard);
    } catch (err: any) {
        return res.status(500).json({ error: err.message });
    }
}


export async function getChildWallets(req: Request, res: Response) {
    try {
        const userId = (req as any).user.id;
        const wallets = await walletService.getChildWallets(userId);
        return res.json({
            count: wallets.length,
            results: wallets
        });
    } catch (err: any) {
        return res.status(500).json({ error: err.message });
    }
}

export async function getChildWalletAnalysis(req: Request, res: Response) {
    try {
        const userId = (req as any).user.id;
        const analysis = await walletService.getChildWalletAnalysis(userId);
        return res.json(analysis);
    } catch (err: any) {
        return res.status(500).json({ error: err.message });
    }
}

export async function listTransactions(req: Request, res: Response) {
    try {
        const userId = (req as any).user.id;
        const wallet = await walletService.getWalletByUserId(userId);

        const { status, type, childId } = req.query;
        const transactions = await transactionService.getTransactions(wallet.id, {
            status: status as string,
            type: type as string,
            childId: childId as string
        });

        return res.json({
            count: transactions.length,
            next: null,
            previous: null,
            results: transactions
        });
    } catch (err: any) {
        return res.status(500).json({ error: err.message });
    }
}

export async function createTransaction(req: Request, res: Response) {
    try {
        const userId = (req as any).user.id;
        const wallet = await walletService.getWalletByUserId(userId);
        const { type, amount, child, description, status } = req.body;

        const transaction = await transactionService.createTransaction({
            type,
            amount,
            status: status || 'pending',
            description,
            walletId: wallet.id,
            childId: child
        });

        return res.status(201).json(transaction);
    } catch (err: any) {
        return res.status(400).json({ error: err.message });
    }
}

export async function getTransaction(req: Request, res: Response) {
    try {
        const userId = (req as any).user.id;
        const wallet = await walletService.getWalletByUserId(userId);
        const { id } = req.params;

        const transaction = await transactionService.getTransactionById(id, wallet.id);
        return res.json(transaction);
    } catch (err: any) {
        return res.status(404).json({ error: err.message });
    }
}

export async function completeTransaction(req: Request, res: Response) {
    try {
        const userId = (req as any).user.id;
        const wallet = await walletService.getWalletByUserId(userId);
        const { id } = req.params;

        const transaction = await transactionService.completeTransaction(id, wallet.id);
        return res.json({
            message: 'Transaction completed successfully!',
            transaction
        });
    } catch (err: any) {
        return res.status(400).json({ error: err.message });
    }
}

export async function cancelTransaction(req: Request, res: Response) {
    try {
        const userId = (req as any).user.id;
        const wallet = await walletService.getWalletByUserId(userId);
        const { id } = req.params;

        const transaction = await transactionService.cancelTransaction(id, wallet.id);
        return res.json({
            message: 'Transaction cancelled successfully!',
            transaction
        });
    } catch (err: any) {
        return res.status(400).json({ error: err.message });
    }
}

export async function getEarningsChart(req: Request, res: Response) {
    try {
        const userId = (req as any).user.id;
        const data = await walletService.getEarningsChartData(userId);
        return res.json({ results: data });
    } catch (err: any) {
        return res.status(500).json({ error: err.message });
    }
}

export async function getSavingsBreakdown(req: Request, res: Response) {
    try {
        const userId = (req as any).user.id;
        const data = await walletService.getSavingsBreakdown(userId);
        return res.json(data);
    } catch (err: any) {
        return res.status(500).json({ error: err.message });
    }
}

export async function getRewardCharts(req: Request, res: Response) {
    try {
        const userId = (req as any).user.id;
        const data = await walletService.getRewardDistribution(userId);
        return res.json({ results: data });
    } catch (err: any) {
        return res.status(500).json({ error: err.message });
    }
}
