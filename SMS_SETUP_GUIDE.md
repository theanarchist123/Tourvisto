# SMS Notification Setup Guide

This guide will help you set up SMS notifications for booking confirmations using Twilio.

## 📱 Features

- **Booking Confirmation SMS**: Automatic SMS sent when a booking is confirmed
- **Travel Reminders**: Optional SMS reminders for upcoming trips
- **Phone Number Validation**: Automatic formatting for Indian phone numbers
- **Error Handling**: Graceful fallback if SMS fails (booking still confirmed)

## 🚀 Setup Instructions

### 1. Create a Twilio Account

1. Go to [Twilio.com](https://www.twilio.com/) and sign up for a free account
2. Verify your account and phone number
3. Note down your **Account SID** and **Auth Token** from the Console Dashboard

### 2. Get a Phone Number

**For Trial Account:**
- Twilio provides a free trial phone number
- You can only send SMS to verified numbers during trial
- Add test phone numbers in Console → Phone Numbers → Manage → Verified Caller IDs

**For Production:**
- Purchase a phone number from Twilio Console
- Choose a number from your country or region
- Monthly cost: ~$1-2 USD per number

### 3. Configure Environment Variables

Update your `.env.local` file with Twilio credentials:

```bash
# SMS Configuration (Twilio)
TWILIO_ACCOUNT_SID=AC1234567890abcdef1234567890abcdef
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890
```

### 4. Test SMS Functionality

Run the test script to verify everything works:

```bash
node test-sms.js
```

## 📞 Phone Number Format

The system automatically handles Indian phone numbers:

- `9876543210` → `+919876543210`
- `91 9876543210` → `+919876543210` 
- `+91-9876-543-210` → `+919876543210`

For international numbers, use the full format: `+countrycode1234567890`

## 🔧 Troubleshooting

### Common Issues:

1. **"Twilio credentials not found"**
   - Check if `.env.local` has the correct variable names
   - Restart your development server after adding variables

2. **"SMS not received"**
   - For trial accounts, verify the destination number in Twilio Console
   - Check spam/blocked messages on your phone
   - Verify phone number format is correct

3. **"Insufficient permissions"**
   - Trial accounts have sending restrictions
   - Upgrade to paid account for production use

4. **"Invalid phone number"**
   - Ensure number includes country code
   - Remove spaces, dashes, and brackets
   - Use E.164 format: +[country code][phone number]

### Testing Without SMS:

If you want to test the booking flow without SMS:
1. Comment out the SMS validation in `app/lib/booking.ts`
2. The booking will still work, just without SMS notifications

## 💡 Usage in Code

### Send Booking Confirmation SMS:
```typescript
import { sendSMS, createBookingConfirmationSMS } from '~/lib/sms';

const smsMessage = createBookingConfirmationSMS(bookingData);
await sendSMS({
    to: '+919876543210',
    message: smsMessage
});
```

### Send Custom SMS:
```typescript
await sendSMS({
    to: '+919876543210',
    message: 'Your custom message here'
});
```

## 🔄 Integration Points

SMS notifications are automatically sent at these points:

1. **Booking Confirmation** (`/api/confirm-booking`)
   - Triggered after successful payment
   - Includes travel details and booking ID

2. **Manual Reminders** (`/api/send-reminder/:bookingId`)
   - Admin can send travel reminders
   - Includes departure time and check-in instructions

## 💰 Cost Considerations

- **Trial Account**: Free $15-20 credit
- **SMS Cost**: ~$0.0075 per SMS in India
- **Phone Number**: ~$1-2 USD per month
- **For 1000 bookings/month**: ~$7.50 + $1 = $8.50 USD

## 🔒 Security Best Practices

1. Never commit Twilio credentials to version control
2. Use environment variables for all sensitive data
3. Implement rate limiting for SMS endpoints
4. Log SMS attempts for monitoring
5. Consider using Twilio Verify service for production

## 📊 Monitoring

Monitor SMS delivery in Twilio Console:
- Console → Monitor → Logs → Messaging
- Check delivery status and error codes
- Set up webhooks for delivery notifications

## 🎯 Future Enhancements

- **Scheduled Reminders**: Cron job for day-before reminders
- **Multi-language Support**: SMS in user's preferred language
- **Delivery Tracking**: Store SMS delivery status in database
- **SMS Templates**: Admin-configurable message templates
- **Bulk SMS**: Send promotional messages to user segments
