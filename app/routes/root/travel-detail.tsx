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
        <main className="pt-32 pb-24 wrapper max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Top Navigation & Share Bar */}
            <div className="flex justify-between items-center w-full mb-8">
                <Link to="/" className="flex items-center gap-2.5 py-2.5 px-5 bg-white border border-light-300 rounded-xl shadow-xs text-dark-100 font-semibold hover:bg-light-200 transition-all">
                    <img src="/assets/icons/arrow-left.svg" alt="back" className="size-4" />
                    <span>Back to Explore</span>
                </Link>

                <button 
                    type="button"
                    onClick={handleShareTrip}
                    className="flex items-center gap-2 px-5 py-2.5 bg-white border border-light-300 rounded-xl text-sm font-semibold text-dark-400 hover:bg-light-200 shadow-xs transition-all cursor-pointer"
                >
                    <span>{copiedShareLink ? '✅ Link Copied!' : '🔗 Share Itinerary'}</span>
                </button>
            </div>

            {/* Header */}
            <header className="flex flex-col gap-4">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-dark-100 tracking-tight leading-tight">
                    {name}
                </h1>
                <div className="flex flex-wrap items-center gap-3">
                    <InfoPill
                        text={`${duration} day plan`}
                        image="/assets/icons/calendar.svg"
                    />
                    <InfoPill
                        text={itinerary?.slice(0, 3).map((item: any) => item.location).join(', ') || country || ''}
                        image="/assets/icons/location-mark.svg"
                    />
                </div>
            </header>

            {/* Image Gallery */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-4 rounded-2xl overflow-hidden mb-10">
                {imageUrls.map((url: string, i: number) => (
                    <div 
                        key={i} 
                        className={cn(
                            "overflow-hidden rounded-2xl shadow-sm bg-light-300",
                            i === 0 ? "md:col-span-2 md:row-span-2 h-[340px] md:h-[420px]" : "h-[160px] md:h-[200px]"
                        )}
                    >
                        <img
                            src={url}
                            alt={`Trip ${i}`}
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                        />
                    </div>
                ))}
            </section>



            {/* Main 2-Column Layout */}
            <div className="flex flex-col lg:flex-row gap-10 items-start">
                {/* Left Content Column */}
                <div className="flex-1 w-full min-w-0 flex flex-col gap-8">
                    {/* Style Chips */}
                    <section className="flex gap-2 items-center flex-wrap">
                        {pillItems.map((pill, i) => (
                            <span 
                                key={i} 
                                className={cn("px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider", pill.bg)}
                            >
                                {pill.text}
                            </span>
                        ))}
                    </section>

                    {/* Overview Narrative */}
                    <section className="bg-white p-6 sm:p-8 rounded-2xl border border-light-100 shadow-xs">
                        <h2 className="text-xl font-bold text-dark-100 mb-3">About This Journey</h2>
                        <p className="text-base sm:text-lg font-normal text-dark-400 leading-relaxed">
                            {description}
                        </p>
                    </section>

                    {/* Daily Itinerary */}
                    <section className="flex flex-col gap-6">
                        <div className="flex justify-between items-center">
                            <h2 className="text-2xl font-bold text-dark-100">Daily Itinerary</h2>
                            <span className="text-xs text-primary-500 bg-primary-50 border border-primary-100 px-3 py-1 rounded-full font-medium">
                                ✨ AI Customizable
                            </span>
                        </div>

                        <div className="flex flex-col gap-6">
                            {itinerary?.map((dayPlan: any, dIndex: number) => (
                                <div key={dIndex} className="bg-white border border-light-300/80 rounded-2xl p-6 shadow-xs">
                                    <div className="flex items-center gap-3 mb-4 pb-3 border-b border-light-100">
                                        <span className="bg-primary text-white font-bold px-3 py-1 rounded-lg text-sm">
                                            Day {dayPlan.day}
                                        </span>
                                        <h3 className="text-lg font-bold text-dark-100">{dayPlan.location}</h3>
                                    </div>

                                    <ul className="flex flex-col gap-4">
                                        {dayPlan.activities?.map((activity: any, aIndex: number) => {
                                            const key = `${dIndex}-${aIndex}`;
                                            const isEditing = editingActivity === key;
                                            const isGenerating = isRegenerating === key;

                                            return (
                                                <li key={aIndex} className="group relative">
                                                    <div className={cn(
                                                        "flex flex-col md:flex-row gap-4 p-4 rounded-xl border transition-all",
                                                        isEditing ? "bg-primary-50/50 border-primary-100 shadow-sm" : "bg-light-200 border-transparent hover:border-light-300"
                                                    )}>
                                                        <span className="flex-shrink-0 font-bold text-xs uppercase text-gray-100 w-24 pt-1">
                                                            {activity.time}
                                                        </span>
                                                        
                                                        {isEditing ? (
                                                            <div className="flex-grow flex flex-col gap-3">
                                                                <textarea 
                                                                    className="w-full bg-white border border-primary-100 rounded-xl p-3 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all text-dark-200 text-sm min-h-[80px]"
                                                                    value={activity.description}
                                                                    onChange={(e) => {
                                                                        const newItinerary = [...itinerary];
                                                                        newItinerary[dIndex].activities[aIndex].description = e.target.value;
                                                                        setItinerary(newItinerary);
                                                                        setHasUnsavedChanges(true);
                                                                    }}
                                                                />
                                                                <div className="flex flex-wrap gap-2 items-center justify-between">
                                                                    <div className="flex flex-wrap gap-2 items-center">
                                                                        <span className="text-xs font-semibold text-primary-500">🪄 AI Rewrite:</span>
                                                                        {['Adventurous', 'Relaxing', 'Budget-friendly'].map(tone => (
                                                                            <button 
                                                                                key={tone}
                                                                                onClick={() => handleRegenerate(dIndex, aIndex, tone.toLowerCase())}
                                                                                disabled={isGenerating}
                                                                                className="px-3 py-1 text-xs font-semibold bg-primary-50 text-primary-500 hover:bg-primary-100 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                                                                            >
                                                                                {isGenerating ? 'Regenerating...' : tone}
                                                                            </button>
                                                                        ))}
                                                                    </div>
                                                                    <button 
                                                                        onClick={() => setEditingActivity(null)}
                                                                        className="text-xs font-bold text-primary hover:underline px-2 cursor-pointer"
                                                                    >
                                                                        Done
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="flex-grow flex items-start justify-between gap-4">
                                                                <p className={cn("text-dark-400 text-sm sm:text-base leading-relaxed", isGenerating && "opacity-50 animate-pulse")}>
                                                                    {activity.description}
                                                                </p>
                                                                <button 
                                                                    onClick={() => setEditingActivity(key)}
                                                                    className="opacity-60 group-hover:opacity-100 transition-opacity p-2 bg-white border border-light-300 hover:bg-primary hover:text-white rounded-lg flex-shrink-0 shadow-2xs cursor-pointer"
                                                                    title="Edit Activity with AI"
                                                                >
                                                                    ✏️
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Best Time to Visit & Weather */}
                    <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {visitTimeAndWeatherInfo.map((section) => (
                            <div key={section.title} className="bg-white p-6 rounded-2xl border border-light-300 shadow-xs flex flex-col gap-3">
                                <h3 className="text-base font-bold text-dark-100 flex items-center gap-2">
                                    <span>{section.title === 'Weather:' ? '🌤️' : '🗓️'}</span>
                                    {section.title}
                                </h3>
                                <ul className="flex flex-col gap-2">
                                    {section.items?.map((item: string) => (
                                        <li key={item} className="text-sm text-gray-100 flex items-start gap-2">
                                            <span className="text-primary font-bold">•</span>
                                            <span>{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </section>

                    {/* Traveler Vibe Checks & Reviews */}
                    <section className="reviews-section w-full bg-white p-6 sm:p-8 rounded-2xl border border-light-300 shadow-xs flex flex-col gap-6">
                        <div className="flex justify-between items-center">
                            <h2 className="text-2xl font-bold text-dark-100">Traveler Vibe Checks</h2>
                            <span className="text-xs font-semibold px-3 py-1 bg-yellow-50 text-yellow-800 border border-yellow-200 rounded-full">
                                Community Reviews
                            </span>
                        </div>
                        
                        {reviews.length > 0 && (
                            <div className="bg-gradient-to-r from-purple-50 via-pink-50 to-purple-50 p-6 rounded-2xl border border-primary-100">
                                <div className="flex justify-between items-start md:items-center flex-col md:flex-row gap-4 mb-3">
                                    <h3 className="font-bold text-primary-500 flex items-center gap-2 text-base">
                                        ✨ AI Sentiment Summary
                                    </h3>
                                    {!aiSummary && (
                                        <button 
                                            onClick={handleSummarize}
                                            disabled={isSummarizing}
                                            className="px-4 py-2 bg-primary-500 text-white rounded-xl text-xs font-bold hover:bg-primary-500 transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
                                        >
                                            {isSummarizing ? 'Analyzing Vibe Checks...' : 'Generate AI Summary'}
                                        </button>
                                    )}
                                </div>
                                {aiSummary ? (
                                    <p className="text-primary-500 text-sm sm:text-base leading-relaxed">{aiSummary}</p>
                                ) : (
                                    <p className="text-primary-500/80 text-xs">Click generate to see what travelers loved most about this destination, synthesized by Gemini AI.</p>
                                )}
                            </div>
                        )}

                        <div className="grid gap-4">
                            {reviews.length === 0 ? (
                                <div className="text-center py-8 bg-light-200 rounded-xl border border-dashed border-light-300">
                                    <p className="text-gray-100 italic text-sm">No vibe checks yet. Be the first to share your experience!</p>
                                </div>
                            ) : (
                                reviews.map((r: any, i: number) => (
                                    <div key={i} className="bg-light-200 p-4 rounded-xl border border-light-100 flex flex-col gap-2">
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                                                    {r.userName?.charAt(0)?.toUpperCase() || 'T'}
                                                </div>
                                                <span className="font-semibold text-sm text-dark-100">{r.userName}</span>
                                            </div>
                                            <span className="bg-white px-2.5 py-0.5 rounded-full text-xs font-semibold border border-light-300 shadow-2xs">
                                                {r.vibe}
                                            </span>
                                        </div>
                                        <p className="text-dark-400 text-sm leading-relaxed">{r.comment}</p>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Vibe Check Form */}
                        <div className="bg-light-200 p-5 rounded-xl border border-light-300 mt-2">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold text-sm text-dark-100">Leave a Vibe Check</h3>
                                {currentUser?.$id ? (
                                    <span className="text-xs text-gray-100 bg-white px-2.5 py-1 rounded-full border border-light-300 font-medium">
                                        Posting as {currentUser.name || 'Traveler'}
                                    </span>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={loginWithGoogle}
                                        className="flex items-center gap-1.5 text-xs text-primary bg-white px-2.5 py-1 rounded-full border border-light-300 hover:bg-light-300 transition-colors cursor-pointer font-medium"
                                    >
                                        <img src="/assets/icons/google.svg" alt="google" className="size-3.5" />
                                        <span>Sign in for verified badge</span>
                                    </button>
                                )}
                            </div>
                            <form onSubmit={handleAddReview} className="flex flex-col gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-100 mb-2">What was the primary vibe?</label>
                                    <div className="flex flex-wrap gap-2">
                                        {['🌅 Scenic', '🌮 Foodie', '🏃‍♂️ Active', '🏛️ Cultural', '🎉 Wild', '🧘 Relaxing'].map(v => (
                                            <button
                                                key={v}
                                                type="button"
                                                onClick={() => setVibe(v)}
                                                className={cn(
                                                    "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border cursor-pointer",
                                                    vibe === v ? "bg-primary text-white border-primary shadow-xs" : "bg-white text-dark-400 border-light-300 hover:bg-light-300"
                                                )}
                                            >
                                                {v}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <textarea 
                                        className="w-full bg-white border border-light-300 rounded-xl p-3.5 outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-dark-200 text-sm min-h-[90px]"
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
                                        className="bg-primary text-white px-6 py-2 rounded-xl text-xs font-bold hover:bg-primary/90 transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
                                    >
                                        {isSubmittingReview ? 'Posting...' : 'Post Vibe Check'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </section>
                </div>

                {/* Right Sticky Booking Sidebar */}
                <aside className="w-full lg:w-[340px] flex-shrink-0 lg:sticky lg:top-28 flex flex-col gap-6">
                    <div className="bg-white border border-light-300 rounded-3xl p-6 shadow-sm flex flex-col gap-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <span className="text-xs font-bold uppercase tracking-wider text-gray-100">Total Price</span>
                                <h2 className="text-3xl font-black text-primary mt-1">{formatConvertedPrice()}</h2>
                            </div>
                            <span className="bg-green-50 text-green-700 border border-green-200 text-xs font-bold px-2.5 py-1 rounded-full">
                                Instant Booking
                            </span>
                        </div>

                        {/* Live Currency Selector */}
                        <div className="flex flex-col gap-2">
                            <label className="text-xs font-semibold text-gray-100">Select Currency</label>
                            <div className="grid grid-cols-5 gap-1 bg-light-300 p-1 rounded-xl">
                                {(['USD', 'INR', 'EUR', 'GBP', 'AED'] as const).map(curr => (
                                    <button
                                        key={curr}
                                        type="button"
                                        onClick={() => setSelectedCurrency(curr)}
                                        className={cn(
                                            "py-1.5 text-xs font-bold rounded-lg transition-all text-center",
                                            selectedCurrency === curr
                                                ? "bg-white text-primary shadow-xs"
                                                : "text-gray-100 hover:text-dark-200"
                                        )}
                                    >
                                        {curr}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="border-t border-b border-light-100 py-4 flex flex-col gap-3 text-sm text-gray-100">
                            <div className="flex justify-between">
                                <span>Duration:</span>
                                <span className="font-semibold text-dark-100">{duration} Days</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Travel Style:</span>
                                <span className="font-semibold text-dark-100">{travelStyle}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Group:</span>
                                <span className="font-semibold text-dark-100">{groupType}</span>
                            </div>
                        </div>

                        <button 
                            onClick={handleBookNow}
                            className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3.5 rounded-2xl transition-all shadow-md hover:shadow-lg text-center cursor-pointer text-base"
                        >
                            Book This Trip Now ✈️
                        </button>

                        <div className="flex flex-col gap-2 pt-2">
                            <div className="flex items-center gap-2 text-xs text-gray-100">
                                <span>🛡️</span>
                                <span>Secure Stripe Payment & Flight Ticket</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-100">
                                <span>✨</span>
                                <span>AI-Powered Itinerary Customization</span>
                            </div>
                        </div>
                    </div>
                </aside>
            </div>

            {/* Bottom Popular Trips Grid */}
            <section className="flex flex-col gap-6 mt-20 w-full">
                <h2 className="text-2xl font-bold text-dark-100">Explore More Popular Trips</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-dark-100 text-white border border-dark-400 shadow-2xl rounded-2xl p-4 flex items-center gap-6 z-50 px-6 animate-bounce">
                    <p className="font-medium text-sm text-gray-200">You have unsaved changes to your itinerary.</p>
                    <button 
                        onClick={handleSaveTrip}
                        disabled={isSaving}
                        className="bg-primary text-white px-5 py-2 rounded-xl font-bold text-xs shadow-md hover:bg-primary/90 transition-all disabled:opacity-50 cursor-pointer"
                    >
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            )}
        </main>
    );
};

export default TravelDetail;