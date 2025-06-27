import React, {useEffect} from 'react'
import {Link, type LoaderFunctionArgs} from "react-router";
import {ButtonComponent} from "@syncfusion/ej2-react-buttons";
import confetti from "canvas-confetti";
import {LEFT_CONFETTI, RIGHT_CONFETTI} from "~/constants";

// Define types inline
namespace Route {
    export interface LoaderData {
        tripId?: string;
    }

    export interface ComponentProps {
        loaderData: LoaderData;
    }
}

export async function loader ({ params }: LoaderFunctionArgs) {
    return {
        tripId: params.tripId
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
                        Your trip booking simulation is complete. In a real scenario, you'd now have access to your travel itinerary and booking details. Get ready to explore & make memories! ✨
                    </p>
                    
                    <Link to={`/travel/${loaderData?.tripId}`} className="w-full">
                        <ButtonComponent className="button-class !h-11 !w-full">
                            <img
                                src="/assets/icons/itinerary-button.svg"
                                className="size-5"
                            />

                            <span className="p-16-semibold text-white">View trip details</span>
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