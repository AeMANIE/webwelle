---
name: webwelle-blog-audio
description: >-
  Generiert Blog-Artikel-MP3s lokal per OpenRouter TTS (Option B): HTML zu
  Sprechtext, npm run blog:audio, audioUrl in posts.json, Play-Button unter Titel.
  Nutzen bei Artikel vorlesen, Blog-Audio, TTS, OpenRouter Speech, blog:audio
  oder nach webwelle-blog-publish.
---

# WebWelle – Blog-Audio (Option B, lokal)

## Wann anwenden

- Nach neuem Git-Blogartikel ([`webwelle-blog-publish`](../webwelle-blog-publish/SKILL.md))
- Nutzer will **Artikel vorlesen** (Play-Button unter Titel)
- MP3 lokal auf Mac generieren, **nicht** im Docker/Coolify-Build

## Architektur

| Ebene | Pfad / Code | Rolle |
|-------|-------------|--------|
| **Sprechtext (bevorzugt)** | `src/content/blog/speech/{slug}.txt` | TTS-Vorlesefassung nach [`skillttslesen.md`](skillttslesen.md) |
| **Sprechtext (Fallback)** | `src/lib/blog-html-to-speech-text.ts` | HTML → Plain Text |
| **Generator** | `scripts/generate-blog-audio.ts` | Lokal: OpenRouter TTS → MP3 |
| **Audio-Datei** | `public/blog-audio/{slug}.mp3` | Committen + Push für Live |
| **Manifest** | `posts.json` → `audioUrl` | Player-Quelle |
| **Player** | `src/app/components/BlogAudioPlayer.tsx` | Unter Titel auf `/blog/[slug]` |
| **Temp** | `public/blog-audio/.tmp/` | **gitignored** |

```mermaid
flowchart LR
  Speech[speech/slug.txt] --> TTS[OpenRouter Gemini TTS]
  HTML[slug.html Fallback] --> Strip[htmlToSpeechText]
  Strip --> TTS
  TTS --> MP3[public/blog-audio/slug.mp3]
  MP3 --> Git[commit + push]
  Git --> Player[BlogAudioPlayer live]
```

**Wichtig:** Generierung läuft **nur lokal** (`npm run blog:audio`). Dockerfile und n8n rufen das Script **nicht** auf.

---

## Voraussetzungen (Mac)

1. `OPENROUTER_API_KEY` in `.env.local`
2. `ffmpeg` installiert: `brew install ffmpeg`
3. OpenRouter-Credits (ca. 0,05–0,30 € pro Artikel)

Optional in `.env.local`:

```
OPENROUTER_TTS_MODEL=google/gemini-3.1-flash-tts-preview
OPENROUTER_TTS_VOICE=Kore
OPENROUTER_TTS_LANGUAGE=de-DE
```

**Nicht** `sesame/csm-1b` für Blog-Vorlesen: Das Modell erzeugt Dialog mit mehreren Stimmen und weicht vom Text ab.

Vorlese-Text nach Regeln in [`skillttslesen.md`](skillttslesen.md) schreiben (nur Deutsch, gesprochene Sprache, keine HTML-Listen).

Verfügbare Modelle prüfen: `node scripts/list-openrouter-tts-models.mjs`  
TTS-Test: `node scripts/test-openrouter-tts.mjs google/gemini-3.1-flash-tts-preview`

---

## Workflow

### 1. Artikel publishen (ohne Audio)

Wie [`webwelle-blog-publish`](../webwelle-blog-publish/SKILL.md): HTML + `posts.json` + Hero.

### 2. Sprechtext vorbereiten

**Bevorzugt:** eigene Vorlese-Version als Plain-Text nach [`skillttslesen.md`](skillttslesen.md):

```
src/content/blog/speech/{slug}.txt
```

Regeln kurz: nur Deutsch, kürzere Sätze, Abkürzungen ausschreiben, FAQ als „Frage … Antwort …“, keine URLs/HTML/Markdown.

Falls keine `.txt` existiert, wird Titel + Excerpt + HTML automatisch konvertiert.

### 3. Sprechtext prüfen (dry-run)

```bash
npm run blog:audio -- --slug=mein-artikel-slug --dry-run
```

Prüfen: **keine** HTML-Tags (`<p>`, `h2`, `strong`) im Output — nur lesbarer Text.

### 4. MP3 generieren

```bash
# Ein Artikel (neu erzwingen: --force)
npm run blog:audio -- --slug=mein-artikel-slug --force

# Alle Git-Artikel in posts.json
npm run blog:audio -- --all
```

Das Script:
- liest **`speech/{slug}.txt`** (bevorzugt) oder Titel + Excerpt + HTML
- normalisiert Plain-Text: **Listenzeilen → Erstens/Zweitens**, Überschrift+Absatz verbinden
- sendet den Text an Gemini TTS (`de-DE`, eine Stimme)
- **Gemini:** Text in **~10–12 Abschnitte à ~1.200 Zeichen** (Absatzgrenzen) — kleine Chunks, weil große Blöcke Listen überspringen
- bei zu kurzer Audio-Antwort: Chunk wird **automatisch halbiert** und erneut gesendet
- PCM-Abschnitte: Stille trimmen + **Crossfade** (0,12 s) → ein MP3
- Prüfung: Gesamtdauer muss zum Text passen (≥ 85 % erwarteter Mindestdauer), sonst Abbruch
- setzt `audioUrl` in `posts.json`

