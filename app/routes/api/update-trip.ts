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
        const { tripId, tripDetail } = await request.json();
        
        if (!tripId || !tripDetail) {
            return Response.json({ error: 'Missing tripId or tripDetail' }, { status: 400 });
        }

        await serverDatabase.updateDocument(
            import.meta.env.VITE_APPWRITE_DATABASE_ID!,
            import.meta.env.VITE_APPWRITE_TRIPS_COLLECTION_ID!,
            tripId,
            { tripDetail: JSON.stringify(tripDetail) }
        );

        return Response.json({ success: true });
    } catch (error: any) {
        console.error('Error updating trip:', error);
        return Response.json(
            { error: 'Failed to update trip' },
            { status: 500 }
        );
    }
};
