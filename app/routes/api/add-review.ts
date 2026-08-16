import { Client, Databases } from 'appwrite';

const serverClient = new Client()
    .setEndpoint(import.meta.env.VITE_APPWRITE_API_ENDPOINT!)
    .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID!);

const serverDatabase = new Databases(serverClient);

export const action = async ({ request }: { request: Request }) => {
    if (request.method !== 'POST') {
        return new Response('Method not allowed', { status: 405 });
    }

    try {
        const { tripId, vibe, comment, userName } = await request.json();
        
        if (!tripId || !vibe || !comment || !userName) {
            return Response.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Fetch the trip
        const trip = await serverDatabase.getDocument(
            import.meta.env.VITE_APPWRITE_DATABASE_ID!,
            import.meta.env.VITE_APPWRITE_TRIPS_COLLECTION_ID!,
            tripId
        );

        const tripDetail = JSON.parse(trip.tripDetail);
        
        // Ensure reviews array exists
        if (!tripDetail.reviews) {
            tripDetail.reviews = [];
        }

        // Append new review
        tripDetail.reviews.push({
            vibe,
            comment,
            userName,
            date: new Date().toISOString()
        });

        // Save back to DB
        await serverDatabase.updateDocument(
            import.meta.env.VITE_APPWRITE_DATABASE_ID!,
            import.meta.env.VITE_APPWRITE_TRIPS_COLLECTION_ID!,
            tripId,
            { tripDetail: JSON.stringify(tripDetail) }
        );

        return Response.json({ success: true, reviews: tripDetail.reviews });
    } catch (error: any) {
        console.error('Error adding review:', error);
        return Response.json(
            { error: 'Failed to add review' },
            { status: 500 }
        );
    }
};
