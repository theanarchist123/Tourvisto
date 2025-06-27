import { Header } from "../../../components";
import { ButtonComponent } from "@syncfusion/ej2-react-buttons";
import { useState } from "react";
import { useNavigate } from "react-router";
import { cn } from "~/lib/utils";
import { Client, Databases } from 'appwrite';
import { getPublicTripById } from "~/appwrite/public-trips";

// Create a server-side client
const createServerClient = () => {
    const client = new Client()
        .setEndpoint(import.meta.env.VITE_APPWRITE_API_ENDPOINT!)
        .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID!);
    
    return new Databases(client);
};

export const loader = async ({ params }: { params: { bookingId: string } }) => {
    const { bookingId } = params;
    
    try {
        console.log('Payment loader - fetching booking:', bookingId);
        
        // Use direct Appwrite client instead of fetch
        const database = createServerClient();
        
        const booking = await database.getDocument(
            import.meta.env.VITE_APPWRITE_DATABASE_ID!,
            import.meta.env.VITE_APPWRITE_BOOKINGS_COLLECTION_ID!,
            bookingId
        );
        
        console.log('Payment loader - booking found:', booking);
        
        // If booking exists, try to fetch the original trip to get the price
        let tripPrice = 50000; // Default fallback
        if (booking && booking.tripId) {
            try {
                const trip = await getPublicTripById(booking.tripId);
                if (trip && trip.price) {
                    tripPrice = Number(trip.price);
                }
            } catch (tripError) {
                console.warn('Could not fetch trip price, using default:', tripError);
            }
        }
        
        return { 
            booking: booking ? { ...booking, tripPrice } : null 
        };
    } catch (error: any) {
        console.error('Payment loader - error fetching booking:', error);
        return { booking: null };
    }
};

const Payment = ({ loaderData }: { loaderData: { booking: any } }) => {
    const { booking } = loaderData;
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handlePayment = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/create-payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    bookingId: booking.$id,
                    amount: booking.totalAmount,
                    currency: 'inr',
                    description: `Payment for trip to ${booking.destination}`,
                    metadata: {
                        bookingId: booking.$id,
                        travelerName: booking.travelerName,
                        email: booking.email
                    }
                })
            });

            const result = await response.json();

            if (result.url) {
                // Redirect to Stripe checkout
                window.location.href = result.url;
            } else {
                setError('Failed to initialize payment');
            }
        } catch (error) {
            console.error('Payment error:', error);
            setError('An error occurred while processing payment');
        } finally {
            setLoading(false);
        }
    };

    if (!booking) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p className="text-lg text-gray-500">Booking not found</p>
            </div>
        );
    }

    const memberNames = JSON.parse(booking.memberNames);
    const totalAmount = booking.tripPrice * booking.numberOfMembers;

    return (
        <main className="flex flex-col gap-10 pb-20 pt-40 wrapper">
            <Header 
                title="Complete Payment" 
                description="Review your booking and complete the payment" 
            />

            <section className="mt-2.5 wrapper-md">
                <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                    <h3 className="text-xl font-semibold mb-4">Booking Summary</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h4 className="font-semibold text-gray-700 mb-2">Trip Details</h4>
                            <p><strong>Destination:</strong> {booking.destination}</p>
                            <p><strong>Travel Date:</strong> {new Date(booking.travelDate).toLocaleDateString()}</p>
                            <p><strong>Flight:</strong> {booking.flightId}</p>
                            <p><strong>Departure:</strong> {booking.departureAirport}</p>
                            <p><strong>Departure Time:</strong> {new Date(booking.departureTime).toLocaleString()}</p>
                            <p><strong>Arrival Time:</strong> {new Date(booking.arrivalTime).toLocaleString()}</p>
                        </div>
                        
                        <div>
                            <h4 className="font-semibold text-gray-700 mb-2">Traveler Information</h4>
                            <p><strong>Lead Traveler:</strong> {booking.travelerName}</p>
                            <p><strong>Email:</strong> {booking.email}</p>
                            <p><strong>Phone:</strong> {booking.phone}</p>
                            <p><strong>Number of Members:</strong> {booking.numberOfMembers}</p>
                            
                            {booking.numberOfMembers > 1 && (
                                <div className="mt-2">
                                    <p><strong>All Members:</strong></p>
                                    <ul className="list-disc list-inside ml-2">
                                        <li>{booking.travelerName} (Lead Traveler)</li>
                                        {memberNames.slice(1).map((name: string, index: number) => (
                                            <li key={index}>{name}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="mt-6 pt-6 border-t">
                        <div className="flex justify-between items-center">
                            <span className="text-xl font-semibold">Total Amount:</span>
                            <span className="text-2xl font-bold text-primary">
                                ${totalAmount.toLocaleString()}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <h4 className="font-semibold text-blue-800 mb-2">Test Mode - No Real Payment</h4>
                    <p className="text-blue-700 text-sm mb-2">
                        This is a test environment. No real payment will be processed.
                    </p>
                    <p className="text-blue-700 text-sm">
                        You can use test card: <strong>4242 4242 4242 4242</strong> with any future expiry date and CVC.
                    </p>
                </div>

                {error && (
                    <div className="error mb-4">
                        <p>{error}</p>
                    </div>
                )}

                <div className="flex gap-4">
                    <ButtonComponent 
                        className="button-secondary !h-12 flex-1"
                        onClick={() => navigate(-1)}
                    >
                        <span className="p-16-semibold">Back to Booking</span>
                    </ButtonComponent>
                    
                    <ButtonComponent 
                        className="button-class !h-12 flex-1"
                        onClick={handlePayment}
                        disabled={loading}
                    >
                        <img 
                            src={`/assets/icons/${loading ? 'loader.svg' : 'magic-star.svg'}`} 
                            className={cn("size-5", {'animate-spin': loading})} 
                        />
                        <span className="p-16-semibold text-white">
                            {loading ? 'Processing...' : 'Pay Now'}
                        </span>
                    </ButtonComponent>
                </div>
            </section>
        </main>
    );
};

export default Payment;
