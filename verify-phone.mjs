// Phone verification helper for Twilio trial accounts
// Run this to automatically verify a phone number: node verify-phone.mjs +919876543210

import twilio from 'twilio';

// Your Twilio credentials
const accountSid = 'ACdbe6e47c380bc153d7e468d734922483';
const authToken = '78856812aaad89624b51b9f6033e3488';

const args = process.argv.slice(2);
const phoneNumber = args[0];

if (!phoneNumber) {
    console.log('❌ Please provide a phone number to verify');
    console.log('Usage: node verify-phone.mjs +919876543210');
    process.exit(1);
}

async function verifyPhone() {
    try {
        console.log('📞 Verifying phone number:', phoneNumber);
        
        const client = twilio(accountSid, authToken);
        
        // Create validation request
        const validation = await client.validationRequests.create({
            phoneNumber: phoneNumber,
        });
        
        console.log('✅ Verification request sent!');
        console.log('📱 Check your phone for a call with the validation code');
        console.log('🔢 Validation Code:', validation.validationCode);
        console.log('📞 Phone Number:', validation.phoneNumber);
        
        console.log('\n🎯 Next Steps:');
        console.log('1. Answer the phone call you should receive shortly');
        console.log('2. The call will ask you to press a key or enter the validation code');
        console.log('3. Once verified, SMS will work for this number!');
        console.log('4. Try booking a ticket in your app again');
        
    } catch (error) {
        console.error('❌ Verification failed:', error.message);
        
        if (error.code === 60200) {
            console.log('✅ Phone number might already be verified!');
            console.log('🎯 Try booking a ticket - SMS should work now');
        } else if (error.code === 21614) {
            console.log('📞 Invalid phone number format. Use E.164 format like +919876543210');
        } else {
            console.log('🔧 Try manual verification:');
            console.log('   1. Go to https://console.twilio.com/');
            console.log('   2. Navigate to Phone Numbers → Manage → Verified Caller IDs');
            console.log('   3. Click "Add a new number"');
            console.log('   4. Enter your phone number and verify via SMS');
        }
    }
}

verifyPhone();
