---
name: webwelle-blog-publish
description: >-
  Erstellt und veröffentlicht professionelle WebWelle-Blogartikel per Git-Push:
  Typografie (H2/H3), Absatzabstände, Hero-Bild, Google-SEO, Zoom-CTAs.
  Nutzen bei src/content/blog, manuellen Blog-Artikeln, Blog-Design, Hero-Bild,
  GitHub-Push Blog, StarterWelle-Artikel oder wenn Pipeline umgangen wird.
---

# WebWelle – Blogartikel (Git-Publish)

## Wann anwenden

- Neuer Blogartikel **ohne** n8n-Pipeline / Admin-Editor
- Nutzer liefert Markdown/HTML + Meta + Hero-Bild
- Blog-Design, Typografie, Abstände oder SEO-Metadaten für `/blog/[slug]`
- Artikel soll nach **Git-Push + Deploy** auf webwelle.com live gehen

## Architektur

| Ebene | Pfad / Code | Rolle |
|-------|-------------|--------|
| **Inhalt** | `src/content/blog/{slug}.html` | Artikel-HTML (Body ohne H1) |
| **Manifest** | `src/content/blog/posts.json` | Meta, Slug, Tags, Hero-URL |
| **Hero-Datei** | `public/blog-images/*.webp` | Statisches Bild (Deploy mit Git) |
| **Loader** | `src/lib/blog-git-posts.ts` | Liest Manifest + HTML zur Laufzeit |
| **Rendering** | `src/app/blog/[slug]/page.tsx` | Layout, SEO, Prose, CTAs |
| **Design-System** | `src/lib/blog-post-display.ts` | Prose-Klassen, Sanitize, Zoom-URL |
| **Pipeline (n8n)** | `blog_jobs` / Admin | **Nicht** für Git-Artikel nötig |

DB-Artikel und Git-Artikel werden auf `/blog` **zusammengeführt**. Bei gleichem Slug gewinnt die DB.

---

## Workflow (Schritt für Schritt)

### Phase A — Inhalt vorbereiten

1. Artikeltext als HTML schreiben (Vorlage unten) — **ohne `<h1>`**
2. Datei speichern: `src/content/blog/{slug}.html`
3. Hero-Bild (16:9, ca. 1200×630) nach `public/blog-images/` legen
4. Eintrag in `src/content/blog/posts.json` ergänzen

### Phase B — Qualität prüfen

5. Typografie: H2 pro Hauptabschnitt, H3 für Unterpunkte
6. Abstände: Leerzeile zwischen jedem `<p>`, `<h2>`, `<ul>`
7. SEO: `title` 30–60 Zeichen, `metaDescription` 120–160 Zeichen
8. `npm run build` — muss grün sein

### Phase C — Live schalten

9. Commit + Push → Coolify deployt
10. Prüfen: `https://webwelle.com/blog/{slug}`
11. Optional: Featured auf `/blog` wenn `"featured": true`

---

## Typografie & Layout (Profi-Design)

Die Seite rendert automatisch:

```
[Gradient-Header: H1 = title, Excerpt, Autor, Datum, Tags]
[Hero-Bild — featuredImageUrl, rounded-2xl]
[Artikel-Body — prose mit H2/H3/Absätzen]
[Autor-Box + Zoom-CTA]
[Banner-CTA + Zoom-Link]
```

### Hierarchie (Pflicht)

| Element | Wo | Regel |
|---------|-----|--------|
| **H1** | Nur `title` in `posts.json` | **Niemals** im HTML-Body |
| **H2** | `<h2>` im HTML | Jeder Hauptteil: Problem, Lösung, Paket, Fazit, FAQ |
| **H3** | `<h3>` im HTML | Unterpunkte innerhalb eines H2 |
| **Absatz** | `<p>` | 2–4 Sätze, **ein Gedanke pro `<p>`** |
| **Liste** | `<ul><li>` | Tipps, Checklisten, Paket-Inhalte |
| **Fett** | `<strong>` | Sparsam — Keywords, Produktnamen |

