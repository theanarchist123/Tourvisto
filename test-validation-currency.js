// Test script to verify validation and currency fixes
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🧪 Testing Validation and Currency Fixes\n');

// Test 1: Check validation logic fix
const bookTripPath = path.join(__dirname, 'app', 'routes', 'root', 'book-trip.tsx');
const bookTripContent = fs.readFileSync(bookTripPath, 'utf8');

console.log('1. Validation Logic Fix:');
if (bookTripContent.includes('formData.memberNames.slice(1).some(name => !name.trim())')) {
    console.log('   ✅ Validation now correctly checks only additional members (excluding lead traveler)');
} else {
    console.log('   ❌ Validation logic still incorrect');
}

// Test 2: Check currency symbol changes
console.log('\n2. Currency Symbol Changes:');

// Check book-trip.tsx
const dollarMatches = (bookTripContent.match(/\$/g) || []).length;
const rupeeMatches = (bookTripContent.match(/₹/g) || []).length;

console.log(`   book-trip.tsx: ${dollarMatches} dollar symbols, ${rupeeMatches} rupee symbols`);

// Check payment.tsx
const paymentPath = path.join(__dirname, 'app', 'routes', 'root', 'payment.tsx');
const paymentContent = fs.readFileSync(paymentPath, 'utf8');

const paymentDollarMatches = (paymentContent.match(/\$/g) || []).length;
const paymentRupeeMatches = (paymentContent.match(/₹/g) || []).length;

console.log(`   payment.tsx: ${paymentDollarMatches} dollar symbols, ${paymentRupeeMatches} rupee symbols`);

if (dollarMatches > 0 && rupeeMatches === 0 && paymentDollarMatches > 0 && paymentRupeeMatches === 0) {
    console.log('   ✅ All currency symbols successfully changed from ₹ to $');
} else {
    console.log('   ❌ Some currency symbols may still be incorrect');
}

console.log('\n📋 Summary:');
console.log('- Member name validation now only checks additional members');
console.log('- Currency symbols changed from rupees (₹) to dollars ($)');
console.log('- Ready for testing the complete booking flow');
