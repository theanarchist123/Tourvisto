import Stripe from 'stripe';

// Debug: Log available environment variables
console.log('Available environment variables:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('STRIPE_SECRET_KEY exists:', !!process.env.STRIPE_SECRET_KEY);
console.log('All env keys:', Object.keys(process.env).filter(key => key.includes('STRIPE')));

// Get the Stripe secret key from environment variables
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
    console.error('STRIPE_SECRET_KEY is not defined in environment variables');
    console.error('Available env vars:', Object.keys(process.env));
    throw new Error('STRIPE_SECRET_KEY is not defined in environment variables');
}

console.log('Stripe key found, initializing Stripe...');

export const stripe = new Stripe(stripeSecretKey, {
    apiVersion: '2025-05-28.basil' // Using the correct API version
})

export const createProduct = async (
    name: string, description: string, images: string[], price:number, tripId: string
) => {
    const product = await stripe.products.create({
        name,
        description,
        images
    });

    const priceObject = await stripe.prices.create({
        product: product.id,
        unit_amount: price * 100,
        currency: 'usd'
    })

    const paymentLink = await stripe.paymentLinks.create({
        line_items: [{ price: priceObject.id, quantity: 1}],
        metadata: { tripId },
        after_completion: {
            type: 'redirect',
            redirect: {
                url: `${process.env.VITE_BASE_URL}/travel/${tripId}/success`
            }
        }
    })

    return paymentLink;
}