### Abstände

- In der HTML-Datei: **Leerzeile** zwischen Block-Elementen
- Rendering: `BLOG_ARTICLE_PROSE_CLASS` — `prose-h2:mt-10`, `prose-p:mb-6`, `prose-h3:mt-8`
- Keine `<br><br>`-Ketten — immer echte `<p>`-Tags

### Technisch kritisch

- Sanitizer **muss** `h2` und `h3` erlauben → `BLOG_CONTENT_SANITIZE_OPTIONS`
- Fehlt `h3` in allowedTags → Überschriften werden gestrippt, Text wirkt „zusammengeklebt“

---

## HTML-Vorlage (Copy-Paste)

```html
<p>Intro: Problem + Nutzen in 2–3 Sätzen. Lokaler Bezug Kempten/Allgäu wenn passend.</p>

<p>Überleitung zum Artikelthema …</p>

<h2>Erster Hauptabschnitt</h2>

<p>Erster Absatz …</p>

<p>Zweiter Absatz …</p>

<h3>Unterpunkt</h3>

<p>Detail …</p>

<ul>
  <li><strong>Punkt eins</strong> – Erklärung</li>
  <li><strong>Punkt zwei</strong> – Erklärung</li>
</ul>

<h2>Zweiter Hauptabschnitt</h2>

<p>Weiterer Inhalt …</p>

<h2>Fazit</h2>

<p>Zusammenfassung + Handlungsempfehlung.</p>

<h2>FAQ – Häufige Fragen</h2>

<p><strong>Frage eins?</strong><br/>Antwort …</p>

<p><strong>Frage zwei?</strong><br/>Antwort …</p>
```

Markdown-Quellen: `##` → h2, `###` → h3 via `normalizeHtmlForQuill` (Admin-Editor).

---

## posts.json — Felder & Google-SEO

```json
{
  "slug": "webdesign-kempten-keyword",
  "htmlFile": "webdesign-kempten-keyword.html",
  "title": "Webdesign Kempten: … (30–60 Zeichen, Keyword vorne)",
  "excerpt": "Teaser unter H1 — 1–2 Sätze, nicht identisch mit metaDescription",
  "metaDescription": "120–160 Zeichen. Keyword + Nutzen + ggf. StarterWelle/Kempten.",
  "featuredImageUrl": "/blog-images/hero-dateiname.webp",
  "author": "SEO-Team WebWelle",
  "tags": ["Haupt-Keyword", "Neben-Keyword", "Kempten", "Allgäu"],
  "featured": true,
  "publishedAt": "2026-06-24"
}
```

| Feld | Google-Relevanz |
|------|-----------------|
| `title` | `<title>` + OG title |
| `metaDescription` | Snippet in SERPs (120–160 Zeichen) |
| `excerpt` | Teaser + OG fallback |
| `tags` | `keywords` + OG article:tag |
| `featuredImageUrl` | OG/Twitter Bild (1200×630 empfohlen) |
| `publishedAt` | `datePublished` Schema.org |

Automatisch generiert in `[slug]/page.tsx`: canonical, googleBot, Open Graph, Twitter Card, BlogPosting JSON-LD.

---

## Bilder

| Typ | Pfad | Anzeige |
|-----|------|---------|
| **Hero** | `featuredImageUrl` + Datei in `public/blog-images/` | Über dem Artikel, full-width, abgerundet |
| **Inline** | Im HTML via `<img>` (selten nötig) | Im Fließtext |

Hero-Specs: Landscape **16:9**, **1200×630 px**, WebP, beschreibender Alt via Dateiname/Thema.

---

## CTAs (automatisch — nicht im HTML)

Jede Artikelseite hat fest eingebaute Boxen:

| Button | Ziel |
|--------|------|
| **Kontakt aufnehmen** | Zoom Scheduler (Autor-Box) |
| **Kostenloses Erstgespräch vereinbaren** | Zoom Scheduler (Banner) |
| **Webdesign-Pakete** | `/#produkte` |

