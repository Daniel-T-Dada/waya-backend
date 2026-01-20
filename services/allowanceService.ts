import { prisma } from '../prisma';
import * as walletService from './walletService';
import * as notificationService from './notificationService';
import { notifyUser } from '../utils/socket';
import { Decimal } from '@prisma/client/runtime/library';

export enum AllowanceFrequency {
    DAILY = 'daily',
    WEEKLY = 'weekly',
    MONTHLY = 'monthly'
}

export enum AllowanceStatus {
    ACTIVE = 'active',
    PAUSED = 'paused',
    INACTIVE = 'inactive'
}

export interface CreateAllowanceData {
    childId: string;
    amount: number;
    frequency: AllowanceFrequency;
    status?: AllowanceStatus;
}

export interface UpdateAllowanceData {
    amount?: number;
    frequency?: AllowanceFrequency;
    status?: AllowanceStatus;
}

/**
 * Calculates the next payment date based on the frequency.
 */
function calculateNextPaymentDate(frequency: AllowanceFrequency, fromDate: Date = new Date()): Date {
    const nextDate = new Date(fromDate);
    switch (frequency) {
        case AllowanceFrequency.DAILY:
            nextDate.setDate(nextDate.getDate() + 1);
            break;
        case AllowanceFrequency.WEEKLY:
            nextDate.setDate(nextDate.getDate() + 7);
            break;
        case AllowanceFrequency.MONTHLY:
            nextDate.setMonth(nextDate.getMonth() + 1);
            break;
        default:
            nextDate.setDate(nextDate.getDate() + 7); // Default to weekly
    }
    return nextDate;
}

export async function createAllowance(parentId: string, data: CreateAllowanceData) {
    // Verify child ownership
    const child = await prisma.child.findUnique({
        where: { id: data.childId }
    });

    if (!child) throw new Error('Child not found');
    if (child.parentId !== parentId) throw new Error('Unauthorized: You do not own this child');

    // Check if an active allowance already exists for this child
    const existingAllowance = await prisma.allowance.findFirst({
        where: {
            childId: data.childId,
            status: AllowanceStatus.ACTIVE
        }
    });

    if (existingAllowance) {
        throw new Error('An active allowance already exists for this child. Please update it or delete it first.');
    }

    const nextPaymentDate = calculateNextPaymentDate(data.frequency);

    const allowance = await prisma.allowance.create({
        data: {
            parentId: parentId,
            childId: data.childId,
            amount: data.amount,
            frequency: data.frequency,
            status: data.status || AllowanceStatus.ACTIVE,
            nextPaymentDate: nextPaymentDate
        },
        include: {
            child: {
                select: {
                    name: true,
                    username: true
                }
            }
        }
    });

    return allowance;
}

export async function getAllowances(parentId: string, status?: AllowanceStatus) {
    const where: any = { parentId: parentId };
    if (status) where.status = status;

    const allowances = await prisma.allowance.findMany({
        where,
        include: {
            child: {
                select: {
                    name: true,
                    username: true
                }
            }
        },
        orderBy: { createdAt: 'desc' }
    });

    return allowances;
}

export async function getAllowanceById(allowanceId: string, parentId: string) {
    const allowance = await prisma.allowance.findUnique({
        where: { id: allowanceId },
        include: {
            child: {
                select: {
                    name: true,
                    username: true
                }
            }
        }
    });

    if (!allowance) throw new Error('Allowance not found');
    if (allowance.parentId !== parentId) throw new Error('Unauthorized');

    return allowance;
}

export async function updateAllowance(allowanceId: string, parentId: string, data: UpdateAllowanceData) {
    const allowance = await prisma.allowance.findUnique({
        where: { id: allowanceId }
    });

    if (!allowance) throw new Error('Allowance not found');
    if (allowance.parentId !== parentId) throw new Error('Unauthorized');

    const updateData: any = {};
    if (data.amount !== undefined) updateData.amount = data.amount;
    if (data.status !== undefined) updateData.status = data.status;

    // If frequency changes, recalculate next payment date from the last paid date or creation date
    if (data.frequency !== undefined && data.frequency !== allowance.frequency) {
        updateData.frequency = data.frequency;
        const referenceDate = allowance.lastPaidAt || allowance.createdAt;
        updateData.nextPaymentDate = calculateNextPaymentDate(data.frequency, referenceDate);
    }

    const updated = await prisma.allowance.update({
        where: { id: allowanceId },
        data: updateData,
        include: {
            child: {
                select: {
                    name: true,
                    username: true
                }
            }
        }
    });

    return updated;
}

