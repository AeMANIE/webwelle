import type Stripe from 'stripe';

export function isCheckoutSessionPaid(session: Pick<Stripe.Checkout.Session, 'payment_status'>): boolean {
  return session.payment_status === 'paid';
}

/** Fetch latest session from Stripe when webhook payload may be stale. */
export async function resolveCheckoutSession(
  session: Stripe.Checkout.Session,
  stripe: Stripe
): Promise<Stripe.Checkout.Session> {
  if (!session.id) return session;
  return stripe.checkout.sessions.retrieve(session.id);
}

export async function resolvePaidCheckoutSession(
  session: Stripe.Checkout.Session,
  stripe: Stripe
): Promise<Stripe.Checkout.Session | null> {
  const latest = await resolveCheckoutSession(session, stripe);
  return isCheckoutSessionPaid(latest) ? latest : null;
}
