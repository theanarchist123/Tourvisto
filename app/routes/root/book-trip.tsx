import { Header } from "../../../components";
import { ButtonComponent } from "@syncfusion/ej2-react-buttons";
import { useState } from "react";
import { useNavigate } from "react-router";
import { account } from "~/appwrite/client";
import { cn, parseTripData } from "~/lib/utils";
import { getPublicTripById } from "~/appwrite/public-trips";

// USD to INR conversion rate (approximate - in real app, fetch from live API)
const USD_TO_INR_RATE = 83.50;

// Indian airports data
const indianAirports = [
    { code: 'DEL', name: 'Delhi - Indira Gandhi International Airport', city: 'New Delhi' },
    { code: 'BOM', name: 'Mumbai - Chhatrapati Shivaji Maharaj International Airport', city: 'Mumbai' },
    { code: 'BLR', name: 'Bangalore - Kempegowda International Airport', city: 'Bangalore' },
    { code: 'MAA', name: 'Chennai - Chennai International Airport', city: 'Chennai' },
    { code: 'HYD', name: 'Hyderabad - Rajiv Gandhi International Airport', city: 'Hyderabad' },
    { code: 'CCU', name: 'Kolkata - Netaji Subhas Chandra Bose International Airport', city: 'Kolkata' },
    { code: 'AMD', name: 'Ahmedabad - Sardar Vallabhbhai Patel International Airport', city: 'Ahmedabad' },
    { code: 'PNQ', name: 'Pune - Pune Airport', city: 'Pune' },
    { code: 'GOI', name: 'Goa - Goa International Airport', city: 'Goa' },
    { code: 'COK', name: 'Kochi - Cochin International Airport', city: 'Kochi' },
    { code: 'TRV', name: 'Thiruvananthapuram - Trivandrum International Airport', city: 'Thiruvananthapuram' },
    { code: 'JAI', name: 'Jaipur - Jaipur International Airport', city: 'Jaipur' },
    { code: 'IXC', name: 'Chandigarh - Chandigarh Airport', city: 'Chandigarh' },
    { code: 'GAU', name: 'Guwahati - Lokpriya Gopinath Bordoloi International Airport', city: 'Guwahati' },
    { code: 'IXB', name: 'Bagdogra - Bagdogra Airport', city: 'Siliguri' }
];

interface BookingFormData {
    travelerName: string;
    email: string;
    phone: string;
    numberOfMembers: number;
    departureAirport: string;
    travelDate: Date | null;
    memberNames: string[];
}

export const loader = async ({ params }: { params: { tripId: string } }) => {
    const { tripId } = params;
    
    console.log('BookTrip loader - tripId:', tripId);
    
    try {
        // Fetch trip details using the same method as travel-detail page
        const trip = await getPublicTripById(tripId);
        
        console.log('BookTrip loader - fetched trip:', trip);
        
        if (!trip) {
            console.error('BookTrip loader - Trip not found for ID:', tripId);
            throw new Error('Trip not found');
        }

        // Parse trip data to get readable information
        const tripData = parseTripData(trip.tripDetail);
        
        console.log('BookTrip loader - parsed tripData:', tripData);
        
        const processedTrip = {
            ...trip,
            ...tripData,
            destination: tripData?.name || trip.destination || 'Unknown Destination',
            price: tripData?.estimatedPrice?.replace(/[^0-9]/g, '') || '50000',
            duration: tripData?.duration || trip.duration || 5
        };
        
        console.log('BookTrip loader - final processed trip:', processedTrip);
        
        return { 
            trip: processedTrip, 
            airports: indianAirports 
        };
    } catch (error) {
        console.error('Error fetching trip:', error);
        return { trip: null, airports: indianAirports };
    }
};

