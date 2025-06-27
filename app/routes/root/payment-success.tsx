import React, {useEffect} from 'react'
import {Link, type LoaderFunctionArgs} from "react-router";
import {ButtonComponent} from "@syncfusion/ej2-react-buttons";
import confetti from "canvas-confetti";
import {LEFT_CONFETTI, RIGHT_CONFETTI} from "~/constants";
import { confirmBookingAndSendEmail } from "~/lib/booking";

// Define types inline
namespace Route {
    export interface LoaderData {
        bookingId?: string;
        sessionId?: string;
    }

    export interface ComponentProps {
        loaderData: LoaderData;
    }
}

export async function loader ({ request }: LoaderFunctionArgs) {
    const url = new URL(request.url);
    const bookingId = url.searchParams.get('bookingId');
    const sessionId = url.searchParams.get('session_id');
    
    // If we have a session_id, update the booking status to confirmed
    if (sessionId && bookingId) {
        try {
            await confirmBookingAndSendEmail(bookingId, sessionId);
            console.log('✅ Booking confirmed and email sent successfully');
        } catch (error) {
            console.error('Error confirming booking:', error);
        }
    }
    
    return {
        bookingId,
        sessionId
    };
}

const PaymentSuccess = ({ loaderData }: Route.ComponentProps) => {
    useEffect(() => {
        confetti(LEFT_CONFETTI)
        confetti(RIGHT_CONFETTI)
    }, [])

    return (
        <main className="payment-success wrapper">
            <section>
                <article>
                    <img src="/assets/icons/check.svg" className="size-24" />
                    <h1>🧪 Demo Payment Successful!</h1>

                    <p>
                        <strong>This was a test payment - no real money was charged!</strong><br/><br/>
                        Your trip booking is confirmed! Your ticket has been generated and will be sent to your email. Get ready to explore & make memories! ✨
                    </p>
                    
                    <Link to={`/ticket/${loaderData?.bookingId}`} className="w-full">
                        <ButtonComponent className="button-class !h-11 !w-full">
                            <img
                                src="/assets/icons/itinerary-button.svg"
                                className="size-5"
                            />

                            <span className="p-16-semibold text-white">View Ticket</span>
                        </ButtonComponent>
                    </Link>
                    <Link to={'/'} className="w-full">
                        <ButtonComponent className="button-class-secondary !h-11 !w-full">
                            <img
                                src="/assets/icons/arrow-left.svg"
                                className="size-5"
                            />

                            <span className="p-16-semibold">Return to homepage</span>
                        </ButtonComponent>
                    </Link>
                </article>
            </section>
        </main>
    )
}
export default PaymentSuccess