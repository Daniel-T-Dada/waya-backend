import { prisma } from '../prisma';
import { notifyUser } from '../utils/socket';
import * as notificationService from './notificationService';

export async function listConcepts() {
    return prisma.concept.findMany({
        where: { is_active: true },
        orderBy: { order: 'asc' }
    });
}

export async function getConceptProgress(childId: string) {
    const concepts = await prisma.concept.findMany({
        where: { is_active: true },
        include: {
            quizzes: {
                include: {
                    attempts: {
                        where: { childId: childId, passed: true },
                        orderBy: { createdAt: 'desc' },
                        take: 1
                    }
                }
            }
        },
        orderBy: { order: 'asc' }
    });

    const results = concepts.map(concept => {
        const passedQuiz = concept.quizzes[0]?.attempts[0]; // Assuming 1 quiz per concept for simplicity in progress view
        return {
            conceptId: concept.id,
            concept_title: concept.title,
            completed: !!passedQuiz,
            quiz_score: passedQuiz ? passedQuiz.score : null,
            completed_at: passedQuiz ? passedQuiz.createdAt : null
        };
    });

    const totalConcepts = results.length;
    const completedConcepts = results.filter(r => r.completed).length;
    const progressPercentage = totalConcepts > 0 ? Math.round((completedConcepts / totalConcepts) * 100) : 0;

    return {
        total_concepts: totalConcepts,
        completed_concepts: completedConcepts,
        progress_percentage: progressPercentage,
        concepts: results
    };
}

export async function getQuizDetails(quizId: string) {
    const quiz = await prisma.quiz.findUnique({
        where: { id: quizId },
        include: {
            questions: {
                include: {
                    choices: {
                        select: {
                            id: true,
                            choiceText: true
                            // Don't leak isCorrect
                        }
                    }
                }
            }
        }
    });

    if (!quiz) throw new Error('Quiz not found');

    return quiz;
}

export async function submitQuiz(childId: string, quizId: string, answers: { questionId: string, selected_choice_id: string }[]) {
    const quiz = await prisma.quiz.findUnique({
        where: { id: quizId },
        include: {
            questions: {
                include: {
                    choices: true
                }
            }
        }
    });

    if (!quiz) throw new Error('Quiz not found');

    let correctAnswersCount = 0;
    const totalQuestions = quiz.questions.length;

    // Map correct answers for efficiency
    const correctMap = new Map();
    quiz.questions.forEach(q => {
        const correctChoice = q.choices.find(c => c.isCorrect);
        if (correctChoice) correctMap.set(q.id, correctChoice.id);
    });

    answers.forEach(answer => {
        if (correctMap.get(answer.questionId) === answer.selected_choice_id) {
            correctAnswersCount++;
        }
    });

    const score = totalQuestions > 0 ? Math.round((correctAnswersCount / totalQuestions) * 100) : 0;
    const passed = score >= quiz.passingScore;
    const rewardAmount = passed ? 100 : 0; // Default reward for passing, could be customized per quiz

    // Check if previously passed to avoid duplicate rewards
    const previousPass = await prisma.quizAttempt.findFirst({
        where: { childId: childId, quizId: quizId, passed: true }
    });

    const finalReward = previousPass ? 0 : rewardAmount;

    return await prisma.$transaction(async (tx) => {
        const attempt = await tx.quizAttempt.create({
            data: {
                childId: childId,
                quizId: quizId,
                score,
                passed,
                correctAnswers: correctAnswersCount,
                totalQuestions: totalQuestions,
                rewardEarned: finalReward
            }
        });

        if (finalReward > 0) {
            // Update child wallet
            const wallet = await tx.childWallet.findUnique({ where: { childId: childId } });
            if (wallet) {
                await tx.childWallet.update({
                    where: { id: wallet.id },
                    data: {
                        balance: { increment: finalReward },
                        total_earned: { increment: finalReward }
                    }
                });

                // Create transaction
                await tx.transaction.create({
                    data: {
                        type: 'credit',
                        amount: finalReward,
                        status: 'completed',
                        description: `MoneyMaze Reward: ${quiz.title}`,
                        childId: childId,
                        wallet_id: wallet.parent_wallet_id // Use parent wallet ID as per schema requirement for transactions
                    }
                });

                // Create LearningReward record
                await tx.learningReward.create({
                    data: {
                        childId: childId,
                        quizId: quizId,
                        amount: finalReward
                    }
                });

                // Real-time notification & sync
                const updatedWallet = await tx.childWallet.findUnique({ where: { id: wallet.id } });
                if (updatedWallet) {
                    notifyUser(childId, 'balance_update', { new_balance: updatedWallet.balance });
                }

                await notificationService.createNotification({
                    childId,
                    type: 'quiz_reward',
                    title: 'MoneyMaze Reward! 🧠',
                    message: `You earned ${finalReward} for passing the "${quiz.title}" quiz!`,
                    relatedObjectType: 'quiz',
                    relatedObjectId: quiz.id
                });
            }
        }

        // Update streak
        await updateStreak(childId, 'quiz');

        return {
            quizId: quizId,
            score,
            passingScore: quiz.passingScore,
            passed,
            totalQuestions: totalQuestions,
            correctAnswers: correctAnswersCount,
            rewardEarned: finalReward.toFixed(2),
            message: passed ? 'Congratulations! You passed the quiz!' : 'You did not pass this time. Keep learning!'
        };
    });
}

