# 🔧 Twilio SMS Setup - Step by Step Guide

## 📱 Getting Your Twilio Credentials

### Step 1: Create Twilio Account
1. Go to [twilio.com](https://www.twilio.com/)
2. Click "Sign up and start building"
3. Fill in your details and verify your email
4. Verify your phone number

### Step 2: Find Your Credentials
1. After logging in, you'll be on the Twilio Console Dashboard
2. Look for the **"Account Info"** section on the right side
3. You'll see:
   - **Account SID** (starts with "AC" + 32 characters)
   - **Auth Token** (32 characters, click the eye icon to reveal)

**Example format:**
```
Account SID: AC1234567890abcdef1234567890abcdef
Auth Token: 1234567890abcdef1234567890abcdef
```

### Step 3: Get a Phone Number

#### For Trial Account (Free):
1. Go to Console → Phone Numbers → Manage → Buy a number
2. Choose your country (India recommended for your app)
3. Select "SMS" capability
4. Choose a number and complete the purchase (uses trial credit)

#### Example Numbers:
- **US**: +15551234567
- **India**: +919876543210
- **UK**: +447123456789

### Step 4: Update Your .env.local File

Replace the placeholder values with your actual credentials:

```bash
# SMS Configuration (Twilio)
TWILIO_ACCOUNT_SID=AC1234567890abcdef1234567890abcdef
TWILIO_AUTH_TOKEN=1234567890abcdef1234567890abcdef
TWILIO_PHONE_NUMBER=+919876543210
```

## 🚨 Common Issues & Solutions

### Issue 1: "accountSid must start with AC"
**Cause:** Invalid Account SID format
**Solution:** 
- Go to Twilio Console
- Copy the full Account SID (34 characters starting with "AC")
- Paste it exactly as shown

### Issue 2: "The number +91XXXXXXXXXX is unverified"
**Cause:** Trial account can only send to verified numbers
**Solution:**
- Go to Console → Phone Numbers → Manage → Verified Caller IDs
- Add and verify your test phone number
- OR upgrade to a paid account

### Issue 3: "Insufficient funds"
**Cause:** Trial credit exhausted or no payment method
**Solution:**
- Add a payment method in Console → Billing
- Each SMS costs ~$0.0075 for India
- Phone number costs ~$1-2/month

### Issue 4: SMS not received
**Check:**
- Phone number format (+countrycode)
- SMS app / spam folder
- Network connectivity
- Twilio logs in Console → Monitor → Logs

## 🧪 Testing Your Setup

### Method 1: Use the development mode
1. Leave credentials as placeholders in .env.local
2. Complete a booking - you'll see SMS content in console logs
3. No actual SMS sent, but you can verify the flow works

### Method 2: Test with real credentials
1. Add your real Twilio credentials
2. Complete a booking with your verified phone number
3. You should receive an actual SMS

### Method 3: Use the test script
```bash
node test-sms-simple.js
```

## 💰 Pricing Breakdown

### Trial Account (Free):
- **$15-20 credit** included
- Can send ~2000 SMS messages
- Must verify recipient numbers
- Perfect for development/testing

### Paid Account:
- **SMS Cost**: ~$0.0075 per message (India)
- **Phone Number**: $1-2 USD per month
- **Monthly for 1000 bookings**: ~$7.50 + $1 = $8.50 USD
- Can send to any number

## 🔒 Security Best Practices

1. **Never commit credentials** to version control
2. Use **environment variables** only
3. **Rotate tokens** periodically
4. **Monitor usage** in Twilio Console
5. **Set up alerts** for unusual activity

## 📊 Monitoring & Logs

### View SMS Status:
1. Go to Console → Monitor → Logs → Messaging
2. See delivery status for each SMS
3. Check error codes and reasons
4. Set up webhooks for delivery notifications

### Common Status Codes:
- **delivered**: SMS successfully delivered
- **failed**: SMS failed to send
- **undelivered**: SMS sent but not delivered
- **queued**: SMS waiting to be sent

## 🎯 Next Steps After Setup

1. **Test thoroughly** with your phone number
2. **Add error monitoring** in production
3. **Consider SMS templates** for different languages
4. **Set up webhooks** for delivery confirmations
5. **Monitor costs** and usage patterns

## 🆘 Need Help?

- **Twilio Support**: [support.twilio.com](https://support.twilio.com)
- **Documentation**: [twilio.com/docs/sms](https://www.twilio.com/docs/sms)
- **Community Forum**: [twilio.com/community](https://www.twilio.com/community)

Your SMS system is ready to go live once you add the correct credentials! 🚀
