import { Header } from "../../../components";
import { Link, redirect } from "react-router";
import { account } from "~/appwrite/client";
import { getUserBookings } from "~/appwrite/bookings";

export async function clientLoader() {
    try {
        const user = await account.get();
        if (!user.$id) return redirect('/sign-in');

        const { bookings } = await getUserBookings(user.$id);
        
        return { bookings };
    } catch (e) {
        return redirect('/sign-in');
    }
}

const MyBookings = ({ loaderData }: { loaderData: { bookings: any[] } }) => {
    const { bookings } = loaderData;

    return (
        <main className="flex flex-col gap-10 pb-20 pt-40 wrapper min-h-screen">
            <Header 
                title="My Bookings" 
                description="View and manage all your past and upcoming trips" 
            />

            <section className="mt-8">
                {bookings.length === 0 ? (
                    <div className="text-center py-20 bg-gray-50 rounded-xl border border-gray-200">
                        <img src="/assets/icons/itinerary.svg" alt="No bookings" className="size-16 mx-auto mb-4 opacity-50" />
                        <h3 className="text-xl font-semibold text-gray-700">No bookings yet</h3>
                        <p className="text-gray-500 mt-2">You haven't booked any trips. It's time to start planning!</p>
                        <Link to="/" className="inline-block mt-6 px-6 py-3 bg-primary text-white rounded-full font-medium">
                            Explore Destinations
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {bookings.map((booking) => {
                            const date = new Date(booking.travelDate).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                            });
                            const travelId = `TR${booking.$id.slice(-6).toUpperCase()}`;
                            const isConfirmed = booking.bookingStatus === 'confirmed' || booking.paymentStatus === 'paid';

                            return (
                                <div key={booking.$id} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col h-full">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-mono font-semibold">
                                            {travelId}
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${isConfirmed ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}`}>
                                            {isConfirmed ? 'Confirmed' : 'Pending'}
                                        </span>
                                    </div>
                                    
                                    <h3 className="text-xl font-bold text-gray-900 mb-1">{booking.destination}</h3>
                                    
                                    <div className="flex flex-col gap-2 mt-4 text-sm text-gray-600 flex-grow">
                                        <div className="flex items-center gap-2">
                                            <span>📅</span> {date}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span>👥</span> {booking.numberOfMembers} Member{booking.numberOfMembers > 1 ? 's' : ''}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span>🛫</span> Flight {booking.flightId}
                                        </div>
                                    </div>

                                    <div className="mt-6 pt-4 border-t border-gray-100">
                                        {isConfirmed ? (
                                            <Link to={`/ticket/${booking.$id}`} className="block w-full text-center bg-primary text-white py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors">
                                                View Ticket
                                            </Link>
                                        ) : (
                                            <Link to={`/payment/${booking.$id}`} className="block w-full text-center bg-yellow-500 text-white py-2 rounded-lg font-medium hover:bg-yellow-600 transition-colors">
                                                Complete Payment
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </section>
        </main>
    );
};

export default MyBookings;
