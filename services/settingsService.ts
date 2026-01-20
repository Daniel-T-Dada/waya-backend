import { prisma } from '../prisma';

export async function getProfileSettings(userId: string) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            email: true,
            name: true,
            image: true,
            phoneNumber: true,
            notificationPreferences: true
        }
    });

    if (!user) throw new Error('User not found');

    // Ensure notificationPreferences has defaults if null
    const prefs = (user.notificationPreferences as any) || {
        email_notifications: true,
        push_notifications: true
    };

    return {
        ...user,
        notificationPreferences: prefs
    };
}

export async function updateProfileSettings(userId: string, data: { name?: string; phoneNumber?: string; image?: string }) {
    return prisma.user.update({
        where: { id: userId },
        data: {
            name: data.name,
            phoneNumber: data.phoneNumber,
            image: data.image
        },
        select: {
            id: true,
            name: true,
            phoneNumber: true,
            image: true
        }
    });
}

export async function getNotificationSettings(userId: string) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { notificationPreferences: true }
    });

    if (!user) throw new Error('User not found');

    const defaultPrefs = {
        email_notifications: true,
        push_notifications: true,
        chore_completion_alerts: true,
        allowance_reminders: true,
        goal_milestone_alerts: true
    };

    const currentPrefs = (user.notificationPreferences as any) || {};

    return {
        ...defaultPrefs,
        ...currentPrefs
    };
}

export async function updateNotificationSettings(userId: string, data: any) {
    const currentPrefs = await getNotificationSettings(userId);
    const newPrefs = { ...currentPrefs, ...data };

    await prisma.user.update({
        where: { id: userId },
        data: { notificationPreferences: newPrefs }
    });

    return { message: 'Notification settings updated successfully' };
}