export async function deleteAllowance(allowanceId: string, parentId: string) {
    const allowance = await prisma.allowance.findUnique({
        where: { id: allowanceId }
    });

    if (!allowance) throw new Error('Allowance not found');
    if (allowance.parentId !== parentId) throw new Error('Unauthorized');

    await prisma.allowance.delete({
        where: { id: allowanceId }
    });

    return true;
}

/**
 * Processes all due allowances.
 */
export async function processDueAllowances() {
    const now = new Date();

    // Find active allowances that are due
    const dueAllowances = await prisma.allowance.findMany({
        where: {
            status: AllowanceStatus.ACTIVE,
            nextPaymentDate: {
                lte: now
            }
        },
        include: {
            child: {
                include: {
                    wallet: true
                }
            }
        }
    });

    const results = [];

    for (const allowance of dueAllowances) {
        try {
            // Get parent wallet
            const parentWalletObj = await walletService.getWalletByUserId(allowance.parentId);

            if (!allowance.child.wallet) {
                console.error(`Child ${allowance.childId} has no wallet. Skipping allowance.`);
                continue;
            }

            // Check parent balance
            if (Number(parentWalletObj.balance) < Number(allowance.amount)) {
                console.warn(`Parent ${allowance.parentId} has insufficient balance for allowance ${allowance.id}.`);
                continue;
            }

            // Execute transfer in transaction
            await prisma.$transaction(async (tx) => {
                // Deduct from parent
                await tx.wallet.update({
                    where: { id: parentWalletObj.id },
                    data: { balance: { decrement: allowance.amount } }
                });

                // Add to child
                await tx.childWallet.update({
                    where: { id: allowance.child.wallet!.id },
                    data: {
                        balance: { increment: allowance.amount },
                        total_earned: { increment: allowance.amount }
                    }
                });

                // Create transaction record
                await tx.transaction.create({
                    data: {
                        type: 'transfer',
                        amount: allowance.amount,
                        status: 'completed',
                        description: `Allowance (${allowance.frequency})`,
                        childId: allowance.childId,
                        wallet_id: parentWalletObj.id
                    }
                });

                // Update allowance next payment date
                const nextDate = calculateNextPaymentDate(allowance.frequency as AllowanceFrequency, allowance.nextPaymentDate);
                await tx.allowance.update({
                    where: { id: allowance.id },
                    data: {
                        lastPaidAt: now,
                        nextPaymentDate: nextDate
                    }
                });
            });

            // Notify child
            await notificationService.createNotification({
                childId: allowance.childId,
                type: 'allowance_paid',
                title: 'Allowance Received!',
                message: `You have received your ${allowance.frequency} allowance of ${allowance.amount}.`,
                relatedObjectType: 'allowance',
                relatedObjectId: allowance.id
            });

            // Real-time Balance Update
            const updatedParentWallet = await walletService.getWalletByUserId(allowance.parentId);
            const updatedChildWallet = await prisma.childWallet.findUnique({ where: { id: allowance.child.wallet!.id } });

            if (updatedParentWallet) notifyUser(allowance.parentId, 'balance_update', { new_balance: updatedParentWallet.balance });
            if (updatedChildWallet) notifyUser(allowance.childId, 'balance_update', { new_balance: updatedChildWallet.balance });

            results.push({ allowanceId: allowance.id, success: true });
        } catch (error: any) {
            console.error(`Error processing allowance ${allowance.id}:`, error);
            results.push({ allowanceId: allowance.id, success: false, error: error.message });
        }
    }

    return results;
}
