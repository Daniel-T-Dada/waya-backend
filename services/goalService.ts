import { prisma } from '../prisma';
import * as walletService from './walletService';
import * as notificationService from './notificationService';
import * as moneyMazeService from './moneyMazeService';
import * as cacheService from './cacheService';
import { notifyUser } from '../utils/socket';
import { Decimal } from '@prisma/client/runtime/library';

export interface CreateGoalData {
    title: string;
    description: string;
    targetAmount: number;
}

export async function createGoal(childId: string, data: CreateGoalData) {
    const goal = await prisma.goal.create({
        data: {
            childId: childId,
            title: data.title,
            description: data.description,
            targetAmount: data.targetAmount,
            status: 'in_progress'
        }
    });

    return {
        id: goal.id,
        child: goal.childId,
        title: goal.title,
        description: goal.description,
        targetAmount: goal.targetAmount,
        currentAmount: goal.currentAmount,
        progress_percentage: 0,
        status: goal.status,
        createdAt: goal.createdAt
    };
}

export async function getChildGoals(childId: string) {
    const goals = await prisma.goal.findMany({
        where: { childId: childId },
        orderBy: { createdAt: 'desc' }
    });

    return goals.map(goal => {
        const target = Number(goal.targetAmount);
        const current = Number(goal.currentAmount);
        const progress = target > 0 ? Math.min(Math.round((current / target) * 100), 100) : 0;

        return {
            id: goal.id,
            child: goal.childId,
            title: goal.title,
            description: goal.description,
            targetAmount: goal.targetAmount,
            currentAmount: goal.currentAmount,
            progress_percentage: progress,
            status: goal.status,
            createdAt: goal.createdAt
        };
    });
}

export async function addSavingsToGoal(childId: string, goalId: string, amount: number) {
    // Check goal existence and ownership
    const goal = await prisma.goal.findUnique({
        where: { id: goalId },
        include: {
            child: {
                include: {
                    wallet: true
                }
            }
        }
    });

    if (!goal) throw new Error('Goal not found');
    if (goal.childId !== childId) throw new Error('Unauthorized: This goal does not belong to you');
    if (goal.status !== 'in_progress') throw new Error(`Cannot add savings to a ${goal.status} goal`);
    if (!goal.child.wallet) throw new Error('Child wallet not found');

    const walletBalance = Number(goal.child.wallet.balance);
    if (walletBalance < amount) throw new Error('Insufficient balance in your wallet');

    const result = await prisma.$transaction(async (tx) => {
        // Deduct from child wallet
        const updatedWallet = await tx.childWallet.update({
            where: { id: goal.child.wallet!.id },
            data: {
                balance: { decrement: amount },
                total_spent: { increment: amount }
            }
        });

        // Add to goal
        const newCurrentAmount = Number(goal.currentAmount) + amount;
        const isCompleted = newCurrentAmount >= Number(goal.targetAmount);

        const updatedGoal = await tx.goal.update({
            where: { id: goalId },
            data: {
                currentAmount: newCurrentAmount,
                status: isCompleted ? 'completed' : 'in_progress',
                completedAt: isCompleted ? new Date() : null
            }
        });

        // Create transaction record
        await tx.transaction.create({
            data: {
                type: 'debit',
                amount: amount,
                status: 'completed',
                description: `Savings for goal: ${goal.title}`,
                childId: childId,
                wallet_id: goal.child.wallet!.parent_wallet_id
            }
        });

        // If completed, maybe reward? 
        // For now we just mark as completed as per schema.
        if (isCompleted) {
            await tx.goalReward.create({
                data: {
                    goalId: goalId,
                    amount: 0 // Default 0 reward unless specified
                }
            });
        }

        return {
            goal: updatedGoal,
            new_wallet_balance: updatedWallet.balance
        };
    });

    // Notify child if goal reached
    if (result.goal.status === 'completed') {
        await notificationService.createNotification({
            childId: childId,
            type: 'goal_reached',
            title: 'Goal Reached! 🎉',
            message: `Congratulations! You have reached your goal: ${goal.title}. Outstanding job!`,
            relatedObjectType: 'goal',
            relatedObjectId: goal.id
        });

        // Also notify parent
        await notificationService.createNotification({
            userId: goal.child.parentId,
            type: 'child_goal_reached',
            title: 'Child Reached a Goal!',
            message: `${goal.child.name || goal.child.username} has reached their goal: ${goal.title}.`,
            relatedObjectType: 'goal',
            relatedObjectId: goal.id
        });
    }

    const target = Number(result.goal.targetAmount);
    const current = Number(result.goal.currentAmount);
    const progress = target > 0 ? Math.min(Math.round((current / target) * 100), 100) : 0;

    // Real-time Sync
    notifyUser(childId, 'balance_update', { new_balance: result.new_wallet_balance });
    notifyUser(childId, 'goal_progress', {
        goalId: goalId,
        currentAmount: result.goal.currentAmount,
        progress_percentage: progress,
    });

    // Update streak
    await moneyMazeService.updateStreak(childId, 'saving');

    // Invalidate leaderboard cache
    const child = await prisma.child.findUnique({ where: { id: childId }, select: { parentId: true } });
    if (child) {
        await cacheService.del(`leaderboard:${child.parentId}`);
    }

    return {
        message: result.goal.status === 'completed' ? 'Congratulations! Goal reached!' : 'Savings added successfully!',
        currentAmount: result.goal.currentAmount,
        progress_percentage: progress,
        new_wallet_balance: result.new_wallet_balance,
        status: result.goal.status
    };
}

