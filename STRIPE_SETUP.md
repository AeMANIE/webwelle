# Stripe Integration Setup

## Umgebungsvariablen

Erstellen Sie eine `.env.local` Datei im Projektverzeichnis mit folgenden Variablen:

```env
# Stripe Konfiguration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
STRIPE_SECRET_KEY=sk_test_your_secret_key_here

# Website URL
NEXT_PUBLIC_BASE_URL=https://webwelle.com

# Stripe Webhook Secret (für Produktion)
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

## Stripe Dashboard Setup

1. **Stripe Account erstellen**: Gehen Sie zu https://stripe.com und erstellen Sie einen Account

2. **API Keys abrufen**: 
   - Gehen Sie zu "Developers" > "API Keys"
   - Kopieren Sie den "Publishable key" und "Secret key"

3. **Produkte und Preise erstellen**:
   - Gehen Sie zu "Products" im Stripe Dashboard
   - Erstellen Sie folgende Produkte:

   **Next.js Website Paket:**
   - Produktname: "React/Next.js Website"
   - Einmalzahlung: €2.490,00 ✅ (Price ID: price_1SCfs1QoIwTqROayf5unUmw5)
   - Monatlich: €119,00 (wiederkehrend) ✅ (Price ID: price_1SCfrMQoIwTqROaytxsYCUXq)

   **WordPress Website Paket:**
   - Produktname: "WordPress Website" 
   - Einmalzahlung: €1.290,00 ⏳ (noch zu erstellen)
   - Monatlich: €65,00 (wiederkehrend) ⏳ (noch zu erstellen)

4. **Price IDs aktualisieren**: ✅ ERLEDIGT
   - Next.js Price IDs wurden bereits in `/src/lib/stripe.ts` aktualisiert
   - WordPress Price IDs werden aktualisiert, sobald die Produkte erstellt sind

## Webhook Setup (Optional)

Für erweiterte Funktionen können Sie Webhooks einrichten:

1. Gehen Sie zu "Developers" > "Webhooks"
2. Fügen Sie einen Endpoint hinzu: `https://webwelle.com/api/stripe/webhook`
3. Wählen Sie folgende Events:
   - `checkout.session.completed`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`

## Testen

1. Verwenden Sie Stripe Test-Karten:
   - Erfolgreiche Zahlung: `4242 4242 4242 4242`
   - Fehlgeschlagene Zahlung: `4000 0000 0000 0002`

2. Testen Sie beide Zahlungsarten:
   - Einmalzahlung
   - Monatliche Abonnements

## Produktion

1. Wechseln Sie zu Live-Modus im Stripe Dashboard
2. Aktualisieren Sie die API Keys in `.env.local`
3. Erstellen Sie die Produkte im Live-Modus
4. Aktualisieren Sie die Price IDs
