import { Request, Response } from 'express';
import * as childService from '../services/childService';
import * as taskService from '../services/taskService';
import * as notificationService from '../services/notificationService';
import { prisma } from '../prisma';

/**
 * Get aggregated dashboard data for child
 * Combines child info, tasks, wallet, achievements, goals, and notifications
 */
export async function getChildDashboard(req: Request, res: Response) {
    try {
        const childId = (req as any).user.id;

        // Fetch all data in parallel
        const [child, tasksSummary, wallet, notifications] = await Promise.all([
            childService.findChildById(childId),
            taskService.getChildTasksSummary(childId),
            prisma.childWallet.findUnique({
                where: { childId: childId }
            }),
            notificationService.getNotifications(undefined, childId)
        ]);

        // Get recent achievements (TODO: implement achievement service)
        const achievements: any[] = [];

        // Get active goals (TODO: implement goal service)
        const goals: any[] = [];

        return res.json({
            child: {
                id: child?.id,
                username: child?.username,
                name: child?.name,
                avatar: child?.avatar,
                parentId: child?.parentId
            },
            tasksSummary,
            wallet: {
                balance: wallet?.balance || 0,
                currency: 'coins',
                lastEarned: {
                    amount: 0, // TODO: Get from last completed task
                    task: '',
                    date: new Date()
                }
            },
            achievements: achievements.slice(0, 5),
            goals: {
                active: goals,
                progress: 0 // Overall progress percentage
            },
            notifications: notifications?.results?.slice(0, 6) || []
        });
    } catch (error: any) {
        console.error('Error fetching child dashboard:', error);
        return res.status(500).json({ error: 'Failed to fetch dashboard data' });
    }
}

/**
 * Get aggregated chores data for child
 * Combines pending tasks, completed tasks, and statistics
 */
export async function getChildChores(req: Request, res: Response) {
    try {
        const childId = (req as any).user.id;

        // Fetch all data in parallel
        const [child, pendingTasks, completedTasks, tasksSummary] = await Promise.all([
            childService.findChildById(childId),
            prisma.chore.findMany({
                where: {
                    child: { id: childId },
                    status: 'pending'
                },
                orderBy: { dueDate: 'asc' },
                take: 10
            }),
            prisma.chore.findMany({
                where: {
                    child: { id: childId },
                    status: 'completed'
                },
                orderBy: { updatedAt: 'desc' },
                take: 10
            }),
            taskService.getChildTasksSummary(childId)
        ]);

        // Calculate stats
        const totalEarned = completedTasks.reduce((sum, task) => sum + Number(task.amount || 0), 0);
        const completionRate = tasksSummary.total > 0
            ? Math.round((tasksSummary.completed / tasksSummary.total) * 100)
            : 0;

        return res.json({
            child: {
                id: child?.id,
                username: child?.username,
                name: child?.name,
                avatar: child?.avatar
            },
            pendingTasks: pendingTasks.map(task => ({
                id: task.id,
                title: task.title,
                description: task.description,
                reward: Number(task.amount || 0),
                dueDate: task.dueDate,
                priority: task.category || 'medium'
            })),
            completedTasks: completedTasks.map(task => ({
                id: task.id,
                title: task.title,
                completedAt: task.updatedAt,
                reward: Number(task.amount || 0),
                approved: task.status === 'completed'
            })),
            stats: {
                totalCompleted: tasksSummary.completed,
                totalEarned: totalEarned,
                completionRate: completionRate,
                streak: 0 // TODO: Calculate streak
            }
        });
    } catch (error: any) {
        console.error('Error fetching child chores:', error);
        return res.status(500).json({ error: 'Failed to fetch chores data' });
    }
}

/**
 * Get aggregated wallet data for child
 * Combines balance, transactions, stats, and financial lessons
 */
