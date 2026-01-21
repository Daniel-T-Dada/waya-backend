import { prisma } from '../prisma';
import { hashPin, comparePin } from '../utils/hash';
import * as transactionService from './transactionService';
import * as notificationService from './notificationService';
import * as cacheService from './cacheService';
import { notifyUser } from '../utils/socket';
import { Prisma } from '../generated/prisma/client.js';

// Get wallet by user ID
export async function getWalletByUserId(userId: string) {
    let wallet = await prisma.wallet.findUnique({
        where: { userId: userId },
        select: {
            id: true,
            userId: true,
            balance: true,
            currency: true,
            createdAt: true,
            updatedAt: true
        }
    });

    // Auto-create wallet if it doesn't exist
    if (!wallet) {
        wallet = await prisma.wallet.create({
            data: {
                userId: userId,
                balance: 0,
                currency: 'NGN'
            },
            select: {
                id: true,
                userId: true,
                balance: true,
                currency: true,
                createdAt: true,
                updatedAt: true
            }
        });
    }

    return wallet;
}

// Add funds to wallet
export async function addFunds(userId: string, amount: number, pin?: string) {
    const wallet = await getWalletByUserId(userId);

    // Verify PIN if wallet has one set
    if (wallet && await hasWalletPin(userId)) {
        if (!pin) throw new Error('Wallet PIN is required');
        const isValid = await verifyWalletPin(userId, pin);
        if (!isValid) throw new Error('Invalid wallet PIN');
    }

    const newBalance = Number(wallet.balance) + amount;

    const updated = await prisma.wallet.update({
        where: { id: wallet.id },
        data: { balance: newBalance }
    });

    // Invalidate caches
    await cacheService.del(`wallet_stats:${userId}`);
    await cacheService.del(`earnings_chart:${userId}`);
    await cacheService.del(`reward_dist:${userId}`);

    // Create transaction record
    await transactionService.createTransaction({
        type: 'credit',
        amount,
        status: 'completed',
        description: `Funds added to wallet`,
        walletId: wallet.id
    });

    // Notify parent
    await notificationService.createNotification({
        userId: userId,
        type: 'funds_added',
        title: 'Funds Added',
        message: `Successfully added ${amount} to your wallet.`,
        relatedObjectType: 'wallet',
        relatedObjectId: wallet.id
    });

    // Real-time Balance Update
    notifyUser(userId, 'balance_update', { new_balance: updated.balance });

    return { new_balance: updated.balance };
}

// Transfer funds to child
export async function transferToChild(userId: string, childId: string, amount: number, pin: string, description?: string) {
    const wallet = await getWalletByUserId(userId);

    // Verify PIN
    if (await hasWalletPin(userId)) {
        const isValid = await verifyWalletPin(userId, pin);
        if (!isValid) throw new Error('Invalid wallet PIN');
    }

    // Verify child ownership
    const child = await prisma.child.findUnique({
        where: { id: childId },
        include: { wallet: true }
    });

    if (!child) throw new Error('Child not found');
    if (child.parentId !== userId) throw new Error('Unauthorized: You do not own this child');
    if (!child.wallet) throw new Error('Child wallet not found');

    // Check sufficient balance
    if (Number(wallet.balance) < amount) {
        throw new Error('Insufficient balance');
    }

    // Perform transfer in transaction
    const result = await prisma.$transaction(async (tx) => {
        // Deduct from parent wallet
        const updatedParentWallet = await tx.wallet.update({
            where: { id: wallet.id },
            data: { balance: Number(wallet.balance) - amount }
        });

        // Add to child wallet
        const updatedChildWallet = await tx.childWallet.update({
            where: { id: child.wallet!.id },
            data: {
                balance: Number(child.wallet!.balance) + amount,
                totalEarned: Number(child.wallet!.totalEarned) + amount
            }
        });

        // Create transaction record
        const transaction = await tx.transaction.create({
            data: {
                type: 'transfer',
                amount,
                status: 'completed',
                description: description || `Transfer to ${child.name || child.username}`,
                childId: childId,
                walletId: wallet.id
            }
        });

        return {
            parent_balance: updatedParentWallet.balance,
            child_balance: updatedChildWallet.balance,
            transaction_id: transaction.id
        };
    });

    // Invalidate caches
    await cacheService.del(`wallet_stats:${userId}`);
    await cacheService.del(`earnings_chart:${userId}`);
    await cacheService.del(`savings_breakdown:${userId}`);
    await cacheService.del(`child_wallets:${userId}`);

    // Notify child
    await notificationService.createNotification({
        childId: childId,
        type: 'transfer_received',
        title: 'Money Received!',
        message: `Your parent has transferred ${amount} to your wallet.`,
        relatedObjectType: 'transaction',
        relatedObjectId: result.transaction_id
    });

    // Real-time Balance Update
    notifyUser(userId, 'balance_update', { new_balance: result.parent_balance });
    notifyUser(childId, 'balance_update', { new_balance: result.child_balance });

    return result;
}

