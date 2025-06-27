// Test Email Configuration
// Run this with: node test-email.js

import { config } from 'dotenv';
import nodemailer from 'nodemailer';

config({ path: '.env.local' });

const testEmail = async () => {
    try {
        console.log('📧 Testing email configuration...');
        
        // Check if environment variables are set
        const requiredVars = ['EMAIL_HOST', 'EMAIL_USER', 'EMAIL_PASS'];
        const missingVars = requiredVars.filter(varName => !process.env[varName]);
        
        if (missingVars.length > 0) {
            console.error('❌ Missing email configuration:', missingVars.join(', '));
            console.log('Please update your .env.local file with real email credentials');
            return;
        }
        
        // Create transporter
        const transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: parseInt(process.env.EMAIL_PORT || '587'),
            secure: false,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });
        
        // Verify connection
        await transporter.verify();
        console.log('✅ Email server connection successful!');
        
        // Send test email
        const testResult = await transporter.sendMail({
            from: process.env.EMAIL_FROM || '"Tourvisto Test" <noreply@tourvisto.com>',
            to: process.env.EMAIL_USER, // Send to yourself for testing
            subject: '🎉 Tourvisto Email Test - Success!',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px;">
                        <h1>🎉 Email System Working!</h1>
                        <p>Your Tourvisto travel app email notifications are ready to go!</p>
                    </div>
                    <div style="padding: 20px; border: 1px solid #e5e7eb; margin-top: 20px; border-radius: 8px;">
                        <h3>✅ Configuration Test Results:</h3>
                        <ul>
                            <li><strong>SMTP Host:</strong> ${process.env.EMAIL_HOST}</li>
                            <li><strong>Port:</strong> ${process.env.EMAIL_PORT}</li>
                            <li><strong>Email User:</strong> ${process.env.EMAIL_USER}</li>
                            <li><strong>From Address:</strong> ${process.env.EMAIL_FROM}</li>
                        </ul>
                        <p style="color: #2563eb; font-weight: bold;">
                            🚀 Your travel booking email notifications are now ready!
                        </p>
                    </div>
                </div>
            `,
            text: 'Tourvisto Email Test - Success! Your email notifications are configured correctly.'
        });
        
        console.log('✅ Test email sent successfully!');
        console.log('📧 Message ID:', testResult.messageId);
        console.log('📥 Check your inbox at:', process.env.EMAIL_USER);
        
    } catch (error) {
        console.error('❌ Email test failed:', error.message);
        
        if (error.code === 'EAUTH') {
            console.log('\n💡 Authentication failed. Please check:');
            console.log('   1. Your Gmail address is correct');
            console.log('   2. You\'re using an App Password (not your regular Gmail password)');
            console.log('   3. 2-Factor Authentication is enabled on your Gmail account');
        }
    }
};

testEmail();
