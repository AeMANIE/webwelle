import zxcvbn from 'zxcvbn';

export interface PasswordValidation {
  isValid: boolean;
  score: number; // 0-4 (0=sehr schwach, 4=sehr stark)
  feedback: string[];
  suggestions: string[];
}

// Passwort-Stärke validieren
export function validatePassword(password: string): PasswordValidation {
  const result = zxcvbn(password);
  
  const feedback: string[] = [];
  const suggestions: string[] = [];
  
  // Mindestanforderungen prüfen
  if (password.length < 8) {
    feedback.push('Passwort muss mindestens 8 Zeichen lang sein');
  }
  
  if (!/[A-Z]/.test(password)) {
    feedback.push('Passwort muss mindestens einen Großbuchstaben enthalten');
  }
  
  if (!/[a-z]/.test(password)) {
    feedback.push('Passwort muss mindestens einen Kleinbuchstaben enthalten');
  }
  
  if (!/[0-9]/.test(password)) {
    feedback.push('Passwort muss mindestens eine Zahl enthalten');
  }
  
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    feedback.push('Passwort muss mindestens ein Sonderzeichen enthalten');
  }
  
  // Zxcvbn-Feedback hinzufügen (nur bei sehr schwachen Passwörtern)
  if (result.score < 1 && result.feedback.warning) {
    feedback.push(result.feedback.warning);
  }
  
  if (result.score < 2 && result.feedback.suggestions.length > 0) {
    suggestions.push(...result.feedback.suggestions);
  }
  
  // Zusätzliche Vorschläge basierend auf Score
  if (result.score < 2) {
    suggestions.push('Verwenden Sie eine Kombination aus Groß- und Kleinbuchstaben, Zahlen und Sonderzeichen');
    suggestions.push('Vermeiden Sie häufige Wörter oder persönliche Informationen');
  }
  
  if (result.score < 3) {
    suggestions.push('Verlängern Sie Ihr Passwort auf mindestens 12 Zeichen');
  }
  
  const isValid = result.score >= 1 && feedback.length === 0;
  
  return {
    isValid,
    score: result.score,
    feedback,
    suggestions
  };
}

// Passwort-Hash generieren
export async function hashPassword(password: string): Promise<string> {
  const bcrypt = await import('bcryptjs');
  const salt = await bcrypt.genSalt(12); // Höhere Runden für mehr Sicherheit
  return bcrypt.hash(password, salt);
}

// Passwort verifizieren
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  const bcrypt = await import('bcryptjs');
  return bcrypt.compare(password, hashedPassword);
}

// Passwort-Stärke-Anzeige
export function getPasswordStrengthText(score: number): { text: string; color: string } {
  switch (score) {
    case 0:
    case 1:
      return { text: 'Sehr schwach', color: 'text-red-500' };
    case 2:
      return { text: 'Schwach', color: 'text-orange-500' };
    case 3:
      return { text: 'Gut', color: 'text-yellow-500' };
    case 4:
      return { text: 'Sehr stark', color: 'text-green-500' };
    default:
      return { text: 'Unbekannt', color: 'text-gray-500' };
  }
}