**Modell:** `google/gemini-3.1-flash-tts-preview` — **nicht** `sesame/csm-1b` (erzeugt fremde Dialog-Stimmen).

### 5. Lokal testen

```bash
npm run dev
```

`/blog/{slug}` — Play-Button unter Autor/Datum/Lesezeit.

### 6. Live schalten

```bash
git add public/blog-audio/{slug}.mp3 src/content/blog/posts.json
git commit -m "Blog-Audio: {slug}"
git push
```

MP3s werden wie Hero-Bilder mit deployt. **Temp-Ordner nicht committen.**

---

## posts.json — audioUrl

```json
{
  "slug": "mein-artikel",
  "audioUrl": "/blog-audio/mein-artikel.mp3",
  ...
}
```

Wird vom Script automatisch gesetzt. Player erscheint nur wenn `audioUrl` vorhanden.

---

## HTML → Sprechtext (Regeln)

| HTML | Sprechtext |
|------|------------|
| `title` + `excerpt` | Am Anfang, vor Body |
| `<h2>`, `<h3>` | Überschrift + Pause |
| `<p>` | Absatz |
| `<ol>` | Erstens, Zweitens, … |
| `<ul>` | Punkt eins, Punkt zwei, … |
| `<table>` | Zeilen: „Zelle1: Zelle2: …“ |
| `<a>` | Nur Link-Text |
| `<strong>` | Nur Wort |

OpenRouter bekommt **niemals** rohes HTML.

---

## Häufige Fehler

| Fehler | Ursache | Lösung |
|--------|---------|--------|
| `OPENROUTER_API_KEY fehlt` | Kein Key in `.env.local` | Key setzen |
| Stimme springt / fremde Dialoge | Falsches Modell (`sesame/csm-1b`) | Gemini in `.env.local`, `--force` neu generieren |
| Sprung mitten im Text / Listen fehlen | Chunks zu groß oder Listen ohne Satzzeichen | `speech/{slug}.txt` nach `skillttslesen.md`; `--dry-run` (10–12 Abschnitte); `--force` |
| MP3 zu kurz (~2 Min.) | Gemini-Ein-Durchgang kürzt ab | Script nutzt ~1.200 Zeichen/Chunk; `--force` neu generieren |
| HTTP 402 | Credits/Key-Limit | Credits aufladen; `--force` neu starten |
| `ffmpeg nicht gefunden` | Nicht installiert | `brew install ffmpeg` |
| Player fehlt live | MP3 nicht gepusht oder Redis-Cache | MP3 + `audioUrl` committen; Seite hart neu laden |
| Stimme liest „h zwei“ | HTML direkt an TTS | `speech/{slug}.txt` nutzen oder `--dry-run` prüfen |

---

## Zwei Skills — Aufgaben

| Datei | Wofür |
|-------|--------|
| **`SKILL.md`** (diese Datei) | Technik: `npm run blog:audio`, Gemini, MP3, Deploy, Fehler |
| **`skillttslesen.md`** | Inhalt: Wie der **Vorlese-Text** formuliert wird (Deutsch, Pausen, FAQ) |

Chunk-Logik gehört in **`SKILL.md`**. Gemini liest **kleine Abschnitte** (~1.200 Zeichen) zuverlässiger als große Blöcke — besonders bei Listen. Das Script teilt automatisch an Absatzgrenzen, halbiert bei zu kurzer Antwort und prüft die Gesamtdauer.

---

## Kosten

- Pro Artikel (~2.000 Wörter): ca. **0,05–0,30 €** OpenRouter-Credits (einmalig)
- Pro Play-Klick auf Live-Seite: **0 €** (statische MP3)

---

## Code-Referenzen

| Datei | Zweck |
|-------|--------|
| `src/lib/blog-html-to-speech-text.ts` | HTML/Plain → Sprechtext, Listen-Erweiterung, Chunk-Split |
| `scripts/generate-blog-audio.ts` | TTS-Abschnitte (~1.200 Zeichen), Auto-Split, PCM-Merge, Längen-Check |
| `src/app/components/BlogAudioPlayer.tsx` | Play-UI |
| `src/app/blog/[slug]/page.tsx` | Player-Einbindung |
| `src/lib/blog-git-posts.ts` | `audioUrl` aus Manifest |
| `.gitignore` | `public/blog-audio/.tmp/` |

---

## Abgrenzung

| Thema | Weg |
|-------|-----|
| Artikel schreiben/publishen | `webwelle-blog-publish` |
| TTS im Deploy/n8n | **Nicht** — nur lokales Script |
| Live-TTS pro Klick | **Nicht** — Option B (vorab MP3) |
| Vorlese-Text formulieren | `skillttslesen.md` |
