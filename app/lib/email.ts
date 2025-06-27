import nodemailer from 'nodemailer';

// Email configuration
const emailConfig = {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
};

// Create reusable transporter
let transporter: nodemailer.Transporter | null = null;

const createTransporter = () => {
    if (!transporter) {
        transporter = nodemailer.createTransport(emailConfig);
    }
    return transporter;
};

// Email sending function
export const sendEmail = async ({
    to,
    subject,
    html,
    text
}: {
    to: string;
    subject: string;
    html?: string;
    text?: string;
}) => {
    try {
        const emailTransporter = createTransporter();
        
        // Verify transporter configuration
        await emailTransporter.verify();
        console.log('Email server is ready to send messages');
        
        const mailOptions = {
            from: process.env.EMAIL_FROM || '"Tourvisto" <noreply@tourvisto.com>',
            to: to,
            subject: subject,
            text: text,
            html: html
        };
        
        const result = await emailTransporter.sendMail(mailOptions);
        console.log('Email sent successfully:', result.messageId);
        
        return {
            success: true,
            messageId: result.messageId,
            recipient: to
        };
        
    } catch (error: any) {
        console.error('Error sending email:', error);
        throw new Error(`Failed to send email: ${error.message}`);
    }
};

// Function to validate email configuration
export const validateEmailConfig = () => {
    const requiredEnvVars = ['EMAIL_HOST', 'EMAIL_USER', 'EMAIL_PASS'];
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
        throw new Error(`Missing email configuration: ${missingVars.join(', ')}`);
    }
    
    return true;
};
