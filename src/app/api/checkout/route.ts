import Stripe from 'stripe';
import { NextResponse } from 'next/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-09-30.clover',
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { plan, email } = body;

    const prices: Record<string, string> = {
      starter: 'price_1SLLnmPPDtKDq7IdE9BzoEEc', // remplace par l’ID du prix Stripe
      pro: 'price_1SLLp5PPDtKDq7Id6OxJV7I9',         // idem
    };

    if (!prices[plan]) {
      return NextResponse.json({ error: 'Plan invalide' }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer_email: email,
      line_items: [
        {
          price: prices[plan],
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_DOMAIN}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_DOMAIN}/auth/register?canceled=true`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Erreur Stripe:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
