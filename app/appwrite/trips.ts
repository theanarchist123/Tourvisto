import {appwriteConfig, database} from "~/appwrite/client";
import {Query} from "appwrite";

export const getAllTrips = async (limit: number, offset: number) => {
    try {
        const allTrips = await database.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.tripCollectionId,
            [Query.limit(limit), Query.offset(offset), Query.orderDesc('createdAt')]
        );

        if(allTrips.total === 0) {
            console.log('No trips found');
            return { allTrips: [], total: 0 };
        }

        return {
            allTrips: allTrips.documents,
            total: allTrips.total,
        };
    } catch (error: any) {
        console.error('Error fetching trips:', error);
        
        // Check if it's a permissions error
        if (error.code === 401 || error.type === 'general_unauthorized_scope') {
            console.error('Permissions error: Make sure the trips collection allows read access for guests/anonymous users');
            // Return empty array instead of throwing error
            return { allTrips: [], total: 0 };
        }
        
        // For other errors, still return empty array to prevent app crash
        return { allTrips: [], total: 0 };
    }
}

export const getTripById = async (tripId: string) => {
    try {
        const trip = await database.getDocument(
            appwriteConfig.databaseId,
            appwriteConfig.tripCollectionId,
            tripId
        );

        if(!trip.$id) {
            console.log('Trip not found');
            return null;
        }

        return trip;
    } catch (error: any) {
        console.error('Error fetching trip by ID:', error);
        
        // Check if it's a permissions error
        if (error.code === 401 || error.type === 'general_unauthorized_scope') {
            console.error('Permissions error: Make sure the trips collection allows read access for guests/anonymous users');
        }
        
        return null;
    }
}