export async function updateStreak(childId: string, activityType: string) {
    const now = new Date();
    // Start of today (UTC)
    const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

    try {
        await prisma.$transaction(async (tx) => {
            const child = await tx.child.findUnique({
                where: { id: childId },
                select: { current_streak: true, last_active_at: true }
            });

            if (!child) return;

            // Check if already active today
            const existingActivity = await tx.dailyActivity.findUnique({
                where: {
                    childId_date: {
                        childId: childId,
                        date: today
                    }
                }
            });

            if (!existingActivity) {
                await tx.dailyActivity.create({
                    data: {
                        childId: childId,
                        date: today,
                        activity_type: activityType
                    }
                });

                let newStreak = 1;
                if (child.last_active_at) {
                    const lastActive = new Date(child.last_active_at);
                    const lastActiveDay = new Date(Date.UTC(lastActive.getUTCFullYear(), lastActive.getUTCMonth(), lastActive.getUTCDate()));

                    const diffTime = today.getTime() - lastActiveDay.getTime();
                    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

                    if (diffDays === 1) {
                        // Consecutive day
                        newStreak = child.current_streak + 1;
                    } else if (diffDays === 0) {
                        // Already active today, streak stays the same
                        newStreak = child.current_streak;
                    } else {
                        // Streak broken
                        newStreak = 1;
                    }
                }

                await tx.child.update({
                    where: { id: childId },
                    data: {
                        current_streak: newStreak,
                        last_active_at: now
                    }
                });
            } else {
                // Just update the timestamp if already active today
                await tx.child.update({
                    where: { id: childId },
                    data: { last_active_at: now }
                });
            }
        });
    } catch (err) {
        console.error('Error updating streak:', err);
    }
}

export async function getWeeklyActivity(childId: string) {
    const now = new Date();
    const dayOfWeek = now.getUTCDay(); // 0 (Sun) to 6 (Sat)

    // Calculate start of week (Monday)
    // If today is Sunday (0), we want back 6 days.
    // If today is Monday (1), we want back 0 days.
    const diff = (dayOfWeek + 6) % 7;
    const monday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - diff));

    const activities = await prisma.dailyActivity.findMany({
        where: {
            childId: childId,
            date: {
                gte: monday
            }
        },
        orderBy: { date: 'asc' }
    });

    // Map to array of 7 booleans (Mon to Sun)
    const result = [false, false, false, false, false, false, false];
    activities.forEach(activity => {
        const date = new Date(activity.date);
        const day = (date.getUTCDay() + 6) % 7; // Map 1-6,0 to 0-6 (Mon-Sun)
        result[day] = true;
    });

    return result;
}

export async function getRewards(childId: string) {
    const rewards = await prisma.learningReward.findMany({
        where: { childId: childId },
        include: {
            quiz: {
                select: { title: true }
            }
        },
        orderBy: { earned_at: 'desc' }
    });

    const total = rewards.reduce((sum, r) => sum + Number(r.amount), 0);

    return {
        count: rewards.length,
        total_rewards: total.toFixed(2),
        results: rewards.map(r => ({
            id: r.id,
            quiz: r.quizId,
            quiz_title: r.quiz.title,
            amount: r.amount,
            earned_at: r.earned_at
        }))
    };
}

export async function getDashboard(childId: string) {
    const child = await prisma.child.findUnique({
        where: { id: childId },
        select: { current_streak: true }
    });

    const totalConcepts = await prisma.concept.count({ where: { is_active: true } });
    const passedAttempts = await prisma.quizAttempt.findMany({
        where: { childId: childId, passed: true },
        select: { quizId: true }
    });

    const uniquePassedQuizzes = new Set(passedAttempts.map(a => a.quizId)).size;

    const totalRewards = await prisma.learningReward.aggregate({
        where: { childId: childId },
        _sum: { amount: true }
    });

    const progressPercentage = totalConcepts > 0 ? Math.round((uniquePassedQuizzes / totalConcepts) * 100) : 0;
    const weeklyActivity = await getWeeklyActivity(childId);

    return {
        total_concepts: totalConcepts,
        completed_concepts: uniquePassedQuizzes,
        total_quizzes: totalConcepts, // Assuming 1 quiz per concept for now
        passed_quizzes: uniquePassedQuizzes,
        total_rewards: (totalRewards._sum.amount || 0).toFixed(2),
        current_streak: child?.current_streak || 0,
        weekly_activity: weeklyActivity,
        progress_percentage: progressPercentage,
        recent_achievements: [] // Achievements logic could be added later
    };
}
