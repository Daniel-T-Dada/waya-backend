import { prisma } from '../prisma';

export interface CreateTransactionData {
    type: string;
    amount: number;
    status: string;
    description: string;
    walletId: string;
    childId?: string;
    choreId?: string;
}

// Create transaction
export async function createTransaction(data: CreateTransactionData) {
    return prisma.transaction.create({
        data: {
            type: data.type,
            amount: data.amount,
            status: data.status,
            description: data.description,
            walletId: data.walletId,
            childId: data.childId,
            choreId: data.choreId
        }
    });
}

// Get transactions with filters
export async function getTransactions(walletId: string, filters?: {
    status?: string;
    type?: string;
    childId?: string;
}) {
    const where: any = { walletId: walletId };

    if (filters?.status) where.status = filters.status;
    if (filters?.type) where.type = filters.type;
    if (filters?.childId) where.childId = filters.childId;

    const transactions = await prisma.transaction.findMany({
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

    return transactions.map(t => ({
        id: t.id,
        type: t.type,
        amount: t.amount,
        status: t.status,
        description: t.description,
        child: t.childId,
        child_name: t.child ? (t.child.name || t.child.username) : null,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt
    }));
}

// Get single transaction
export async function getTransactionById(transactionId: string, walletId: string) {
    const transaction = await prisma.transaction.findUnique({
        where: { id: transactionId },
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

    if (!transaction) throw new Error('Transaction not found');
    if (transaction.walletId !== walletId) throw new Error('Unauthorized');

    return {
        id: transaction.id,
        type: transaction.type,
        amount: transaction.amount,
        status: transaction.status,
        description: transaction.description,
        child: transaction.childId,
        child_name: transaction.child ? (transaction.child.name || transaction.child.username) : null,
        createdAt: transaction.createdAt
    };
}

// Complete transaction
export async function completeTransaction(transactionId: string, walletId: string) {
    const transaction = await prisma.transaction.findUnique({
        where: { id: transactionId }
    });

    if (!transaction) throw new Error('Transaction not found');
    if (transaction.walletId !== walletId) throw new Error('Unauthorized');
    if (transaction.status !== 'pending') throw new Error('Transaction is not pending');

    const updated = await prisma.transaction.update({
        where: { id: transactionId },
        data: { status: 'completed' }
    });

    return {
        id: updated.id,
        status: updated.status,
        completed_at: updated.updatedAt
    };
}

// Cancel transaction
export async function cancelTransaction(transactionId: string, walletId: string) {
    const transaction = await prisma.transaction.findUnique({
        where: { id: transactionId }
    });

    if (!transaction) throw new Error('Transaction not found');
    if (transaction.walletId !== walletId) throw new Error('Unauthorized');
    if (transaction.status !== 'pending') throw new Error('Only pending transactions can be cancelled');

    const updated = await prisma.transaction.update({
        where: { id: transactionId },
        data: { status: 'cancelled' }
    });

    return {
        id: updated.id,
        status: updated.status
    };
}
