import { prisma } from '../prisma.js';
import { Child } from '../generated/prisma/client.js';
import { hashPin, comparePin } from '../utils/hash';

export interface CreateChildData {
    username: string;
    name?: string;
    pin: string;
}

export interface UpdateChildData {
    username?: string;
    name?: string;
    pin?: string;
    avatar?: string;
    avatar_public_id?: string;
}

// Create a child and automatically create their wallet
export async function createChild(parentId: string, data: CreateChildData): Promise<Child> {
    const { username, name, pin } = data;

    // Check if username already exists
    const existing = await prisma.child.findUnique({ where: { username } });
    if (existing) throw new Error('Username already exists');

    // Validate PIN format (must be 4 digits)
    if (!/^\d{4}$/.test(pin)) {
        throw new Error('PIN must be exactly 4 digits');
    }

    // Hash the PIN
    const hashedPin = await hashPin(pin);

    // Get or create parent wallet
    let parentWallet = await prisma.wallet.findUnique({ where: { userId: parentId } });

    if (!parentWallet) {
        // Auto-create parent wallet if it doesn't exist
        parentWallet = await prisma.wallet.create({
            data: {
                userId: parentId,
                balance: 0,
                currency: 'NGN'
            }
        });
    }

    // Create child with wallet in a transaction
    const child = await prisma.child.create({
        data: {
            parentId: parentId,
            username,
            name,
            pin: hashedPin,
            wallet: {
                create: {
                    parentWalletId: parentWallet.id,
                    balance: 0,
                    totalEarned: 0,
                    totalSpent: 0
                }
            }
        },
        include: {
            wallet: true
        }
    });

    return child;
}

// Get all children for a parent
export async function getChildrenByParent(parentId: string) {
    return prisma.child.findMany({
        where: { parentId: parentId },
        select: {
            id: true,
            parentId: true,
            username: true,
            name: true,
            avatar: true,
            createdAt: true
        },
        orderBy: { createdAt: 'desc' }
    });
}

// Get all children for a parent with wallet and allowances (for dashboard)
export async function getChildrenWithWallets(parentId: string) {
    return prisma.child.findMany({
        where: { parentId: parentId },
        include: {
            wallet: true,
            allowances: true
        },
        orderBy: { createdAt: 'desc' }
    });
}

// Get a single child by ID (with ownership verification)
export async function getChildById(childId: string, parentId: string) {
    const child = await prisma.child.findUnique({
        where: { id: childId },
        select: {
            id: true,
            parentId: true,
            username: true,
            name: true,
            avatar: true,
            createdAt: true
        }
    });

    if (!child) throw new Error('Child not found');
    if (child.parentId !== parentId) throw new Error('Unauthorized: You do not own this child');

    return child;
}

// Update child details
export async function updateChild(childId: string, parentId: string, data: UpdateChildData) {
    // Verify ownership first
    await getChildById(childId, parentId);

    const updateData: any = {};

    if (data.username) updateData.username = data.username;
    if (data.name !== undefined) updateData.name = data.name;
    if (data.avatar !== undefined) updateData.avatar = data.avatar;
    if (data.avatar_public_id !== undefined) updateData.avatarPublicId = data.avatar_public_id;

    if (data.pin) {
        if (!/^\d{4}$/.test(data.pin)) {
            throw new Error('PIN must be exactly 4 digits');
        }
        updateData.pin = await hashPin(data.pin);
    }

    return prisma.child.update({
        where: { id: childId },
        data: updateData,
        select: {
            username: true,
            name: true,
            avatar: true
        }
    });
}

// Delete child (cascades to wallet)
export async function deleteChild(childId: string, parentId: string) {
    // Verify ownership first
    await getChildById(childId, parentId);

    await prisma.child.delete({
        where: { id: childId }
    });

    return true;
}

// Authenticate child with username and PIN
export async function authenticateChild(username: string, pin: string) {
    const child = await prisma.child.findUnique({
        where: { username },
        include: {
            parent: {
                select: {
                    id: true
                }
            }
        }
    });

    if (!child) return null;

    const isValidPin = await comparePin(pin, child.pin);
    if (!isValidPin) return null;

    return {
        childId: child.id,
        childUsername: child.username,
        childName: child.name,
        parentId: child.parent.id
    };
}

