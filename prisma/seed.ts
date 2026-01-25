import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';
import bcrypt from 'bcryptjs';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });


async function main() {
    console.log('🌱 Starting database seeding...');

    // Note: We'll skip clearing existing data since you already have Parent 1 and Child 1
    // If you want to clear and start fresh, uncomment the lines below:
    /*
    console.log('🗑️  Clearing existing data...');
    await prisma.notification.deleteMany();
    await prisma.learningReward.deleteMany();
    await prisma.dailyActivity.deleteMany();
    await prisma.quizAttempt.deleteMany();
    await prisma.goal.deleteMany();
    await prisma.allowance.deleteMany();
    await prisma.chore.deleteMany();
    await prisma.transaction.deleteMany();
    await prisma.payment.deleteMany();
    await prisma.childWallet.deleteMany();
    await prisma.wallet.deleteMany();
    await prisma.child.deleteMany();
    await prisma.user.deleteMany();
    */

    // Hash passwords
    const parentPassword = await bcrypt.hash('secure1234', 10);
    const childPin = await bcrypt.hash('1234', 10);

    // ========================================
    // Get existing Parent 1 or create if not exists
    // ========================================
    console.log('👤 Checking for First Parent...');
    let parent1 = await prisma.user.findUnique({
        where: { email: 'firstparent@yopmail.com' },
    });

    if (!parent1) {
        console.log('Creating First Parent...');
        parent1 = await prisma.user.create({
            data: {
                email: 'firstparent@yopmail.com',
                password: parentPassword,
                name: 'First Parent',
                role: 'parent',
                emailVerified: true,
                phoneNumber: '+2348012345671',
                notificationPreferences: {
                    email: true,
                    push: true,
                    sms: false,
                },
            },
        });
    }

    // Get or create wallet for Parent 1
    let parent1Wallet = await prisma.wallet.findUnique({
        where: { userId: parent1.id },
    });

    if (!parent1Wallet) {
        parent1Wallet = await prisma.wallet.create({
            data: {
                userId: parent1.id,
                balance: 50000.00,
                pin: childPin,
            },
        });
    }

    // ========================================
    // Get existing children or create new ones
    // ========================================
    console.log('👶 Checking for children...');

    // Child 1 (existing)
    let child1 = await prisma.child.findUnique({
        where: { username: 'firstchild' },
    });

    if (!child1) {
        child1 = await prisma.child.create({
            data: {
                username: 'firstchild',
                name: 'First ParentChildOne',
                pin: childPin,
                parentId: parent1.id,
                avatar: '👦',
            },
        });
    }

    let child1Wallet = await prisma.childWallet.findUnique({
        where: { childId: child1.id },
    });

    if (!child1Wallet) {
        child1Wallet = await prisma.childWallet.create({
            data: {
                childId: child1.id,
                parentWalletId: parent1Wallet.id,
                balance: 5000.00,
            },
        });
    }

    // Child 2 (new)
    let child2 = await prisma.child.findUnique({
        where: { username: 'secondchild' },
    });

    if (!child2) {
        console.log('Creating Second Child...');
        child2 = await prisma.child.create({
            data: {
                username: 'secondchild',
                name: 'First ParentChildTwo',
                pin: childPin,
                parentId: parent1.id,
                avatar: '👧',
            },
        });

        await prisma.childWallet.create({
            data: {
                childId: child2.id,
                parentWalletId: parent1Wallet.id,
                balance: 3500.00,
            },
        });
    }

    // Child 3 (new)
    let child3 = await prisma.child.findUnique({
        where: { username: 'thirdchild' },
    });

    if (!child3) {
        console.log('Creating Third Child...');
        child3 = await prisma.child.create({
            data: {
                username: 'thirdchild',
                name: 'First ParentChildThree',
                pin: childPin,
                parentId: parent1.id,
                avatar: '🧒',
            },
        });

        await prisma.childWallet.create({
            data: {
                childId: child3.id,
                parentWalletId: parent1Wallet.id,
                balance: 7500.00,
            },
        });
    }

    // ========================================
    // PARENT 2: Second Parent (new)
    // ========================================
    console.log('👤 Checking for Second Parent...');
    let parent2 = await prisma.user.findUnique({
        where: { email: 'secondparent@yopmail.com' },
    });

    if (!parent2) {
        console.log('Creating Second Parent...');
        parent2 = await prisma.user.create({
            data: {
                email: 'secondparent@yopmail.com',
                password: parentPassword,
                name: 'Second Parent',
                role: 'parent',
                emailVerified: true,
                phoneNumber: '+2348012345672',
                notificationPreferences: {
                    email: true,
                    push: true,
                    sms: true,
                },
            },
        });
    }

    let parent2Wallet = await prisma.wallet.findUnique({
        where: { userId: parent2.id },
    });

    if (!parent2Wallet) {
        parent2Wallet = await prisma.wallet.create({
            data: {
                userId: parent2.id,
                balance: 75000.00,
                pin: childPin,
            },
        });
    }

    // Create 2 children for Parent 2
    console.log('👶 Creating children for Second Parent...');

    let child4 = await prisma.child.findUnique({
        where: { username: 'fourthchild' },
    });

    if (!child4) {
        child4 = await prisma.child.create({
            data: {
                username: 'fourthchild',
                name: 'Second ParentChildOne',
                pin: childPin,
                parentId: parent2.id,
                avatar: '👦',
            },
        });

        await prisma.childWallet.create({
            data: {
                childId: child4.id,
                parentWalletId: parent2Wallet.id,
                balance: 4200.00,
            },
        });
    }

    let child5 = await prisma.child.findUnique({
        where: { username: 'fifthchild' },
    });

    if (!child5) {
        child5 = await prisma.child.create({
            data: {
                username: 'fifthchild',
                name: 'Second ParentChildTwo',
                pin: childPin,
                parentId: parent2.id,
                avatar: '👧',
            },
        });

        await prisma.childWallet.create({
            data: {
                childId: child5.id,
                parentWalletId: parent2Wallet.id,
                balance: 6800.00,
            },
        });
    }

    // ========================================
    // TRANSACTIONS
    // ========================================
    console.log('💸 Creating transactions...');

    // Check if transactions already exist
    const existingTransactions = await prisma.transaction.count({
        where: { walletId: parent1Wallet.id },
    });

    if (existingTransactions === 0) {
        // Parent 1 transactions
        await prisma.transaction.createMany({
            data: [
                {
                    type: 'credit',
                    amount: 50000.00,
                    status: 'completed',
                    description: 'Initial wallet funding',
                    walletId: parent1Wallet.id,
                },
                {
                    type: 'debit',
                    amount: 5000.00,
                    status: 'completed',
                    description: 'Transfer to First ParentChildOne',
                    walletId: parent1Wallet.id,
                    childId: child1.id,
                },
                {
                    type: 'debit',
                    amount: 3500.00,
                    status: 'completed',
                    description: 'Transfer to First ParentChildTwo',
                    walletId: parent1Wallet.id,
                    childId: child2?.id,
                },
            ],
        });
    }

    // Parent 2 transactions
    const parent2Transactions = await prisma.transaction.count({
        where: { walletId: parent2Wallet.id },
    });

    if (parent2Transactions === 0) {
        await prisma.transaction.createMany({
            data: [
                {
                    type: 'credit',
                    amount: 75000.00,
                    status: 'completed',
                    description: 'Initial wallet funding',
                    walletId: parent2Wallet.id,
                },
                {
                    type: 'debit',
                    amount: 4200.00,
                    status: 'completed',
                    description: 'Transfer to Second ParentChildOne',
                    walletId: parent2Wallet.id,
                    childId: child4?.id,
                },
            ],
        });
    }

    // ========================================
    // PAYMENTS (Paystack)
    // ========================================
    console.log('💳 Creating payment records...');

    const existingPayments = await prisma.payment.count();

    if (existingPayments === 0) {
        await prisma.payment.createMany({
            data: [
                {
                    reference: `PAY_${Date.now()}_1`,
                    amount: 50000.00,
                    status: 'success',
                    userId: parent1.id,
                    channel: 'card',
                    currency: 'NGN',
                },
                {
                    reference: `PAY_${Date.now()}_2`,
                    amount: 75000.00,
                    status: 'success',
                    userId: parent2.id,
                    channel: 'card',
                    currency: 'NGN',
                },
            ],
        });
    }

    // ========================================
    // CHORES (Tasks)
    // ========================================
    console.log('📋 Creating chores...');

    const existingChores = await prisma.chore.count();

    if (existingChores === 0) {
        // Chores for Child 1
        await prisma.chore.createMany({
            data: [
                {
                    title: 'Complete Math Homework',
                    description: 'Finish all exercises on pages 45-47',
                    amount: 500.00,
                    status: 'completed',
                    dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
                    assignedTo: child1.id,
                    parentId: parent1.id,
                    category: 'homework',
                },
                {
                    title: 'Clean Your Room',
                    description: 'Organize toys and make your bed',
                    amount: 300.00,
                    status: 'awaiting_approval',
                    dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
                    assignedTo: child1.id,
                    parentId: parent1.id,
                    category: 'chores',
                },
                {
                    title: 'Read 2 Chapters',
                    description: 'Read chapters 5 and 6 of your storybook',
                    amount: 200.00,
                    status: 'pending',
                    dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
                    assignedTo: child1.id,
                    parentId: parent1.id,
                    category: 'reading',
                },
            ],
        });

        // Chores for Child 2
        if (child2) {
            await prisma.chore.createMany({
                data: [
                    {
                        title: 'Practice Piano',
                        description: 'Practice scales for 30 minutes',
                        amount: 400.00,
                        status: 'awaiting_approval',
                        dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
                        assignedTo: child2.id,
                        parentId: parent1.id,
                        category: 'music',
                    },
                    {
                        title: 'Water the Plants',
                        description: 'Water all plants in the garden',
                        amount: 150.00,
                        status: 'pending',
                        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
                        assignedTo: child2.id,
                        parentId: parent1.id,
                        category: 'chores',
                    },
                ],
            });
        }

        // Chores for Child 3
        if (child3) {
            await prisma.chore.create({
                data: {
                    title: 'Science Project',
                    description: 'Complete volcano experiment',
                    amount: 800.00,
                    status: 'awaiting_approval',
                    dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
                    assignedTo: child3.id,
                    parentId: parent1.id,
                    category: 'homework',
                },
            });
        }

        // Chores for Child 4
        if (child4) {
            await prisma.chore.createMany({
                data: [
                    {
                        title: 'English Essay',
                        description: 'Write a 500-word essay on your favorite book',
                        amount: 600.00,
                        status: 'pending',
                        dueDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
                        assignedTo: child4.id,
                        parentId: parent2.id,
                        category: 'homework',
                    },
                    {
                        title: 'Help with Dishes',
                        description: 'Help wash dishes after dinner',
                        amount: 200.00,
                        status: 'completed',
                        dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
                        assignedTo: child4.id,
                        parentId: parent2.id,
                        category: 'chores',
                    },
                ],
            });
        }

        // Chores for Child 5
        if (child5) {
            await prisma.chore.create({
                data: {
                    title: 'Soccer Practice',
                    description: 'Attend soccer practice and drills',
                    amount: 350.00,
                    status: 'awaiting_approval',
                    dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
                    assignedTo: child5.id,
                    parentId: parent2.id,
                    category: 'sports',
                },
            });
        }
    }

    // ========================================
    // TIME-DISTRIBUTED CHORES (for realistic charts and percentage changes)
    // ========================================
    console.log('📊 Creating time-distributed chores for charts...');

    const timeDistributedChoresCount = await prisma.chore.count({
        where: {
            title: { contains: '[Chart Data]' }
        }
    });

    if (timeDistributedChoresCount === 0 && child1 && child2 && child3) {
        const now = new Date();

        // Helper function to create date X days ago
        const daysAgo = (days: number) => {
            const date = new Date(now);
            date.setDate(date.getDate() - days);
            return date;
        };

        // Create completed chores spread across last 14 days
        // This enables percentage changes and realistic chart data
        const timeDistributedChores = [
            // CURRENT PERIOD (Last 7 days) - Higher activity
            // Day 1 (yesterday)
            {
                title: '[Chart Data] Morning Routine',
                description: 'Complete morning routine independently',
                amount: 250.00,
                status: 'completed',
                assignedTo: child1.id,
                parentId: parent1.id,
                category: 'daily',
                createdAt: daysAgo(1),
                updatedAt: daysAgo(1),
            },
            {
                title: '[Chart Data] Homework Help',
                description: 'Help sibling with homework',
                amount: 300.00,
                status: 'completed',
                assignedTo: child2.id,
                parentId: parent1.id,
                category: 'homework',
                createdAt: daysAgo(1),
                updatedAt: daysAgo(1),
            },
            // Day 2
            {
                title: '[Chart Data] Organize Bookshelf',
                description: 'Organize all books alphabetically',
                amount: 400.00,
                status: 'completed',
                assignedTo: child1.id,
                parentId: parent1.id,
                category: 'chores',
                createdAt: daysAgo(2),
                updatedAt: daysAgo(2),
            },
            // Day 3
            {
                title: '[Chart Data] Feed Pets',
                description: 'Feed pets morning and evening',
                amount: 200.00,
                status: 'completed',
                assignedTo: child3.id,
                parentId: parent1.id,
                category: 'pets',
                createdAt: daysAgo(3),
                updatedAt: daysAgo(3),
            },
            {
                title: '[Chart Data] Math Practice',
                description: 'Complete 20 math problems',
                amount: 350.00,
                status: 'completed',
                assignedTo: child1.id,
                parentId: parent1.id,
                category: 'homework',
                createdAt: daysAgo(3),
                updatedAt: daysAgo(3),
            },
            // Day 5
            {
                title: '[Chart Data] Garden Work',
                description: 'Pull weeds from garden',
                amount: 450.00,
                status: 'completed',
                assignedTo: child2.id,
                parentId: parent1.id,
                category: 'outdoor',
                createdAt: daysAgo(5),
                updatedAt: daysAgo(5),
            },
            // Day 6
            {
                title: '[Chart Data] Laundry Helper',
                description: 'Fold and put away laundry',
                amount: 300.00,
                status: 'completed',
                assignedTo: child1.id,
                parentId: parent1.id,
                category: 'chores',
                createdAt: daysAgo(6),
                updatedAt: daysAgo(6),
            },

            // PREVIOUS PERIOD (8-14 days ago) - Lower activity for comparison
            // Day 8
            {
                title: '[Chart Data] Vacuum Living Room',
                description: 'Vacuum entire living room',
                amount: 350.00,
                status: 'completed',
                assignedTo: child2.id,
                parentId: parent1.id,
                category: 'chores',
                createdAt: daysAgo(8),
                updatedAt: daysAgo(8),
            },
            // Day 10
            {
                title: '[Chart Data] Wash Car',
                description: 'Help wash family car',
                amount: 500.00,
                status: 'completed',
                assignedTo: child3.id,
                parentId: parent1.id,
                category: 'outdoor',
                createdAt: daysAgo(10),
                updatedAt: daysAgo(10),
            },
            // Day 12
            {
                title: '[Chart Data] Recycling Duty',
                description: 'Sort and take out recycling',
                amount: 200.00,
                status: 'completed',
                assignedTo: child1.id,
                parentId: parent1.id,
                category: 'chores',
                createdAt: daysAgo(12),
                updatedAt: daysAgo(12),
            },
            // Day 13
            {
                title: '[Chart Data] Study Session',
                description: 'Study for upcoming test',
                amount: 400.00,
                status: 'completed',
                assignedTo: child2.id,
                parentId: parent1.id,
                category: 'homework',
                createdAt: daysAgo(13),
                updatedAt: daysAgo(13),
            },
        ];

        // Insert time-distributed chores
        for (const chore of timeDistributedChores) {
            await prisma.chore.create({
                data: chore
            });
        }

        console.log(`   ✅ Created ${timeDistributedChores.length} time-distributed chores`);
    }

    // Checking for Parent 2 chart data
    const parent2ChartChoresCount = await prisma.chore.count({
        where: {
            title: { contains: '[Chart Data]' },
            parentId: parent2.id
        }
    });

    if (parent2ChartChoresCount === 0 && child4 && child5) {
        const now = new Date();

        // Helper function to create date X days ago
        const daysAgo = (days: number) => {
            const date = new Date(now);
            date.setDate(date.getDate() - days);
            return date;
        };

        const timeDistributedChoresParent2 = [
            // CURRENT PERIOD (Last 7 days)
            {
                title: '[Chart Data] Walk Dog',
                description: 'Walk the dog around the block',
                amount: 300.00,
                status: 'completed',
                assignedTo: child4.id,
                parentId: parent2.id,
                category: 'pets',
                createdAt: daysAgo(1),
                updatedAt: daysAgo(1),
            },
            {
                title: '[Chart Data] Fold Laundry',
                description: 'Fold your own clothes',
                amount: 250.00,
                status: 'completed',
                assignedTo: child5.id,
                parentId: parent2.id,
                category: 'chores',
                createdAt: daysAgo(2),
                updatedAt: daysAgo(2),
            },
            {
                title: '[Chart Data] Math Homework',
                description: 'Complete math worksheet',
                amount: 500.00,
                status: 'completed',
                assignedTo: child4.id,
                parentId: parent2.id,
                category: 'homework',
                createdAt: daysAgo(4),
                updatedAt: daysAgo(4),
            },

            // PREVIOUS PERIOD (8-14 days ago)
            {
                title: '[Chart Data] Clean Garage',
                description: 'Sweep the garage floor',
                amount: 800.00,
                status: 'completed',
                assignedTo: child4.id,
                parentId: parent2.id,
                category: 'chores',
                createdAt: daysAgo(9),
                updatedAt: daysAgo(9),
            },
            {
                title: '[Chart Data] Wash Windows',
                description: 'Wash first floor windows',
                amount: 600.00,
                status: 'completed',
                assignedTo: child5.id,
                parentId: parent2.id,
                category: 'chores',
                createdAt: daysAgo(12),
                updatedAt: daysAgo(12),
            }
        ];

        for (const chore of timeDistributedChoresParent2) {
            await prisma.chore.create({
                data: chore
            });
        }
        console.log(`   ✅ Created ${timeDistributedChoresParent2.length} time-distributed chores for Parent 2`);
    }

    // ========================================
    // GOALS (Rewards/Savings Goals)

    // ========================================
    console.log('� Creating savings goals...');

    const existingGoals = await prisma.goal.count();

    if (existingGoals === 0) {
        // Goals for Child 1
        await prisma.goal.createMany({
            data: [
                {
                    title: 'New Bicycle',
                    description: 'Save up for a new mountain bike',
                    targetAmount: 15000.00,
                    currentAmount: 2000.00,
                    childId: child1.id,
                    status: 'in_progress',
                },
                {
                    title: 'Video Game',
                    description: 'Save for new PlayStation game',
                    targetAmount: 5000.00,
                    currentAmount: 3500.00,
                    childId: child1.id,
                    status: 'in_progress',
                },
            ],
        });

        // Goals for Child 2
        if (child2) {
            await prisma.goal.create({
                data: {
                    title: 'Art Supplies',
                    description: 'Professional art set with paints and brushes',
                    targetAmount: 8000.00,
                    currentAmount: 1500.00,
                    childId: child2.id,
                    status: 'in_progress',
                },
            });
        }
    }

    // ========================================
    // NOTIFICATIONS
    // ========================================
    console.log('🔔 Creating notifications...');

    const existingNotifications = await prisma.notification.count();

    if (existingNotifications === 0) {
        await prisma.notification.createMany({
            data: [
                {
                    userId: parent1.id,
                    title: 'Chore Completed',
                    message: 'First ParentChildOne completed "Complete Math Homework"',
                    type: 'chore_completed',
                    isRead: false,
                },
                {
                    userId: parent1.id,
                    title: 'Wallet Funded',
                    message: 'Your wallet has been credited with ₦50,000',
                    type: 'payment_success',
                    isRead: true,
                },
                {
                    userId: parent2.id,
                    title: 'New Chore Assigned',
                    message: 'You assigned "English Essay" to Second ParentChildOne',
                    type: 'chore_assigned',
                    isRead: false,
                },
            ],
        });
    }

    // ========================================
    // ALLOWANCES (Recurring Payments)
    // ========================================
    console.log('💰 Creating allowances...');

    const existingAllowances = await prisma.allowance.count();

    if (existingAllowances === 0) {
        // Weekly allowances for children
        await prisma.allowance.createMany({
            data: [
                {
                    parentId: parent1.id,
                    childId: child1.id,
                    amount: 1000.00,
                    frequency: 'weekly',
                    status: 'active',
                    nextPaymentDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                },
                {
                    parentId: parent1.id,
                    childId: child2?.id!,
                    amount: 800.00,
                    frequency: 'weekly',
                    status: 'active',
                    nextPaymentDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                },
                {
                    parentId: parent2.id,
                    childId: child4?.id!,
                    amount: 1200.00,
                    frequency: 'weekly',
                    status: 'active',
                    nextPaymentDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
                },
            ],
        });
    }

    // ========================================
    // DAILY ACTIVITIES (For Streaks)
    // ========================================
    console.log('📅 Creating daily activities...');

    const existingActivities = await prisma.dailyActivity.count();

    if (existingActivities === 0) {
        const today = new Date();
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
        const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);

        // Child 1 - 4 day streak
        await prisma.dailyActivity.createMany({
            data: [
                { childId: child1.id, date: today, activityType: 'chore' },
                { childId: child1.id, date: yesterday, activityType: 'quiz' },
                { childId: child1.id, date: twoDaysAgo, activityType: 'chore' },
                { childId: child1.id, date: threeDaysAgo, activityType: 'saving' },
            ],
        });

        // Child 2 - 2 day streak
        if (child2) {
            await prisma.dailyActivity.createMany({
                data: [
                    { childId: child2.id, date: today, activityType: 'quiz' },
                    { childId: child2.id, date: yesterday, activityType: 'chore' },
                ],
            });
        }

        // Child 4 - 3 day streak
        if (child4) {
            await prisma.dailyActivity.createMany({
                data: [
                    { childId: child4.id, date: today, activityType: 'chore' },
                    { childId: child4.id, date: yesterday, activityType: 'quiz' },
                    { childId: child4.id, date: twoDaysAgo, activityType: 'chore' },
                ],
            });
        }
    }

    // ========================================
    // CONCEPTS & QUIZZES (Learning Content)
    // ========================================
    console.log('📚 Creating learning concepts and quizzes...');

    const existingConcepts = await prisma.concept.count();

    if (existingConcepts === 0) {
        // Create Concepts
        const concept1 = await prisma.concept.create({
            data: {
                title: 'Money Basics',
                description: 'Understanding money, coins, and bills',
                level: 1,
                order: 1,
                isActive: true,
            },
        });

        const concept2 = await prisma.concept.create({
            data: {
                title: 'Saving & Spending',
                description: 'Learn about saving money and smart spending',
                level: 1,
                order: 2,
                isActive: true,
            },
        });

        const concept3 = await prisma.concept.create({
            data: {
                title: 'Earning Money',
                description: 'How to earn money through chores and tasks',
                level: 2,
                order: 3,
                isActive: true,
            },
        });

        // Create Quizzes with Questions
        const quiz1 = await prisma.quiz.create({
            data: {
                conceptId: concept1.id,
                title: 'Identifying Coins',
                description: 'Test your knowledge of different coins',
                passingScore: 70,
            },
        });

        // Questions for Quiz 1
        const question1 = await prisma.question.create({
            data: {
                quizId: quiz1.id,
                questionText: 'How many kobo are in 1 Naira?',
                questionType: 'multiple_choice',
            },
        });

        await prisma.answerChoice.createMany({
            data: [
                { questionId: question1.id, choiceText: '10 kobo', isCorrect: false },
                { questionId: question1.id, choiceText: '50 kobo', isCorrect: false },
                { questionId: question1.id, choiceText: '100 kobo', isCorrect: true },
                { questionId: question1.id, choiceText: '1000 kobo', isCorrect: false },
            ],
        });

        const question2 = await prisma.question.create({
            data: {
                quizId: quiz1.id,
                questionText: 'Which is worth more?',
                questionType: 'multiple_choice',
            },
        });

        await prisma.answerChoice.createMany({
            data: [
                { questionId: question2.id, choiceText: '5 Naira', isCorrect: false },
                { questionId: question2.id, choiceText: '10 Naira', isCorrect: true },
                { questionId: question2.id, choiceText: '2 Naira', isCorrect: false },
                { questionId: question2.id, choiceText: '1 Naira', isCorrect: false },
            ],
        });

        // Quiz 2
        const quiz2 = await prisma.quiz.create({
            data: {
                conceptId: concept2.id,
                title: 'Saving Money',
                description: 'Learn about saving and goals',
                passingScore: 70,
            },
        });

        const question3 = await prisma.question.create({
            data: {
                quizId: quiz2.id,
                questionText: 'Why is it important to save money?',
                questionType: 'multiple_choice',
            },
        });

        await prisma.answerChoice.createMany({
            data: [
                { questionId: question3.id, choiceText: 'To buy things later', isCorrect: true },
                { questionId: question3.id, choiceText: 'To lose it', isCorrect: false },
                { questionId: question3.id, choiceText: 'To give it away', isCorrect: false },
                { questionId: question3.id, choiceText: 'To hide it', isCorrect: false },
            ],
        });

        // Quiz 3
        const quiz3 = await prisma.quiz.create({
            data: {
                conceptId: concept3.id,
                title: 'Earning Through Chores',
                description: 'Understanding how to earn money',
                passingScore: 70,
            },
        });

        const question4 = await prisma.question.create({
            data: {
                quizId: quiz3.id,
                questionText: 'What is a chore?',
                questionType: 'multiple_choice',
            },
        });

        await prisma.answerChoice.createMany({
            data: [
                { questionId: question4.id, choiceText: 'A task you do to help', isCorrect: true },
                { questionId: question4.id, choiceText: 'A type of food', isCorrect: false },
                { questionId: question4.id, choiceText: 'A game', isCorrect: false },
                { questionId: question4.id, choiceText: 'A toy', isCorrect: false },
            ],
        });

        // ========================================
        // QUIZ ATTEMPTS
        // ========================================
        console.log('🎯 Creating quiz attempts...');

        // Child 1 attempts
        await prisma.quizAttempt.createMany({
            data: [
                {
                    childId: child1.id,
                    quizId: quiz1.id,
                    score: 100,
                    passed: true,
                    correctAnswers: 2,
                    totalQuestions: 2,
                    rewardEarned: 50.00,
                },
                {
                    childId: child1.id,
                    quizId: quiz2.id,
                    score: 100,
                    passed: true,
                    correctAnswers: 1,
                    totalQuestions: 1,
                    rewardEarned: 50.00,
                },
            ],
        });

        // Child 2 attempts
        if (child2) {
            await prisma.quizAttempt.create({
                data: {
                    childId: child2.id,
                    quizId: quiz1.id,
                    score: 50,
                    passed: false,
                    correctAnswers: 1,
                    totalQuestions: 2,
                    rewardEarned: 0,
                },
            });
        }

        // Child 4 attempts
        if (child4) {
            await prisma.quizAttempt.createMany({
                data: [
                    {
                        childId: child4.id,
                        quizId: quiz1.id,
                        score: 100,
                        passed: true,
                        correctAnswers: 2,
                        totalQuestions: 2,
                        rewardEarned: 50.00,
                    },
                    {
                        childId: child4.id,
                        quizId: quiz3.id,
                        score: 100,
                        passed: true,
                        correctAnswers: 1,
                        totalQuestions: 1,
                        rewardEarned: 50.00,
                    },
                ],
            });
        }

        // ========================================
        // LEARNING REWARDS
        // ========================================
        console.log('🏆 Creating learning rewards...');

        await prisma.learningReward.createMany({
            data: [
                {
                    childId: child1.id,
                    quizId: quiz1.id,
                    amount: 50.00,
                },
                {
                    childId: child1.id,
                    quizId: quiz2.id,
                    amount: 50.00,
                },
                {
                    childId: child4?.id!,
                    quizId: quiz1.id,
                    amount: 50.00,
                },
                {
                    childId: child4?.id!,
                    quizId: quiz3.id,
                    amount: 50.00,
                },
            ],
        });
    }

    // ========================================
    // HISTORICAL DATA FOR TRENDS
    // ========================================
    console.log('📉 Creating historical trends (Transactions)...');

    // Create random transactions for the last 6 months
    const today = new Date();
    const categories = ['Transfers', 'Allowance', 'Food', 'Transport', 'Bills', 'Subscription'];
    const trendTransactions = [];

    for (let i = 1; i <= 6; i++) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 15);

        // 1. Monthly Income (Credit)
        trendTransactions.push({
            type: 'credit',
            amount: 50000 + (Math.random() * 20000), // 50k - 70k income
            status: 'completed',
            description: 'Wallet Funding',
            walletId: parent1Wallet.id,
            createdAt: d,
            updatedAt: d
        });

        // 2. Variable Expenses (Debit)
        const numExpenses = 3 + Math.floor(Math.random() * 4); // 3-6 expenses per month
        for (let j = 0; j < numExpenses; j++) {
            const amount = 2000 + (Math.random() * 8000); // 2k - 10k
            const category = categories[Math.floor(Math.random() * categories.length)];
            const desc = category === 'Transfers' ? `Transfer to ${child1.name}` : `${category} Payment`;

            trendTransactions.push({
                type: 'debit',
                amount: amount,
                status: 'completed',
                description: desc,
                walletId: parent1Wallet.id,
                childId: category === 'Transfers' ? child1.id : null,
                createdAt: new Date(d.getTime() + (j * 86400000)), // Spread expenses over days
                updatedAt: new Date(d.getTime() + (j * 86400000))
            });
        }
    }

    for (const t of trendTransactions) {
        await prisma.transaction.create({ data: t });
    }
    console.log(`   ✅ Created ${trendTransactions.length} historical transactions for trends`);

    // ========================================
    // ACHIEVEMENTS
    // ========================================
    console.log('🏅 Creating achievements...');

    // Helper for achievements
    const daysAgo = (days: number) => {
        const date = new Date();
        date.setDate(date.getDate() - days);
        return date;
    };

    await prisma.achievement.createMany({
        data: [
            {
                childId: child1.id, // First ParentChildOne
                type: 'chore_streak',
                title: '5-Day Streak',
                description: 'Completed chores for 5 consecutive days',
                earnedAt: daysAgo(2)
            },
            {
                childId: child1.id,
                type: 'quiz_master',
                title: 'Quiz Whiz',
                description: 'Scored 100% on a Math quiz',
                earnedAt: daysAgo(5)
            },
            {
                childId: child1.id,
                type: 'savings_goal',
                title: 'First Goal',
                description: 'Completed first savings goal',
                earnedAt: daysAgo(10)
            },
            {
                childId: child2.id, // First ParentChildTwo
                type: 'early_bird',
                title: 'Early Bird',
                description: 'Completed chores before 9 AM',
                earnedAt: daysAgo(1)
            },
            {
                childId: child3.id, // First ParentChildThree
                type: 'top_earner',
                title: 'Top Earner',
                description: 'Earned most rewards this week',
                earnedAt: daysAgo(3)
            }
        ]
    });
    console.log(`   ✅ Created 5 achievements`);

    console.log('✅ Database seeding completed successfully!');
    console.log('\n📊 Summary:');

    const totalParents = await prisma.user.count({ where: { role: 'parent' } });
    const totalChildren = await prisma.child.count();
    const totalWallets = await prisma.wallet.count();
    const totalChildWallets = await prisma.childWallet.count();
    const totalTransactions = await prisma.transaction.count();
    const totalChores = await prisma.chore.count();
    const totalGoals = await prisma.goal.count();
    const totalNotifications = await prisma.notification.count();
    const totalAllowances = await prisma.allowance.count();
    const totalDailyActivities = await prisma.dailyActivity.count();
    const totalConcepts = await prisma.concept.count();
    const totalQuizzes = await prisma.quiz.count();
    const totalQuestions = await prisma.question.count();
    const totalQuizAttempts = await prisma.quizAttempt.count();
    const totalLearningRewards = await prisma.learningReward.count();
    const totalAchievements = await prisma.achievement.count();

    console.log(`   - Parents: ${totalParents}`);
    console.log(`   - Children: ${totalChildren}`);
    console.log(`   - Parent Wallets: ${totalWallets}`);
    console.log(`   - Child Wallets: ${totalChildWallets}`);
    console.log(`   - Transactions: ${totalTransactions}`);
    console.log(`   - Chores: ${totalChores}`);
    console.log(`   - Goals: ${totalGoals}`);
    console.log(`   - Allowances: ${totalAllowances}`);
    console.log(`   - Daily Activities (Streaks): ${totalDailyActivities}`);
    console.log(`   - Learning Concepts: ${totalConcepts}`);
    console.log(`   - Quizzes: ${totalQuizzes}`);
    console.log(`   - Quiz Questions: ${totalQuestions}`);
    console.log(`   - Quiz Attempts: ${totalQuizAttempts}`);
    console.log(`   - Learning Rewards: ${totalLearningRewards}`);
    console.log(`   - Achievements: ${totalAchievements}`);
    console.log(`   - Notifications: ${totalNotifications}`);
}

main()
    .catch((e) => {
        console.error('❌ Error seeding database:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
