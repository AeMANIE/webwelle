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

