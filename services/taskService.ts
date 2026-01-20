import { prisma } from '../prisma';

/**
 * Get task summary statistics for a parent
 * Returns counts of total, pending, completed, and overdue tasks
 */
export async function getTasksSummary(parentId: string) {
    // Get all tasks for children of this parent
    const tasks = await prisma.chore.findMany({
        where: {
            child: {
                parentId: parentId
            }
        },
        select: {
            status: true,
            dueDate: true
        }
    });

    const now = new Date();

    const summary = {
        total: tasks.length,
        pending: tasks.filter(t => t.status === 'pending').length,
        completed: tasks.filter(t => t.status === 'completed').length,
        overdue: tasks.filter(t =>
            t.status === 'pending' &&
            t.dueDate &&
            new Date(t.dueDate) < now
        ).length
    };

    return summary;
}

/**
 * Get tasks for a parent with optional status filtering
 */
export async function getParentTasks(parentId: string, status?: string, limit?: number) {
    const where: any = {
        child: {
            parentId: parentId
        }
    };

    if (status) {
        where.status = status;
    }

    return prisma.chore.findMany({
        where,
        include: {
            child: {
                select: {
                    id: true,
                    username: true,
                    name: true,
                    avatar: true
                }
            }
        },
        orderBy: {
            createdAt: 'desc'
        },
        take: limit
    });
}

/**
 * Get task summary for a specific child
 */
export async function getChildTasksSummary(childId: string) {
    const tasks = await prisma.chore.findMany({
        where: {
            child: {
                id: childId
            }
        },
        select: {
            status: true,
            dueDate: true,
            createdAt: true
        }
    });

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const summary = {
        total: tasks.length,
        pending: tasks.filter(t => t.status === 'pending').length,
        completed: tasks.filter(t => t.status === 'completed').length,
        todayCompleted: tasks.filter(t =>
            t.status === 'completed' &&
            new Date(t.createdAt) >= today
        ).length
    };

    return summary;
}

/**
 * Get completed tasks for a parent
 */
export async function getCompletedTasks(parentId: string, limit: number = 10) {
    return getParentTasks(parentId, 'completed', limit);
}

/**
 * Get pending tasks for a parent
 */
export async function getPendingTasks(parentId: string, limit: number = 10) {
    return getParentTasks(parentId, 'pending', limit);
}
