import dotenv from 'dotenv';
dotenv.config();

import { sendEmail } from '../utils/email';

async function test() {
    console.log('Testing email sending...');
    console.log(`Host: ${process.env.SMTP_HOST}`);
    console.log(`Port: ${process.env.SMTP_PORT}`);
    console.log(`User: ${process.env.SMTP_USER}`);

    try {
        await sendEmail(process.env.SMTP_USER || '', 'Test Subject', 'This is a test email from Waya Backend Smoke Test.');
        console.log('Test completed successfully (check logs above).');
    } catch (error) {
        console.error('Test failed:', error);
    }
}

test();