// Make payment (deduct from child wallet)
export async function makePayment(userId: string, childId: string, amount: number, pin: string, description: string) {
    const wallet = await getWalletByUserId(userId);

    // Verify PIN
    if (await hasWalletPin(userId)) {
        const isValid = await verifyWalletPin(userId, pin);
        if (!isValid) throw new Error('Invalid wallet PIN');
    }

    // Verify child ownership
    const child = await prisma.child.findUnique({
        where: { id: childId },
        include: { wallet: true }
    });

    if (!child) throw new Error('Child not found');
    if (child.parentId !== userId) throw new Error('Unauthorized: You do not own this child');
    if (!child.wallet) throw new Error('Child wallet not found');

    // Check sufficient balance in child wallet
    if (Number(child.wallet.balance) < amount) {
        throw new Error('Insufficient balance in child wallet');
    }

    // Perform payment
    const result = await prisma.$transaction(async (tx) => {
        // Deduct from child wallet
        const updatedChildWallet = await tx.childWallet.update({
            where: { id: child.wallet!.id },
            data: {
                balance: Number(child.wallet!.balance) - amount,
                totalSpent: Number(child.wallet!.totalSpent) + amount
            }
        });

        // Create transaction record
        const transaction = await tx.transaction.create({
            data: {
                type: 'debit',
                amount,
                status: 'paid',
                description,
                childId: childId,
                walletId: wallet.id
            }
        });

        return {
            new_balance: updatedChildWallet.balance,
            transaction_id: transaction.id
        };
    });

    // Invalidate caches
    await cacheService.del(`wallet_stats:${userId}`);
    await cacheService.del(`earnings_chart:${userId}`);
    await cacheService.del(`savings_breakdown:${userId}`);
    await cacheService.del(`child_wallets:${userId}`);

    return result;
}

// Set wallet PIN
export async function setWalletPin(userId: string, pin: string, confirmPin: string) {
    if (pin !== confirmPin) {
        throw new Error('PINs do not match');
    }

    if (!/^\d{4}$/.test(pin)) {
        throw new Error('PIN must be exactly 4 digits');
    }

    const wallet = await getWalletByUserId(userId);
    const hashedPin = await hashPin(pin);

    await prisma.wallet.update({
        where: { id: wallet.id },
        data: { pin: hashedPin }
    });

    return true;
}

// Verify wallet PIN
export async function verifyWalletPin(userId: string, pin: string): Promise<boolean> {
    const wallet = await prisma.wallet.findUnique({
        where: { userId: userId },
        select: { pin: true }
    });

    if (!wallet || !wallet.pin) return false;
    return comparePin(pin, wallet.pin);
}

// Check if wallet has PIN set
export async function hasWalletPin(userId: string): Promise<boolean> {
    const wallet = await prisma.wallet.findUnique({
        where: { userId: userId },
        select: { pin: true }
    });

    return !!(wallet && wallet.pin);
}

// Get dashboard stats
export async function getDashboardStats(userId: string) {
    const cacheKey = `wallet_stats:${userId}`;
    const cached = await cacheService.get<any>(cacheKey);
    if (cached) return cached;

    const wallet = await getWalletByUserId(userId);

    const children = await prisma.child.count({
        where: { parentId: userId }
    });

    const childWallets = await prisma.childWallet.findMany({
        where: { parentWalletId: wallet.id }
    });

    const totalEarned = childWallets.reduce((sum, cw) => sum + Number(cw.totalEarned), 0);
    const totalSpent = childWallets.reduce((sum, cw) => sum + Number(cw.totalSpent), 0);

    const transactions = await prisma.transaction.groupBy({
        by: ['status'],
        where: { walletId: wallet.id },
        _count: true
    });

    const pending = transactions.find(t => t.status === 'pending')?._count || 0;
    const completed = transactions.find(t => t.status === 'completed')?._count || 0;

    const result = {
        total_balance: wallet.balance,
        total_children: children,
        totalSpent: totalSpent,
        totalEarned: totalEarned,
        pending_transactions: pending,
        completed_transactions: completed
    };

    await cacheService.set(cacheKey, result, 300);
    return result;
}

// Get child wallets
export async function getChildWallets(userId: string) {
    const cacheKey = `child_wallets:${userId}`;
    const cached = await cacheService.get<any[]>(cacheKey);
    if (cached) return cached;

    const wallet = await getWalletByUserId(userId);

    const childWallets = await prisma.childWallet.findMany({
        where: { parentWalletId: wallet.id },
        include: {
            child: {
                select: {
                    id: true,
                    name: true,
                    username: true
                }
            }
        }
    });

    const result = childWallets.map(cw => ({
        id: cw.id,
        child: cw.childId,
        child_name: cw.child.name || cw.child.username,
        balance: cw.balance,
        totalEarned: cw.totalEarned,
        totalSpent: cw.totalSpent,
        createdAt: cw.createdAt
    }));

    await cacheService.set(cacheKey, result, 300);
    return result;
}

