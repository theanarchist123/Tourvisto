import { Client, Databases, Query } from "appwrite";

// Create a separate client for public access without authentication
const publicClient = new Client();
publicClient
    .setEndpoint(import.meta.env.VITE_APPWRITE_API_ENDPOINT)
    .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID);

const publicDatabase = new Databases(publicClient);

export const getPublicTrips = async (limit: number, offset: number) => {
    console.log('🚀 getPublicTrips called with limit:', limit, 'offset:', offset);
    try {
        const allTrips = await publicDatabase.listDocuments(
            import.meta.env.VITE_APPWRITE_DATABASE_ID,
            import.meta.env.VITE_APPWRITE_TRIPS_COLLECTION_ID,
            [Query.limit(limit), Query.offset(offset), Query.orderDesc('$createdAt')]
        );

        console.log('🎉 Public trips fetched successfully:', allTrips);

        if(allTrips.total === 0) {
            console.log('No trips found');
            return { allTrips: [], total: 0 };
        }

        return {
            allTrips: allTrips.documents,
            total: allTrips.total,
        };
    } catch (error: any) {
        console.error('❌ Error fetching public trips:', error);
        
        if (error.code === 401) {
            console.error('❌ PERMISSION ERROR: The trips collection needs read permissions for guests/all users');
            console.error('📋 TO FIX: Go to Appwrite Console → Database → Trips Collection → Permissions');
            console.error('📋 ADD: Read permission for "role:all" or "role:guests"');
        }
        
        return { allTrips: [], total: 0 };
    }
};

export const getPublicTripById = async (tripId: string) => {
    console.log('🚀 getPublicTripById called with ID:', tripId);
    try {
        const trip = await publicDatabase.getDocument(
            import.meta.env.VITE_APPWRITE_DATABASE_ID,
            import.meta.env.VITE_APPWRITE_TRIPS_COLLECTION_ID,
            tripId
        );

        console.log('🎉 Public trip by ID fetched successfully:', trip);
        return trip;
    } catch (error: any) {
        console.error('❌ Error fetching public trip by ID:', error);
        
        if (error.code === 401) {
            console.error('❌ PERMISSION ERROR: The trips collection needs read permissions for guests/all users');
            console.error('📋 TO FIX: Go to Appwrite Console → Database → Trips Collection → Permissions');
            console.error('📋 ADD: Read permission for "role:all" or "role:guests"');
        }
        
        return null;
    }
};