export async function getChildWallet(req: Request, res: Response) {
    try {
        const childId = (req as any).user.id;

        // Fetch wallet and child info
        const [child, wallet] = await Promise.all([
            childService.findChildById(childId),
            prisma.childWallet.findUnique({
                where: { childId: childId }
            })
        ]);

        // Get transactions separately (ChildWallet doesn't have transactions relation)
        const transactions = await prisma.transaction.findMany({
            where: {
                childId: childId
            },
            orderBy: { createdAt: 'desc' },
            take: 20
        });

        // Separate transactions by type
        const earned = transactions.filter((t: any) => t.type === 'credit');
        const spent = transactions.filter((t: any) => t.type === 'debit');

        // Calculate stats
        const totalEarned = Number(wallet?.totalEarned || 0);
        const totalSpent = Number(wallet?.totalSpent || 0);
        const savingsRate = totalEarned > 0
            ? Math.round(((totalEarned - totalSpent) / totalEarned) * 100)
            : 0;

        // TODO: Get financial lessons from a lessons service
        const financialLessons = {
            completed: [],
            available: [],
            progress: 0
        };

        // TODO: Get financial achievements
        const achievements: any[] = [];

        return res.json({
            balance: {
                total: Number(wallet?.balance || 0),
                currency: 'coins',
                lastUpdated: wallet?.updatedAt || new Date()
            },
            transactions: {
                earned: earned.slice(0, 10),
                spent: spent.slice(0, 10),
                pagination: {
                    total: transactions.length,
                    page: 1,
                    limit: 20
                }
            },
            stats: {
                totalEarned: totalEarned,
                totalSpent: totalSpent,
                savingsRate: savingsRate,
                topEarningTask: '' // TODO: Calculate from transactions
            },
            financialLessons,
            achievements
        });
    } catch (error: any) {
        console.error('Error fetching child wallet:', error);
        return res.status(500).json({ error: 'Failed to fetch wallet data' });
    }
}

/**
 * Get aggregated goals data for child
 * Combines active goals, completed goals, achievements, and recommendations
 */
export async function getChildGoals(req: Request, res: Response) {
    try {
        const childId = (req as any).user.id;

        // Fetch child and wallet info
        const [child, wallet] = await Promise.all([
            childService.findChildById(childId),
            prisma.childWallet.findUnique({
                where: { childId: childId }
            })
        ]);

        // TODO: Get goals from goal service when implemented
        const activeGoals: any[] = [];
        const completedGoals: any[] = [];
        const achievements: any[] = [];

        // Calculate recommended goals based on earning rate
        const currentBalance = Number(wallet?.balance || 0);
        const totalEarned = Number(wallet?.totalEarned || 0);

        const recommendedGoals = [
            {
                title: 'Save for a toy',
                targetAmount: 5000,
                estimatedTime: totalEarned > 0 ? `${Math.ceil(5000 / (totalEarned / 30))} days` : 'N/A'
            },
            {
                title: 'Save for a game',
                targetAmount: 10000,
                estimatedTime: totalEarned > 0 ? `${Math.ceil(10000 / (totalEarned / 30))} days` : 'N/A'
            }
        ];

        return res.json({
            child: {
                id: child?.id,
                username: child?.username,
                name: child?.name
            },
            currentBalance,
            activeGoals,
            completedGoals,
            achievements,
            recommendedGoals
        });
    } catch (error: any) {
        console.error('Error fetching child goals:', error);
        return res.status(500).json({ error: 'Failed to fetch goals data' });
    }
}

/**
 * Get aggregated earnings data for child
 * Combines earnings stats, history, top tasks, and trends
 */
