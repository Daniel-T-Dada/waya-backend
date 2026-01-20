import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

console.log(`[SYS] Email initialized with host: ${process.env.SMTP_HOST || 'default (localhost)'}`);

export async function sendEmail(to: string, subject: string, text: string) {
    if (process.env.RETURN_EMAIL_OTP === 'true') {
        console.log(`[DEV MODE] Email to ${to}: ${text}`);
    }

    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.warn('Email credentials not found. Skipping email sending.');
        return;
    }

    try {
        await transporter.sendMail({
            from: process.env.EMAIL_FROM || process.env.SMTP_USER,
            to,
            subject,
            text
        });
        console.log(`Email sent to ${to}`);
    } catch (error) {
        console.error('Error sending email:', error);
        // Don't throw in dev mode if credits fail, just log
        if (process.env.NODE_ENV === 'production') {
            throw new Error('Failed to send email');
        }
    }
}
