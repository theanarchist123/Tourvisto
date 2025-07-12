import twilio from 'twilio';

// Twilio configuration
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_PHONE_NUMBER;

// Initialize Twilio client
let twilioClient: twilio.Twilio | null = null;

export const validateSMSConfig = () => {
    if (!accountSid || !authToken || !fromNumber) {
        throw new Error('Missing Twilio configuration. Please set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER in your environment variables.');
    }
    
    // Validate Account SID format
    if (!accountSid.startsWith('AC') || accountSid.length !== 34) {
        throw new Error(`Invalid Twilio Account SID format. Account SID must start with "AC" and be 34 characters long. Current: ${accountSid.substring(0, 10)}...`);
    }
    
    // Validate Auth Token format
    if (authToken.length !== 32) {
        throw new Error(`Invalid Twilio Auth Token format. Auth Token must be 32 characters long. Current length: ${authToken.length}`);
    }
    
    // Validate phone number format
    if (!fromNumber.startsWith('+')) {
        throw new Error(`Invalid Twilio phone number format. Phone number must start with "+". Current: ${fromNumber}`);
    }
};

export const initializeTwilioClient = () => {
    if (!twilioClient) {
        validateSMSConfig();
        twilioClient = twilio(accountSid, authToken);
    }
    return twilioClient;
};

export interface SMSOptions {
    to: string;
    message: string;
}

export const sendSMS = async ({ to, message }: SMSOptions) => {
    try {
        console.log('📱 SMS Configuration Check:');
        console.log('Account SID:', accountSid ? `${accountSid.substring(0, 10)}...` : 'MISSING');
        console.log('Auth Token:', authToken ? `${authToken.substring(0, 10)}...` : 'MISSING');
        console.log('From Number:', fromNumber);
        
        // Check if we're in development and have placeholder credentials
        if (accountSid === 'your-twilio-account-sid' || 
            authToken === 'your-twilio-auth-token' || 
            fromNumber === 'your-twilio-phone-number') {
            
            console.log('📱 SMS DEVELOPMENT MODE - SMS not sent');
            console.log('📞 To:', to);
            console.log('💬 Message:', message);
            console.log('ℹ️  Configure Twilio credentials in .env.local to enable SMS');
            
            return {
                success: true,
                messageId: 'dev-mode-' + Date.now(),
                status: 'development',
                to: cleanPhoneNumber(to)
            };
        }
        
        // Validate configuration
        console.log('🔍 Validating SMS configuration...');
        validateSMSConfig();
        
        const client = initializeTwilioClient();
        
        // Clean and validate phone number
        const cleanedPhone = cleanPhoneNumber(to);
        
        console.log(`📱 Sending SMS to: ${cleanedPhone}`);
        console.log(`📤 From: ${fromNumber}`);
        console.log(`💬 Message preview: ${message.substring(0, 50)}...`);
        
        const messageResponse = await client.messages.create({
            body: message,
            from: fromNumber,
            to: cleanedPhone,
        });

        console.log('✅ SMS sent successfully!');
        console.log('📧 Message SID:', messageResponse.sid);
        console.log('📊 Status:', messageResponse.status);
        
        return {
            success: true,
            messageId: messageResponse.sid,
            status: messageResponse.status,
            to: cleanedPhone
        };

    } catch (error: any) {
        console.error('❌ SMS Error Details:', {
            message: error.message,
            code: error.code,
            moreInfo: error.moreInfo,
            status: error.status
        });
        
        // More specific error messages
        if (error.code === 21608) {
            throw new Error('The phone number is not verified. For trial accounts, verify the number in Twilio Console.');
        } else if (error.code === 21614) {
            throw new Error('Invalid phone number format. Please use E.164 format (e.g., +919876543210).');
        } else if (error.code === 20003) {
            throw new Error('Authentication failed. Please check your Twilio credentials.');
        } else if (error.message.includes('accountSid must start with AC')) {
            throw new Error('Invalid Account SID format. Please check your Twilio Account SID.');
        }
        
        throw new Error(`Failed to send SMS: ${error.message}`);
    }
};

export const cleanPhoneNumber = (phoneNumber: string): string => {
    // Remove all non-numeric characters
    const cleaned = phoneNumber.replace(/\D/g, '');
    
    // If the number starts with 91 (India country code), ensure it has the + prefix
    if (cleaned.startsWith('91') && cleaned.length === 12) {
        return `+${cleaned}`;
    }
    
    // If the number is 10 digits (Indian mobile number), add +91 prefix
    if (cleaned.length === 10) {
        return `+91${cleaned}`;
    }
    
    // If it already has a country code but no +, add it
    if (cleaned.length > 10 && !phoneNumber.startsWith('+')) {
        return `+${cleaned}`;
    }
    
    // Return as is if it already has proper format
    return phoneNumber.startsWith('+') ? phoneNumber : `+${cleaned}`;
};

export const createBookingConfirmationSMS = (bookingData: any): string => {
    const departureDate = new Date(bookingData.departureTime);
    const travelId = `TR${bookingData.$id.slice(-6).toUpperCase()}`;
    
    return `🎫 BOOKING CONFIRMED!

Travel ID: ${travelId}
✈️ ${bookingData.destination}
📅 ${departureDate.toLocaleDateString()} ${departureDate.toLocaleTimeString()}
🛫 ${bookingData.flightId}
👤 ${bookingData.travelerName}
🎟️ ${bookingData.numberOfMembers} seat(s)

✅ Your ticket has been confirmed! Check your email for detailed information.

Need help? Contact support@tourvisto.com

- Tourvisto Team`;
};

export const createBookingReminderSMS = (bookingData: any): string => {
    const departureDate = new Date(bookingData.departureTime);
    const travelId = `TR${bookingData.$id.slice(-6).toUpperCase()}`;
    
    return `⏰ TRAVEL REMINDER

Your flight to ${bookingData.destination} is tomorrow!

Travel ID: ${travelId}
📅 ${departureDate.toLocaleDateString()} ${departureDate.toLocaleTimeString()}
🛫 ${bookingData.flightId}

🚨 Remember:
• Arrive 2 hours early
• Carry valid photo ID
• Complete online check-in

Safe travels! 
- Tourvisto Team`;
};
