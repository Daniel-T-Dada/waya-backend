import { prisma } from '../prisma';
import * as transactionService from './transactionService';
import * as walletService from './walletService';
import * as notificationService from './notificationService';
import * as moneyMazeService from './moneyMazeService';
import { notifyUser } from '../utils/socket';

export interface CreateChoreData {
    title: string;
    description: string;
    assignedTo: string;
    reward: number;
    dueDate?: string;
    category?: string;
}

export interface UpdateChoreData {
    title?: string;
    description?: string;
    reward?: number;
    dueDate?: string;
    category?: string;
}

// Create chore
export async function createChore(parentId: string, data: CreateChoreData) {
    // Verify child ownership
    const child = await prisma.child.findUnique({
        where: { id: data.assignedTo },
        select: { id: true, parentId: true, name: true, username: true }
    });

    if (!child) throw new Error('Child not found');
    if (child.parentId !== parentId) throw new Error('Unauthorized: You do not own this child');

    const chore = await prisma.chore.create({
        data: {
            title: data.title,
            description: data.description,
            amount: data.reward,
            assignedTo: data.assignedTo,
            parentId: parentId,
            dueDate: data.dueDate ? new Date(data.dueDate) : null,
            category: data.category,
            status: 'pending'
        }
    });

    // Notify child
    await notificationService.createNotification({
        childId: data.assignedTo,
        type: 'chore_assigned',
        title: 'New Chore Assigned',
        message: `You have a new chore: ${data.title}`,
        relatedObjectType: 'chore',
        relatedObjectId: chore.id
    });


    return {
        id: chore.id,
        title: chore.title,
        description: chore.description,
        amount: chore.amount,
        dueDate: chore.dueDate,
        assignedTo: chore.assignedTo,
        assignedToName: child.name || child.username,
        assignedToUsername: child.username,
        parentId: chore.parentId,
        status: chore.status,
        createdAt: chore.createdAt,
        completedAt: chore.completedAt
    };
}

// Get chores with filters
export async function getChores(parentId: string, filters?: {
    status?: string;
    assignedTo?: string;
    category?: string;
}) {
    const where: any = { parentId: parentId };

    if (filters?.status) where.status = filters.status;
    if (filters?.assignedTo) where.assignedTo = filters.assignedTo;
    if (filters?.category) where.category = filters.category;

    const chores = await prisma.chore.findMany({
        where,
        include: {
            child: {
                select: {
                    id: true,
                    name: true,
                    username: true
                }
            }
        },
        orderBy: { createdAt: 'desc' }
    });

    return chores.map(chore => ({
        id: chore.id,
        title: chore.title,
        description: chore.description,
        amount: chore.amount,
        dueDate: chore.dueDate,
        assignedTo: chore.assignedTo,
        assignedToName: chore.child.name || chore.child.username,
        status: chore.status,
        createdAt: chore.createdAt
    }));
}

