import {Link, type LoaderFunctionArgs, useNavigate, useOutletContext} from "react-router";
import {getPublicTrips, getPublicTripById} from "~/appwrite/public-trips";
import {getUser, loginWithGoogle} from "~/appwrite/auth";
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

const CURRENCY_RATES: Record<string, { symbol: string; rate: number }> = {
    USD: { symbol: '$', rate: 1 },
    INR: { symbol: '₹', rate: 86.5 },
    EUR: { symbol: '€', rate: 0.92 },
    GBP: { symbol: '£', rate: 0.79 },
    AED: { symbol: 'AED ', rate: 3.67 },
};

const TravelDetail = ({ loaderData }: Route.ComponentProps) => {
    const navigate = useNavigate();
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);
    
    // Get user from layout outlet context (client-authenticated) with fallback to loader
    const context = useOutletContext<{ user?: any }>();
    const currentUser = context?.user || loaderData?.user;
    
    const imageUrls = loaderData?.trip?.imageUrls || [];
    const tripData = parseTripData(loaderData?.trip?.tripDetail);
    const tripId = loaderData?.trip?.$id;
    
    const isOwner = currentUser?.$id && (loaderData?.trip?.userId === currentUser?.$id || !loaderData?.trip?.userId);

    const [itinerary, setItinerary] = useState(tripData?.itinerary || []);
    const [editingActivity, setEditingActivity] = useState<string | null>(null);
    const [isRegenerating, setIsRegenerating] = useState<string | null>(null);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const [reviews, setReviews] = useState(tripData?.reviews || []);
    const [vibe, setVibe] = useState('🌅 Scenic');
    const [comment, setComment] = useState('');
    const [isSubmittingReview, setIsSubmittingReview] = useState(false);
    const [aiSummary, setAiSummary] = useState<string | null>(null);
    const [isSummarizing, setIsSummarizing] = useState(false);

    // Currency Switcher state
    const [selectedCurrency, setSelectedCurrency] = useState<'USD' | 'INR' | 'EUR' | 'GBP' | 'AED'>('USD');
    // Social Share feedback
    const [copiedShareLink, setCopiedShareLink] = useState(false);

    const {
        name, duration, travelStyle,
        groupType, budget, interests, estimatedPrice,
        description, bestTimeToVisit, weatherInfo, country
    } = tripData || {};
    const allTrips = loaderData.allTrips as Trip[] | [];

    // Format price in chosen currency
    const formatConvertedPrice = () => {
        if (!estimatedPrice) return 'N/A';
        const numeric = Number(String(estimatedPrice).replace(/[^0-9.]/g, '')) || 0;
        if (!numeric) return estimatedPrice;
        const rateInfo = CURRENCY_RATES[selectedCurrency];
        const converted = Math.round(numeric * rateInfo.rate);
        return `${rateInfo.symbol}${converted.toLocaleString()}`;
    };

    const handleShareTrip = async () => {
        const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `Tourvisto - ${name}`,
                    text: `Check out this amazing ${duration}-day trip itinerary to ${country || name} on Tourvisto!`,
                    url: shareUrl,
                });
                return;
            } catch (err) {
                // Fallback to clipboard
            }
        }
        
        if (typeof navigator !== 'undefined' && navigator.clipboard) {
            navigator.clipboard.writeText(shareUrl);
            setCopiedShareLink(true);
            setTimeout(() => setCopiedShareLink(false), 3000);
        }
    };

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

    const handleAddReview = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!comment.trim()) return;

        setIsSubmittingReview(true);
        try {
            const res = await fetch('/api/add-review', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tripId,
                    vibe,
                    comment,
                    userName: currentUser?.name || 'Fellow Traveler'
                })
            });
            const data = await res.json();
            if (data.reviews) {
                setReviews(data.reviews);
                setComment('');
                setAiSummary(null); // Clear summary so it can be regenerated with new data
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsSubmittingReview(false);
        }
    };

    const handleSummarize = async () => {
        setIsSummarizing(true);
        try {
            const res = await fetch('/api/summarize-reviews', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    reviews,
                    tripName: name
                })
            });
            const data = await res.json();
            if (data.summary) {
                setAiSummary(data.summary);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsSummarizing(false);
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
                <div className="flex justify-between items-center w-full mb-6">
                    <Link to="/" className="back-link !mb-0">
                        <img src="/assets/icons/arrow-left.svg" alt="back icon" />
                        <span>Go back</span>
                    </Link>

                    {/* Quick Social Share */}
                    <button 
                        type="button"
                        onClick={handleShareTrip}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm transition-all cursor-pointer"
                    >
                        <span>{copiedShareLink ? '✅ Link Copied!' : '🔗 Share Trip'}</span>
                    </button>
                </div>


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
                                .map((item: any) => item.location).join(', ') || ''}
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

                {/* Title & Live Currency Converter */}
                <section className="title flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <article>
                        <h3>
                            {duration}-Day {country} {travelStyle} Trip
                        </h3>
                        <p>{budget}, {groupType} and {interests}</p>
                    </article>

                    <div className="flex flex-col md:items-end gap-2">
                        <h2 className="text-3xl font-bold text-primary">{formatConvertedPrice()}</h2>
                        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
                            {(['USD', 'INR', 'EUR', 'GBP', 'AED'] as const).map(curr => (
                                <button
                                    key={curr}
                                    type="button"
                                    onClick={() => setSelectedCurrency(curr)}
                                    className={cn(
                                        "px-2 py-1 text-xs font-semibold rounded transition-all",
                                        selectedCurrency === curr
                                            ? "bg-white text-primary shadow-xs font-bold"
                                            : "text-gray-500 hover:text-gray-800"
                                    )}
                                >
                                    {curr}
                                </button>
                            ))}
                        </div>
                    </div>
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
                                                    <button 
                                                        onClick={() => setEditingActivity(key)}
                                                        className="opacity-0 group-hover:opacity-100 transition-opacity ml-4 p-2 bg-gray-100 hover:bg-primary hover:text-white rounded-lg flex-shrink-0 cursor-pointer"
                                                        title="Edit Activity"
                                                    >
                                                        ✏️
                                                    </button>
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
                        <span className="price-pill">{formatConvertedPrice()}</span>
                    </ButtonComponent>
                </div>

                <hr className="my-10 border-gray-200" />

                <section className="reviews-section w-full">
                    <h2 className="p-30-bold text-dark-100 mb-6">Traveler Vibe Checks</h2>
                    
                    {reviews.length > 0 && (
                        <div className="mb-8">
                            <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-2xl border border-purple-100">
                                <div className="flex justify-between items-start md:items-center flex-col md:flex-row gap-4 mb-4">
                                    <h3 className="font-semibold text-purple-900 flex items-center gap-2">
                                        ✨ AI Sentiment Summary
                                    </h3>
                                    {!aiSummary && (
                                        <button 
                                            onClick={handleSummarize}
                                            disabled={isSummarizing}
                                            className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 cursor-pointer"
                                        >
                                            {isSummarizing ? 'Analyzing...' : 'Generate Summary'}
                                        </button>
                                    )}
                                </div>
                                {aiSummary ? (
                                    <p className="text-purple-800 text-lg leading-relaxed">{aiSummary}</p>
                                ) : (
                                    <p className="text-purple-600/70 text-sm">Click generate to see what travelers really think about this trip, powered by Gemini AI.</p>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="grid gap-4 mb-10">
                        {reviews.length === 0 ? (
                            <p className="text-gray-500 italic">No vibe checks yet. Be the first!</p>
                        ) : (
                            reviews.map((r: any, i: number) => (
                                <div key={i} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col gap-3">
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                                                {r.userName?.charAt(0)?.toUpperCase() || 'T'}
                                            </div>
                                            <span className="font-medium text-gray-900">{r.userName}</span>
                                        </div>
                                        <span className="bg-gray-50 px-3 py-1 rounded-full text-sm font-medium border border-gray-200">
                                            {r.vibe}
                                        </span>
                                    </div>
                                    <p className="text-gray-700 leading-relaxed">{r.comment}</p>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Vibe Check Form for Logged In User OR Guest */}
                    <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-gray-900">Leave a Vibe Check</h3>
                            {currentUser?.$id ? (
                                <span className="text-xs text-gray-500 bg-white px-2.5 py-1 rounded-full border border-gray-200">
                                    Posting as {currentUser.name || 'Traveler'}
                                </span>
                            ) : (
                                <button
                                    type="button"
                                    onClick={loginWithGoogle}
                                    className="flex items-center gap-1.5 text-xs text-primary bg-white px-2.5 py-1 rounded-full border border-gray-200 hover:bg-gray-100 transition-colors cursor-pointer"
                                >
                                    <img src="/assets/icons/google.svg" alt="google" className="size-3.5" />
                                    <span>Sign in for verified badge</span>
                                </button>
                            )}
                        </div>
                        <form onSubmit={handleAddReview} className="flex flex-col gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">What was the primary vibe?</label>
                                <div className="flex flex-wrap gap-2">
                                    {['🌅 Scenic', '🌮 Foodie', '🏃‍♂️ Active', '🏛️ Cultural', '🎉 Wild', '🧘 Relaxing'].map(v => (
                                        <button
                                            key={v}
                                            type="button"
                                            onClick={() => setVibe(v)}
                                            className={cn("px-4 py-2 rounded-full text-sm font-medium transition-all border cursor-pointer", vibe === v ? "bg-primary text-white border-primary" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-100")}
                                        >
                                            {v}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <textarea 
                                    className="w-full bg-white border border-gray-200 rounded-xl p-4 outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-gray-700 min-h-[100px]"
                                    placeholder="Share your experience (e.g., Best local foods, secret viewpoint, sunset timing, activity highlights)..."
                                    value={comment}
                                    onChange={e => setComment(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="flex justify-end">
                                <button 
                                    type="submit" 
                                    disabled={isSubmittingReview || !comment.trim()}
                                    className="bg-primary text-white px-6 py-2.5 rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 cursor-pointer"
                                >
                                    {isSubmittingReview ? 'Posting...' : 'Post Vibe Check'}
                                </button>
                            </div>
                        </form>
                    </div>
                </section>

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