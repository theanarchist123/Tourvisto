import {Link, type LoaderFunctionArgs, useNavigate} from "react-router";
import {getPublicTrips, getPublicTripById} from "~/appwrite/public-trips";
import {cn, getFirstWord, parseTripData} from "~/lib/utils";
import {Header, InfoPill, TripCard} from "../../../components";
import {ButtonComponent, ChipDirective, ChipListComponent, ChipsDirective} from "@syncfusion/ej2-react-buttons";
import {useState} from "react";

// Define types inline
namespace Route {
    export interface LoaderData {
        trip?: any;
        allTrips: any[];
    }

    export interface ComponentProps {
        loaderData: LoaderData;
    }
}

export const loader = async ({ params }: LoaderFunctionArgs) => {
    const { tripId } = params;
    if(!tripId) throw new Error ('Trip ID is required');

    const [trip, trips] = await Promise.all([
        getPublicTripById(tripId),
        getPublicTrips(4, 0)
    ]);

    return {
        trip,
        allTrips: trips.allTrips.map(({ $id, tripDetail, imageUrls }) => ({
            id: $id,
            ...parseTripData(tripDetail),
            imageUrls: imageUrls ?? []
        }))
    }
}

const TravelDetail = ({ loaderData }: Route.ComponentProps) => {
    const navigate = useNavigate();
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);
    
    const imageUrls = loaderData?.trip?.imageUrls || [];
    const tripData = parseTripData(loaderData?.trip?.tripDetail);
    const tripId = loaderData?.trip?.$id;

    const {
        name, duration, itinerary, travelStyle,
        groupType, budget, interests, estimatedPrice,
        description, bestTimeToVisit, weatherInfo, country
    } = tripData || {};
    const allTrips = loaderData.allTrips as Trip[] | [];

    const handlePayment = async () => {
        if (!tripId) {
            alert('Trip ID not found');
            return;
        }

        setIsProcessingPayment(true);
        
        try {
            const response = await fetch('/api/create-payment', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ tripId }),
            });

            const data = await response.json();

            if (response.ok && data.url) {
                // Show test mode message before redirecting
                if (data.testMode) {
                    const proceed = confirm(
                        `🧪 TEST MODE PAYMENT\n\n` +
                        `This is a demo payment using Stripe's test mode.\n` +
                        `No real money will be charged!\n\n` +
                        `Use test card: 4242 4242 4242 4242\n` +
                        `Any future date, any CVC\n\n` +
                        `Click OK to proceed to test checkout.`
                    );
                    
                    if (!proceed) {
                        setIsProcessingPayment(false);
                        return;
                    }
                }
                
                // Redirect to Stripe Checkout
                window.location.href = data.url;
            } else {
                alert(`Payment processing failed: ${data.error || 'Unknown error'}\n\n${data.message || ''}`);
            }
        } catch (error) {
            console.error('Payment error:', error);
            alert('Payment processing failed. This is just a demo - no real payment required!');
        } finally {
            setIsProcessingPayment(false);
        }
    };

    const pillItems = [
        { text: travelStyle, bg: '!bg-pink-50 !text-pink-500' },
        { text: groupType, bg: '!bg-primary-50 !text-primary-500' },
        { text: budget, bg: '!bg-success-50 !text-success-700' },
        { text: interests, bg: '!bg-navy-50 !text-navy-500' },
    ]

    const visitTimeAndWeatherInfo = [
        { title: 'Best Time to Visit:', items: bestTimeToVisit},
        { title: 'Weather:', items: weatherInfo}
    ]

    return (
        <main className="travel-detail pt-40 wrapper">
            <div className="travel-div">
                <Link to="/" className="back-link">
                    <img src="/assets/icons/arrow-left.svg" alt="back icon" />
                    <span>Go back</span>
                </Link>


            <section className="container wrapper-md">
                <header>
                    <h1 className="p-40-semibold text-dark-100">{name}</h1>
                    <div className="flex items-center gap-5">
                        <InfoPill
                            text={`${duration} day plan`}
                            image="/assets/icons/calendar.svg"
                        />

                        <InfoPill
                            text={itinerary?.slice(0,4)
                                .map((item) => item.location).join(', ') || ''}
                            image="/assets/icons/location-mark.svg"
                        />
                    </div>
                </header>

                <section className="gallery">
                    {imageUrls.map((url: string, i: number) => (
                        <img
                            src={url}
                            key={i}
                            className={cn('w-full rounded-xl object-cover', i === 0
                                ? 'md:col-span-2 md:row-span-2 h-[330px]'
                                : 'md:row-span-1 h-[150px]')}
                        />
                    ))}
                </section>

                <section className="flex gap-3 md:gap-5 items-center flex-wrap">
                    <ChipListComponent id="travel-chip">
                        <ChipsDirective>
                            {pillItems.map((pill, i) => (
                                <ChipDirective
                                    key={i}
                                    text={getFirstWord(pill.text)}
                                    cssClass={`${pill.bg} !text-base !font-medium !px-4`}
                                />
                            ))}
                        </ChipsDirective>
                    </ChipListComponent>

                    <ul className="flex gap-1 items-center">
                        {Array(5).fill('null').map((_, index) => (
                            <li key={index}>
                                <img
                                    src="/assets/icons/star.svg"
                                    alt="star"
                                    className="size-[18px]"
                                />
                            </li>
                        ))}

                        <li className="ml-1">
                            <ChipListComponent>
                                <ChipsDirective>
                                    <ChipDirective
                                        text="4.9/5"
                                        cssClass="!bg-yellow-50 !text-yellow-700"
                                    />
                                </ChipsDirective>
                            </ChipListComponent>
                        </li>
                    </ul>
                </section>

                <section className="title">
                    <article>
                        <h3>
                            {duration}-Day {country} {travelStyle} Trip
                        </h3>
                        <p>{budget}, {groupType} and {interests}</p>
                    </article>

                    <h2>{estimatedPrice}</h2>
                </section>

                <p className="text-sm md:text-lg font-normal text-dark-400">{description}</p>

                <ul className="itinerary">
                    {itinerary?.map((dayPlan: DayPlan, index: number) => (
                        <li key={index}>
                            <h3>
                                Day {dayPlan.day}: {dayPlan.location}
                            </h3>

                            <ul>
                                {dayPlan.activities.map((activity, index: number) => (
                                    <li key={index}>
                                        <span className="flex-shring-0 p-18-semibold">{activity.time}</span>
                                        <p className="flex-grow">{activity.description}</p>
                                    </li>
                                ))}
                            </ul>
                        </li>
                    ))}
                </ul>

                {visitTimeAndWeatherInfo.map((section) => (
                    <section key={section.title} className="visit">
                        <div>
                            <h3>{section.title}</h3>

                            <ul>
                                {section.items?.map((item) => (
                                    <li key={item}>
                                        <p className="flex-grow">{item}</p>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </section>
                ))}

                <div className="flex">
                    <ButtonComponent 
                        className="button-class" 
                        onClick={handlePayment}
                        disabled={isProcessingPayment}
                    >
                        <span className="p-16-semibold text-white">
                            {isProcessingPayment ? 'Processing...' : '🧪 Demo Payment (Test Mode)'}
                        </span>
                        <span className="price-pill">{estimatedPrice}</span>
                    </ButtonComponent>
                </div>

            </section>
            </div>

            <section className="flex flex-col gap-6">
                <h2 className="p-24-semibold text-dark-100">Popular Trips</h2>

                <div className="trip-grid">
                    {allTrips.map((trip) => (
                        <TripCard
                            key={trip.id}
                            id={trip.id}
                            name={trip.name}
                            imageUrl={trip.imageUrls[0]}
                            location={trip.itinerary?.[0]?.location ?? ""}
                            tags={[trip.interests, trip.travelStyle]}
                            price={trip.estimatedPrice}
                        />
                    ))}
                </div>
            </section>
        </main>
    )
}
export default TravelDetail