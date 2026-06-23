import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { dwaLeadProductTitle } from '@/app/components/leistungen-offers';
import { getAdminOrderNotificationEmail } from '@/lib/admin-order-notification';
import {
  renderWebWelleAdminDwaConsultationEmail,
  renderWebWelleAdminPaidOrderEmail,
} from '@/lib/email-templates/webwelle';

describe('getAdminOrderNotificationEmail', () => {
  it('defaults to info@webwelle.com when env is unset', () => {
    const previous = process.env.ADMIN_ORDER_NOTIFICATION_EMAIL;
    delete process.env.ADMIN_ORDER_NOTIFICATION_EMAIL;
    assert.equal(getAdminOrderNotificationEmail(), 'info@webwelle.com');
    if (previous !== undefined) {
      process.env.ADMIN_ORDER_NOTIFICATION_EMAIL = previous;
    }
  });
});

describe('renderWebWelleAdminPaidOrderEmail', () => {
  it('includes customer name, package and total amount', () => {
    const mail = renderWebWelleAdminPaidOrderEmail({
      customerName: 'Max Mustermann',
      customerEmail: 'max@example.com',
      packageName: 'StarterWelle',
      packagePrice: '1.990,00 €',
      isMonthly: false,
      selectedAddons: [{ label: 'SEO Profi', price: '299,00 €', billing: 'monthly' }],
      totalAmount: 2289,
      currency: 'eur',
      sessionId: 'cs_test_123',
      source: 'funnel',
      leadId: 'lead-42',
      offerId: 'offer-7',
      invoiceNumber: 'WW-2026-TEST1234',
      hasInvoicePdf: true,
    });

    assert.match(mail.subject, /StarterWelle/);
    assert.match(mail.subject, /Max Mustermann/);
    assert.match(mail.html, /Max Mustermann/);
    assert.match(mail.html, /StarterWelle/);
    assert.match(mail.html, /2289\.00 EUR/);
    assert.match(mail.text, /Lead-ID: lead-42/);
    assert.match(mail.html, /Kundenrechnung liegt als PDF im Anhang/);
  });
});

describe('renderWebWelleAdminDwaConsultationEmail', () => {
  it('includes project brief and product title from lead source', () => {
    const productTitle = dwaLeadProductTitle('leistungen_executive_ki');
    const brief = 'Wir möchten unsere Website modernisieren und KI-Prozesse integrieren.';

    const mail = renderWebWelleAdminDwaConsultationEmail({
      productTitle,
      customerName: 'Firma XY',
      customerEmail: 'kontakt@firma-xy.de',
      customerPhone: '+49 831 123456',
      companyName: 'Firma XY GmbH',
      industry: 'Handwerk',
      projectBrief: brief,
      postalCode: '87437',
      city: 'Kempten',
      market: 'DE',
      selectedSolutions: ['Mehrsprachige Umsetzung'],
      projectNotes: 'Bitte Rückruf am Nachmittag.',
      leadId: 'dwa-lead-1',
      leadToken: 'token-abc',
    });

    assert.match(mail.subject, new RegExp(productTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    assert.match(mail.subject, /Firma XY/);
    assert.match(mail.html, /modernisieren und KI-Prozesse integrieren/);
    assert.ok(mail.text.includes(brief));
    assert.match(mail.html, /Mehrsprachige Umsetzung/);
    assert.match(mail.html, /Handwerk/);
  });
});
