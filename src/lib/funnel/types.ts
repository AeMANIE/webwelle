export type DachMarket = 'DE' | 'AT' | 'CH';

export type FunnelLeadStatus =
  | 'new'
  | 'geo_complete'
  | 'research_running'
  | 'research_ready'
  | 'discount_selected'
  | 'contact_complete'
  | 'offer_viewed'
  | 'package_selected'
  | 'offer_sent'
  | 'signed'
  | 'checkout_sent'
  | 'paid'
  | 'lost';

export type DeliveryWindow =
  | '1_month'
  | '2_3_months'
  | '4_14_months'
  | '16_plus_months';

export const DELIVERY_DISCOUNTS: Record<DeliveryWindow, number> = {
  '1_month': 40000,
  '2_3_months': 20000,
  '4_14_months': 10000,
  '16_plus_months': 0,
};

export interface FunnelLead {
  id: string;
  token: string;
  status: FunnelLeadStatus;
  source: string;
  market: DachMarket | null;
  market_auto_detected: boolean;
  country: string | null;
  postal_code: string | null;
  city: string | null;
  industry_raw: string | null;
  industry_normalized: string | null;
  industry_detail: string | null;
  industry_confidence: number | null;
  geo_lat: number | null;
  geo_lng: number | null;
  first_name: string | null;
  last_name: string | null;
  company_name: string | null;
  email: string | null;
  phone: string | null;
  street: string | null;
  house_number: string | null;
  address_verified: boolean;
  email_verified_at: Date | null;
  phone_verified_at: Date | null;
  selected_package: string | null;
  selected_modules: unknown[];
  wants_custom_offer: boolean;
  design_reference_urls: string[];
  customer_id: string | null;
  created_at: Date;
  updated_at: Date;
  expires_at: Date;
}

export interface FunnelResearchResult {
  id: string;
  lead_id: string;
  workflow_key: string;
  status: string;
  payload: Record<string, unknown> | null;
  error_message: string | null;
  updated_at: Date;
}

export interface FunnelDiscountChoice {
  delivery_window: DeliveryWindow;
  discount_cents: number;
  selected_at: Date;
}
