// Test SMS functionality for booking notifications
// This file can be used to test SMS integration manually

import { sendSMS, createBookingConfirmationSMS, cleanPhoneNumber } from './app/lib/sms.js';

// Test data - replace with actual booking data for testing
const testBookingData = {
    $id: 'test123456789',
    destination: 'Paris, France',
    departureTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
    flightId: 'AI101',
    travelerName: 'John Doe',
    numberOfMembers: 2,
    phone: '+911234567890' // Replace with your test phone number
};

async function testSMS() {
    try {
        console.log('🧪 Testing SMS functionality...\n');

        // Test phone number cleaning
        console.log('1. Testing phone number cleaning:');
        console.log('   Input: "91 9876543210" -> Output:', cleanPhoneNumber('91 9876543210'));
        console.log('   Input: "9876543210" -> Output:', cleanPhoneNumber('9876543210'));
        console.log('   Input: "+91-9876-543-210" -> Output:', cleanPhoneNumber('+91-9876-543-210'));
        
        // Test SMS message creation
        console.log('\n2. Testing SMS message creation:');
        const smsMessage = createBookingConfirmationSMS(testBookingData);
        console.log('   Generated SMS message:');
        console.log('   ' + smsMessage.replace(/\n/g, '\n   '));

        // Test actual SMS sending (uncomment when ready to test)
        /*
        console.log('\n3. Testing actual SMS sending:');
        const result = await sendSMS({
            to: testBookingData.phone,
            message: smsMessage
        });
        console.log('   SMS sent successfully:', result);
        */

        console.log('\n✅ SMS functionality test completed successfully!');
        console.log('\n📝 To test actual SMS sending:');
        console.log('   1. Set up your Twilio credentials in .env.local');
        console.log('   2. Replace the test phone number with your actual number');
        console.log('   3. Uncomment the SMS sending test above');
        console.log('   4. Run: node test-sms.js');

    } catch (error) {
        console.error('❌ SMS test failed:', error.message);
        console.log('\n🔧 Troubleshooting:');
        console.log('   1. Check if Twilio credentials are set in .env.local');
        console.log('   2. Ensure phone number is in correct format (+countrycode)');
        console.log('   3. Verify Twilio account has sufficient balance');
        console.log('   4. Check if the destination number is verified (for trial accounts)');
    }
}

// Run the test
testSMS();
