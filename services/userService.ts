import { prisma } from '../prisma';

export async function getUserProfile(userId: string) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            email: true,
            name: true,
            role: true,
            emailVerified: true,
            image: true,
            phoneNumber: true,
            notificationPreferences: true,
            createdAt: true
        }
    });
    return user;
}

export async function updateUserProfile(userId: string, data: { name?: string; phoneNumber?: string; image?: string; notificationPreferences?: any }) {
    const user = await prisma.user.update({
        where: { id: userId },
        data: {
            ...data
        },
        select: {
            id: true,
            email: true,
            name: true,
            role: true,
            emailVerified: true,
            image: true,
            phoneNumber: true,
            notificationPreferences: true,
            updatedAt: true
        }
    });
    return user;
}

export async function updateProfileImage(userId: string, image: string, avatarPublicId: string) {
    return prisma.user.update({
        where: { id: userId },
        data: {
            image,
            avatarPublicId
        },
        select: {
            id: true,
            image: true,
            avatarPublicId: true
        }
    });
}

export async function updateUser(userId: string, data: { password?: string; image?: string; avatarPublicId?: string }) {
    return prisma.user.update({
        where: { id: userId },
        data
    });
}
