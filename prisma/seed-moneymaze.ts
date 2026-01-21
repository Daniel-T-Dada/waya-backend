import { PrismaClient } from '../generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

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
                    passingScore: 70,
                    questions: {
                        create: [
                            {
                                questionText: 'What is the best way to save money for something expensive?',
                                choices: {
                                    create: [
                                        { choiceText: 'Buy it immediately on credit', isCorrect: false },
                                        { choiceText: 'Set a savings goal and put money aside regularly', isCorrect: true },
                                        { choiceText: 'Ask someone else to pay for it', isCorrect: false }
                                    ]
                                }
                            },
                            {
                                questionText: 'What does interest mean in a savings account?',
                                choices: {
                                    create: [
                                        { choiceText: 'A fee you pay the bank', isCorrect: false },
                                        { choiceText: 'Extra money the bank pays you for keeping your money there', isCorrect: true },
                                        { choiceText: 'The color of the bank building', isCorrect: false }
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
                    passingScore: 70,
                    questions: {
                        create: [
                            {
                                questionText: 'Which of these is a "need"?',
                                choices: {
                                    create: [
                                        { choiceText: 'A new video game', isCorrect: false },
                                        { choiceText: 'Healthy food', isCorrect: true },
                                        { choiceText: 'A designer T-shirt', isCorrect: false }
                                    ]
                                }
                            },
                            {
                                questionText: 'Why should you compare prices before buying something?',
                                choices: {
                                    create: [
                                        { choiceText: 'To spend more money', isCorrect: false },
                                        { choiceText: 'To make sure you are getting the best deal', isCorrect: true },
                                        { choiceText: 'To waste time', isCorrect: false }
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
