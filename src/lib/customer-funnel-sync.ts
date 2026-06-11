import { pool } from './database';
import { splitFullName } from './validation';

export interface CustomerFunnelSyncProfile {
  email: string;
  name: string;
  phone?: string | null;
  company_name?: string | null;
  street?: string | null;
  city?: string | null;
  zip?: string | null;
  country?: string | null;
}

/** Keep funnel_leads in sync when customers profile changes (offers, DocuSeal, Stripe). */
export async function syncFunnelLeadsFromCustomer(
  customerId: string,
  profile: CustomerFunnelSyncProfile
): Promise<number> {
  const { firstName, lastName } = splitFullName(profile.name || '');
  const email = profile.email.toLowerCase().trim();

  const client = await pool.connect();
  try {
    const result = await client.query(
      `UPDATE funnel_leads SET
        first_name = $1,
        last_name = $2,
        company_name = $3,
        email = $4,
        phone = $5,
        street = $6,
        postal_code = $7,
        city = $8,
        country = $9,
        customer_id = COALESCE(customer_id, $10::uuid),
        updated_at = NOW()
      WHERE customer_id = $10::uuid
         OR (
           LOWER(email) = LOWER($4)
           AND (customer_id IS NULL OR customer_id = $10::uuid)
         )
      RETURNING id`,
      [
        firstName || null,
        lastName || null,
        profile.company_name || null,
        email,
        profile.phone || null,
        profile.street || null,
        profile.zip || null,
        profile.city || null,
        profile.country || null,
        customerId,
      ]
    );
    return result.rowCount ?? 0;
  } finally {
    client.release();
  }
}
