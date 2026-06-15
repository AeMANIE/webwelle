import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { isCheckoutSessionPaid } from './stripe-checkout-paid';

describe('isCheckoutSessionPaid', () => {
  it('returns true when payment_status is paid', () => {
    assert.equal(isCheckoutSessionPaid({ payment_status: 'paid' }), true);
  });

  it('returns false when payment_status is unpaid', () => {
    assert.equal(isCheckoutSessionPaid({ payment_status: 'unpaid' }), false);
  });

  it('returns false when payment_status is no_payment_required', () => {
    assert.equal(isCheckoutSessionPaid({ payment_status: 'no_payment_required' }), false);
  });
});
