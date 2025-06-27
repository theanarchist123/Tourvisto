import { type ActionFunctionArgs } from "react-router";
import { stripe } from "~/lib/stripe";
import { getPublicTripById } from "~/appwrite/public-trips";
import { parseTripData } from "~/lib/utils";

export const action = async ({ request }: ActionFunctionArgs) => {
    try {
        console.log('Creating payment - checking Stripe initialization...');
        
        // Check if stripe is properly initialized
        if (!stripe) {
            throw new Error('Stripe is not properly initialized');
        }

        const { tripId } = await request.json();
        
        if (!tripId) {
            return new Response(JSON.stringify({ error: "Trip ID is required" }), {
                status: 400,
                headers: { "Content-Type": "application/json" }
            });
        }

        console.log('Fetching trip details for ID:', tripId);

        // Get trip details from database
        const trip = await getPublicTripById(tripId);
        if (!trip) {
            return new Response(JSON.stringify({ error: "Trip not found" }), {
                status: 404,
                headers: { "Content-Type": "application/json" }
            });
        }

        const tripData = parseTripData(trip.tripDetail);
        if (!tripData) {
            return new Response(JSON.stringify({ error: "Invalid trip data" }), {
                status: 400,
                headers: { "Content-Type": "application/json" }
            });
        }

        console.log('Creating Stripe checkout session...');

        // Parse price and convert to cents (minimum $1 for Stripe)
        let priceString = tripData.estimatedPrice?.replace(/[^0-9.]/g, '') || '1';
        let priceAmount = Math.max(Math.round(parseFloat(priceString) * 100), 100); // Minimum $1

        // Create Stripe Checkout Session with inline price data (simpler and more test-friendly)
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: `🏖️ ${tripData.name || 'Amazing Travel Package'}`,
                            description: `${tripData.description || 'A wonderful travel experience'} \n\n⚠️ TEST MODE - No real payment will be charged!`,
                            images: trip.imageUrls?.slice(0, 3) || [],
                        },
                        unit_amount: priceAmount,
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `${process.env.VITE_BASE_URL?.replace(/\/$/, '')}/travel/${tripId}/success`,
            cancel_url: `${process.env.VITE_BASE_URL?.replace(/\/$/, '')}/travel/${tripId}`,
            metadata: {
                tripId: tripId,
                testMode: 'true'
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
