import { Request, Response } from 'express';
import * as childService from '../services/childService';
import * as taskService from '../services/taskService';
import * as walletService from '../services/walletService';
import * as transactionService from '../services/transactionService';
import * as notificationService from '../services/notificationService';
import * as userService from '../services/userService';
import * as insightService from '../services/insightService';
import * as achievementService from '../services/achievementService';

/**
 * Get aggregated dashboard data for parent
 * Combines user info, children, tasks, wallet, and notifications in one request
 */
export async function getParentDashboard(req: Request, res: Response) {
    try {
        const parentId = (req as any).user.id;

        // Fetch all data in parallel for performance
        const [user, children, tasksSummary, wallet, notificationsData] = await Promise.all([
            userService.getUserProfile(parentId),
            childService.getChildrenByParent(parentId),
            taskService.getTasksSummary(parentId),
            walletService.getWalletByUserId(parentId),
            notificationService.getNotifications(parentId)
        ]);

        // Get recent transactions for wallet
        const recentTransactions = wallet ? await transactionService.getTransactions(wallet.id) : [];

        // Calculate quick stats
        const quickStats = {
            activeChildren: children.length,
            pendingApprovals: tasksSummary.pending,
            weeklySpending: 0 // TODO: Calculate from transactions
        };

        return res.json({
            user: {
                id: user?.id,
                name: user?.name,
                email: user?.email,
                avatar: user?.image,
                role: 'parent'
            },
            children: children.map((child: any) => ({
                id: child.id,
                username: child.username,
                name: child.name,
                avatar: child.avatar,
                tasksCompleted: 0, // TODO: Add to child query
                totalTasks: 0 // TODO: Add to child query
            })),
            tasksSummary,
            wallet: {
                balance: wallet?.balance || 0,
                currency: wallet?.currency || 'NGN',
                recentTransactions: recentTransactions.slice(0, 5)
            },
            notifications: notificationsData?.results?.slice(0, 6) || [],
            quickStats
        });
    } catch (error: any) {
        console.error('Error fetching parent dashboard:', error);
        return res.status(500).json({ error: 'Failed to fetch dashboard data' });
    }
}

/**
 * Get aggregated taskmaster data for parent
 * Combines task stats, completed tasks, pending tasks, and children
 */
export async function getParentTaskMaster(req: Request, res: Response) {
    try {
        const parentId = (req as any).user.id;

        // Fetch all data in parallel
        const [taskStats, completedTasks, pendingTasks, children] = await Promise.all([
            taskService.getTasksSummary(parentId),
            taskService.getCompletedTasks(parentId, 10),
            taskService.getPendingTasks(parentId, 10),
            childService.getChildrenByParent(parentId)
        ]);

        return res.json({
            taskStats: {
                totalAssigned: taskStats.total,
                completed: taskStats.completed,
                pending: taskStats.pending,
                overdue: taskStats.overdue
            },
            completedTasks,
            pendingTasks,
            children: children.map(child => ({
                id: child.id,
                username: child.username,
                name: child.name,
                avatar: child.avatar
            }))
        });
    } catch (error: any) {
        console.error('Error fetching parent taskmaster:', error);
        return res.status(500).json({ error: 'Failed to fetch taskmaster data' });
    }
}

/**
 * Get aggregated wallet data for parent
 * Combines balance, transactions, children allowances, and insights
 */
export async function getParentWallet(req: Request, res: Response) {
    try {
        const parentId = (req as any).user.id;

        // Fetch all data in parallel
        const [wallet, children] = await Promise.all([
            walletService.getWalletByUserId(parentId),
            childService.getChildrenWithWallets(parentId)
        ]);

        // Get transactions if wallet exists
        const transactions = wallet ? await transactionService.getTransactions(wallet.id) : [];

        // Separate transactions by type
        const income = transactions.filter((t: any) => t.type === 'credit');
        const expenses = transactions.filter((t: any) => t.type === 'debit');

        // Get children with their wallet balances
        const childrenWithAllowances = children.map((child: any) => {
            const activeAllowance = child.allowances?.find((a: any) => a.status === 'active');
            return {
                id: child.id,
                name: child.name,
                allowance: activeAllowance ? Number(activeAllowance.amount) : 0,
                spent: Number(child.wallet?.totalSpent || 0),
                balance: Number(child.wallet?.balance || 0)
            };
        });

        // Calculate spending insights
        const insights = await insightService.getWalletInsights(parentId);

        return res.json({
            balance: {
                total: wallet?.balance || 0,
                currency: wallet?.currency || 'NGN',
                lastUpdated: wallet?.updatedAt || new Date()
            },
            transactions: {
                income: income.slice(0, 10),
                expenses: expenses.slice(0, 10),
                pagination: {
                    total: transactions.length,
                    page: 1,
                    limit: 20
                }
            },
            children: childrenWithAllowances,
            insights
        });
    } catch (error: any) {
        console.error('Error fetching parent wallet:', error);
        return res.status(500).json({ error: 'Failed to fetch wallet data' });
    }
}

/**
 * Get aggregated insights data for parent
 * Combines task trends, spending patterns, and children performance
 */
