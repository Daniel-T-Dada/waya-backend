import { prisma } from '../prisma';
import { notifyUser } from '../utils/socket';

export interface CreateNotificationData {
    userId?: string;
    childId?: string;
    type: string;
    title: string;
    message: string;
    relatedObjectType?: string;
    relatedObjectId?: string;
}

export async function createNotification(data: CreateNotificationData) {
    const notification = await prisma.notification.create({
        data: {
            userId: data.userId,
            childId: data.childId,
            type: data.type,
            title: data.title,
            message: data.message,
            relatedObjectType: data.relatedObjectType,
            relatedObjectId: data.relatedObjectId
        }
    });

    // Emit real-time notification
    const targetId = data.userId || data.childId;
    if (targetId) {
        notifyUser(targetId, 'notification', notification);
    }

    return notification;
}

export async function getNotifications(userId?: string, childId?: string) {
    const where: any = {};
    if (userId) where.userId = userId;
    if (childId) where.childId = childId;

    const notifications = await prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 50 // Limit to last 50
    });

    const unreadCount = await prisma.notification.count({
        where: {
            ...where,
            isRead: false
        }
    });

    return {
        count: notifications.length,
        unread_count: unreadCount,
        results: notifications
    };
}

export async function markAsRead(notificationId: string, userId?: string, childId?: string) {
    const where: any = { id: notificationId };
    if (userId) where.userId = userId;
    if (childId) where.childId = childId;

    // Verify ownership
    const notification = await prisma.notification.findUnique({ where });
    if (!notification) throw new Error('Notification not found or unauthorized');

    return prisma.notification.update({
        where: { id: notificationId },
        data: { isRead: true }
    });
}

export async function markAllAsRead(userId?: string, childId?: string) {
    const where: any = { isRead: false };
    if (userId) where.userId = userId;
    if (childId) where.childId = childId;

    return prisma.notification.updateMany({
        where,
        data: { isRead: true }
    });
}

export async function deleteNotification(notificationId: string, userId?: string, childId?: string) {
    const where: any = { id: notificationId };
    if (userId) where.userId = userId;
    if (childId) where.childId = childId;

    // Verify ownership
    const notification = await prisma.notification.findUnique({ where });
    if (!notification) throw new Error('Notification not found or unauthorized');

    return prisma.notification.delete({
        where: { id: notificationId }
    });
}
