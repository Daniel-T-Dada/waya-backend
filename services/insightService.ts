import { prisma } from '../prisma';

export async function getChoreInsights(parentId: string) {
    const chores = await prisma.chore.findMany({
        where: { parentId: parentId }
    });

    const total = chores.length;
    const completed = chores.filter(c => c.status === 'completed').length;
    const pending = chores.filter(c => c.status === 'pending' || c.status === 'awaiting_approval').length;
    const missed = chores.filter(c => c.status === 'missed').length;

    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    // Calculate average completion time (in days)
    const completedChores = chores.filter(c => c.status === 'completed' && c.completedAt);
    let avgCompletionDays = 0;
    if (completedChores.length > 0) {
        const totalTime = completedChores.reduce((sum, c) => {
            const duration = c.completedAt!.getTime() - c.createdAt.getTime();
            return sum + duration;
        }, 0);
        avgCompletionDays = Math.round(totalTime / completedChores.length / (1000 * 60 * 60 * 24));
    }

    // Top performer
    const childPerformance = await prisma.chore.groupBy({
        by: ['assigned_to'],
        where: { parentId: parentId, status: 'completed' },
        _count: true,
        orderBy: { _count: { assigned_to: 'desc' } },
        take: 1
    });

    let topPerformer = null;
    if (childPerformance.length > 0) {
        const child = await prisma.child.findUnique({
            where: { id: childPerformance[0].assigned_to },
            select: { id: true, name: true, username: true }
        });
        if (child) {
            topPerformer = {
                childId: child.id,
                child_name: child.name || child.username,
                completed_chores: childPerformance[0]._count
            };
        }
    }

    // Category breakdown
    const categories = Array.from(new Set(chores.map(c => c.category).filter(Boolean)));
    const insightsByCategory = categories.map(cat => {
        const catChores = chores.filter(c => c.category === cat);
        const catCompleted = catChores.filter(c => c.status === 'completed').length;
        return {
            category: cat,
            total: catChores.length,
            completed: catCompleted,
            completion_rate: catChores.length > 0 ? Math.round((catCompleted / catChores.length) * 100) : 0
        };
    });

    return {
        total_chores: total,
        completed_chores: completed,
        pending_chores: pending,
        missed_chores: missed,
        completion_rate: completionRate,
        average_completion_time: `${avgCompletionDays} days`,
        top_performer: topPerformer,
        insights_by_category: insightsByCategory
    };
}

export async function getRecentActivities(parentId: string) {
    const wallet = await prisma.wallet.findUnique({
        where: { userId: parentId }
    });

    if (!wallet) throw new Error('Wallet not found');

    const transactions = await prisma.transaction.findMany({
        where: { walletId: wallet.id },
        include: {
            child: { select: { name: true, username: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
    });

    const chores = await prisma.chore.findMany({
        where: { parentId: parentId, status: 'completed' },
        include: {
            child: { select: { name: true, username: true } }
        },
        orderBy: { completedAt: 'desc' },
        take: 5
    });

    // Merge and sort
    const activities = [
        ...transactions.map(t => ({
            id: t.id,
            type: t.type,
            amount: t.amount,
            status: t.status,
            description: t.description,
            child_name: t.child ? (t.child.name || t.child.username) : 'Direct',
            createdAt: t.createdAt
        })),
        ...chores.map(c => ({
            id: c.id,
            type: 'chore_completion',
            amount: c.amount,
            status: 'completed',
            description: `Completed chore: ${c.title}`,
            child_name: c.child.name || c.child.username,
            createdAt: c.completedAt || c.updatedAt
        }))
    ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 15);

    return { activities };
}
