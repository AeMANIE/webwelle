// TAN generieren (6-stellig)
export function generateTAN(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// E-Mail-Transporter konfigurieren (dynamisch importieren)
async function getTransporter() {
  const nodemailer = await import('nodemailer');
  return nodemailer.createTransport({
    host: process.env.EMAIL_SMTP_HOST || 'smtp.hostinger.com',
    port: parseInt(process.env.EMAIL_SMTP_PORT || '465'),
    secure: process.env.EMAIL_SMTP_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_SMTP_USER || 'info@webwelle.com',
      pass: process.env.EMAIL_SMTP_PASSWORD || 'your-email-password'
    }
  });
}

// TAN per E-Mail senden
export async function sendTANEmail(email: string, tan: string, customerName: string): Promise<boolean> {
  try {
    // Prüfe ob E-Mail-Konfiguration vorhanden ist
    if (!process.env.EMAIL_SMTP_USER || !process.env.EMAIL_SMTP_PASSWORD) {
      console.log('='.repeat(80));
      console.log('📧 TAN-E-MAIL FÜR ENTWICKLUNG');
      console.log('='.repeat(80));
      console.log(`An: ${email}`);
      console.log(`Name: ${customerName}`);
      console.log(`TAN: ${tan}`);
      console.log('='.repeat(80));
      console.log('E-Mail-Konfiguration nicht gefunden. Konfigurieren Sie EMAIL_SMTP_USER und EMAIL_SMTP_PASSWORD in .env.local');
      console.log('='.repeat(80));
      return true; // Für Entwicklung als erfolgreich markieren
    }

    // Echte E-Mail senden
    const transporter = await getTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'info@webwelle.com',
      to: email,
      subject: 'WebWelle - Ihr TAN-Code für die Anmeldung',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0e141f; color: #ffffff; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #DCA441; margin: 0;">WebWelle</h1>
            <p style="color: #a0a0a0; margin: 5px 0;">Ihr Partner für Festpreis-Webdesign</p>
          </div>
          
          <div style="background: #1a2332; padding: 30px; border-radius: 10px; text-align: center;">
            <h2 style="color: #ffffff; margin-bottom: 20px;">🔐 Ihr TAN-Code</h2>
            <p style="color: #a0a0a0; margin-bottom: 20px;">
              Hallo ${customerName},
            </p>
            <p style="color: #a0a0a0; margin-bottom: 30px;">
              Hier ist Ihr TAN-Code für die Anmeldung:
            </p>
            <div style="background: #DCA441; color: #0e141f; font-size: 32px; font-weight: bold; padding: 20px; border-radius: 8px; letter-spacing: 5px; margin: 20px 0;">
              ${tan}
            </div>
            <p style="color: #a0a0a0; font-size: 14px; margin-top: 20px;">
              Dieser Code ist 10 Minuten gültig.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #374151;">
            <p style="color: #a0a0a0; font-size: 12px;">
              WebWelle | Allgäu | Bayern<br>
              E-Mail: info@webwelle.com
            </p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('✅ TAN-E-Mail erfolgreich gesendet an:', email);
    return true;
  } catch (error) {
    console.error('❌ Fehler beim Senden der TAN-E-Mail:', error);
    return false;
  }
}

// Verifikations-E-Mail senden
export async function sendVerificationEmail(email: string, name: string, token: string): Promise<boolean> {
  try {
    // Prüfe ob E-Mail-Konfiguration vorhanden ist
    if (!process.env.EMAIL_SMTP_USER || !process.env.EMAIL_SMTP_PASSWORD) {
      console.log('='.repeat(80));
      console.log('📧 VERIFIKATIONS-E-MAIL FÜR ENTWICKLUNG');
      console.log('='.repeat(80));
      console.log(`An: ${email}`);
      console.log(`Name: ${name}`);
      console.log(`Verifikations-Link: ${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/verify-email?token=${token}`);
      console.log('='.repeat(80));
      console.log('E-Mail-Konfiguration nicht gefunden. Konfigurieren Sie EMAIL_SMTP_USER und EMAIL_SMTP_PASSWORD in .env.local');
      console.log('='.repeat(80));
      return true; // Für Entwicklung als erfolgreich markieren
    }

    // Echte E-Mail senden
    const transporter = await getTransporter();
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'info@webwelle.com',
      to: email,
      subject: 'WebWelle - E-Mail-Adresse bestätigen',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0e141f; color: #ffffff; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #DCA441; margin: 0;">WebWelle</h1>
            <p style="color: #a0a0a0; margin: 5px 0;">Ihr Partner für Festpreis-Webdesign</p>
          </div>
          
          <div style="background: #1a2332; padding: 30px; border-radius: 10px; text-align: center;">
            <h2 style="color: #ffffff; margin-bottom: 20px;">✅ E-Mail-Adresse bestätigen</h2>
            <p style="color: #a0a0a0; margin-bottom: 20px;">
              Hallo ${name},
            </p>
            <p style="color: #a0a0a0; margin-bottom: 30px;">
              Vielen Dank für Ihre Registrierung bei WebWelle! Bitte bestätigen Sie Ihre E-Mail-Adresse, um Ihr Konto zu aktivieren.
            </p>
            <a href="${baseUrl}/verify-email?token=${token}" style="background: #DCA441; color: #0e141f; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; margin: 20px 0;">
              E-Mail-Adresse bestätigen
            </a>
            <p style="color: #a0a0a0; font-size: 14px; margin-top: 20px;">
              Dieser Link ist 24 Stunden gültig.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #374151;">
            <p style="color: #a0a0a0; font-size: 12px;">
              WebWelle | Allgäu | Bayern<br>
              E-Mail: info@webwelle.com
            </p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('✅ Verifikations-E-Mail erfolgreich gesendet an:', email);
    return true;
  } catch (error) {
    console.error('❌ Fehler beim Senden der Verifikations-E-Mail:', error);
    return false;
  }
}

