import { type ActionFunctionArgs } from "react-router";
import { stripe } from "~/lib/stripe";
import { database } from "~/appwrite/client";

export const action = async ({ request }: ActionFunctionArgs) => {
    try {
        console.log('Creating payment - checking Stripe initialization...');
        
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

        console.log('Fetching booking details for ID:', bookingId);

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

        console.log('Creating Stripe checkout session...');

        // Convert amount to cents for Stripe (minimum $1 or ₹1)
        const priceAmount = Math.max(Math.round(amount * 100), 100);

        // Create Stripe Checkout Session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: currency.toLowerCase(),
                        product_data: {
                            name: `✈️ Trip to ${booking.destination}`,
                            description: `${description || `Trip booking for ${booking.numberOfMembers} member(s)`} \n\n⚠️ TEST MODE - No real payment will be charged!`,
                        },
                        unit_amount: priceAmount,
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `${import.meta.env.VITE_BASE_URL?.replace(/\/$/, '')}/payment-success?bookingId=${bookingId}&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${import.meta.env.VITE_BASE_URL?.replace(/\/$/, '')}/payment/${bookingId}`,
            metadata: {
                bookingId: bookingId,
                travelerName: booking.travelerName,
                email: booking.email,
                testMode: 'true',
                ...metadata
            },
        });

        console.log('Stripe session created successfully:', session.id);

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
