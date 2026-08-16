import { Query } from "appwrite";
import { database, appwriteConfig } from "./client";

export const getUserBookings = async (userId: string) => {
    console.log('🚀 getUserBookings called for userId:', userId);
    try {
        const bookingsCollectionId = import.meta.env.VITE_APPWRITE_BOOKINGS_COLLECTION_ID;
        if (!bookingsCollectionId) {
            console.error('VITE_APPWRITE_BOOKINGS_COLLECTION_ID is missing');
            return { bookings: [], total: 0 };
        }

        const bookings = await database.listDocuments(
            appwriteConfig.databaseId,
            bookingsCollectionId,
            [
                Query.equal('userId', userId),
                Query.orderDesc('$createdAt')
            ]
        );

        console.log('🎉 Bookings fetched successfully:', bookings.total);

        return {
            bookings: bookings.documents,
            total: bookings.total,
        };
    } catch (error: any) {
        console.error('❌ Error fetching user bookings:', error);
        return { bookings: [], total: 0 };
    }
};
