import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function viewAccounts() {
    try {
        console.log('🔍 Fetching Account records...\n');

        const accounts = await prisma.account.findMany({
            include: {
                user: {
                    select: {
                        email: true,
                        name: true,
                        role: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        if (accounts.length === 0) {
            console.log('ℹ️  No accounts found in database.\n');
            return;
        }

        console.log(`📊 Found ${accounts.length} account(s):\n`);
        console.log('='.repeat(80));

        accounts.forEach((account, index) => {
            console.log(`\n🔑 Account ${index + 1}`);
            console.log('-'.repeat(80));
            console.log(`ID:                ${account.id}`);
            console.log(`Account ID:        ${account.accountId}`);
            console.log(`Provider:          ${account.providerId}`);
            console.log(`User:              ${account.user.name} (${account.user.email})`);
            console.log(`Role:              ${account.user.role}`);
            console.log(`Auth Type:         ${account.password ? '🔐 Credential-based' : '🌐 OAuth (Google/Facebook)'}`);
            console.log(`Has Access Token:  ${account.accessToken ? '✅ Yes' : '❌ No'}`);
            console.log(`Has Refresh Token: ${account.refreshToken ? '✅ Yes' : '❌ No'}`);
            console.log(`Has ID Token:      ${account.idToken ? '✅ Yes' : '❌ No'}`);
            console.log(`Scope:             ${account.scope || 'N/A'}`);
            console.log(`Created:           ${account.createdAt.toLocaleString()}`);
            console.log(`Updated:           ${account.updatedAt.toLocaleString()}`);

            if (account.accessTokenExpiresAt) {
                const isExpired = account.accessTokenExpiresAt < new Date();
                console.log(`Access Expires:    ${account.accessTokenExpiresAt.toLocaleString()} ${isExpired ? '⚠️ EXPIRED' : '✅ Valid'}`);
            }

            if (account.refreshTokenExpiresAt) {
                const isExpired = account.refreshTokenExpiresAt < new Date();
                console.log(`Refresh Expires:   ${account.refreshTokenExpiresAt.toLocaleString()} ${isExpired ? '⚠️ EXPIRED' : '✅ Valid'}`);
            }
        });

        console.log('\n' + '='.repeat(80));

        // Summary statistics
        const credentialAccounts = accounts.filter(a => a.password !== null).length;
        const oauthAccounts = accounts.filter(a => a.password === null).length;

        console.log('\n📈 Summary:');
        console.log(`   Total Accounts:       ${accounts.length}`);
        console.log(`   Credential-based:     ${credentialAccounts}`);
        console.log(`   OAuth-based:          ${oauthAccounts}`);
        console.log('');

    } catch (error) {
        console.error('❌ Error fetching accounts:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Run the script
viewAccounts()
    .then(() => {
        console.log('✅ Script completed successfully\n');
        process.exit(0);
    })
    .catch((error) => {
        console.error('💥 Script failed:', error);
        process.exit(1);
    });