const BookTrip = ({ loaderData }: { loaderData: { trip: any; airports: any[] } }) => {
    const { trip, airports } = loaderData;
    const navigate = useNavigate();
    
    const [formData, setFormData] = useState<BookingFormData>({
        travelerName: '',
        email: '',
        phone: '',
        numberOfMembers: 1,
        departureAirport: '',
        travelDate: null,
        memberNames: ['']
    });
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleChange = (field: keyof BookingFormData, value: any) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleMemberCountChange = (count: number) => {
        const memberNames = Array(count).fill('').map((_, index) => 
            formData.memberNames[index] || ''
        );
        setFormData(prev => ({
            ...prev,
            numberOfMembers: count,
            memberNames
        }));
    };

    const handleMemberNameChange = (index: number, name: string) => {
        const newMemberNames = [...formData.memberNames];
        newMemberNames[index] = name;
        setFormData(prev => ({
            ...prev,
            memberNames: newMemberNames
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        // Validation
        if (!formData.travelerName || !formData.email || !formData.phone || 
            !formData.departureAirport || !formData.travelDate) {
            setError('Please fill in all required fields');
            setLoading(false);
            return;
        }

        if (formData.numberOfMembers > 1 && formData.memberNames.slice(1).some(name => !name.trim())) {
            setError('Please provide names for all members');
            setLoading(false);
            return;
        }

        try {
            const user = await account.get();
            
            // Calculate total amount
            const totalAmount = Number(trip.price) * formData.numberOfMembers;
            
            // Create booking
            const bookingResponse = await fetch('/api/create-booking', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tripId: trip.$id,
                    userId: user.$id,
                    travelerName: formData.travelerName,
                    email: formData.email,
                    phone: formData.phone,
                    numberOfMembers: formData.numberOfMembers,
                    memberNames: formData.memberNames,
                    departureAirport: formData.departureAirport,
                    travelDate: formData.travelDate?.toISOString(),
                    destination: trip.destination,
                    tripDetails: trip.tripDetail,
                    totalAmount: totalAmount
                })
            });

            const booking = await bookingResponse.json();
            
            if (booking.id) {
                // Calculate total amount
                const totalAmount = Number(trip.price) * formData.numberOfMembers;
                
                // Create Stripe payment session directly
                const paymentResponse = await fetch('/api/create-payment', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        bookingId: booking.id,
                        amount: totalAmount,
                        currency: 'inr',
                        description: `Payment for trip to ${trip.destination}`,
                        metadata: {
                            bookingId: booking.id,
                            travelerName: formData.travelerName,
                            email: formData.email
                        }
                    })
                });

                const paymentResult = await paymentResponse.json();
                
                if (paymentResult.url) {
                    // Redirect directly to Stripe checkout
                    window.location.href = paymentResult.url;
                } else {
                    // Fallback to payment page if direct redirect fails
                    navigate(`/payment/${booking.id}`);
                }
            } else {
                setError('Failed to create booking');
            }
        } catch (error) {
            console.error('Booking error:', error);
            setError('An error occurred while creating the booking');
        } finally {
            setLoading(false);
        }
    };

    if (!trip) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p className="text-lg text-gray-500">Trip not found</p>
            </div>
        );
    }

    return (
        <main className="flex flex-col gap-10 pb-20 pt-40 wrapper">
            <Header 
                title="Book Your Trip" 
                description={`Complete your booking for ${trip.destination}`} 
            />

            <section className="mt-2.5 wrapper-md">
                <div className="trip-card mb-8">
                    <div className="flex gap-4">
                        <img 
                            src={trip.imageUrls?.[0] || '/assets/images/sample.jpeg'} 
                            alt={trip.destination} 
                            className="w-32 h-24 object-cover rounded-lg" 
                        />
                        <div>
                            <h3 className="text-xl font-semibold">{trip.destination}</h3>
                            <p className="text-gray-600">{trip.duration} days</p>
                            <p className="text-2xl font-bold text-primary">${Number(trip.price).toLocaleString()}</p>
                            <p className="text-sm text-gray-600">≈ ₹{(Number(trip.price) * USD_TO_INR_RATE).toLocaleString()} INR</p>
                        </div>
                    </div>
                </div>

                <form className="trip-form" onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="travelerName" className="form-label">
                                Lead Traveler Name *
                            </label>
                            <input
                                id="travelerName"
                                type="text"
                                className="form-input"
                                value={formData.travelerName}
                                onChange={(e) => handleChange('travelerName', e.target.value)}
                                placeholder="Enter your full name"
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="email" className="form-label">
                                Email Address *
                            </label>
                            <input
                                id="email"
                                type="email"
                                className="form-input"
                                value={formData.email}
                                onChange={(e) => handleChange('email', e.target.value)}
                                placeholder="Enter your email"
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="phone" className="form-label">
                                Phone Number *
                            </label>
                            <input
                                id="phone"
                                type="tel"
                                className="form-input"
                                value={formData.phone}
                                onChange={(e) => handleChange('phone', e.target.value)}
                                placeholder="Enter your phone number"
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="numberOfMembers" className="form-label">
                                Number of Members *
                            </label>
                            <select
                                id="numberOfMembers"
                                className="form-input"
                                value={formData.numberOfMembers}
                                onChange={(e) => handleMemberCountChange(Number(e.target.value))}
                            >
                                {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                                    <option key={num} value={num}>{num}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label htmlFor="departureAirport" className="form-label">
                                Departure Airport *
                            </label>
                            <select
                                id="departureAirport"
                                className="form-input"
                                value={formData.departureAirport}
                                onChange={(e) => handleChange('departureAirport', e.target.value)}
                                required
                            >
                                <option value="">Select departure airport</option>
                                {airports.map((airport: any) => (
                                    <option key={airport.code} value={airport.code}>
                                        {airport.city} ({airport.code})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label htmlFor="travelDate" className="form-label">
                                Travel Date *
                            </label>
                            <input
                                id="travelDate"
                                type="date"
                                className="form-input"
                                value={formData.travelDate ? formData.travelDate.toISOString().split('T')[0] : ''}
                                onChange={(e) => handleChange('travelDate', e.target.value ? new Date(e.target.value) : null)}
                                min={new Date().toISOString().split('T')[0]}
                                required
                            />
                        </div>
                    </div>

                    {formData.numberOfMembers > 1 && (
                        <div className="mt-6">
                            <h4 className="text-lg font-semibold mb-4">Additional Member Names</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {formData.memberNames.slice(1).map((name, index) => (
                                    <div key={index + 1}>
                                        <label htmlFor={`member-${index + 1}`} className="form-label">
                                            Member {index + 2} Name *
                                        </label>
                                        <input
                                            id={`member-${index + 1}`}
                                            type="text"
                                            className="form-input"
                                            value={name}
                                            onChange={(e) => handleMemberNameChange(index + 1, e.target.value)}
                                            placeholder={`Enter member ${index + 2} name`}
                                            required
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="bg-gray-200 h-px w-full my-6" />

                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <p className="text-lg font-semibold">Total Amount</p>
                            <p className="text-2xl font-bold text-primary">
                                ${(Number(trip.price) * formData.numberOfMembers).toLocaleString()}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                                ≈ ₹{(Number(trip.price) * formData.numberOfMembers * USD_TO_INR_RATE).toLocaleString()} INR
                            </p>
                            <p className="text-xs text-gray-500">
                                (Payment will be processed in Indian Rupees)
                            </p>
                        </div>
                    </div>

                    {error && (
                        <div className="error mb-4">
                            <p>{error}</p>
                        </div>
                    )}

                    <ButtonComponent 
                        type="submit"
                        className="button-class !h-12 !w-full"
                        disabled={loading}
                    >
                        <img 
                            src={`/assets/icons/${loading ? 'loader.svg' : 'magic-star.svg'}`} 
                            className={cn("size-5", {'animate-spin': loading})} 
                        />
                        <span className="p-16-semibold text-white">
                            {loading ? 'Creating Booking...' : 'Proceed to Payment'}
                        </span>
                    </ButtonComponent>
                </form>
            </section>
        </main>
    );
};

export default BookTrip;
