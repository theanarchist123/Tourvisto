import { Client, Databases } from 'appwrite';
import { sendEmail, validateEmailConfig } from '~/lib/email';

// Create a server-side client
const serverClient = new Client()
    .setEndpoint(import.meta.env.VITE_APPWRITE_API_ENDPOINT!)
    .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID!);

const serverDatabase = new Databases(serverClient);

export const action = async ({ request }: { request: Request }) => {
    if (request.method !== 'POST') {
        return new Response('Method not allowed', { status: 405 });
    }

    try {
        // Validate email configuration first
        validateEmailConfig();
        
        const { bookingId } = await request.json();
        
        console.log('Sending ticket email for booking:', bookingId);
        
        // Fetch booking details
        const booking = await serverDatabase.getDocument(
            import.meta.env.VITE_APPWRITE_DATABASE_ID!,
            import.meta.env.VITE_APPWRITE_BOOKINGS_COLLECTION_ID!,
            bookingId
        );

        if (!booking) {
            return Response.json(
                { error: 'Booking not found' },
                { status: 404 }
            );
        }

        // Parse booking data
        const memberNames = JSON.parse(booking.memberNames || '[]');
        const seatAssignments = JSON.parse(booking.seatAssignments || '[]');
        const departureDate = new Date(booking.departureTime);
        const arrivalDate = new Date(booking.arrivalTime);

        // Generate travel ID
        const travelId = `TR${booking.$id.slice(-6).toUpperCase()}`;

        // Create email content
        const emailSubject = `✈️ Your Travel Ticket - ${booking.destination}`;
        
        const emailHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${emailSubject}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .header h1 { margin: 0; font-size: 24px; }
        .header p { margin: 5px 0 0 0; opacity: 0.9; }
        .ticket { border: 2px solid #2563eb; margin: 20px 0; padding: 20px; border-radius: 0 0 8px 8px; }
        .section { margin: 20px 0; }
        .section h3 { color: #2563eb; margin-bottom: 15px; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .label { font-weight: bold; color: #2563eb; margin-bottom: 5px; }
        .value { margin-bottom: 15px; color: #374151; }
        .barcode { text-align: center; font-family: monospace; letter-spacing: 2px; background: #f3f4f6; padding: 15px; border-radius: 4px; margin: 20px 0; }
        .footer { background: #f9fafb; padding: 20px; text-align: center; margin-top: 20px; border-radius: 8px; }
        .footer h4 { color: #2563eb; margin-bottom: 10px; }
        .footer ul { text-align: left; display: inline-block; margin: 0; padding-left: 20px; }
        .footer li { margin-bottom: 5px; }
        .contact { margin-top: 20px; color: #2563eb; font-weight: bold; }
        .disclaimer { margin-top: 15px; color: #6b7280; font-size: 12px; }
        @media (max-width: 600px) {
            .grid { grid-template-columns: 1fr; }
            .container { padding: 10px; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>✈️ Your Travel Ticket</h1>
            <p>Tourvisto - Your Journey Begins Here</p>
        </div>
        
        <div class="ticket">
            <div class="section">
                <h3>🧳 Travel Information</h3>
                <div class="grid">
                    <div>
                        <div class="label">Travel ID:</div>
                        <div class="value">${travelId}</div>
                        
                        <div class="label">Destination:</div>
                        <div class="value">${booking.destination}</div>
                        
                        <div class="label">Flight:</div>
                        <div class="value">${booking.flightId}</div>
                        
                        <div class="label">Departure Airport:</div>
                        <div class="value">${booking.departureAirport}</div>
                    </div>
                    <div>
                        <div class="label">Travel Date:</div>
                        <div class="value">${departureDate.toLocaleDateString()}</div>
                        
                        <div class="label">Departure Time:</div>
                        <div class="value">${departureDate.toLocaleTimeString()}</div>
                        
                        <div class="label">Arrival Time:</div>
                        <div class="value">${arrivalDate.toLocaleTimeString()}</div>
                        
                        <div class="label">Status:</div>
                        <div class="value">✅ Confirmed</div>
                    </div>
                </div>
            </div>
            
            <div class="section">
                <h3>👤 Traveler Details</h3>
                <div class="grid">
                    <div>
                        <div class="label">Lead Traveler:</div>
                        <div class="value">${booking.travelerName}</div>
                        
                        <div class="label">Email:</div>
                        <div class="value">${booking.email}</div>
                        
                        <div class="label">Phone:</div>
                        <div class="value">${booking.phone}</div>
                    </div>
                    <div>
                        <div class="label">Number of Members:</div>
                        <div class="value">${booking.numberOfMembers}</div>
                        
                        <div class="label">Seat Assignments:</div>
                        <div class="value">${seatAssignments.join(', ')}</div>
                    </div>
                </div>
                
                ${booking.numberOfMembers > 1 ? `
                <div style="margin-top: 15px;">
                    <div class="label">All Members:</div>
                    <ul style="margin: 5px 0; padding-left: 20px;">
                        <li>${booking.travelerName} (Lead Traveler)</li>
                        ${memberNames.slice(1).map((name: string) => `<li>${name}</li>`).join('')}
                    </ul>
                </div>
                ` : ''}
            </div>
            
            <div class="barcode">
                📱 ${travelId}-${booking.flightId}-${booking.$id.slice(-4).toUpperCase()}
            </div>
        </div>
        
        <div class="footer">
            <h4>📋 Important Travel Instructions</h4>
            <ul>
                <li>Arrive at the airport at least 2 hours before departure</li>
                <li>Carry a valid photo ID for check-in</li>
                <li>Check baggage restrictions with the airline</li>
                <li>Keep this ticket handy during your journey</li>
                <li>Complete online check-in 24 hours before departure</li>
            </ul>
            
            <div class="contact">
                🆘 Need help? Contact us at support@tourvisto.com
            </div>
            
            <div class="disclaimer">
                This is an automated email. Please do not reply to this email.<br>
                © 2025 Tourvisto. All rights reserved.
            </div>
        </div>
    </div>
</body>
</html>
        `;

        const emailText = `
Your Travel Ticket - ${booking.destination}

Travel ID: ${travelId}
Flight: ${booking.flightId}
Destination: ${booking.destination}
Departure: ${departureDate.toLocaleString()}
Arrival: ${arrivalDate.toLocaleString()}

Traveler: ${booking.travelerName}
Email: ${booking.email}
Phone: ${booking.phone}
Members: ${booking.numberOfMembers}
Seats: ${seatAssignments.join(', ')}

Status: Confirmed ✅

Important: Arrive at airport 2 hours before departure.
Contact: support@tourvisto.com

Tourvisto - Your Journey Begins Here
        `;

        // Send email using Nodemailer
        const emailResult = await sendEmail({
            to: booking.email,
            subject: emailSubject,
            html: emailHtml,
            text: emailText
        });

        return Response.json({ 
            success: true,
            message: 'Ticket email sent successfully',
            recipient: booking.email,
            travelId: travelId,
            messageId: emailResult.messageId
        });

    } catch (error: any) {
        console.error('Error sending ticket email:', error);
        return Response.json(
            { 
                error: 'Failed to send ticket email', 
                details: error.message 
            },
            { status: 500 }
        );
    }
};
