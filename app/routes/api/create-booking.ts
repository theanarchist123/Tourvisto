import { Client, Databases, ID } from 'appwrite';

// Create a server-side client for admin operations
const serverClient = new Client()
    .setEndpoint(import.meta.env.VITE_APPWRITE_API_ENDPOINT!)
    .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID!);

const serverDatabase = new Databases(serverClient);

export const action = async ({ request }: { request: Request }) => {
    if (request.method !== 'POST') {
        return new Response('Method not allowed', { status: 405 });
    }

    try {
        const bookingData = await request.json();
        
        console.log('Received booking data:', bookingData);
        
        // Validate required fields
        if (!bookingData.tripId || !bookingData.userId || !bookingData.travelerName || 
            !bookingData.email || !bookingData.phone || !bookingData.travelDate) {
            console.error('Missing required fields:', bookingData);
            return Response.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }
        
        // Validate environment variables
        if (!import.meta.env.VITE_APPWRITE_DATABASE_ID || 
            !import.meta.env.VITE_APPWRITE_BOOKINGS_COLLECTION_ID) {
            console.error('Missing environment variables');
            return Response.json(
                { error: 'Server configuration error' },
                { status: 500 }
            );
        }
        
        // Generate flight details
        const generateFlightDetails = (departureAirport: string, destination: string, travelDate: string) => {
            const flightId = `AI${Math.floor(Math.random() * 9000) + 1000}`;
            const departureTime = new Date(travelDate);
            departureTime.setHours(Math.floor(Math.random() * 12) + 6); // Random time between 6 AM - 6 PM
            departureTime.setMinutes([0, 15, 30, 45][Math.floor(Math.random() * 4)]);
            
            const arrivalTime = new Date(departureTime);
            arrivalTime.setHours(arrivalTime.getHours() + Math.floor(Math.random() * 8) + 2); // 2-10 hours flight
            
            return {
                flightId,
                departureTime: departureTime.toISOString(),
                arrivalTime: arrivalTime.toISOString()
            };
        };

        // Generate seat assignments
        const generateSeatAssignments = (numberOfMembers: number) => {
            const seats = [];
            const rows = ['A', 'B', 'C', 'D', 'E', 'F'];
            const startRow = Math.floor(Math.random() * 20) + 10; // Rows 10-30
            
            for (let i = 0; i < numberOfMembers; i++) {
                const seatRow = startRow + Math.floor(i / 6);
                const seatColumn = rows[i % 6];
                seats.push(`${seatRow}${seatColumn}`);
            }
            
            return seats;
        };

        const flightDetails = generateFlightDetails(
            bookingData.departureAirport, 
            bookingData.destination, 
            bookingData.travelDate
        );
        
        const seatAssignments = generateSeatAssignments(bookingData.numberOfMembers);
        
        console.log('Generated flight details:', flightDetails);
        console.log('Generated seat assignments:', seatAssignments);
        
        // Create booking document
        const bookingsCollectionId = import.meta.env.VITE_APPWRITE_BOOKINGS_COLLECTION_ID!;
        
        console.log('About to create booking with:', {
            databaseId: import.meta.env.VITE_APPWRITE_DATABASE_ID,
            collectionId: bookingsCollectionId,
            tripId: bookingData.tripId,
            userId: bookingData.userId
        });
        
        // Extract only essential trip details to avoid size limit
        const essentialTripDetails = {
            name: bookingData.tripDetails?.name || bookingData.destination,
            duration: bookingData.tripDetails?.duration || '5 days',
            estimatedPrice: bookingData.tripDetails?.estimatedPrice || 'N/A',
            description: bookingData.tripDetails?.description?.substring(0, 500) || 'Trip details',
            highlights: Array.isArray(bookingData.tripDetails?.highlights) 
                ? bookingData.tripDetails.highlights.slice(0, 3) 
                : []
        };
        
        const tripDetailsString = JSON.stringify(essentialTripDetails);
        console.log('Essential trip details length:', tripDetailsString.length);
        
        const bookingDocument = {
            tripId: bookingData.tripId,
            userId: bookingData.userId,
            travelerName: bookingData.travelerName,
            email: bookingData.email,
            phone: bookingData.phone,
            numberOfMembers: bookingData.numberOfMembers,
            memberNames: JSON.stringify(bookingData.memberNames),
            departureAirport: bookingData.departureAirport,
            destination: bookingData.destination,
            travelDate: bookingData.travelDate,
            flightId: flightDetails.flightId,
            departureTime: flightDetails.departureTime,
            arrivalTime: flightDetails.arrivalTime,
            seatAssignments: JSON.stringify(seatAssignments),
            bookingStatus: 'pending',
            paymentStatus: 'pending',
            tripDetails: tripDetailsString,
            createdAt: new Date().toISOString()
        };
        
        console.log('Booking document to create:', bookingDocument);
        
        const booking = await serverDatabase.createDocument(
            import.meta.env.VITE_APPWRITE_DATABASE_ID!,
            bookingsCollectionId,
            ID.unique(),
            bookingDocument
        );
        
        console.log('Booking created successfully:', booking);

        return Response.json({ 
            id: booking.$id,
            status: 'success',
            message: 'Booking created successfully'
        });

    } catch (error: any) {
        console.error('Booking creation error:', error);
        console.error('Error details:', {
            message: error.message,
            code: error.code,
            type: error.type,
            response: error.response
        });
        
        // Handle specific Appwrite errors
        if (error.code === 404) {
            return Response.json(
                { error: 'Collection not found. Please check if the bookings collection exists in Appwrite.' },
                { status: 500 }
            );
        }
        
        if (error.code === 401) {
            return Response.json(
                { error: 'Authentication failed. Please check API key configuration.' },
                { status: 500 }
            );
        }
        
        return Response.json(
            { 
                error: 'Failed to create booking', 
                details: error.message || 'Unknown error',
                code: error.code || 'UNKNOWN'
            },
            { status: 500 }
        );
    }
};
