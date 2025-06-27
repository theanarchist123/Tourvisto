import { getPublicTripById } from '~/appwrite/public-trips';

export const loader = async ({ params }: { params: { tripId: string } }) => {
    const { tripId } = params;
    
    try {
        const trip = await getPublicTripById(tripId);
        
        if (!trip) {
            return Response.json(
                { error: 'Trip not found' },
                { status: 404 }
            );
        }

        return Response.json(trip);
    } catch (error) {
        console.error('Error fetching trip:', error);
        return Response.json(
            { error: 'Failed to fetch trip' },
            { status: 500 }
        );
    }
};
