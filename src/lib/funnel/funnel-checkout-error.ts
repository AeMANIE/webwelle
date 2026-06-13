import Stripe from 'stripe';

export class FunnelCheckoutError extends Error {
  constructor(
    message: string,
    public code: string,
    public priceId?: string,
    public stripeCode?: string
  ) {
    super(message);
    this.name = 'FunnelCheckoutError';
  }
}

function isStripeError(error: unknown): error is Stripe.errors.StripeError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'type' in error &&
    typeof (error as Stripe.errors.StripeError).type === 'string'
  );
}

export function mapCheckoutError(error: unknown): FunnelCheckoutError {
  if (error instanceof FunnelCheckoutError) return error;

  if (isStripeError(error)) {
    const code = error.code || error.type;
    const priceMatch = error.message.match(/price_[A-Za-z0-9]+/);
    const priceId = priceMatch?.[0];

    if (code === 'resource_missing' || error.message.includes('No such price')) {
      return new FunnelCheckoutError(
        error.message ||
          'Stripe-Preis nicht gefunden. Bitte STRIPE_PRICE_* in Coolify mit den Price-IDs aus dem Stripe-Dashboard abgleichen (Test vs. Live).',
        'stripe_price_missing',
        priceId,
        code
      );
    }
    return new FunnelCheckoutError(
      `Stripe-Fehler: ${error.message}`,
      'stripe_error',
      priceId,
      code
    );
  }

  if (error instanceof Error) {
    if (/offer_checkout_sessions|relation .* does not exist/i.test(error.message)) {
      return new FunnelCheckoutError(
        'Checkout-Tabelle fehlt in der Datenbank. Bitte Deployment neu starten oder /api/migrate ausführen.',
        'db_schema_missing'
      );
    }
    return new FunnelCheckoutError(error.message, 'checkout_failed');
  }

  return new FunnelCheckoutError(
    'Checkout konnte nicht gestartet werden.',
    'checkout_failed'
  );
}
