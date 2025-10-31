// api/checkout-session.js
import Stripe from 'stripe';

export default async function handler(req, res) {
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const { session_id } = req.query;
    if (!session_id) return res.status(400).json({ error: 'missing session_id' });

    const session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ['customer', 'line_items.data.price.product']
    });

    const product = session.line_items?.data?.[0]?.price?.product;
    const planLabel =
      typeof product === 'object' ? product.name :
      session.metadata?.plan || 'Plano';

    const customer = session.customer_details || {};
    const phone = customer.phone || session.customer?.phone || '';

    return res.status(200).json({
      plan: planLabel,
      amount_total: session.amount_total,
      currency: session.currency,
      email: customer.email || '',
      name: customer.name || '',
      phone
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'stripe_failed' });
  }
}