export async function getChildEarnings(req: Request, res: Response) {
    try {
        const childId = (req as any).user.id;

        // Fetch child and wallet
        const [child, wallet] = await Promise.all([
            childService.findChildById(childId),
            prisma.childWallet.findUnique({
                where: { childId: childId }
            })
        ]);

        // Get completed tasks for earnings
        const completedTasks = await prisma.chore.findMany({
            where: {
                child: { id: childId },
                status: 'completed'
            },
            orderBy: { updatedAt: 'desc' },
            take: 100
        });

        // Calculate stats
        const totalEarnings = Number(wallet?.totalEarned || 0);
        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        const thisWeek = completedTasks
            .filter(t => new Date(t.updatedAt) >= weekAgo)
            .reduce((sum, t) => sum + Number(t.amount || 0), 0);

        const thisMonth = completedTasks
            .filter(t => new Date(t.updatedAt) >= monthAgo)
            .reduce((sum, t) => sum + Number(t.amount || 0), 0);

        const averagePerTask = completedTasks.length > 0
            ? Math.round(totalEarnings / completedTasks.length)
            : 0;

        // Calculate top earning tasks
        const taskEarnings = new Map<string, { count: number; total: number }>();
        completedTasks.forEach(task => {
            const existing = taskEarnings.get(task.title) || { count: 0, total: 0 };
            taskEarnings.set(task.title, {
                count: existing.count + 1,
                total: existing.total + Number(task.amount || 0)
            });
        });

        const topEarningTasks = Array.from(taskEarnings.entries())
            .map(([taskName, data]) => ({
                taskName,
                timesCompleted: data.count,
                totalEarned: data.total
            }))
            .sort((a, b) => b.totalEarned - a.totalEarned)
            .slice(0, 5);

        // Calculate trends (compare this week vs last week)
        const lastWeek = completedTasks
            .filter(t => {
                const date = new Date(t.updatedAt);
                return date >= new Date(weekAgo.getTime() - 7 * 24 * 60 * 60 * 1000) && date < weekAgo;
            })
            .reduce((sum, t) => sum + Number(t.amount || 0), 0);

        const trendPercentage = lastWeek > 0
            ? Math.round(((thisWeek - lastWeek) / lastWeek) * 100)
            : 0;

        const trends = {
            direction: trendPercentage > 0 ? 'up' as const : trendPercentage < 0 ? 'down' as const : 'stable' as const,
            percentage: Math.abs(trendPercentage),
            comparison: 'last_week' as const
        };

        // TODO: Group earnings by day/week/month for charts
        const earningsHistory = {
            daily: [],
            weekly: [],
            monthly: []
        };

        return res.json({
            child: {
                id: child?.id,
                username: child?.username,
                name: child?.name
            },
            stats: {
                totalEarnings,
                thisWeek,
                thisMonth,
                averagePerTask
            },
            earningsHistory,
            topEarningTasks,
            trends
        });
    } catch (error: any) {
        console.error('Error fetching child earnings:', error);
        return res.status(500).json({ error: 'Failed to fetch earnings data' });
    }
}

// Get child dashboard stats (level, earnings, streak, etc.)
export async function getChildDashboardStatsController(req: Request, res: Response) {
    try {
        const { childId } = req.params;
        const stats = await childService.getChildDashboardStats(childId);
        return res.json(stats);
    } catch (error: any) {
        console.error('Error fetching child dashboard stats:', error);
        return res.status(500).json({ error: 'Failed to fetch dashboard stats' });
    }
}

// Get child earning meter stats
export async function getChildEarningMeterController(req: Request, res: Response) {
    try {
        const { childId } = req.params;
        const stats = await childService.getChildEarningMeter(childId);
        return res.json(stats);
    } catch (error: any) {
        console.error('Error fetching earning meter:', error);
        return res.status(500).json({ error: 'Failed to fetch earning meter data' });
    }
}

// Get child earnings chart
export async function getChildEarningsChartController(req: Request, res: Response) {
    try {
        const { childId } = req.params;
        const { period = '7days' } = req.query;
        const chart = await childService.getChildEarningsChart(childId, period as string);
        return res.json(chart);
    } catch (error: any) {
        console.error('Error fetching earnings chart:', error);
        return res.status(500).json({ error: 'Failed to fetch earnings chart' });
    }
}

// Get child expense breakdown
export async function getChildExpenseBreakdownController(req: Request, res: Response) {
    try {
        const { childId } = req.params;
        const { period = '7days' } = req.query;
        const breakdown = await childService.getChildExpenseBreakdown(childId, period as string);
        return res.json(breakdown);
    } catch (error: any) {
        console.error('Error fetching expense breakdown:', error);
        return res.status(500).json({ error: 'Failed to fetch expense breakdown' });
    }
}

// Get redeemable rewards
export async function getRedeemableRewardsController(req: Request, res: Response) {
    try {
        const { childId } = req.params;
        const rewards = await childService.getRedeemableRewards(childId);
        return res.json(rewards);
    } catch (error: any) {
        console.error('Error fetching redeemable rewards:', error);
        return res.status(500).json({ error: 'Failed to fetch redeemable rewards' });
    }
}

