export type CustomerFreeTextKind =
  | 'industry_short'
  | 'industry_detail'
  | 'project_brief'
  | 'project_notes';

export const CUSTOMER_FREE_TEXT_LIMITS: Record<
  CustomerFreeTextKind,
  { min: number; max: number; label: string }
> = {
  industry_short: { min: 2, max: 80, label: 'Branche' },
  industry_detail: { min: 8, max: 300, label: 'Branchenbeschreibung' },
  project_brief: { min: 20, max: 2000, label: 'Projektbeschreibung' },
  project_notes: { min: 0, max: 1000, label: 'Zusatznotizen' },
};

export function getFreeTextLimit(kind: CustomerFreeTextKind) {
  return CUSTOMER_FREE_TEXT_LIMITS[kind];
}
