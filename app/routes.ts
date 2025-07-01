import { type RouteConfig, route, layout, index } from "@react-router/dev/routes";

export default [
    route('sign-in', 'routes/root/sign-in.tsx'),
    route('api/create-trip', 'routes/api/create-trip.ts'),
    route('api/create-payment', 'routes/api/create-payment.ts'),
    route('api/create-booking', 'routes/api/create-booking.ts'),
    route('api/confirm-booking', 'routes/api/confirm-booking.ts'),
    route('api/send-ticket-email', 'routes/api/send-ticket-email.ts'),
    route('api/send-reminder/:bookingId', 'routes/api/send-reminder.$bookingId.ts'),
    route('api/delete-user/:userId', 'routes/api/delete-user.$userId.ts'),
    route('api/booking/:bookingId', 'routes/api/booking.$bookingId.ts'),
    route('api/trip/:tripId', 'routes/api/trip.$tripId.ts'),
    layout("routes/admin/admin-layout.tsx", [
        route('dashboard', 'routes/admin/dashboard.tsx'),
        route('all-users', 'routes/admin/all-users.tsx'),
        route('trips', 'routes/admin/trips.tsx'),
        route('trips/create', 'routes/admin/create-trip.tsx'),
        route('trips/:tripId', 'routes/admin/trip-detail.tsx'),
    ]),
    layout('routes/root/page-layout.tsx', [
        index('routes/root/travel-page.tsx'),
        route('/travel/:tripId', 'routes/root/travel-detail.tsx'),
        route('/book-trip/:tripId', 'routes/root/book-trip.tsx'),
        route('/payment/:bookingId', 'routes/root/payment.tsx'),
        route('/ticket/:bookingId', 'routes/root/ticket.$bookingId.tsx'),
        route('/payment-success', 'routes/root/payment-success.tsx'),
    ])
] satisfies RouteConfig;