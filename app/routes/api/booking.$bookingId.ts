import { Client, Databases } from 'appwrite';

// Create a server-side client
const serverClient = new Client()
    .setEndpoint(import.meta.env.VITE_APPWRITE_API_ENDPOINT!)
    .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID!);

const serverDatabase = new Databases(serverClient);

export const loader = async ({ params }: { params: { bookingId: string } }) => {
    const { bookingId } = params;
    
    console.log('Fetching booking with ID:', bookingId);
    
    try {
        const booking = await serverDatabase.getDocument(
            import.meta.env.VITE_APPWRITE_DATABASE_ID!,
            import.meta.env.VITE_APPWRITE_BOOKINGS_COLLECTION_ID!,
            bookingId
        );

        console.log('Booking found:', booking);
        return Response.json(booking);
    } catch (error: any) {
        console.error('Error fetching booking:', error);
        console.error('Error details:', {
            message: error.message,
            code: error.code,
            type: error.type
        });
        
        return Response.json(
            { 
                error: 'Booking not found',
                details: error.message,
                bookingId: bookingId
            },
            { status: 404 }
        );
    }
};