// Get single chore
export async function getChoreById(choreId: string, parentId: string) {
    const chore = await prisma.chore.findUnique({
        where: { id: choreId },
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

    if (!chore) throw new Error('Chore not found');
    if (chore.parentId !== parentId) throw new Error('Unauthorized');

    return {
        id: chore.id,
        title: chore.title,
        description: chore.description,
        amount: chore.amount,
        dueDate: chore.dueDate,
        assignedTo: chore.assignedTo,
        assignedToName: chore.child.name || chore.child.username,
        status: chore.status,
        createdAt: chore.createdAt,
        completedAt: chore.completedAt
    };
}

// Update chore
export async function updateChore(choreId: string, parentId: string, data: UpdateChoreData) {
    // Verify ownership
    const chore = await prisma.chore.findUnique({ where: { id: choreId } });
    if (!chore) throw new Error('Chore not found');
    if (chore.parentId !== parentId) throw new Error('Unauthorized');

    const updateData: any = {};
    if (data.title) updateData.title = data.title;
    if (data.description) updateData.description = data.description;
    if (data.reward !== undefined) updateData.amount = data.reward;
    if (data.dueDate !== undefined) updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null;
    if (data.category !== undefined) updateData.category = data.category;

    const updated = await prisma.chore.update({
        where: { id: choreId },
        data: updateData
    });

    return {
        id: updated.id,
        title: updated.title,
        description: updated.description,
        amount: updated.amount,
        dueDate: updated.dueDate,
        status: updated.status
    };
}

// Delete chore
export async function deleteChore(choreId: string, parentId: string) {
    const chore = await prisma.chore.findUnique({ where: { id: choreId } });
    if (!chore) throw new Error('Chore not found');
    if (chore.parentId !== parentId) throw new Error('Unauthorized');

    await prisma.chore.delete({ where: { id: choreId } });
    return true;
}

// Update chore status (parent approval)
export async function updateChoreStatus(choreId: string, parentId: string, status: string) {
    const chore = await prisma.chore.findUnique({ where: { id: choreId } });
    if (!chore) throw new Error('Chore not found');
    if (chore.parentId !== parentId) throw new Error('Unauthorized');

    const updateData: any = { status };
    if (status === 'completed') {
        updateData.completedAt = new Date();
    }

    const updated = await prisma.chore.update({
        where: { id: choreId },
        data: updateData,
        include: { child: true }
    });

    // Notify child if approved
    if (status === 'completed') {
        await notificationService.createNotification({
            childId: updated.assignedTo,
            type: 'chore_approved',
            title: 'Chore Approved!',
            message: `Your chore "${updated.title}" has been approved. You can now redeem your reward!`,
            relatedObjectType: 'chore',
            relatedObjectId: updated.id
        });
    }

    return {
        id: updated.id,
        status: updated.status,
        completedAt: updated.completedAt,
        message: status === 'completed' ? 'Chore approved and marked as completed.' : `Chore status updated to ${status}.`
    };
}

// Mark chore as completed (child)
export async function markChoreCompleted(choreId: string, childId: string) {
    const chore = await prisma.chore.findUnique({ where: { id: choreId } });
    if (!chore) throw new Error('Chore not found');
    if (chore.assignedTo !== childId) throw new Error('Unauthorized: This chore is not assigned to you');
    if (chore.status !== 'pending') throw new Error(`Cannot mark a ${chore.status} chore as completed`);

    const updated = await prisma.chore.update({
        where: { id: choreId },
        data: {
            status: 'awaiting_approval',
            completedAt: new Date()
        },
        include: { child: true }
    });

    // Notify parent
    await notificationService.createNotification({
        userId: updated.parentId,
        type: 'chore_completed',
        title: 'Chore Completed',
        message: `${updated.child.name || updated.child.username} has completed the chore: ${updated.title}`,
        relatedObjectType: 'chore',
        relatedObjectId: updated.id
    });

    // Update streak
    await moneyMazeService.updateStreak(childId, 'chore');

    return {
        id: updated.id,
        status: updated.status,
        message: 'Chore marked as completed and is now awaiting parent approval.'
    };
}

// Redeem chore reward
export async function redeemChoreReward(choreId: string, childId: string) {
    const chore = await prisma.chore.findUnique({
        where: { id: choreId },
        include: {
            child: {
                include: {
                    wallet: true
                }
            }
        }
    });

    if (!chore) throw new Error('Chore not found');
    if (chore.assignedTo !== childId) throw new Error('Unauthorized: This chore is not assigned to you');
    if (chore.status !== 'completed') throw new Error('Chore must be completed before redeeming reward');
    if (!chore.child.wallet) throw new Error('Child wallet not found');

    // Get parent wallet
    const parentWallet = await walletService.getWalletByUserId(chore.parentId);

    // Check parent has sufficient balance
    if (Number(parentWallet.balance) < Number(chore.amount)) {
        throw new Error('Insufficient balance in parent wallet');
    }

    // Transfer reward in transaction
    const result = await prisma.$transaction(async (tx) => {
        // Deduct from parent wallet
        await tx.wallet.update({
            where: { id: parentWallet.id },
            data: { balance: Number(parentWallet.balance) - Number(chore.amount) }
        });

        // Add to child wallet
        const updatedChildWallet = await tx.childWallet.update({
            where: { id: chore.child.wallet!.id },
            data: {
                balance: Number(chore.child.wallet!.balance) + Number(chore.amount),
                total_earned: Number(chore.child.wallet!.total_earned) + Number(chore.amount)
            }
        });

        // Create transaction record
        await tx.transaction.create({
            data: {
                type: 'reward',
                amount: chore.amount,
                status: 'completed',
                description: `Reward for chore: ${chore.title}`,
                childId: childId,
                walletId: parentWallet.id,
                chore_id: choreId
            }
        });

        return {
            reward_amount: chore.amount,
            new_balance: updatedChildWallet.balance
        };
    });

    // Real-time Balance Update
    notifyUser(chore.parentId, 'balance_update', { new_balance: Number(parentWallet.balance) - Number(chore.amount) });
    notifyUser(childId, 'balance_update', { new_balance: result.new_balance });

    return {
        message: 'Reward redeemed successfully!',
        reward_amount: result.reward_amount,
        new_balance: result.new_balance
    };
}

// Get child's chores
export async function getChildChores(childId: string, status?: string) {
    const where: any = { assignedTo: childId };
    if (status) where.status = status;

    const chores = await prisma.chore.findMany({
        where,
        orderBy: { createdAt: 'desc' }
    });

    return chores.map(chore => ({
        id: chore.id,
        title: chore.title,
        description: chore.description,
        amount: chore.amount,
        dueDate: chore.dueDate,
        status: chore.status,
        createdAt: chore.createdAt
    }));
}

// Get chore summary
export async function getChoreSummary(parentId: string) {
    const chores = await prisma.chore.groupBy({
        by: ['status'],
        where: { parentId: parentId },
        _count: true
    });

    const total = chores.reduce((sum, group) => sum + group._count, 0);
    const pending = chores.find(g => g.status === 'pending')?._count || 0;
    const awaitingApproval = chores.find(g => g.status === 'awaiting_approval')?._count || 0;
    const completed = chores.find(g => g.status === 'completed')?._count || 0;
    const missed = chores.find(g => g.status === 'missed')?._count || 0;

    return {
        total,
        pending,
        awaiting_approval: awaitingApproval,
        completed,
        missed
    };
}
