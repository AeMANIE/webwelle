// Zentrale Input-Validierung für alle Formulare
export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
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

// Email-Tippfehler-Erkennung – gibt Korrekturvorschlag zurück oder null
const TYPO_DOMAINS: Record<string, string> = {
  'gmial.com': 'gmail.com', 'gmai.com': 'gmail.com', 'gmail.co': 'gmail.com',
  'gmail.cm': 'gmail.com', 'gmal.com': 'gmail.com', 'gemail.com': 'gmail.com',
  'gamil.com': 'gmail.com', 'gnail.com': 'gmail.com',
  'yahooo.com': 'yahoo.com', 'yaho.com': 'yahoo.com', 'yahoo.cmo': 'yahoo.com',
  'yahoo.vcom': 'yahoo.com', 'yahoo.co': 'yahoo.com', 'yhoo.com': 'yahoo.com',
  'yhaoo.com': 'yahoo.com', 'yahoo.de': 'yahoo.de',
  'hotmai.com': 'hotmail.com', 'hotmail.cmo': 'hotmail.com', 'hotmail.co': 'hotmail.com',
  'hotmial.com': 'hotmail.com',
  'outllook.com': 'outlook.com', 'outlok.com': 'outlook.com',
  'outloook.com': 'outlook.com',
  'wbe.de': 'web.de', 'web.d': 'web.de',
  'gxm.de': 'gmx.de', 'gmx.d': 'gmx.de', 'gmx.cmo': 'gmx.com',
  'ionos.d': 'ionos.de',
};

const TYPO_TLDS: Array<[string, string]> = [
  ['.cmo', '.com'], ['.ocm', '.com'], ['.vom', '.com'], ['.vcom', '.com'],
  ['.con', '.com'], ['.copm', '.com'], ['.comm', '.com'],
  ['.dee', '.de'], ['.dde', '.de'], ['.ded', '.de'],
  ['.orrg', '.org'], ['.orgg', '.org'],
];

export function detectEmailTypo(email: string): string | null {
  const trimmed = email.trim().toLowerCase();
  if (!trimmed.includes('@')) return null;
  const atIdx = trimmed.lastIndexOf('@');
  const local = trimmed.slice(0, atIdx);
  const domain = trimmed.slice(atIdx + 1);

  if (!local || !domain) return null;

  // Doppelter Punkt
  if (trimmed.includes('..')) {
    return 'Doppelter Punkt entdeckt – bitte prüfen.';
  }

  // Fehlende TLD (kein Punkt in der Domain)
  if (!domain.includes('.')) {
    return 'Die Domain scheint unvollständig zu sein (z. B. fehlt .de oder .com).';
  }

  // Bekannte Domain-Tippfehler
  if (TYPO_DOMAINS[domain]) {
    return `Meinten Sie ${local}@${TYPO_DOMAINS[domain]}?`;
  }

  // TLD-Tippfehler
  for (const [wrong, correct] of TYPO_TLDS) {
    if (domain.endsWith(wrong)) {
      const fixed = domain.slice(0, domain.length - wrong.length) + correct;
      return `Meinten Sie ${local}@${fixed}?`;
    }
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

