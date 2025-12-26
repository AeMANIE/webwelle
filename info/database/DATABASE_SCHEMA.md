# Datenbank-Schema Dokumentation

**Stand:** 2025-12-26  
**Datenbank:** PostgreSQL  
**Gesamt Tabellen:** 9  
**Vorhanden:** 9  
**Fehlend:** 0  
**Gesamt Zeilen:** 10

---

## Tabellen-Übersicht

### ✅ customers
**Zeilen:** 3

#### Spalten (15)
| Name | Typ | Nullable |
|------|-----|----------|
| id | uuid | ❌ |
| email | character varying | ❌ |
| password_hash | character varying | ✅ |
| name | character varying | ✅ |
| phone | character varying | ✅ |
| company_name | character varying | ✅ |
| is_verified | boolean | ✅ |
| verification_token | character varying | ✅ |
| reset_token | character varying | ✅ |
| reset_token_expires | timestamp without time zone | ✅ |
| portal_activated | boolean | ✅ |
| portal_activated_at | timestamp without time zone | ✅ |
| created_at | timestamp with time zone | ✅ |
| updated_at | timestamp with time zone | ✅ |
| customer_number | character varying | ✅ |

#### Indizes (5)
- `customers_pkey` (Primary Key)
- `customers_email_key` (Unique)
- `idx_customers_email`
- `idx_customers_portal_activated`
- `customers_customer_number_key` (Unique)

---

### ✅ webwelle_bookings
**Zeilen:** 1

#### Spalten (28)
| Name | Typ | Nullable |
|------|-----|----------|
| id | uuid | ❌ |
| created_at | timestamp with time zone | ✅ |
| status | character varying | ❌ |
| session_id | character varying | ❌ |
| package_type | character varying | ❌ |
| is_monthly | boolean | ❌ |
| checkout_mode | character varying | ❌ |
| package_price_display | character varying | ❌ |
| currency | character varying | ❌ |
| total_amount_cents | integer | ❌ |
| customer_id | uuid | ✅ |
| customer_name | character varying | ✅ |
| customer_email | character varying | ✅ |
| customer_phone | character varying | ✅ |
| company_name | character varying | ✅ |
| existing_website | boolean | ✅ |
| existing_website_url | text | ✅ |
| target_group | jsonb | ✅ |
| design_style | character varying | ✅ |
| design_reference_url | text | ✅ |
| selected_addons | jsonb | ✅ |
| message | text | ✅ |
| raw_form_data | jsonb | ✅ |
| stripe_metadata | jsonb | ✅ |
| stripe_customer_id | character varying | ✅ |
| stripe_payment_intent_id | character varying | ✅ |
| stripe_subscription_id | character varying | ✅ |
| stripe_invoice_id | character varying | ✅ |

#### Indizes (8)
- `webwelle_bookings_pkey` (Primary Key)
- `webwelle_bookings_session_id_key` (Unique)
- `idx_bookings_status_created_at`
- `idx_bookings_session_id`
- `idx_bookings_customer_id`
- `idx_bookings_customer_email`
- `idx_bookings_package_type`
- `idx_bookings_stripe_customer_id`

---

### ✅ webwelle_invoices
**Zeilen:** 0

#### Spalten (12)
| Name | Typ | Nullable |
|------|-----|----------|
| id | uuid | ❌ |
| created_at | timestamp with time zone | ✅ |
| booking_id | uuid | ❌ |
| invoice_number | character varying | ❌ |
| amount_cents | integer | ❌ |
| currency | character varying | ❌ |
| status | character varying | ❌ |
| due_date | date | ❌ |
| paid_at | timestamp with time zone | ✅ |
| stripe_invoice_id | character varying | ✅ |
| pdf_url | text | ✅ |
| notes | text | ✅ |

#### Indizes (6)
- `webwelle_invoices_pkey` (Primary Key)
- `webwelle_invoices_invoice_number_key` (Unique)
- `idx_invoices_booking_id`
- `idx_invoices_invoice_number`
- `idx_invoices_status_due_date`
- `idx_invoices_stripe_invoice_id`

---

### ✅ webwelle_subscriptions
**Zeilen:** 0

#### Spalten (14)
| Name | Typ | Nullable |
|------|-----|----------|
| id | uuid | ❌ |
| created_at | timestamp with time zone | ✅ |
| booking_id | uuid | ❌ |
| stripe_subscription_id | character varying | ❌ |
| status | character varying | ❌ |
| current_period_start | timestamp with time zone | ❌ |
| current_period_end | timestamp with time zone | ❌ |
| next_billing_date | timestamp with time zone | ✅ |
| cancelled_at | timestamp with time zone | ✅ |
| cancel_at_period_end | boolean | ❌ |
| customer_cancelled | boolean | ❌ |
| cancellation_reason | text | ✅ |
| trial_start | timestamp with time zone | ✅ |
| trial_end | timestamp with time zone | ✅ |

#### Indizes (7)
- `webwelle_subscriptions_pkey` (Primary Key)
- `webwelle_subscriptions_booking_id_key` (Unique)
- `webwelle_subscriptions_stripe_subscription_id_key` (Unique)
- `idx_subscriptions_booking_id`
- `idx_subscriptions_stripe_subscription_id`
- `idx_subscriptions_status_next_billing`
- `idx_subscriptions_customer_cancelled`

---

### ✅ webwelle_addon_orders
**Zeilen:** 0

#### Spalten (15)
| Name | Typ | Nullable |
|------|-----|----------|
| id | uuid | ❌ |
| created_at | timestamp with time zone | ✅ |
| booking_id | uuid | ❌ |
| addon_key | character varying | ❌ |
| addon_label | character varying | ✅ |
| billing | character varying | ❌ |
| price_id | character varying | ❌ |
| amount_cents | integer | ❌ |
| currency | character varying | ❌ |
| checkout_mode | character varying | ❌ |
| status | character varying | ❌ |
| session_id | character varying | ✅ |
| stripe_invoice_id | character varying | ✅ |
| stripe_subscription_id | character varying | ✅ |
| notes | text | ✅ |

