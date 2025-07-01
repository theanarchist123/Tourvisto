import { sendBookingReminder } from '~/lib/booking';

export const action = async ({ request, params }: { request: Request; params: any }) => {
    if (request.method !== 'POST') {
        return new Response('Method not allowed', { status: 405 });
    }

    try {
        const { bookingId } = params;
        
        if (!bookingId) {
            return Response.json(
                { error: 'Booking ID is required' },
                { status: 400 }
            );
        }
        
        const result = await sendBookingReminder(bookingId);
        
        return Response.json(result);

    } catch (error: any) {
        console.error('Error sending booking reminder:', error);
        return Response.json(
            { 
                error: 'Failed to send booking reminder', 
                details: error.message 
            },
            { status: 500 }
        );
    }
};
