import { Request, Response } from 'express';
import * as childService from '../services/childService';
import * as taskService from '../services/taskService';
import * as walletService from '../services/walletService';
import * as transactionService from '../services/transactionService';
import * as notificationService from '../services/notificationService';
import * as userService from '../services/userService';

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
            childService.getChildrenByParent(parentId)
        ]);

        // Get transactions if wallet exists
        const transactions = wallet ? await transactionService.getTransactions(wallet.id) : [];

        // Separate transactions by type
        const income = transactions.filter((t: any) => t.type === 'credit');
        const expenses = transactions.filter((t: any) => t.type === 'debit');

        // TODO: Get children with their wallet balances
        const childrenWithAllowances = children.map((child: any) => ({
            id: child.id,
            name: child.name,
            allowance: 0, // TODO: Get from child wallet
            spent: 0, // TODO: Calculate from transactions
            balance: 0 // TODO: Get from child wallet
        }));

        // TODO: Calculate spending insights
        const insights = {
            topCategories: [],
            monthlyTrend: []
        };

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

        const recentTasks = tasks.filter(t => new Date(t.createdAt) >= thirtyDaysAgo);
        const taskTrends = {
            daily: [], // TODO: Group by day
            weekly: [], // TODO: Group by week
            monthly: [] // TODO: Group by month
        };

        // Calculate spending patterns
        const spendingPatterns = {
            byCategory: [], // TODO: Group by category
            byChild: children.map((child: any) => ({
                childId: child.id,
                childName: child.name,
                totalSpent: 0 // TODO: Calculate from transactions
            })),
            trends: [] // TODO: Calculate trends
        };

        // Calculate children performance
        const childrenPerformance = children.map((child: any) => {
            const childTasks = tasks.filter((t: any) => t.child?.id === child.id);
            const completed = childTasks.filter((t: any) => t.status === 'completed').length;

            return {
                childId: child.id,
                name: child.name,
                tasksCompleted: completed,
                completionRate: childTasks.length > 0 ? Math.round((completed / childTasks.length) * 100) : 0,
                averageTime: 0, // TODO: Calculate average completion time
                achievements: [] // TODO: Get achievements
            };
        });

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
