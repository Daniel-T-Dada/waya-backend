import { prisma } from '../lib/prisma';

export async function getChildAchievements(childId: string) {
    return prisma.achievement.findMany({
        where: { childId },
        orderBy: { earnedAt: 'desc' }
    });
}


export async function checkAndAwardAchievements(childId: string, type: 'chore' | 'saving' | 'quiz') {
    // Placeholder logic for now - allows for future expansion
    // Real implementation would check stats and create achievements
    // For now, achievements are seeded
    return;
}
