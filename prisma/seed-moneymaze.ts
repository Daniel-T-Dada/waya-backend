import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding MoneyMaze data...');

    // 1. Financial Concepts
    const concept1 = await prisma.concept.create({
        data: {
            title: 'Saving Money',
            description: 'Learn why saving is important and how to start your own savings habit.',
            level: 1,
            order: 1,
            quizzes: {
                create: {
                    title: 'Saving Money Quiz',
                    description: 'Test your knowledge about the basics of saving.',
                    passing_score: 70,
                    questions: {
                        create: [
                            {
                                question_text: 'What is the best way to save money for something expensive?',
                                choices: {
                                    create: [
                                        { choice_text: 'Buy it immediately on credit', is_correct: false },
                                        { choice_text: 'Set a savings goal and put money aside regularly', is_correct: true },
                                        { choice_text: 'Ask someone else to pay for it', is_correct: false }
                                    ]
                                }
                            },
                            {
                                question_text: 'What does interest mean in a savings account?',
                                choices: {
                                    create: [
                                        { choice_text: 'A fee you pay the bank', is_correct: false },
                                        { choice_text: 'Extra money the bank pays you for keeping your money there', is_correct: true },
                                        { choice_text: 'The color of the bank building', is_correct: false }
                                    ]
                                }
                            }
                        ]
                    }
                }
            }
        }
    });

    const concept2 = await prisma.concept.create({
        data: {
            title: 'Spending Wisely',
            description: 'Understand the difference between needs and wants.',
            level: 1,
            order: 2,
            quizzes: {
                create: {
                    title: 'Needs vs. Wants Quiz',
                    description: 'Can you tell what you really need from what you just want?',
                    passing_score: 70,
                    questions: {
                        create: [
                            {
                                question_text: 'Which of these is a "need"?',
                                choices: {
                                    create: [
                                        { choice_text: 'A new video game', is_correct: false },
                                        { choice_text: 'Healthy food', is_correct: true },
                                        { choice_text: 'A designer T-shirt', is_correct: false }
                                    ]
                                }
                            },
                            {
                                question_text: 'Why should you compare prices before buying something?',
                                choices: {
                                    create: [
                                        { choice_text: 'To spend more money', is_correct: false },
                                        { choice_text: 'To make sure you are getting the best deal', is_correct: true },
                                        { choice_text: 'To waste time', is_correct: false }
                                    ]
                                }
                            }
                        ]
                    }
                }
            }
        }
    });

    console.log('MoneyMaze data seeded successfully!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
