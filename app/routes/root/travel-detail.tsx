import {Link, type LoaderFunctionArgs, useNavigate} from "react-router";
import {getPublicTrips, getPublicTripById} from "~/appwrite/public-trips";
import {getUser} from "~/appwrite/auth";
import {cn, getFirstWord, parseTripData} from "~/lib/utils";
import {Header, InfoPill, TripCard} from "../../../components";
import {ButtonComponent, ChipDirective, ChipListComponent, ChipsDirective} from "@syncfusion/ej2-react-buttons";
import {useState} from "react";

// Define types inline
namespace Route {
    export interface LoaderData {
        trip?: any;
        allTrips: any[];
        user?: any;
    }

    export interface ComponentProps {
        loaderData: LoaderData;
    }
}

export const loader = async ({ params }: LoaderFunctionArgs) => {
    const { tripId } = params;
    if(!tripId) throw new Error ('Trip ID is required');

    const [trip, trips, user] = await Promise.all([
        getPublicTripById(tripId),
        getPublicTrips(4, 0),
        getUser().catch(() => null)
    ]);

    return {
        trip,
        allTrips: trips.allTrips.map(({ $id, tripDetail, imageUrls }) => ({
            id: $id,
            ...parseTripData(tripDetail),
            imageUrls: imageUrls ?? []
        })),
        user
    }
}

