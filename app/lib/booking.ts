import { Client, Databases } from 'appwrite';
import { sendEmail, validateEmailConfig } from '~/lib/email';
import { sendSMS, createBookingConfirmationSMS, createBookingReminderSMS, validateSMSConfig } from '~/lib/sms';

// Create a server-side client
const serverClient = new Client()
    .setEndpoint(import.meta.env.VITE_APPWRITE_API_ENDPOINT!)
    .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID!);

const serverDatabase = new Databases(serverClient);

export const confirmBookingAndSendEmail = async (bookingId: string, sessionId: string) => {
    try {
        console.log('Confirming booking:', bookingId);
        
        // Update booking status to confirmed
        const updatedBooking = await serverDatabase.updateDocument(
            import.meta.env.VITE_APPWRITE_DATABASE_ID!,
            import.meta.env.VITE_APPWRITE_BOOKINGS_COLLECTION_ID!,
            bookingId,
            {
                bookingStatus: 'confirmed',
                paymentStatus: 'completed'
            }
        );

        console.log(`Booking ${bookingId} confirmed. Sending email to ${updatedBooking.email}`);

        // Send ticket email notification directly using email service
        try {
            // Validate email configuration
            validateEmailConfig();
            
            // Parse booking data for email
            const memberNames = JSON.parse(updatedBooking.memberNames || '[]');
            const seatAssignments = JSON.parse(updatedBooking.seatAssignments || '[]');
            const departureDate = new Date(updatedBooking.departureTime);
            const arrivalDate = new Date(updatedBooking.arrivalTime);
            const travelId = `TR${updatedBooking.$id.slice(-6).toUpperCase()}`;

            // Create email content
            const emailSubject = `✈️ Your Travel Ticket - ${updatedBooking.destination}`;
            
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
                        <div class="value">${updatedBooking.destination}</div>
                        
                        <div class="label">Flight:</div>
                        <div class="value">${updatedBooking.flightId}</div>
                        
                        <div class="label">Departure Airport:</div>
                        <div class="value">${updatedBooking.departureAirport}</div>
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
                        <div class="value">${updatedBooking.travelerName}</div>
                        
                        <div class="label">Email:</div>
                        <div class="value">${updatedBooking.email}</div>
                        
                        <div class="label">Phone:</div>
                        <div class="value">${updatedBooking.phone}</div>
                    </div>
                    <div>
                        <div class="label">Number of Members:</div>
                        <div class="value">${updatedBooking.numberOfMembers}</div>
                        
                        <div class="label">Seat Assignments:</div>
                        <div class="value">${seatAssignments.join(', ')}</div>
                    </div>
                </div>
                
                ${updatedBooking.numberOfMembers > 1 ? `
                <div style="margin-top: 15px;">
                    <div class="label">All Members:</div>
                    <ul style="margin: 5px 0; padding-left: 20px;">
                        <li>${updatedBooking.travelerName} (Lead Traveler)</li>
                        ${memberNames.slice(1).map((name: string) => `<li>${name}</li>`).join('')}
                    </ul>
                </div>
                ` : ''}
            </div>
            
            <div class="barcode">
                📱 ${travelId}-${updatedBooking.flightId}-${updatedBooking.$id.slice(-4).toUpperCase()}
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
Your Travel Ticket - ${updatedBooking.destination}

Travel ID: ${travelId}
Flight: ${updatedBooking.flightId}
Destination: ${updatedBooking.destination}
Departure: ${departureDate.toLocaleString()}
Arrival: ${arrivalDate.toLocaleString()}

Traveler: ${updatedBooking.travelerName}
Email: ${updatedBooking.email}
Phone: ${updatedBooking.phone}
Members: ${updatedBooking.numberOfMembers}
Seats: ${seatAssignments.join(', ')}

Status: Confirmed ✅

Important: Arrive at airport 2 hours before departure.
Contact: support@tourvisto.com

Tourvisto - Your Journey Begins Here
            `;

            // Send email using Nodemailer
            const emailResult = await sendEmail({
                to: updatedBooking.email,
                subject: emailSubject,
                html: emailHtml,
                text: emailText
            });

            console.log('✅ Ticket email sent successfully:', emailResult.messageId);

        } catch (emailError) {
            console.error('❌ Error sending email:', emailError);
            // Don't throw - booking is still confirmed even if email fails
        }

        // Send SMS notification
        console.log('📱 Starting SMS notification process...');
        try {
            // Create SMS message
            const smsMessage = createBookingConfirmationSMS(updatedBooking);
            console.log('📝 SMS message created, length:', smsMessage.length);
            console.log('📞 Sending SMS to:', updatedBooking.phone);
            
            // Send SMS notification
            const smsResult = await sendSMS({
                to: updatedBooking.phone,
                message: smsMessage
            });

            console.log('✅ Booking confirmation SMS sent successfully!');
            console.log('📧 SMS Details:', {
                messageId: smsResult.messageId,
                status: smsResult.status,
                to: smsResult.to
            });

        } catch (smsError: any) {
            console.error('❌ SMS sending failed:', smsError.message);
            console.error('📱 Full SMS Error:', smsError);
            // Don't throw - booking is still confirmed even if SMS fails
        }

        return {
            success: true,
            booking: updatedBooking,
            message: 'Booking confirmed successfully. Email and SMS notifications sent.'
        };

    } catch (error: any) {
        console.error('Error confirming booking:', error);
        throw new Error(`Failed to confirm booking: ${error.message}`);
    }
};

export const sendBookingReminder = async (bookingId: string) => {
    try {
        console.log('Sending booking reminder for:', bookingId);
        
        // Get booking details
        const booking = await serverDatabase.getDocument(
            import.meta.env.VITE_APPWRITE_DATABASE_ID!,
            import.meta.env.VITE_APPWRITE_BOOKINGS_COLLECTION_ID!,
            bookingId
        );

        if (booking.bookingStatus !== 'confirmed') {
            throw new Error('Cannot send reminder for unconfirmed booking');
        }

        // Send reminder SMS
        try {
            validateSMSConfig();
            
            const reminderMessage = createBookingReminderSMS(booking);
            
            const smsResult = await sendSMS({
                to: booking.phone,
                message: reminderMessage
            });

            console.log('✅ Booking reminder SMS sent successfully:', smsResult.messageId);

            return {
                success: true,
                messageId: smsResult.messageId,
                message: 'Booking reminder sent successfully'
            };

        } catch (smsError: any) {
            console.error('❌ Error sending reminder SMS:', smsError);
            throw new Error(`Failed to send reminder SMS: ${smsError.message}`);
        }

    } catch (error: any) {
        console.error('Error sending booking reminder:', error);
        throw new Error(`Failed to send booking reminder: ${error.message}`);
    }
};