// Get child wallet analysis
export async function getChildWalletAnalysis(userId: string) {
    const childWallets = await getChildWallets(userId);

    const totalBalance = childWallets.reduce((sum, cw) => sum + Number(cw.balance), 0);
    const totalEarned = childWallets.reduce((sum, cw) => sum + Number(cw.totalEarned), 0);
    const totalSpent = childWallets.reduce((sum, cw) => sum + Number(cw.totalSpent), 0);
    const averageBalance = childWallets.length > 0 ? totalBalance / childWallets.length : 0;

    const topEarner = childWallets.reduce((max, cw) =>
        Number(cw.totalEarned) > Number(max.totalEarned) ? cw : max
        , childWallets[0]);

    return {
        total_children: childWallets.length,
        total_balance: totalBalance,
        totalEarned: totalEarned,
        totalSpent: totalSpent,
        average_balance: averageBalance,
        top_earner: topEarner ? {
            childId: topEarner.child,
            child_name: topEarner.child_name,
            totalEarned: topEarner.totalEarned
        } : null
    };
}

// Get earnings chart data (last 7 days)
export async function getEarningsChartData(userId: string) {
    const cacheKey = `earnings_chart:${userId}`;
    const cached = await cacheService.get<any[]>(cacheKey);
    if (cached) return cached;

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));

    const transactions = await prisma.transaction.findMany({
        where: {
            wallet: { userId: userId },
            type: { in: ['reward', 'credit', 'transfer'] },
            status: 'completed',
            createdAt: { gte: sevenDaysAgo }
        },
        orderBy: { createdAt: 'asc' }
    });

    const dailyEarnings: Record<string, number> = {};
    for (let i = 0; i < 7; i++) {
        const d = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000));
        const dateStr = d.toISOString().split('T')[0];
        dailyEarnings[dateStr] = 0;
    }

    transactions.forEach(t => {
        const dateStr = t.createdAt.toISOString().split('T')[0];
        if (dailyEarnings[dateStr] !== undefined) {
            dailyEarnings[dateStr] += Number(t.amount);
        }
    });

    const result = Object.entries(dailyEarnings)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, amount]) => ({ date, amount }));

    await cacheService.set(cacheKey, result, 300);
    return result;
}

// Get savings breakdown (active goals vs. wallet balance)
export async function getSavingsBreakdown(userId: string) {
    const cacheKey = `savings_breakdown:${userId}`;
    const cached = await cacheService.get<any>(cacheKey);
    if (cached) return cached;

    const parentWallet = await getWalletByUserId(userId);
    const childWallets = await prisma.childWallet.findMany({
        where: { parentWalletId: parentWallet.id }
    });

    const totalWalletBalance = childWallets.reduce((sum, cw) => sum + Number(cw.balance), 0);

    const goals = await prisma.goal.aggregate({
        where: { child: { parentId: userId }, status: 'in_progress' },
        _sum: { currentAmount: true }
    });

    const totalInGoals = Number(goals._sum?.currentAmount || 0);

    const result = {
        wallet_balance: totalWalletBalance,
        goal_savings: totalInGoals,
        total: totalWalletBalance + totalInGoals
    };

    await cacheService.set(cacheKey, result, 300);
    return result;
}

// Get reward distribution (Bar chart data)
export async function getRewardDistribution(userId: string) {
    const cacheKey = `reward_dist:${userId}`;
    const cached = await cacheService.get<any[]>(cacheKey);
    if (cached) return cached;

    const parentWallet = await getWalletByUserId(userId);

    const transactions = await prisma.transaction.findMany({
        where: {
            walletId: parentWallet.id,
            status: 'completed',
            type: { in: ['reward', 'credit', 'transfer'] }
        }
    });

    let choreRewards = 0;
    let allowanceRewards = 0;
    let learningRewards = 0;

    transactions.forEach(t => {
        const desc = t.description.toLowerCase();
        if (desc.includes('chore')) choreRewards += Number(t.amount);
        else if (desc.includes('allowance')) allowanceRewards += Number(t.amount);
        else if (desc.includes('moneymaze') || desc.includes('quiz')) learningRewards += Number(t.amount);
    });

    const result = [
        { label: 'Chores', value: choreRewards },
        { label: 'Allowance', value: allowanceRewards },
        { label: 'MoneyMaze', value: learningRewards }
    ];

    await cacheService.set(cacheKey, result, 300);
    return result;
}