const TravelDetail = ({ loaderData }: Route.ComponentProps) => {
    const navigate = useNavigate();
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);
    
    const imageUrls = loaderData?.trip?.imageUrls || [];
    const tripData = parseTripData(loaderData?.trip?.tripDetail);
    const tripId = loaderData?.trip?.$id;
    const currentUser = loaderData?.user;
    
    const isOwner = currentUser?.$id && loaderData?.trip?.userId === currentUser?.$id;

    const [itinerary, setItinerary] = useState(tripData?.itinerary || []);
    const [editingActivity, setEditingActivity] = useState<string | null>(null);
    const [isRegenerating, setIsRegenerating] = useState<string | null>(null);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const {
        name, duration, travelStyle,
        groupType, budget, interests, estimatedPrice,
        description, bestTimeToVisit, weatherInfo, country
    } = tripData || {};
    const allTrips = loaderData.allTrips as Trip[] | [];

    if (!tripData) {
        return (
            <main className="travel-detail pt-40 wrapper text-center min-h-screen">
                <h1 className="p-40-semibold text-dark-100">Trip not found</h1>
                <Link to="/" className="text-primary mt-4 inline-block">Go back to home</Link>
            </main>
        )
    }

    const handleBookNow = () => {
        if (!tripId) {
            alert('Trip ID not found');
            return;
        }
        navigate(`/book-trip/${tripId}`);
    };

    const handleRegenerate = async (dayIndex: number, actIndex: number, tone: string) => {
        const dayPlan = itinerary[dayIndex];
        const activity = dayPlan.activities[actIndex];
        const key = `${dayIndex}-${actIndex}`;
        setIsRegenerating(key);
        
        try {
            const res = await fetch('/api/regenerate-activity', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    currentActivity: activity,
                    location: dayPlan.location,
                    tone
                })
            });
            const data = await res.json();
            if (data.activity) {
                const newItinerary = [...itinerary];
                newItinerary[dayIndex].activities[actIndex] = data.activity;
                setItinerary(newItinerary);
                setHasUnsavedChanges(true);
            }
        } catch (e) {
            console.error(e);
            alert("Failed to regenerate activity");
        } finally {
            setIsRegenerating(null);
            setEditingActivity(null);
        }
    };

    const handleSaveTrip = async () => {
        setIsSaving(true);
        try {
            const updatedTripDetail = { ...tripData, itinerary };
            const res = await fetch('/api/update-trip', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tripId, tripDetail: updatedTripDetail })
            });
            if (res.ok) {
                setHasUnsavedChanges(false);
            } else {
                alert("Failed to save changes");
            }
        } catch(e) {
            console.error(e);
        } finally {
            setIsSaving(false);
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
                    {itinerary?.map((dayPlan: any, dIndex: number) => (
                        <li key={dIndex}>
                            <h3>
                                Day {dayPlan.day}: {dayPlan.location}
                            </h3>

                            <ul className="flex flex-col gap-4 mt-4">
                                {dayPlan.activities.map((activity: any, aIndex: number) => {
                                    const key = `${dIndex}-${aIndex}`;
                                    const isEditing = editingActivity === key;
                                    const isGenerating = isRegenerating === key;

                                    return (
                                    <li key={aIndex} className="group relative">
                                        <div className={cn("flex flex-col md:flex-row gap-4 p-4 rounded-xl border border-transparent transition-all", isEditing ? "bg-white border-primary shadow-sm" : "hover:bg-gray-50")}>
                                            <span className="flex-shrink-0 p-18-semibold w-24 text-gray-500">{activity.time}</span>
                                            
                                            {isEditing ? (
                                                <div className="flex-grow flex flex-col gap-3">
                                                    <textarea 
                                                        className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-gray-700 min-h-[80px]"
                                                        value={activity.description}
                                                        onChange={(e) => {
                                                            const newItinerary = [...itinerary];
                                                            newItinerary[dIndex].activities[aIndex].description = e.target.value;
                                                            setItinerary(newItinerary);
                                                            setHasUnsavedChanges(true);
                                                        }}
                                                    />
                                                    <div className="flex flex-wrap gap-2 items-center justify-between">
                                                        <div className="flex gap-2 items-center">
                                                            <span className="text-sm font-medium text-gray-500 mr-2">🪄 AI Magic:</span>
                                                            {['Adventurous', 'Relaxing', 'Budget-friendly'].map(tone => (
                                                                <button 
                                                                    key={tone}
                                                                    onClick={() => handleRegenerate(dIndex, aIndex, tone.toLowerCase())}
                                                                    disabled={isGenerating}
                                                                    className="px-3 py-1.5 text-xs font-medium bg-purple-50 text-purple-600 hover:bg-purple-100 rounded-full transition-colors disabled:opacity-50"
                                                                >
                                                                    {isGenerating ? '✨...' : `Make ${tone}`}
                                                                </button>
                                                            ))}
                                                        </div>
                                                        <button 
                                                            onClick={() => setEditingActivity(null)}
                                                            className="text-sm font-medium text-primary hover:underline px-2"
                                                        >
                                                            Done
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex-grow flex items-start justify-between">
                                                    <p className={cn("text-gray-700", isGenerating && "opacity-50 animate-pulse")}>
                                                        {activity.description}
                                                    </p>
                                                    {isOwner && (
                                                        <button 
                                                            onClick={() => setEditingActivity(key)}
                                                            className="opacity-0 group-hover:opacity-100 transition-opacity ml-4 p-2 bg-gray-100 hover:bg-primary hover:text-white rounded-lg flex-shrink-0"
                                                            title="Edit Activity"
                                                        >
                                                            ✏️
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </li>
                                )})}
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
                        onClick={handleBookNow}
                    >
                        <span className="p-16-semibold text-white">
                            Book Now
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
            
            {/* Floating Action Bar for Unsaved Changes */}
            {hasUnsavedChanges && (
                <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 shadow-[0_-4px_12px_rgba(0,0,0,0.05)] p-4 flex justify-between items-center z-50 px-8">
                    <p className="font-medium text-gray-700">You have unsaved changes to your itinerary.</p>
                    <button 
                        onClick={handleSaveTrip}
                        disabled={isSaving}
                        className="bg-primary text-white px-8 py-3 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all disabled:opacity-50"
                    >
                        {isSaving ? 'Saving...' : 'Save Trip'}
                    </button>
                </div>
            )}
        </main>
    )
}
export default TravelDetail