export async function findChildById(id: string) {
    return prisma.child.findUnique({ where: { id } });
}

// Get child dashboard stats
export async function getChildDashboardStats(childId: string) {
    // Get completed quizzes to calculate level
    const quizAttempts = await prisma.quizAttempt.findMany({
        where: { childId, passed: true },
        select: { id: true }
    });

    const level = Math.floor(quizAttempts.length / 2) + 1; // 2 quizzes per level
    const levelProgress = {
        current: quizAttempts.length % 2,
        required: 2,
        percentage: ((quizAttempts.length % 2) / 2) * 100
    };

    // Get total earnings (chores + quizzes) for last 7 days and previous 7 days
    const now = new Date();
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const previous7Days = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const choreEarningsCurrent = await prisma.chore.aggregate({
        where: {
            assignedTo: childId,
            status: 'completed',
            updatedAt: { gte: last7Days }
        },
        _sum: { amount: true }
    });

    const choreEarningsPrevious = await prisma.chore.aggregate({
        where: {
            assignedTo: childId,
            status: 'completed',
            updatedAt: { gte: previous7Days, lt: last7Days }
        },
        _sum: { amount: true }
    });

    const quizEarningsCurrent = await prisma.quizAttempt.aggregate({
        where: {
            childId,
            passed: true,
            createdAt: { gte: last7Days }
        },
        _sum: { rewardEarned: true }
    });

    const quizEarningsPrevious = await prisma.quizAttempt.aggregate({
        where: {
            childId,
            passed: true,
            createdAt: { gte: previous7Days, lt: last7Days }
        },
        _sum: { rewardEarned: true }
    });

    const totalEarnings = Number(choreEarningsCurrent._sum?.amount || 0) + Number(quizEarningsCurrent._sum?.rewardEarned || 0);
    const previousEarnings = Number(choreEarningsPrevious._sum?.amount || 0) + Number(quizEarningsPrevious._sum?.rewardEarned || 0);
    const earningsChange = previousEarnings > 0 ? ((totalEarnings - previousEarnings) / previousEarnings) * 100 : 0;

    // Get completed chores count
    const completedChores = await prisma.chore.count({
        where: { assignedTo: childId, status: 'completed' }
    });

    // Calculate current streak from DailyActivity
    const dailyActivities = await prisma.dailyActivity.findMany({
        where: { childId },
        orderBy: { date: 'desc' },
        take: 30
    });

    let currentStreak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < dailyActivities.length; i++) {
        const activityDate = new Date(dailyActivities[i].date);
        activityDate.setHours(0, 0, 0, 0);
        const expectedDate = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);

        if (activityDate.getTime() === expectedDate.getTime()) {
            currentStreak++;
        } else {
            break;
        }
    }

    // Get pending chores count
    const pendingChores = await prisma.chore.count({
        where: { assignedTo: childId, status: 'pending' }
    });

    return {
        level,
        levelProgress,
        totalEarnings,
        earningsChange: Math.round(earningsChange * 100) / 100,
        completedChores,
        currentStreak,
        pendingChores
    };
}

