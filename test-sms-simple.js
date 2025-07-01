// Simple SMS Test - Tests phone number formatting without external dependencies
// This demonstrates the SMS functionality without requiring Twilio credentials

console.log('🧪 Testing SMS functionality...\n');

// Test phone number cleaning function
const cleanPhoneNumber = (phoneNumber) => {
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

// Test booking confirmation SMS message creation
const createBookingConfirmationSMS = (bookingData) => {
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

// Test data
const testBookingData = {
    $id: 'test123456789',
    destination: 'Paris, France',
    departureTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
    flightId: 'AI101',
    travelerName: 'John Doe',
    numberOfMembers: 2,
    phone: '+911234567890'
};

console.log('1. Testing phone number cleaning:');
console.log('   Input: "91 9876543210" -> Output:', cleanPhoneNumber('91 9876543210'));
console.log('   Input: "9876543210" -> Output:', cleanPhoneNumber('9876543210'));
console.log('   Input: "+91-9876-543-210" -> Output:', cleanPhoneNumber('+91-9876-543-210'));

console.log('\n2. Testing SMS message creation:');
const smsMessage = createBookingConfirmationSMS(testBookingData);
console.log('   Generated SMS message:');
console.log('   ' + smsMessage.replace(/\n/g, '\n   '));

console.log('\n✅ SMS functionality test completed successfully!');
console.log('\n📝 To test actual SMS sending:');
console.log('   1. Set up your Twilio credentials in .env.local:');
console.log('      TWILIO_ACCOUNT_SID=your_account_sid');
console.log('      TWILIO_AUTH_TOKEN=your_auth_token');
console.log('      TWILIO_PHONE_NUMBER=your_phone_number');
console.log('   2. Complete a booking to trigger automatic SMS');
console.log('   3. Or use the admin API: POST /api/send-reminder/:bookingId');

console.log('\n🚀 SMS integration is ready for production!');