#### Indizes (6)
- `webwelle_addon_orders_pkey` (Primary Key)
- `webwelle_addon_orders_session_id_key` (Unique)
- `idx_addon_orders_booking_id`
- `idx_addon_orders_status_created_at`
- `idx_addon_orders_session_id`
- `idx_addon_orders_addon_key`

---

### ✅ reset_tokens
**Zeilen:** 0

#### Spalten (7)
| Name | Typ | Nullable |
|------|-----|----------|
| id | integer | ❌ |
| customer_id | uuid | ✅ |
| email | character varying | ❌ |
| token | character varying | ❌ |
| expires_at | timestamp without time zone | ❌ |
| used | boolean | ✅ |
| created_at | timestamp without time zone | ✅ |

#### Indizes (4)
- `reset_tokens_pkey` (Primary Key)
- `idx_reset_tokens_customer_id`
- `idx_reset_tokens_email`
- `idx_reset_tokens_token`

---

### ✅ customer_portal_tokens
**Zeilen:** 0

#### Spalten (8)
| Name | Typ | Nullable |
|------|-----|----------|
| id | uuid | ❌ |
| customer_id | uuid | ✅ |
| customer_email | character varying | ❌ |
| token | character varying | ❌ |
| expires_at | timestamp with time zone | ❌ |
| used_at | timestamp with time zone | ✅ |
| booking_id | uuid | ✅ |
| created_at | timestamp with time zone | ✅ |

#### Indizes (6)
- `customer_portal_tokens_pkey` (Primary Key)
- `customer_portal_tokens_token_key` (Unique)
- `idx_portal_tokens_customer_id`
- `idx_portal_tokens_email`
- `idx_portal_tokens_token`
- `idx_portal_tokens_expires`

---

### ✅ invoices
**Zeilen:** 6

#### Spalten (17)
| Name | Typ | Nullable |
|------|-----|----------|
| id | uuid | ❌ |
| stripe_invoice_id | character varying | ❌ |
| invoice_number | character varying | ✅ |
| customer_id | uuid | ✅ |
| customer_email | character varying | ❌ |
| customer_name | character varying | ✅ |
| customer_number | character varying | ✅ |
| amount_cents | bigint | ❌ |
| currency | character varying | ✅ |
| status | character varying | ❌ |
| paid_at | timestamp with time zone | ✅ |
| due_date | timestamp with time zone | ✅ |
| pdf_url | text | ✅ |
| hosted_invoice_url | text | ✅ |
| issuer | character varying | ✅ |
| created_at | timestamp with time zone | ✅ |
| updated_at | timestamp with time zone | ✅ |

#### Indizes (6)
- `invoices_pkey` (Primary Key)
- `invoices_stripe_invoice_id_key` (Unique)
- `idx_invoices_customer_id`
- `idx_invoices_customer_email`
- `idx_invoices_stripe_id`
- `idx_invoices_status`

---

### ✅ blog_posts
**Zeilen:** 0

#### Spalten (15)
| Name | Typ | Nullable |
|------|-----|----------|
| id | uuid | ❌ |
| title | character varying | ❌ |
| slug | character varying | ❌ |
| excerpt | text | ✅ |
| content | text | ❌ |
| author | character varying | ✅ |
| featured_image_url | character varying | ✅ |
| meta_description | text | ✅ |
| tags | ARRAY | ✅ |
| featured | boolean | ✅ |
| status | character varying | ✅ |
| published_at | timestamp with time zone | ✅ |
| created_at | timestamp with time zone | ✅ |
| updated_at | timestamp with time zone | ✅ |
| created_by | character varying | ✅ |

#### Indizes (5)
- `blog_posts_pkey` (Primary Key)
- `blog_posts_slug_key` (Unique)
- `idx_blog_posts_status`
- `idx_blog_posts_slug`
- `idx_blog_posts_published_at`

---

## Wichtige Hinweise

### ❌ Nicht existierende Spalten in `customers`
Die folgenden Spalten existieren **NICHT** in der `customers`-Tabelle und sollten **NICHT** in Queries verwendet werden:
- `street`
- `city`
- `zip`
- `country`

### ✅ Verwendete Spalten in `customers`
Verwende nur diese Spalten:
- `id`, `email`, `password_hash`, `name`, `phone`, `company_name`, `is_verified`, `verification_token`, `reset_token`, `reset_token_expires`, `portal_activated`, `portal_activated_at`, `created_at`, `updated_at`, `customer_number`

---

## Beziehungen zwischen Tabellen

- `webwelle_bookings.customer_id` → `customers.id`
- `webwelle_bookings.customer_email` → `customers.email`
- `invoices.customer_id` → `customers.id`
- `invoices.customer_email` → `customers.email`
- `reset_tokens.customer_id` → `customers.id`
- `customer_portal_tokens.customer_id` → `customers.id`
- `webwelle_invoices.booking_id` → `webwelle_bookings.id`
- `webwelle_subscriptions.booking_id` → `webwelle_bookings.id`
- `webwelle_addon_orders.booking_id` → `webwelle_bookings.id`

---

## Aktualisierung

Diese Dokumentation sollte aktualisiert werden, wenn:
- Neue Tabellen hinzugefügt werden
- Spalten zu bestehenden Tabellen hinzugefügt oder entfernt werden
- Indizes geändert werden
- Beziehungen zwischen Tabellen geändert werden

**Letzte Aktualisierung:** 2025-12-26