// Passwort-Reset-E-Mail senden
export async function sendPasswordResetEmail(email: string, name: string, token: string): Promise<boolean> {
  try {
    // Für Entwicklung: E-Mail in Console ausgeben
    console.log('='.repeat(80));
    console.log('📧 PASSWORT-RESET-E-MAIL FÜR ENTWICKLUNG');
    console.log('='.repeat(80));
    console.log(`An: ${email}`);
    console.log(`Name: ${name}`);
    console.log(`Reset-Link: http://localhost:3001/reset-password?token=${token}`);
    console.log('='.repeat(80));
    console.log('In Produktion würde hier eine echte E-Mail gesendet werden.');
    console.log('='.repeat(80));
    
    // Simuliere E-Mail-Versand
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return true;
  } catch (error) {
    console.error('❌ Fehler beim Senden der Passwort-Reset-E-Mail:', error);
    return false;
  }
}

// Test-E-Mail senden
export async function sendTestEmail(email: string): Promise<boolean> {
  try {
    const transporter = await getTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'info@webwelle.com',
      to: email,
      subject: 'WebWelle Test-E-Mail',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0e141f; color: #ffffff; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #DCA441; margin: 0;">WebWelle</h1>
            <p style="color: #a0a0a0; margin: 5px 0;">Ihr Partner für Festpreis-Webdesign</p>
          </div>
          
          <div style="background: #1a2332; padding: 30px; border-radius: 10px; text-align: center;">
            <h2 style="color: #ffffff; margin-bottom: 20px;">✅ Test-E-Mail erfolgreich!</h2>
            <p style="color: #a0a0a0; margin-bottom: 20px;">
              Die E-Mail-Konfiguration funktioniert korrekt.
            </p>
            <p style="color: #a0a0a0; font-size: 14px;">
              Sie können jetzt TAN-Codes per E-Mail empfangen.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #374151;">
            <p style="color: #a0a0a0; font-size: 12px;">
              WebWelle | Allgäu | Bayern<br>
              E-Mail: info@webwelle.com
            </p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('✅ Test-E-Mail erfolgreich gesendet an:', email);
    return true;
  } catch (error) {
    console.error('❌ Fehler beim Senden der Test-E-Mail:', error);
    return false;
  }
}

// Generische E-Mail-Funktion
export async function sendEmail(options: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<boolean> {
  try {
    // Prüfe ob E-Mail-Konfiguration vorhanden ist
    if (!process.env.EMAIL_SMTP_USER || !process.env.EMAIL_SMTP_PASSWORD) {
      console.log('='.repeat(80));
      console.log('📧 E-MAIL FÜR ENTWICKLUNG');
      console.log('='.repeat(80));
      console.log(`An: ${options.to}`);
      console.log(`Betreff: ${options.subject}`);
      console.log('HTML-Inhalt:');
      console.log(options.html);
      if (options.text) {
        console.log('Text-Inhalt:');
        console.log(options.text);
      }
      console.log('='.repeat(80));
      console.log('E-Mail-Konfiguration nicht gefunden. Konfigurieren Sie EMAIL_SMTP_USER und EMAIL_SMTP_PASSWORD in .env.local');
      console.log('='.repeat(80));
      return true; // Für Entwicklung als erfolgreich markieren
    }

    // Echte E-Mail senden
    const transporter = await getTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'info@webwelle.com',
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    };

    await transporter.sendMail(mailOptions);
    console.log('✅ E-Mail erfolgreich gesendet an:', options.to);
    return true;
  } catch (error) {
    console.error('❌ Fehler beim Senden der E-Mail:', error);
    return false;
  }
}
