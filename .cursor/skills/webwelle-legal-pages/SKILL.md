---
name: webwelle-legal-pages
description: >-
  Aktualisiert WebWelle-Rechtseiten (AGB, Datenschutz, Impressum, Widerruf) mit
  neuem Text bei gleichem Design. Nutzen wenn der Nutzer Rechtstexte einspielt,
  info/agbneu.txt, info/datenschutz.txt, AGB/Datenschutz/Impressum/Widerruf
  aktualisieren, Footer-Rechtliches oder „gleiches Design wie Datenschutz“ sagt.
---

# WebWelle – Rechtseiten (Text + Design)

## Wann anwenden

- Nutzer liefert neuen Text für AGB, Datenschutz, Impressum oder Widerruf
- Nutzer verweist auf `info/*.txt` oder sagt „Text einbauen, Design gleich lassen“
- Neue Rechtseite im Stil der bestehenden vier Seiten

## Workflow

1. **Referenz lesen** – `src/app/components/Datenschutz.tsx` (Hauptvorlage)
2. **Zielkomponente** öffnen (siehe Mapping unten)
3. **Text wortgetreu** aus Nutzerdatei in JSX übernehmen
4. **Nur Inhalt** in der Komponente ändern – Layout-Klassen 1:1 von Referenz
5. **Meta** in `layout.tsx` nur bei inhaltlich relevanten Änderungen anpassen
6. **Nicht ändern**: Footer-Link, Sitemap, Route – sofern schon vorhanden

## Datei-Mapping

| Seite | Komponente | `page.tsx` | `layout.tsx` | Typische Textquelle |
|-------|------------|------------|--------------|---------------------|
| AGB | `src/app/components/AGB.tsx` | `src/app/agb/page.tsx` | `src/app/agb/layout.tsx` | `info/agbneu.txt` |
| Datenschutz | `src/app/components/Datenschutz.tsx` | `src/app/datenschutz/page.tsx` | `src/app/datenschutz/layout.tsx` | `info/datenschutz.txt` |
| Impressum | `src/app/components/Impressum.tsx` | `src/app/impressum/page.tsx` | `src/app/impressum/layout.tsx` | Nutzerangabe |
| Widerruf | `src/app/components/Widerruf.tsx` | `src/app/widerruf/page.tsx` | `src/app/widerruf/layout.tsx` | Nutzerangabe |

## Seiten-Gerüst (exakt)

```tsx
export default function Seitenname() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="prose prose-lg max-w-none">
        <h1 className="text-3xl font-bold mb-8 text-center text-white">
          {Seitentitel}
        </h1>
        <p className="text-center text-gray-300 mb-12">
          {Untertitel}
        </p>

        <div className="space-y-8">
          {/* Abschnitte */}
        </div>

        <div className="text-center mt-12">
          <a
            href="/"
            className="inline-flex items-center bg-gray-800 text-white px-8 py-4 rounded-lg hover:bg-gray-700 transition-colors font-semibold text-lg"
          >
            Zurück zur Startseite
          </a>
        </div>
      </div>
    </div>
  );
}
```

## Untertitel (Beispiele)

| Seite | Untertitel |
|-------|------------|
| AGB | `B2B-Vertragsbedingungen der AeManie GmbH` |
| Datenschutz | `Informationen zum Umgang mit Ihren Daten` |
| Impressum | `Angaben gemäß § 5 TMG` |
| Widerruf | `der AeManie GmbH` |

## Abschnitts-Muster

```tsx
<div>
  <h2 className="text-2xl font-bold mb-4 text-white">1. Titel</h2>
  <div className="space-y-4 text-white">
    <p>Absatz …</p>
  </div>
</div>
```

Unterpunkt:

```tsx
<h3 className="text-lg font-semibold mb-2 text-white">Untertitel</h3>
```

## Design-Bausteine

### Info-Box (Kontakt, Anbieter, Hinweise)

```tsx
<div className="bg-gray-800 p-4 border-l-4 border-gray-400">
  <p className="font-semibold mb-2 text-white">Überschrift:</p>
  <p className="text-white">…</p>
</div>
```

### Schlussblock mit Stand

```tsx
<div className="bg-gray-800 p-6 border-l-4 border-gray-400">
  <h2 className="text-2xl font-bold mb-4 text-white">N. Schlussbestimmungen</h2>
  <div className="space-y-4 text-white">…</div>
  <div className="bg-gray-700 p-4 mt-4 border border-gray-600">
    <p className="font-semibold text-white"><strong>Stand:</strong> TT.MM.JJJJ</p>
  </div>
</div>
```

### Liste in grauer Box

```tsx
<ul className="list-disc list-inside space-y-2 ml-4 text-gray-300">
  <li>…</li>
</ul>
```

### Wichtiger Hinweis (gelb)

```tsx
<p className="font-semibold text-yellow-300">Wichtig: …</p>
```

### Links

- Intern: `<a href="/datenschutz" className="text-blue-400 hover:underline">webwelle.com/datenschutz</a>`
- Extern: `<a href="https://webwelle.com" className="text-blue-400 hover:underline">https://webwelle.com</a>`

## Text aus `info/*.txt` parsen

Typisches Format:

```
1. Abschnittstitel
Stand: 15.06.2026   ← nur in Untertitel oder Stand-Box, nicht doppeln

Absatz eins.
Absatz zwei.

2. Nächster Abschnitt
…
```

- Jede nummerierte Überschrift → `h2`
- Leerzeilen zwischen Blöcken → separate `<p>`
- Aufzählungen → `ul`/`ol` mit Klassen oben
- **Inhalt nicht kürzen** – juristischer Text bleibt vollständig

## AGB-spezifisch

- Einleitung: graue Box „Anbieter im Überblick“ (AeManie GmbH, Adresse, GF, Stand)
- Produktabschnitte (StarterWelle, E-Mail): optional Hinweis-Box bei Laufzeit/Verlängerung
- Abschnitt mit Verboten/Listen: Bullet-Liste in grauer Box
- Backup-Pflichten: gelber „Wichtig“-Hinweis
- Interne Prüflisten (z. B. Abschnitt 29): graue Box, Liste `text-gray-300` – nur wenn Nutzer explizit will

## Was nicht tun

- Kein neues Layout, keine neuen Komponenten/Mapper ohne Auftrag
- Kein `prose-invert` oder andere Abweichungen von den vier Referenzseiten
- Keine Meta-/Footer-/Sitemap-Änderungen ohne Anlass
- Kein Commit/Push ohne explizite Nutzeranfrage

## Checkliste vor Abschluss

- [ ] Gleiche Wrapper-Klassen wie Datenschutz/Impressum
- [ ] H1 zentriert, Untertitel `text-gray-300`
- [ ] Alle Abschnitte aus Quelltext vorhanden
- [ ] Info-Boxen/Listen/Hinweise wo inhaltlich sinnvoll (wie Referenzseiten)
- [ ] „Zurück zur Startseite“-Button unten
- [ ] Lint der geänderten Dateien prüfen