// Get child earning meter stats
export async function getChildEarningMeter(childId: string) {
    const now = new Date();
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const previous7Days = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    // Get total earned (all time)
    const choreEarnings = await prisma.chore.aggregate({
        where: { assignedTo: childId, status: 'completed' },
        _sum: { amount: true }
    });

    const quizEarnings = await prisma.quizAttempt.aggregate({
        where: { childId, passed: true },
        _sum: { rewardEarned: true }
    });

    const totalEarned = Number(choreEarnings._sum?.amount || 0) + Number(quizEarnings._sum?.rewardEarned || 0);

    // Get total saved (goal contributions)
    const goals = await prisma.goal.findMany({
        where: { childId },
        select: { currentAmount: true }
    });

    const totalSaved = goals.reduce((sum, goal) => sum + Number(goal.currentAmount), 0);

    // Get current wallet balance
    const wallet = await prisma.childWallet.findFirst({
        where: { childId }
    });

    const currentBalance = Number(wallet?.balance || 0);
    const totalSpent = totalEarned - totalSaved - currentBalance;

    // Calculate percentage changes (last 7 days vs previous 7 days)
    const earnedCurrent = await prisma.chore.aggregate({
        where: {
            assignedTo: childId,
            status: 'completed',
            updatedAt: { gte: last7Days }
        },
        _sum: { amount: true }
    });

    const earnedPrevious = await prisma.chore.aggregate({
        where: {
            assignedTo: childId,
            status: 'completed',
            updatedAt: { gte: previous7Days, lt: last7Days }
        },
        _sum: { amount: true }
    });

    const earnedChange = Number(earnedPrevious._sum?.amount || 0) > 0
        ? ((Number(earnedCurrent._sum?.amount || 0) - Number(earnedPrevious._sum?.amount || 0)) / Number(earnedPrevious._sum?.amount || 0)) * 100
        : 0;

    return {
        totalEarned,
        earnedChange: Math.round(earnedChange * 100) / 100,
        totalSaved,
        savedChange: 0, // Can be enhanced with historical data
        totalSpent,
        spentChange: 0 // Can be enhanced with historical data
    };
}

// Get child earnings chart (last 7 days)
export async function getChildEarningsChart(childId: string, period: string = '7days') {
    const days = period === '7days' ? 7 : 30;
    const data = [];

    for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);

        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + 1);

        // Get earned for this day
        const choreEarned = await prisma.chore.aggregate({
            where: {
                assignedTo: childId,
                status: 'completed',
                updatedAt: { gte: date, lt: nextDate }
            },
            _sum: { amount: true }
        });

        const quizEarned = await prisma.quizAttempt.aggregate({
            where: {
                childId,
                passed: true,
                createdAt: { gte: date, lt: nextDate }
            },
            _sum: { rewardEarned: true }
        });

        const earned = Number(choreEarned._sum?.amount || 0) + Number(quizEarned._sum?.rewardEarned || 0);

        // Get spent for this day (transactions)
        const transactions = await prisma.transaction.findMany({
            where: {
                childId,
                type: 'debit',
                createdAt: { gte: date, lt: nextDate }
            }
        });

        const spent = transactions.reduce((sum, t) => sum + Number(t.amount), 0);

        data.push({
            date: date.toISOString().split('T')[0],
            earned,
            spent
        });
    }

    return { data };
}

// Get child expense breakdown
export async function getChildExpenseBreakdown(childId: string, period: string = '7days') {
    const days = period === '7days' ? 7 : 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get saved amount (goal contributions in period)
    const goals = await prisma.goal.findMany({
        where: {
            childId,
            updatedAt: { gte: startDate }
        },
        select: { currentAmount: true }
    });

    const saved = goals.reduce((sum, goal) => sum + Number(goal.currentAmount), 0);

    // Get spent amount (transactions in period)
    const transactions = await prisma.transaction.findMany({
        where: {
            childId,
            type: 'debit',
            createdAt: { gte: startDate }
        }
    });

    const spent = transactions.reduce((sum, t) => sum + Number(t.amount), 0);

    const total = saved + spent;
    const savingsRate = total > 0 ? (saved / total) * 100 : 0;

    return {
        saved,
        spent,
        total,
        savingsRate: Math.round(savingsRate * 100) / 100
    };
}

// Get redeemable rewards (chores awaiting approval)
export async function getRedeemableRewards(childId: string) {
    const chores = await prisma.chore.findMany({
        where: {
            assignedTo: childId,
            status: 'awaiting_approval'
        },
        select: {
            id: true,
            title: true,
            description: true,
            amount: true,
            status: true,
            updatedAt: true
        },
        orderBy: { updatedAt: 'desc' }
    });

    return chores.map(chore => ({
        id: chore.id,
        choreId: chore.id,
        title: chore.title,
        description: chore.description,
        amount: chore.amount,
        status: chore.status,
        completedAt: chore.updatedAt
    }));
}

