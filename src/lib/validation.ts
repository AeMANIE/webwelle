import { parsePhoneNumberFromString } from 'libphonenumber-js/max';
import { validatePostalCode } from '@/lib/funnel/market';
import type { DachMarket } from '@/lib/funnel/types';
import {
  CUSTOMER_FREE_TEXT_LIMITS,
  type CustomerFreeTextKind,
} from '@/lib/funnel/input-limits';

// Zentrale Input-Validierung für alle Formulare
export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export type FieldValidationResult = { valid: boolean; hint?: string };

const PERSON_NAME_ALLOWED = /^[a-zA-ZäöüÄÖÜß\s\-']+$/;
const PERSON_NAME_VOWEL = /[aeiouäöüAEIOUÄÖÜ]/;

const PERSON_NAME_BLOCKLIST = new Set([
  'test',
  'asd',
  'asdf',
  'qwe',
  'xxx',
  'muster',
  'demo',
  'null',
  'abc',
  'as',
  'ab',
  'xy',
  'xx',
]);

const PERSON_NAME_KEYBOARD_PATTERNS = [
  'asd',
  'qwe',
  'zxc',
  'qwer',
  'asdf',
  '123',
  '1234',
];

const MOBILE_MARKET_NAMES: Record<'DE' | 'AT' | 'CH', string> = {
  DE: 'Deutschland',
  AT: 'Österreich',
  CH: 'Schweiz',
};

const MOBILE_EXAMPLE_HINT: Record<'DE' | 'AT' | 'CH', string> = {
  DE: 'z. B. 0151 … oder +49 151 …',
  AT: 'z. B. 0664 … oder +43 664 …',
  CH: 'z. B. 079 … oder +41 79 …',
};

function hasRepeatingDigits(digits: string): boolean {
  return /(\d)\1{6,}/.test(digits);
}

function hasObviousDigitSequence(digits: string): boolean {
  const sequences = ['0123456789', '1234567890', '9876543210', '0987654321'];
  return sequences.some((seq) => digits.includes(seq));
}

// E-Mail-Validierung
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Telefonnummer-Validierung (deutsche Formate)
export function validatePhone(phone: string): boolean {
  const phoneRegex = /^(\+49|0)[1-9]\d{1,14}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
}

// DACH-Telefonnummer-Validierung mit marktspezifischen Regeln und Hinweisen
export function validatePhoneDACH(
  phone: string,
  market: 'DE' | 'AT' | 'CH' = 'DE'
): { valid: boolean; hint?: string } {
  if (!phone) return { valid: false };
  const cleaned = phone.replace(/[\s\-\(\)\.\/]/g, '');
  if (!cleaned) return { valid: false };

  const countryConfig = {
    DE: { code: '+49', alt: '0049', name: 'Deutschland', min: 10, max: 13 },
    AT: { code: '+43', alt: '0043', name: 'Österreich', min: 9, max: 13 },
    CH: { code: '+41', alt: '0041', name: 'Schweiz', min: 9, max: 12 },
  };
  const cfg = countryConfig[market];

  // Muss mit + oder 0 beginnen
  if (!cleaned.startsWith('+') && !cleaned.startsWith('0')) {
    return { valid: false, hint: `Bitte mit Vorwahl eingeben (z. B. ${cfg.code} 151 oder 0151).` };
  }

  // Nur Ziffern und führendes + erlaubt
  if (!/^\+?\d+$/.test(cleaned)) {
    return { valid: false, hint: 'Nur Ziffern, Leerzeichen und Bindestriche erlaubt.' };
  }

  // Längencheck (Gesamtlänge inkl. Ländervorwahl)
  const digitCount = cleaned.replace(/^\+/, '').length;
  if (digitCount < cfg.min) {
    return { valid: false, hint: `Zu kurz – gültige ${cfg.name}-Nummern haben mindestens ${cfg.min} Ziffern.` };
  }
  if (digitCount > cfg.max) {
    return { valid: false, hint: `Zu lang – bitte nur die Nummer ohne Leerzeichen (max. ${cfg.max} Ziffern).` };
  }

  return { valid: true };
}

export function validatePersonName(
  name: string,
  fieldLabel = 'Name'
): FieldValidationResult {
  const trimmed = name.trim();
  if (trimmed.length < 3) {
    return {
      valid: false,
      hint: `Bitte ${fieldLabel} mit mindestens 3 Buchstaben eingeben.`,
    };
  }

  if (!PERSON_NAME_ALLOWED.test(trimmed)) {
    return {
      valid: false,
      hint: `${fieldLabel} darf nur Buchstaben, Bindestrich und Apostroph enthalten.`,
    };
  }

  if (/(.)\1{2,}/.test(trimmed)) {
    return {
      valid: false,
      hint: `Bitte einen echten ${fieldLabel} eingeben.`,
    };
  }

  if (!PERSON_NAME_VOWEL.test(trimmed)) {
    return {
      valid: false,
      hint: `Bitte einen gültigen ${fieldLabel} eingeben.`,
    };
  }

  const normalized = trimmed.toLowerCase().replace(/[\s\-']/g, '');
  if (PERSON_NAME_BLOCKLIST.has(normalized)) {
    return {
      valid: false,
      hint: `Bitte Ihren echten ${fieldLabel} eingeben.`,
    };
  }

  if (
    PERSON_NAME_KEYBOARD_PATTERNS.some(
      (pattern) => normalized === pattern || normalized.includes(pattern)
    )
  ) {
    return {
      valid: false,
      hint: `Bitte Ihren echten ${fieldLabel} eingeben.`,
    };
  }

  return { valid: true };
}

export function validatePersonNamePair(
  firstName: string,
  lastName: string
): FieldValidationResult {
  const first = firstName.trim().toLowerCase();
  const last = lastName.trim().toLowerCase();
  if (first && last && first === last) {
    return {
      valid: false,
      hint: 'Vor- und Nachname dürfen nicht identisch sein.',
    };
  }
  return { valid: true };
}

const MOBILE_MIN_DIGITS: Record<'DE' | 'AT' | 'CH', number> = {
  DE: 10,
  AT: 9,
  CH: 9,
};

/** Live-Hinweise erst, wenn die Nummer vollständig genug wirkt (nicht schon bei „0172“). */
export function isPhoneReadyForLiveValidation(
  phone: string,
  market: 'DE' | 'AT' | 'CH' = 'DE'
): boolean {
  const digits = phone.replace(/\D/g, '');
  return digits.length >= MOBILE_MIN_DIGITS[market];
}

export function validateMobileDACH(
  phone: string,
  market: 'DE' | 'AT' | 'CH' = 'DE'
): FieldValidationResult {
  if (!phone.trim()) {
    return { valid: false, hint: 'Bitte Ihre Handynummer eingeben.' };
  }

  const digits = phone.replace(/\D/g, '');
  if (hasRepeatingDigits(digits) || hasObviousDigitSequence(digits)) {
    return {
      valid: false,
      hint: `Bitte eine gültige Handynummer eingeben (${MOBILE_EXAMPLE_HINT[market]}).`,
    };
  }

  const parsed = parsePhoneNumberFromString(phone, market);
  if (!parsed?.isValid()) {
    return {
      valid: false,
      hint: `Bitte eine gültige Handynummer für ${MOBILE_MARKET_NAMES[market]} eingeben (${MOBILE_EXAMPLE_HINT[market]}).`,
    };
  }

  if (parsed.getType() !== 'MOBILE') {
    return {
      valid: false,
      hint: `Bitte eine Handynummer eingeben – Festnetznummern werden hier nicht akzeptiert (${MOBILE_EXAMPLE_HINT[market]}).`,
    };
  }

  if (parsed.country && parsed.country !== market) {
    return {
      valid: false,
      hint: `Die Nummer passt nicht zum gewählten Markt (${MOBILE_MARKET_NAMES[market]}).`,
    };
  }

  return { valid: true };
}

/** Bekannte Provider (DACH) – Autovervollständigung nach @ */
export const POPULAR_EMAIL_DOMAINS = [
  'gmail.com',
  'googlemail.com',
  'web.de',
  'gmx.de',
  'gmx.net',
  'gmx.at',
  'gmx.ch',
  'yahoo.de',
  'yahoo.com',
  'hotmail.com',
  'hotmail.de',
  'outlook.com',
  'outlook.de',
  'icloud.com',
  'me.com',
  't-online.de',
  'freenet.de',
  'posteo.de',
  'proton.me',
  'protonmail.com',
  'live.de',
  'live.com',
  'aon.at',
  'chello.at',
  'bluewin.ch',
  'sunrise.ch',
  'gmx.ch',
  'ionos.de',
  'mailbox.org',
] as const;

// Email-Tippfehler-Erkennung – gibt Korrekturvorschlag zurück oder null
const TYPO_DOMAINS: Record<string, string> = {
  'gmial.com': 'gmail.com', 'gmai.com': 'gmail.com', 'gmail.co': 'gmail.com',
  'gmail.cm': 'gmail.com', 'gmal.com': 'gmail.com', 'gemail.com': 'gmail.com',
  'gamil.com': 'gmail.com', 'gnail.com': 'gmail.com', 'gmaill.com': 'gmail.com',
  'yahooo.com': 'yahoo.com', 'yaho.com': 'yahoo.com', 'yahoo.cmo': 'yahoo.com',
  'yahoo.vcom': 'yahoo.com', 'yahoo.co': 'yahoo.com', 'yhoo.com': 'yahoo.com',
  'yhaoo.com': 'yahoo.com',
  'hotmai.com': 'hotmail.com', 'hotmail.cmo': 'hotmail.com', 'hotmail.co': 'hotmail.com',
  'hotmial.com': 'hotmail.com',
  'outllook.com': 'outlook.com', 'outlok.com': 'outlook.com',
  'outloook.com': 'outlook.com',
  'wbe.de': 'web.de', 'web.d': 'web.de',
  'gxm.de': 'gmx.de', 'gmx.d': 'gmx.de', 'gmx.cmo': 'gmx.com',
  'ionos.d': 'ionos.de',
  'iclod.com': 'icloud.com', 'iclould.com': 'icloud.com', 'icoud.com': 'icloud.com',
};

function emailLevenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[m][n];
}

function parseEmailParts(email: string): { local: string; domain: string } | null {
  const trimmed = email.trim().toLowerCase();
  if (!trimmed.includes('@')) return null;
  const atIdx = trimmed.lastIndexOf('@');
  const local = trimmed.slice(0, atIdx);
  const domain = trimmed.slice(atIdx + 1);
  if (!local || !domain) return null;
  return { local, domain };
}

/** Korrigierte E-Mail bei bekanntem Tippfehler, sonst null */
export function fixEmailTypo(email: string): string | null {
  const parts = parseEmailParts(email);
  if (!parts) return null;
  const { local, domain } = parts;

  if (email.includes('..')) return null;

  // Unvollständige Domain: nur Inline-Vervollständigung, kein Tippfehler-Fix
  if (!domain.includes('.')) {
    return null;
  }

  if (TYPO_DOMAINS[domain]) {
    return `${local}@${TYPO_DOMAINS[domain]}`;
  }

  for (const [wrong, correct] of TYPO_TLDS) {
    if (domain.endsWith(wrong)) {
      const fixed = domain.slice(0, domain.length - wrong.length) + correct;
      return `${local}@${fixed}`;
    }
  }

  if (domain.length >= 4) {
    for (const known of POPULAR_EMAIL_DOMAINS) {
      const dist = emailLevenshtein(domain, known);
      if (dist > 0 && dist <= 2 && domain !== known) {
        return `${local}@${known}`;
      }
    }
  }

  return null;
}

/** Domain-Vorschläge für Autovervollständigung (Teilstring nach @) */
export function suggestEmailDomains(partialDomain: string, limit = 6): string[] {
  const p = partialDomain.trim().toLowerCase().replace(/^@/, '');
  if (!p) return [...POPULAR_EMAIL_DOMAINS].slice(0, limit);

  const startsWith = POPULAR_EMAIL_DOMAINS.filter((d) => d.startsWith(p));
  if (startsWith.length >= limit) return startsWith.slice(0, limit);

  const fuzzy = POPULAR_EMAIL_DOMAINS.filter(
    (d) => !startsWith.includes(d) && emailLevenshtein(d, p) <= 2
  );
  return [...new Set([...startsWith, ...fuzzy])].slice(0, limit);
}

/** Inline-Vervollständigung im Eingabefeld (graue Endung, Tab/→ übernehmen) */
export function getInlineEmailCompletion(email: string): {
  full: string;
  suffix: string;
} | null {
  const trimmed = email.trim();
  const atIdx = trimmed.lastIndexOf('@');
  if (atIdx < 0) return null;

  const local = trimmed.slice(0, atIdx);
  const domainPart = trimmed.slice(atIdx + 1);
  if (!local.trim() || domainPart.includes(' ')) return null;

  const domainLower = domainPart.toLowerCase();

  // Erst nach dem ersten Buchstaben nach @ (nicht direkt bei „user@“)
  if (!domainLower.includes('.')) {
    if (domainLower.length < 1) return null;

    const best = suggestEmailDomains(domainLower, 1)[0];
    if (best && best.startsWith(domainLower) && best !== domainLower) {
      const full = `${local}@${best}`;
      return { full, suffix: best.slice(domainLower.length) };
    }
    return null;
  }

  // Vollständige Domain mit Tippfehler: Korrektur als Inline-Suffix/Ersatz
  const fix = fixEmailTypo(trimmed.toLowerCase());
  if (fix && fix !== trimmed.toLowerCase()) {
    if (fix.startsWith(trimmed.toLowerCase())) {
      return { full: fix, suffix: fix.slice(trimmed.length) };
    }
    const fixAt = fix.lastIndexOf('@');
    const fixDomain = fixAt >= 0 ? fix.slice(fixAt + 1) : '';
    if (fixDomain && fixDomain !== domainLower) {
      const suffix = fixDomain.slice(domainLower.length);
      if (suffix) {
        return { full: fix, suffix };
      }
      return { full: fix, suffix: fix.slice(trimmed.length) };
    }
  }

  // Bereits korrekte Domain, aber noch tippbar verlängern (selten)
  const best = suggestEmailDomains(domainLower, 1)[0];
  if (best && best.startsWith(domainLower) && best !== domainLower) {
    const full = `${local}@${best}`;
    return { full, suffix: best.slice(domainLower.length) };
  }

  return null;
}

/** Nur bei fertiger Domain mit echtem Tippfehler (nicht beim Tippen von @i) */
export function emailNeedsTypoConfirmation(email: string): boolean {
  const trimmed = email.trim().toLowerCase();
  if (!trimmed.includes('@')) return false;
  const parts = parseEmailParts(trimmed);
  if (!parts?.domain.includes('.')) return false;
  const fix = fixEmailTypo(trimmed);
  return Boolean(fix && fix !== trimmed);
}

export interface EmailAssistState {
  typoMessage: string | null;
  suggestedEmail: string | null;
  domainSuggestions: string[];
  localPart: string;
  domainPart: string;
  hasAt: boolean;
}

export function getEmailAssistState(email: string): EmailAssistState {
  const trimmed = email.trim();
  const lower = trimmed.toLowerCase();
  const atIdx = lower.lastIndexOf('@');
  const hasAt = atIdx >= 0;
  const localPart = hasAt ? trimmed.slice(0, atIdx) : trimmed;
  const domainPart = hasAt ? trimmed.slice(atIdx + 1) : '';

  const suggestedEmail = domainPart.includes('.') ? fixEmailTypo(lower) : null;
  const typoMessage =
    suggestedEmail && suggestedEmail !== lower
      ? detectEmailTypo(lower)
      : lower.includes('@')
        ? detectEmailTypo(lower)
        : null;

  const domainSuggestions =
    hasAt && domainPart.length >= 1 && !domainPart.includes(' ')
      ? suggestEmailDomains(domainPart)
      : [];

  return {
    typoMessage,
    suggestedEmail: suggestedEmail && suggestedEmail !== lower ? suggestedEmail : null,
    domainSuggestions,
    localPart,
    domainPart,
    hasAt,
  };
}

const TYPO_TLDS: Array<[string, string]> = [
  ['.cmo', '.com'], ['.ocm', '.com'], ['.vom', '.com'], ['.vcom', '.com'],
  ['.con', '.com'], ['.copm', '.com'], ['.comm', '.com'],
  ['.dee', '.de'], ['.dde', '.de'], ['.ded', '.de'],
  ['.orrg', '.org'], ['.orgg', '.org'],
];

export function detectEmailTypo(email: string): string | null {
  const trimmed = email.trim().toLowerCase();
  if (!trimmed.includes('@')) return null;
  const parts = parseEmailParts(trimmed);
  if (!parts) return null;
  const { local, domain } = parts;

  if (trimmed.includes('..')) {
    return 'Doppelter Punkt entdeckt – bitte prüfen.';
  }

  const fixed = fixEmailTypo(trimmed);
  if (fixed && fixed !== trimmed) {
    return `Meinten Sie ${fixed}?`;
  }

  if (!domain.includes('.')) {
    const suggestions = suggestEmailDomains(domain, 3);
    if (suggestions.length > 0) {
      return `Domain unvollständig – z. B. ${local}@${suggestions[0]}?`;
    }
    return 'Die Domain scheint unvollständig zu sein (z. B. fehlt .de oder .com).';
  }

  return null;
}

// Text-Validierung (verhindert XSS)
export function sanitizeText(text: string): string {
  return text
    .replace(/[<>]/g, '') // Entferne < und >
    .replace(/javascript:/gi, '') // Entferne javascript: URLs
    .trim();
}

export function sanitizeCustomerFreeText(value: string): string {
  return sanitizeText(
    value
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '')
      .replace(/\r\n/g, '\n')
      .replace(/\n{4,}/g, '\n\n\n')
  );
}

export function validateCustomerFreeText(
  value: string,
  kind: CustomerFreeTextKind
): FieldValidationResult {
  const { min, max, label } = CUSTOMER_FREE_TEXT_LIMITS[kind];
  const sanitized = sanitizeCustomerFreeText(value);

  if (sanitized.length < min) {
    if (min === 0) {
      return { valid: true };
    }
    return {
      valid: false,
      hint: `${label} ist zu kurz (mindestens ${min} Zeichen).`,
    };
  }

  if (sanitized.length > max) {
    return {
      valid: false,
      hint: `${label} ist zu lang (maximal ${max} Zeichen).`,
    };
  }

  return { valid: true };
}

export function prepareCustomerFreeText(
  value: string,
  kind: CustomerFreeTextKind
): FieldValidationResult & { value?: string } {
  const { max } = CUSTOMER_FREE_TEXT_LIMITS[kind];
  const sanitized = sanitizeCustomerFreeText(value).slice(0, max);
  const validation = validateCustomerFreeText(sanitized, kind);
  if (!validation.valid) {
    return validation;
  }
  return { valid: true, value: sanitized };
}

export type { CustomerFreeTextKind };

// URL-Validierung
export function validateUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// Buchungsformular-Validierung
export function validateBookingForm(formData: Record<string, unknown>): ValidationResult {
  const errors: Record<string, string> = {};

  // Pflichtfelder prüfen mit benutzerfreundlichen Namen
  const requiredFields: Record<string, string> = {
    customerName: 'Ihr Name',
    customerEmail: 'E-Mail-Adresse',
    companyName: 'Firmenname',
    existingWebsite: 'Bestehende Website',
    designStyle: 'Design-Stil',
    budget: 'Budget'
  };

  for (const [field, displayName] of Object.entries(requiredFields)) {
    if (!formData[field] || typeof formData[field] !== 'string' || !formData[field].toString().trim()) {
      errors[field] = `Bitte füllen Sie das Feld "${displayName}" aus.`;
    }
  }

  // E-Mail-Validierung
  if (formData.customerEmail && typeof formData.customerEmail === 'string') {
    if (!validateEmail(formData.customerEmail)) {
      errors.customerEmail = 'Bitte geben Sie eine gültige E-Mail-Adresse ein.';
    }
  }

  // Telefon-Validierung (optional)
  if (formData.customerPhone && typeof formData.customerPhone === 'string') {
    if (!validatePhone(formData.customerPhone)) {
      errors.customerPhone = 'Bitte geben Sie eine gültige Telefonnummer ein (z.B. +49 123 456789 oder 0123 456789).';
    }
  }

  // Text-Sanitization
  const textFields = ['customerName', 'companyName', 'message'];
  for (const field of textFields) {
    if (formData[field] && typeof formData[field] === 'string') {
      formData[field] = sanitizeText(formData[field] as string);
    }
  }

  // Array-Validierung für targetGroup und functions
  if (formData.targetGroup) {
    if (!Array.isArray(formData.targetGroup)) {
      errors.targetGroup = 'Bitte wählen Sie mindestens eine Zielgruppe aus.';
    } else {
      formData.targetGroup = formData.targetGroup.map(item => sanitizeText(item as string));
    }
  }

  if (formData.functions) {
    if (!Array.isArray(formData.functions)) {
      errors.functions = 'Bitte wählen Sie mindestens eine Funktion aus.';
    } else {
      formData.functions = formData.functions.map(item => sanitizeText(item as string));
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

// Login-Formular-Validierung
export function validateLoginForm(email: string, password: string): ValidationResult {
  const errors: Record<string, string> = {};

  if (!email || !email.trim()) {
    errors.email = 'E-Mail ist erforderlich';
  } else if (!validateEmail(email)) {
    errors.email = 'Ungültige E-Mail-Adresse';
  }

  if (!password || !password.trim()) {
    errors.password = 'Passwort ist erforderlich';
  } else if (password.length < 8) {
    errors.password = 'Passwort muss mindestens 8 Zeichen lang sein';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

const DACH_MARKETS = new Set<string>(['DE', 'AT', 'CH']);

export function splitFullName(name: string): { firstName: string; lastName: string } {
  const trimmed = name.trim();
  const spaceIdx = trimmed.indexOf(' ');
  if (spaceIdx === -1) {
    return { firstName: trimmed, lastName: '' };
  }
  return {
    firstName: trimmed.slice(0, spaceIdx),
    lastName: trimmed.slice(spaceIdx + 1).trim(),
  };
}

export function buildFullName(firstName: string, lastName: string): string {
  return `${firstName.trim()} ${lastName.trim()}`.trim();
}

export interface CustomerProfileInput {
  firstName: string;
  lastName: string;
  companyName?: string;
  street?: string;
  zip?: string;
  city?: string;
  country?: string;
  phone?: string;
}

export function validateCustomerProfile(input: CustomerProfileInput): ValidationResult {
  const errors: Record<string, string> = {};
  const market = DACH_MARKETS.has(String(input.country || '').toUpperCase())
    ? (String(input.country).toUpperCase() as DachMarket)
    : 'DE';

  const firstNameResult = validatePersonName(input.firstName, 'Vorname');
  if (!firstNameResult.valid) {
    errors.firstName = firstNameResult.hint || 'Ungültiger Vorname';
  }

  const lastNameResult = validatePersonName(input.lastName, 'Nachname');
  if (!lastNameResult.valid) {
    errors.lastName = lastNameResult.hint || 'Ungültiger Nachname';
  }

  const namePairResult = validatePersonNamePair(input.firstName, input.lastName);
  if (!namePairResult.valid) {
    errors.lastName = namePairResult.hint || 'Ungültiger Name';
  }

  const phone = String(input.phone || '').trim();
  if (!phone) {
    errors.phone = 'Bitte Ihre Handynummer eingeben.';
  } else {
    const phoneResult = validateMobileDACH(phone, market);
    if (!phoneResult.valid) {
      errors.phone = phoneResult.hint || 'Ungültige Handynummer';
    }
  }

  const street = sanitizeText(String(input.street || '').trim());
  if (street.length < 3) {
    errors.street = 'Bitte Straße und Hausnummer eingeben.';
  }

  const city = sanitizeText(String(input.city || '').trim());
  if (city.length < 2) {
    errors.city = 'Bitte eine gültige Stadt eingeben.';
  }

  const zip = String(input.zip || '').trim();
  if (!zip || !validatePostalCode(market, zip)) {
    errors.zip =
      market === 'DE'
        ? 'Bitte eine gültige PLZ mit 5 Ziffern eingeben.'
        : 'Bitte eine gültige PLZ mit 4 Ziffern eingeben.';
  }

  const country = String(input.country || '').trim().toUpperCase();
  if (!DACH_MARKETS.has(country)) {
    errors.country = 'Bitte Deutschland, Österreich oder Schweiz wählen.';
  }

  const companyName = sanitizeText(String(input.companyName || '').trim());
  if (companyName && companyName.length < 2) {
    errors.companyName = 'Bitte einen gültigen Firmennamen eingeben.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

// TAN-Validierung
export function validateTAN(tan: string): ValidationResult {
  const errors: Record<string, string> = {};

  if (!tan || !tan.trim()) {
    errors.tan = 'TAN ist erforderlich';
  } else if (!/^\d{6}$/.test(tan)) {
    errors.tan = 'TAN muss 6-stellig und numerisch sein';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

