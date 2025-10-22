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

  // Pflichtfelder prüfen
  const requiredFields = [
    'customerName',
    'customerEmail', 
    'companyName',
    'existingWebsite',
    'designStyle',
    'budget'
  ];

  for (const field of requiredFields) {
    if (!formData[field] || typeof formData[field] !== 'string' || !formData[field].toString().trim()) {
      errors[field] = `${field} ist erforderlich`;
    }
  }

  // E-Mail-Validierung
  if (formData.customerEmail && typeof formData.customerEmail === 'string') {
    if (!validateEmail(formData.customerEmail)) {
      errors.customerEmail = 'Ungültige E-Mail-Adresse';
    }
  }

  // Telefon-Validierung (optional)
  if (formData.customerPhone && typeof formData.customerPhone === 'string') {
    if (!validatePhone(formData.customerPhone)) {
      errors.customerPhone = 'Ungültige Telefonnummer';
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
      errors.targetGroup = 'Zielgruppe muss eine Liste sein';
    } else {
      formData.targetGroup = formData.targetGroup.map(item => sanitizeText(item as string));
    }
  }

  if (formData.functions) {
    if (!Array.isArray(formData.functions)) {
      errors.functions = 'Funktionen müssen eine Liste sein';
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

