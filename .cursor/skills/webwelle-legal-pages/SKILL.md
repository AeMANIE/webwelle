---
name: webwelle-legal-pages
description: >-
  Aktualisiert WebWelle-Rechtseiten (AGB, Datenschutz, Impressum, Widerruf) mit
  neuem Text bei gleichem Design. Veröffentlichung per Git-Push + Deploy.
  Nutzen wenn der Nutzer Rechtstexte einspielt, info/agbneu.txt, info/datenschutz.txt,
  AGB/Datenschutz/Impressum/Widerruf aktualisieren, Footer-Rechtliches,
  Google-Metadaten Rechtseiten oder „gleiches Design wie Datenschutz“ sagt.
---

# WebWelle – Rechtseiten (Text + Design + Git-Publish)

## Wann anwenden

- Nutzer liefert neuen Text für AGB, Datenschutz, Impressum oder Widerruf
- Nutzer verweist auf `info/*.txt` oder sagt „Text einbauen, Design gleich lassen“
- Nutzer will Rechtseiten **per GitHub-Push** live schalten (ohne Admin/DB)
- Google-Metadaten (Title, Description, Canonical, OG) für Rechtseiten prüfen/anpassen

## Veröffentlichung (Git-Push)

Rechtseiten liegen **im Code** — kein Admin, keine Datenbank.

1. Text in die Ziel-Komponente einbauen (siehe Mapping)
2. **`layout.tsx`** Meta prüfen/anpassen (Google, siehe unten)
3. `npm run build` lokal (optional, vor Push)
4. **Commit + Push** → Coolify deployt → Seite live unter `/agb`, `/datenschutz`, …

| Seite | Live-URL |
|-------|----------|
| AGB | `https://webwelle.com/agb` |
| Datenschutz | `https://webwelle.com/datenschutz` |
| Impressum | `https://webwelle.com/impressum` |
| Widerruf | `https://webwelle.com/widerruf` |

## Workflow Inhalt

1. **Referenz lesen** – `src/app/components/Datenschutz.tsx` (Hauptvorlage)
2. **Zielkomponente** öffnen (siehe Mapping)
3. **Text wortgetreu** aus Nutzerdatei in JSX übernehmen
4. **Nur Inhalt** in der Komponente ändern – Layout-Klassen 1:1 von Referenz
5. **Meta** in `layout.tsx` bei inhaltlichen Änderungen anpassen (Pflicht für Google)
6. **Nicht ändern**: Footer-Link, Sitemap, Route – sofern schon vorhanden

## Datei-Mapping

| Seite | Komponente | `page.tsx` | `layout.tsx` (Meta!) | Typische Textquelle |
|-------|------------|------------|------------------------|---------------------|
| AGB | `src/app/components/AGB.tsx` | `src/app/agb/page.tsx` | `src/app/agb/layout.tsx` | `info/agbneu.txt` |
| Datenschutz | `src/app/components/Datenschutz.tsx` | `src/app/datenschutz/page.tsx` | `src/app/datenschutz/layout.tsx` | `info/datenschutz.txt` |
| Impressum | `src/app/components/Impressum.tsx` | `src/app/impressum/page.tsx` | `src/app/impressum/layout.tsx` | Nutzerangabe |
| Widerruf | `src/app/components/Widerruf.tsx` | `src/app/widerruf/page.tsx` | `src/app/widerruf/layout.tsx` | Nutzerangabe |

## Google-Metadaten (Pflicht in `layout.tsx`)

Bei Textänderungen **immer** prüfen und ggf. anpassen. Referenz: `src/app/datenschutz/layout.tsx`.

| Feld | Regel |
|------|-------|
| `title` | `{Seitenthema} \| WebWelle – {Nutzen/Kontext}` — 50–60 Zeichen ideal |
| `description` | 120–160 Zeichen, klarer Inhalt der Seite, Keyword natürlich |
| `keywords` | 5–10 Begriffe, kommagetrennt, inkl. WebWelle, Kempten/Allgäu wenn passend |
| `alternates.canonical` | `https://webwelle.com/{route}` — **immer setzen** |
| `robots` | `index: true, follow: true` + `googleBot` mit `max-image-preview: large` |
| `openGraph` | `type: website`, `locale: de_DE`, `url`, `title`, `description`, `images` |
| `twitter` | `summary_large_image`, gleicher Title/Description wie OG |

### Meta-Vorlage (Canonical ergänzen wenn fehlt)

```tsx
const BASE = 'https://webwelle.com';
const PATH = '/datenschutz'; // pro Seite anpassen

export const metadata: Metadata = {
  title: 'Datenschutzerklärung | WebWelle – Transparenz & Sicherheit',
  description: '… 120–160 Zeichen …',
  keywords: 'Datenschutzerklärung, DSGVO, WebWelle, Kempten, Allgäu',
  authors: [{ name: 'WebWelle' }],
  creator: 'WebWelle',
  publisher: 'WebWelle',
  alternates: { canonical: `${BASE}${PATH}` },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'de_DE',
    url: `${BASE}${PATH}`,
    siteName: 'WebWelle',
    title: '… wie title …',
    description: '… wie description …',
    images: [{ url: '/logo.png', width: 1200, height: 630, alt: 'WebWelle Logo' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: '…',
    description: '…',
    images: ['/logo.png'],
  },
};
```

**Rechtseiten:** `robots.index: true` — Impressum/Datenschutz sollen von Google indexiert werden.

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

## Was nicht tun

- Kein neues Layout, keine neuen Komponenten/Mapper ohne Auftrag
- Kein `prose-invert` oder andere Abweichungen von den vier Referenzseiten
- Meta nicht vergessen bei inhaltlichen Updates
- Kein Push ohne explizite Nutzeranfrage

## Checkliste vor Push

- [ ] Gleiche Wrapper-Klassen wie Datenschutz/Impressum
- [ ] H1 zentriert, Untertitel `text-gray-300`
- [ ] Alle Abschnitte aus Quelltext vorhanden
- [ ] **`layout.tsx`:** title, description (120–160), canonical, OG, twitter, googleBot
- [ ] `npm run build` erfolgreich
- [ ] Commit + Push → Live unter `/agb` etc.

## Abgrenzung Blog (Git-Publish)

Blog-Artikel (nicht Rechtseiten): `src/content/blog/posts.json` + HTML — Skill **`webwelle-blog-publish`**.

### Blog-Typografie (Kurzregel)

- **H1** nur als Seitentitel (nicht im HTML-Body)
- **H2/H3** im HTML — `h3` darf beim Sanitize nicht fehlen (`BLOG_CONTENT_SANITIZE_OPTIONS`)
- **Absatzabstand:** eigene `<p>`-Tags + Leerzeilen; Prose-Klassen `BLOG_ARTICLE_PROSE_CLASS`
- **CTAs** „Kontakt“ / „Erstgespräch“ → Zoom Scheduler (siehe Blog-Skill)