export async function getParentInsights(req: Request, res: Response) {
    try {
        const parentId = (req as any).user.id;

        // Fetch all data in parallel
        const [children, tasks, transactions] = await Promise.all([
            childService.getChildrenByParent(parentId),
            taskService.getParentTasks(parentId),
            walletService.getWalletByUserId(parentId).then(wallet =>
                wallet ? transactionService.getTransactions(wallet.id) : []
            )
        ]);

        // Calculate task trends (last 30 days)
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        const recentTasks = tasks.filter(t => new Date(t.createdAt) >= thirtyDaysAgo);

        // Group tasks by day (last 7 days)
        const dailyMap = new Map<string, { completed: number, pending: number }>();
        for (let i = 6; i >= 0; i--) {
            const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
            const key = d.toISOString().split('T')[0];
            dailyMap.set(key, { completed: 0, pending: 0 });
        }

        recentTasks.filter(t => new Date(t.createdAt) >= sevenDaysAgo).forEach((t: any) => {
            const key = new Date(t.createdAt).toISOString().split('T')[0];
            if (dailyMap.has(key)) {
                const data = dailyMap.get(key)!;
                if (t.status === 'completed') data.completed++;
                else data.pending++;
            }
        });

        const taskTrends = {
            daily: Array.from(dailyMap.entries()).map(([date, data]) => ({
                date,
                completed: data.completed,
                pending: data.pending
            })),
            weekly: [], // Simplified for now
            monthly: [] // Simplified for now
        };

        // Calculate spending by child
        const childSpendingMap = new Map<string, number>();
        children.forEach((child: any) => childSpendingMap.set(child.id, 0));

        (transactions as any[]).filter(t => t.type === 'debit' && t.childId).forEach(t => {
            const current = childSpendingMap.get(t.childId) || 0;
            childSpendingMap.set(t.childId, current + Number(t.amount));
        });

        // Calculate spending by category
        const categoryMap = new Map<string, number>();
        (transactions as any[]).filter(t => t.type === 'debit').forEach(t => {
            const desc = t.description.toLowerCase();
            let cat = 'Other';
            if (desc.includes('transfer')) cat = 'Transfers';
            else if (desc.includes('allowance')) cat = 'Allowance';
            else if (desc.includes('food') || desc.includes('grocery')) cat = 'Food';

            const current = categoryMap.get(cat) || 0;
            categoryMap.set(cat, current + Number(t.amount));
        });
        // Calculate trends (Monthly spending for last 6 months)
        const trendMap = new Map<string, number>();
        const months: string[] = [];

        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const key = d.toISOString().slice(0, 7); // YYYY-MM
            const monthName = d.toLocaleString('default', { month: 'short' });
            trendMap.set(key, 0);
            months.push(monthName);
        }

        (transactions as any[]).filter(t => t.type === 'debit').forEach(t => {
            const key = new Date(t.createdAt).toISOString().slice(0, 7);
            if (trendMap.has(key)) {
                trendMap.set(key, (trendMap.get(key) || 0) + Number(t.amount));
            }
        });

        const spendingPatterns = {
            byCategory: Array.from(categoryMap.entries()).map(([category, amount]) => ({
                category,
                amount
            })),
            byChild: children.map((child: any) => ({
                childId: child.id,
                childName: child.name,
                totalSpent: childSpendingMap.get(child.id) || 0
            })),
            trends: Array.from(trendMap.entries()).map(([key, amount], index) => ({
                month: months[index],
                amount,
                change: index > 0 ?
                    Math.round(((amount - (trendMap.get(Array.from(trendMap.keys())[index - 1]) || 1)) / (trendMap.get(Array.from(trendMap.keys())[index - 1]) || 1)) * 100)
                    : 0
            }))
        };

        // Calculate children performance with achievements
        const childrenPerformance = await Promise.all(children.map(async (child: any) => {
            const childTasks = tasks.filter((t: any) => t.child?.id === child.id);
            const completedTasks = childTasks.filter((t: any) => t.status === 'completed');
            const completed = completedTasks.length;

            // Calculate average completion time
            let avgTime = 0;
            if (completedTasks.length > 0) {
                const totalTime = completedTasks.reduce((sum: number, t: any) => {
                    if (t.completedAt) {
                        const duration = new Date(t.completedAt).getTime() - new Date(t.createdAt).getTime();
                        return sum + duration;
                    }
                    return sum;
                }, 0);
                avgTime = Math.round(totalTime / completedTasks.length / (1000 * 60 * 60 * 24)); // days
            }

            // Fetch achievements
            const achievements = await achievementService.getChildAchievements(child.id);

            return {
                childId: child.id,
                name: child.name,
                tasksCompleted: completed,
                completionRate: childTasks.length > 0 ? Math.round((completed / childTasks.length) * 100) : 0,
                averageTime: avgTime,
                achievements: achievements.map(a => ({
                    id: a.id,
                    type: a.type,
                    title: a.title,
                    description: a.description,
                    earnedAt: a.earnedAt
                }))
            };
        }));

        return res.json({
            taskTrends,
            spendingPatterns,
            childrenPerformance
        });
    } catch (error: any) {
        console.error('Error fetching parent insights:', error);
        return res.status(500).json({ error: 'Failed to fetch insights data' });
    }
}

/**
 * Get aggregated settings data for parent
 * Combines profile, notifications, privacy settings, and children
 */
export async function getParentSettings(req: Request, res: Response) {
    try {
        const parentId = (req as any).user.id;

        // Fetch all data in parallel
        const [user, children] = await Promise.all([
            userService.getUserProfile(parentId),
            childService.getChildrenByParent(parentId)
        ]);

        return res.json({
            profile: {
                name: user?.name || '',
                email: user?.email || '',
                avatar: user?.image || '',
                phone: user?.phoneNumber || ''
            },
            notifications: user?.notificationPreferences || {
                email: true,
                push: true,
                taskReminders: true,
                weeklyReports: true
            },
            privacy: {
                profileVisibility: 'private',
                dataSharing: false
            },
            children: children.map((child: any) => ({
                id: child.id,
                username: child.username,
                name: child.name,
                avatar: child.avatar
            }))
        });
    } catch (error: any) {
        console.error('Error fetching parent settings:', error);
        return res.status(500).json({ error: 'Failed to fetch settings data' });
    }
}