export async function getGoalProgress(childId: string) {
    const goals = await prisma.goal.findMany({
        where: { childId: childId }
    });

    const totalGoals = goals.length;
    const activeGoals = goals.filter(g => g.status === 'in_progress').length;
    const completedGoals = goals.filter(g => g.status === 'completed').length;

    const totalTarget = goals.reduce((sum, g) => sum + Number(g.targetAmount), 0);
    const totalSaved = goals.reduce((sum, g) => sum + Number(g.currentAmount), 0);

    const overallProgress = totalTarget > 0 ? Math.min(Math.round((totalSaved / totalTarget) * 100), 100) : 0;

    return {
        total_goals: totalGoals,
        active_goals: activeGoals,
        completed_goals: completedGoals,
        total_targetAmount: totalTarget.toFixed(2),
        total_saved_amount: totalSaved.toFixed(2),
        overall_progress: overallProgress
    };
}

export async function getLeaderboard(parentId: string) {
    const cacheKey = `leaderboard:${parentId}`;
    const cached = await cacheService.get<any[]>(cacheKey);
    if (cached) return cached;

    // Find all children in the parent's family
    const children = await prisma.child.findMany({
        where: { parentId: parentId },
        include: {
            goals: true
        }
    });

    const leaderboard = children.map(child => {
        const completedGoals = child.goals.filter(g => g.status === 'completed').length;
        const totalSaved = child.goals.reduce((sum, g) => sum + Number(g.currentAmount), 0);

        return {
            childId: child.id,
            child_name: child.name || child.username,
            goals_completed: completedGoals,
            total_saved: totalSaved.toFixed(2)
        };
    });

    leaderboard.sort((a, b) => {
        if (b.goals_completed !== a.goals_completed) {
            return b.goals_completed - a.goals_completed;
        }
        return Number(b.total_saved) - Number(a.total_saved);
    });

    const result = leaderboard.map((item, index) => ({
        rank: index + 1,
        ...item
    }));

    await cacheService.set(cacheKey, result, 300); // 5 min TTL
    return result;
}

export async function getGoalRewards(childId: string) {
    const rewards = await prisma.goalReward.findMany({
        where: {
            goal: {
                childId: childId
            }
        },
        include: {
            goal: {
                select: {
                    title: true
                }
            }
        },
        orderBy: { earned_at: 'desc' }
    });

    const totalRewards = rewards.reduce((sum, r) => sum + Number(r.amount), 0);

    return {
        count: rewards.length,
        total_rewards: totalRewards.toFixed(2),
        results: rewards.map(r => ({
            id: r.id,
            goalId: r.goalId,
            goal_title: r.goal.title,
            reward_amount: r.amount,
            earned_at: r.earned_at
        }))
    };
}
