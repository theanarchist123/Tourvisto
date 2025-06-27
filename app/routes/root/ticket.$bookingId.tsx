import { Header } from "../../../components";
import { useState, useEffect } from "react";
import { ButtonComponent } from "@syncfusion/ej2-react-buttons";

import { Client, Databases } from 'appwrite';

// Create a server-side client directly in the loader
const createServerClient = () => {
    const client = new Client()
        .setEndpoint(import.meta.env.VITE_APPWRITE_API_ENDPOINT!)
        .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID!);
    
    return new Databases(client);
};

export const loader = async ({ params }: { params: { bookingId: string } }) => {
    const { bookingId } = params;
    
    try {
        console.log('Ticket loader - fetching booking:', bookingId);
        
        // Use direct Appwrite client instead of fetch
        const database = createServerClient();
        
        const booking = await database.getDocument(
            import.meta.env.VITE_APPWRITE_DATABASE_ID!,
            import.meta.env.VITE_APPWRITE_BOOKINGS_COLLECTION_ID!,
            bookingId
        );
        
        console.log('Ticket loader - booking found:', booking);
        return { booking };
    } catch (error: any) {
        console.error('Ticket loader - error fetching booking:', error);
        return { booking: null };
    }
};

const Ticket = ({ loaderData }: { loaderData: { booking: any } }) => {
    const { booking } = loaderData;
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const handlePrint = () => {
        window.print();
    };

    const handleDownload = () => {
        // Create a downloadable version of the ticket
        const ticketContent = document.getElementById('ticket-content');
        if (ticketContent) {
            const printWindow = window.open('', '_blank');
            if (printWindow) {
                printWindow.document.write(`
                    <html>
                        <head>
                            <title>Travel Ticket - ${booking.travelerName}</title>
                            <style>
                                body { font-family: Arial, sans-serif; margin: 20px; }
                                .ticket { border: 2px solid #333; padding: 20px; margin: 20px 0; }
                                .header { text-align: center; border-bottom: 1px solid #ccc; padding-bottom: 10px; margin-bottom: 20px; }
                                .section { margin: 15px 0; }
                                .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
                                .label { font-weight: bold; }
                                .barcode { text-align: center; font-family: monospace; letter-spacing: 2px; }
                            </style>
                        </head>
                        <body>
                            ${ticketContent.innerHTML}
                        </body>
                    </html>
                `);
                printWindow.document.close();
                printWindow.print();
            }
        }
    };

    if (!booking) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p className="text-lg text-gray-500">Ticket not found</p>
            </div>
        );
    }

    const memberNames = JSON.parse(booking.memberNames || '[]');
    const seatAssignments = JSON.parse(booking.seatAssignments || '[]');
    const departureDate = new Date(booking.departureTime);
    const arrivalDate = new Date(booking.arrivalTime);

    // Generate travel ID (combination of booking ID and flight ID)
    const travelId = `TR${booking.$id.slice(-6).toUpperCase()}`;

    return (
        <main className="flex flex-col gap-10 pb-20 pt-40 wrapper">
            <Header 
                title="Your Travel Ticket" 
                description="Your confirmed travel ticket with all details" 
            />

            <section className="mt-2.5 wrapper-md">
                <div className="no-print flex gap-4 mb-6">
                    <ButtonComponent 
                        className="button-class !h-12"
                        onClick={handlePrint}
                    >
                        <img src="/assets/icons/magic-star.svg" className="size-5" />
                        <span className="p-16-semibold text-white">Print Ticket</span>
                    </ButtonComponent>
                    
                    <ButtonComponent 
                        className="button-secondary !h-12"
                        onClick={handleDownload}
                    >
                        <img src="/assets/icons/arrow-down.svg" className="size-5" />
                        <span className="p-16-semibold">Download</span>
                    </ButtonComponent>
                </div>

                <div id="ticket-content" className="bg-white border-2 border-gray-300 rounded-lg shadow-lg p-8">
                    {/* Ticket Header */}
                    <div className="text-center border-b-2 border-dashed border-gray-300 pb-6 mb-6">
                        <h1 className="text-3xl font-bold text-primary mb-2">✈️ TRAVEL TICKET</h1>
                        <p className="text-gray-600">Confirmed Booking</p>
                        <div className="mt-4 text-xl font-mono font-bold bg-gray-100 p-2 rounded">
                            {travelId}
                        </div>
                    </div>

                    {/* Passenger Information */}
                    <div className="mb-6">
                        <h3 className="text-lg font-semibold mb-4 text-gray-800 border-b pb-2">👤 Passenger Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-gray-600">Lead Traveler</p>
                                <p className="font-semibold text-lg">{booking.travelerName}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Contact</p>
                                <p className="font-medium">{booking.email}</p>
                                <p className="font-medium">{booking.phone}</p>
                            </div>
                        </div>
                        
                        {booking.numberOfMembers > 1 && (
                            <div className="mt-4">
                                <p className="text-sm text-gray-600 mb-2">All Travelers ({booking.numberOfMembers} members)</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    <div className="flex justify-between">
                                        <span>1. {booking.travelerName}</span>
                                        <span className="font-mono text-sm bg-blue-100 px-2 py-1 rounded">
                                            {seatAssignments[0] || 'N/A'}
                                        </span>
                                    </div>
                                    {memberNames.slice(1).map((name: string, index: number) => (
                                        <div key={index + 1} className="flex justify-between">
                                            <span>{index + 2}. {name}</span>
                                            <span className="font-mono text-sm bg-blue-100 px-2 py-1 rounded">
                                                {seatAssignments[index + 1] || 'N/A'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Flight Information */}
                    <div className="mb-6">
                        <h3 className="text-lg font-semibold mb-4 text-gray-800 border-b pb-2">✈️ Flight Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <p className="text-sm text-gray-600">Flight Number</p>
                                <p className="font-bold text-xl">{booking.flightId}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Travel Date</p>
                                <p className="font-semibold">{departureDate.toLocaleDateString('en-IN', { 
                                    weekday: 'long', 
                                    year: 'numeric', 
                                    month: 'long', 
                                    day: 'numeric' 
                                })}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                            <div className="border rounded-lg p-4">
                                <p className="text-sm text-gray-600 mb-1">🛫 Departure</p>
                                <p className="font-bold text-lg">{booking.departureAirport}</p>
                                <p className="text-gray-700">
                                    {departureDate.toLocaleTimeString('en-IN', { 
                                        hour: '2-digit', 
                                        minute: '2-digit',
                                        hour12: true 
                                    })}
                                </p>
                            </div>
                            <div className="border rounded-lg p-4">
                                <p className="text-sm text-gray-600 mb-1">🛬 Arrival</p>
                                <p className="font-bold text-lg">{booking.destination}</p>
                                <p className="text-gray-700">
                                    {arrivalDate.toLocaleTimeString('en-IN', { 
                                        hour: '2-digit', 
                                        minute: '2-digit',
                                        hour12: true 
                                    })}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Booking Details */}
                    <div className="mb-6">
                        <h3 className="text-lg font-semibold mb-4 text-gray-800 border-b pb-2">📋 Booking Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <p className="text-sm text-gray-600">Booking ID</p>
                                <p className="font-mono font-semibold">{booking.$id.slice(-8).toUpperCase()}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Travel ID</p>
                                <p className="font-mono font-semibold">{travelId}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Status</p>
                                <p className="font-semibold text-green-600">✅ CONFIRMED</p>
                            </div>
                        </div>
                    </div>

                    {/* Barcode/QR Code Placeholder */}
                    <div className="text-center border-t-2 border-dashed border-gray-300 pt-6 mt-6">
                        <p className="text-sm text-gray-600 mb-2">Boarding Pass Code</p>
                        <div className="font-mono text-2xl tracking-widest bg-gray-100 p-4 rounded inline-block">
                            ||||| |||| ||||| |||| |||||
                        </div>
                        <p className="text-xs text-gray-500 mt-2">Present this ticket at the airport</p>
                    </div>

                    {/* Footer */}
                    <div className="text-center mt-6 text-sm text-gray-500">
                        <p>Thank you for choosing our travel services!</p>
                        <p>For assistance, contact us at support@travelagency.com</p>
                        <p className="mt-2">Generated on: {currentTime.toLocaleString('en-IN')}</p>
                    </div>
                </div>

                <div className="mt-6 text-center text-sm text-gray-600">
                    <p>⚠️ Please arrive at the airport at least 2 hours before domestic flights and 3 hours before international flights.</p>
                    <p>📱 Save this ticket to your phone or take a printout for airport check-in.</p>
                </div>
            </section>
        </main>
    );
};

export default Ticket;
