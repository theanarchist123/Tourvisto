import { confirmBookingAndSendEmail } from '~/lib/booking';

export const action = async ({ request }: { request: Request }) => {
    if (request.method !== 'POST') {
        return new Response('Method not allowed', { status: 405 });
    }

    try {
        const { bookingId, sessionId } = await request.json();
        
        const result = await confirmBookingAndSendEmail(bookingId, sessionId);
        
        return Response.json(result);

    } catch (error: any) {
        console.error('Error confirming booking:', error);
        return Response.json(
            { 
                error: 'Failed to confirm booking', 
                details: error.message 
            },
            { status: 500 }
        );
    }
};
