# Outbound – Tägliche Nutzung

## Ablauf

1. `npx serve outbound/ui` starten
2. Website-URL eingeben (optional Google-Maps-Link)
3. **Analyse starten** – dauert ca. 1–3 Minuten
4. Daten prüfen: Firma, E-Mail, GBP-Score, Pain Points, Betreff
5. **Entwurf speichern** bei Änderungen
6. E-Mail-Vorschau + PDF prüfen
7. **Freigeben & senden**

## Tipps

- **Keine E-Mail im Impressum?** Manuell eintragen vor dem Versand.
- **Falsches Google-Profil?** Maps-URL beim Start mitgeben oder GBP-Felder korrigieren.
- **Kein PDF?** Gotenberg auf VPS prüfen (`GOTENBERG_URL` in n8n-Env).
- **CORS-Fehler?** n8n-Workflows müssen aktiv sein; Webhook-URLs in `config.js` prüfen.

## Betreff & Ansprache

LLM schlägt variablen Betreff vor – vor Versand anpassen. Absender: *Herr Manie, AeManie GmbH, webwelle.com*.

## Produkte im Angebot

- **Hauptangebot:** meist StarterWelle (699 € / 24 Monate)
- **Alternativen:** DWA / Executive KI nur wenn Checkbox gesetzt
- **Upsells:** SEO Profi, Blog, GMB nach Bedarf
