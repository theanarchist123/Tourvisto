import { type ActionFunctionArgs } from "react-router";
import { stripe } from "~/lib/stripe";
import { database } from "~/appwrite/client";

// USD to INR conversion rate (approximate - in real app, fetch from live API)
const USD_TO_INR_RATE = 83.50; // Current approximate rate

const convertUSDToINR = (usdAmount: number): number => {
    return Math.round(usdAmount * USD_TO_INR_RATE);
};

export const action = async ({ request }: ActionFunctionArgs) => {
    if (request.method !== 'POST') {
        return new Response('Method not allowed', { status: 405 });
    }

    try {
        
        // Check if stripe is properly initialized
        if (!stripe) {
            throw new Error('Stripe is not properly initialized');
        }

        const { bookingId, amount, currency = 'inr', description, metadata = {} } = await request.json();
        
        if (!bookingId || !amount) {
            return new Response(JSON.stringify({ error: "Booking ID and amount are required" }), {
                status: 400,
                headers: { "Content-Type": "application/json" }
            });
        }

        // Get booking details from database
        const booking = await database.getDocument(
            import.meta.env.VITE_APPWRITE_DATABASE_ID!,
            import.meta.env.VITE_APPWRITE_BOOKINGS_COLLECTION_ID!,
            bookingId
        );

        if (!booking) {
            return new Response(JSON.stringify({ error: "Booking not found" }), {
                status: 404,
                headers: { "Content-Type": "application/json" }
            });
        }

        // Convert USD to INR if currency is INR
        let finalAmount = amount;
        let displayCurrency = currency;
        
        if (currency.toLowerCase() === 'inr') {
            finalAmount = convertUSDToINR(amount);
            console.log('Converted amount (INR):', finalAmount);
        }

        const baseUrl = import.meta.env.VITE_BASE_URL?.replace(/\/$/, '') || 'http://localhost:5174';
        const successUrl = `${baseUrl}/payment-success?bookingId=${bookingId}&session_id={CHECKOUT_SESSION_ID}`;
        const cancelUrl = `${baseUrl}/payment/${bookingId}`;

        // Convert amount to paise for INR or cents for USD (minimum ₹1 or $1)
        const priceAmount = Math.max(Math.round(finalAmount * 100), 100);

        // Create Stripe Checkout Session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: displayCurrency.toLowerCase(),
                        product_data: {
                            name: `✈️ Trip to ${booking.destination}`,
                            description: `${description || `Trip booking for ${booking.numberOfMembers} member(s)`}${currency.toLowerCase() === 'inr' ? `\n\n💱 Converted from $${amount} USD to ₹${finalAmount} INR (Rate: 1 USD = ₹${USD_TO_INR_RATE})` : ''} \n\n⚠️ TEST MODE - No real payment will be charged!`,
                        },
                        unit_amount: priceAmount,
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: successUrl,
            cancel_url: cancelUrl,
            metadata: {
                bookingId: bookingId,
                travelerName: booking.travelerName,
                email: booking.email,
                testMode: 'true',
                ...metadata
            },
        });

        return new Response(JSON.stringify({ 
            sessionId: session.id, 
            url: session.url,
            testMode: true,
            message: "This is a test payment - no real money will be charged!"
        }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });

    } catch (error: any) {
        console.error("Stripe payment error:", error);
        return new Response(JSON.stringify({ 
            error: "Payment processing failed",
            details: error.message,
            testMode: true,
            message: "This is test mode - no real charges would occur"
        }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
};
