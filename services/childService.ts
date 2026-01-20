import { prisma } from '../prisma';
import { Child } from '@prisma/client';
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
