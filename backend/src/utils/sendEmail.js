// backend/src/utils/sendEmail.js
import nodemailer from 'nodemailer';

let transporter = null;
let warnedOnce = false;

const PLACEHOLDER_MARKERS = ['your_email', 'your_app_password', 'your_email@gmail.com', 'your_app_password_here'];
const looksLikePlaceholder = (v) => !v || PLACEHOLDER_MARKERS.some(p => v.includes(p));

const isConfigured = () => (
    !!(process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS)
    && !looksLikePlaceholder(process.env.EMAIL_USER)
    && !looksLikePlaceholder(process.env.EMAIL_PASS)
);

const getTransporter = () => {
    if (transporter) return transporter;
    transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: Number(process.env.EMAIL_PORT) || 587,
        secure: Number(process.env.EMAIL_PORT) === 465,
        auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });
    return transporter;
};

/**
 * Sends an email if SMTP is configured; otherwise logs it to the console
 * so local development keeps working without any setup. Never throws —
 * a failed email should never break the request that triggered it.
 */
export const sendEmail = async ({ to, subject, html, text }) => {
    if (!isConfigured()) {
        if (!warnedOnce) {
            console.warn('⚠️  EMAIL_HOST/EMAIL_USER/EMAIL_PASS not set — emails will be logged, not sent. See backend/.env');
            warnedOnce = true;
        }
        console.log(`📧 [dev email] To: ${to} | Subject: ${subject}\n${text || html}`);
        return { sent: false, dev: true };
    }

    try {
        await getTransporter().sendMail({
            from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
            to, subject, html, text,
        });
        return { sent: true };
    } catch (error) {
        console.error('sendEmail error:', error.message);
        return { sent: false, error: error.message };
    }
};

export default sendEmail;
