// Simple test to validate Twilio credentials
// Run this with: node twilio-test.mjs

import twilio from 'twilio';

// Your credentials from .env.local
const accountSid = 'ACdbe6e47c380bc153d7e468d734922483';
const authToken = '78856812aaad89624b51b9f6033e3488';
const fromNumber = '+917021623887';

console.log('🧪 Testing Twilio Configuration...\n');

// Test 1: Check credential format
console.log('1. Checking credential format:');
console.log('   Account SID format:', accountSid.startsWith('AC') && accountSid.length === 34 ? '✅ Valid' : '❌ Invalid');
console.log('   Auth Token length:', authToken.length === 32 ? '✅ Valid (32 chars)' : `❌ Invalid (${authToken.length} chars)`);
console.log('   Phone number format:', fromNumber.startsWith('+') ? '✅ Valid' : '❌ Invalid');

// Test 2: Initialize Twilio client
console.log('\n2. Initializing Twilio client...');
try {
    const client = twilio(accountSid, authToken);
    console.log('   ✅ Twilio client initialized successfully');
    
    // Test 3: Validate account (this will make a real API call)
    console.log('\n3. Validating account with Twilio...');
    
    const account = await client.api.accounts(accountSid).fetch();
    console.log('   ✅ Account validation successful!');
    console.log('   📊 Account Status:', account.status);
    console.log('   📞 Account Type:', account.type);
    
    // Test 4: List phone numbers
    console.log('\n4. Checking phone numbers...');
    const phoneNumbers = await client.incomingPhoneNumbers.list({ limit: 5 });
    console.log('   📱 Available phone numbers:', phoneNumbers.length);
    
    if (phoneNumbers.length > 0) {
        console.log('   📞 Your numbers:');
        phoneNumbers.forEach((number, index) => {
            console.log(`      ${index + 1}. ${number.phoneNumber} (${number.capabilities.sms ? 'SMS enabled' : 'SMS disabled'})`);
        });
    }
    
    console.log('\n✅ All tests passed! Your Twilio setup is working correctly.');
    console.log('📝 You can now test SMS by booking a ticket in your app.');
    
} catch (error) {
    console.error('\n❌ Twilio test failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    
    if (error.code === 20003) {
        console.log('   • Check your Account SID and Auth Token');
        console.log('   • Make sure they are copied correctly from Twilio Console');
    } else if (error.message.includes('account')) {
        console.log('   • Verify your Twilio account is activated');
        console.log('   • Check if you have sufficient balance');
    } else {
        console.log('   • Check your internet connection');
        console.log('   • Verify Twilio Console for any account issues');
    }
}

console.log('\n🚀 Test completed!');