Zoom-URL ( Konstante `BLOG_ZOOM_CONSULTATION_URL` ):
`https://scheduler.zoom.us/aemanie-gmbh/30-minuten-mit-aemanie-gmbh-herr-manie`

CTA-Texte **nicht** ins HTML schreiben — kommen aus `page.tsx`.

---

## Neuen Artikel anlegen (Kurz)

```bash
# 1. HTML
src/content/blog/mein-neuer-artikel.html

# 2. Manifest-Eintrag
src/content/blog/posts.json   # Array erweitern

# 3. Hero (optional)
public/blog-images/mein-hero.webp

# 4. Deploy
npm run build && git add … && git commit && git push
```

---

## Häufige Fehler

| Fehler | Folge | Richtig |
|--------|-------|---------|
| `<h1>` im HTML | Doppelte H1, schlechtes SEO | Nur H2/H3 im Body |
| Kein Leerzeilen in HTML | Schwer editierbar | Leerzeile zwischen Tags |
| `h3` nicht im Sanitizer | Überschriften verschwinden | `BLOG_CONTENT_SANITIZE_OPTIONS` prüfen |
| Nur Admin/Pipeline gedacht | Artikel nicht live nach Push | Git-Pfad `src/content/blog/` |
| metaDescription zu kurz/lang | Schlechtes Snippet | 120–160 Zeichen |
| Hero nur in JSON, nicht in `public/` | Bild 404 | Beide Pfade pflegen |
| Slug-Kollision mit DB | DB-Artikel überschreibt Git | Eindeutigen Slug wählen |

---

## Qualitäts-Checkliste vor Push

### Inhalt
- [ ] ≥ 300 Wörter
- [ ] ≥ 3 H2-Abschnitte
- [ ] H3 wo sinnvoll (Unterpunkte, FAQ)
- [ ] Kein H1 im HTML
- [ ] Absätze kurz, mit Luft
- [ ] Fazit + optional FAQ
- [ ] Lokaler Bezug (Kempten/Allgäu) wenn Thema passt

### SEO & Meta
- [ ] title 30–60 Zeichen
- [ ] metaDescription 120–160 Zeichen
- [ ] excerpt ≠ metaDescription
- [ ] 3–5 Tags
- [ ] Hero vorhanden und erreichbar

### Technik
- [ ] `posts.json` valides JSON
- [ ] `htmlFile` existiert
- [ ] `npm run build` erfolgreich
- [ ] Nach Deploy: `/blog/{slug}` visuell geprüft (H2 sichtbar, Abstände OK)

---

## Code-Referenzen

| Datei | Zweck |
|-------|--------|
| `src/content/blog/posts.json` | Artikel-Manifest |
| `src/content/blog/*.html` | Artikel-Inhalte |
| `src/lib/blog-git-posts.ts` | Git-Artikel laden |
| `src/lib/blog-post-display.ts` | Prose, Sanitize, Zoom-URL |
| `src/app/blog/[slug]/page.tsx` | Seiten-Layout + SEO |
| `src/app/blog/page.tsx` | Blog-Übersicht (merge DB + Git) |
| `Dockerfile` | Kopiert `src/content/blog` in Container |

---

## Abgrenzung

| Thema | Skill / Weg |
|-------|-------------|
| **Rechtseiten** (AGB, Datenschutz) | `webwelle-legal-pages` |
| **Blog-Text schreiben** (SEO-Copy) | `webwelle-blogartikel` |
| **Automatische Pipeline** | Admin → Kunden-Blog / n8n |
| **Manueller Admin-Editor** | `/admin` → Blog-Editor → Neuer Artikel |

---

## Beispiel (live)

- Slug: `webdesign-kempten-gute-websites-starterwelle`
- HTML: `src/content/blog/webdesign-kempten-gute-websites-starterwelle.html`
- URL: `https://webwelle.com/blog/webdesign-kempten-gute-websites-starterwelle`
