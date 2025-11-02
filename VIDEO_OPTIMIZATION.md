# Video Performance - Empfehlungen

## ❌ Videos in Redis cachen?

**Antwort: NEIN, das bringt keinen Sinn.**

### Warum nicht?

1. **Größe**: Videos sind mehrere MB groß (z.B. `Aa.mp4`, `Aa90.mp4`)
   - Redis ist für **kleine, häufig abgerufene Daten** gedacht (Rate Limits, TANs)
   - Ein Video würde Redis schnell überfüllen

2. **Statische Dateien**: Videos liegen in `/public` und werden **statisch serviert**
   - Next.js serviert diese direkt
   - Keine dynamische Generierung nötig

3. **Bessere Alternativen**:
   - ✅ Browser Caching (automatisch)
   - ✅ CDN (Vercel/Cloudflare)
   - ✅ Video-Optimierung (Codecs, Kompression)
   - ✅ Lazy Loading

---

## ✅ Bessere Optimierungen für Videos

### 1. **Browser Caching** (Bereits aktiv)
Videos werden automatisch vom Browser gecacht.

### 2. **Preload-Optimierung** (Empfohlen)
In `Hero.tsx` ist bereits `preload="metadata"` gesetzt - **GUT!**

### 3. **Video-Optimierung** (Optional, aber empfohlen)
- ✅ WebM-Format zusätzlich zu MP4 (kleinere Dateien)
- ✅ Mehrere Auflösungen (bereits vorhanden: `Aa.mp4`, `Aa90.mp4`)
- ✅ Kompression mit modernen Codecs (H.265, VP9)

### 4. **CDN** (Vercel Edge Network)
Vercel cached Videos automatisch im Edge Network.

### 5. **Lazy Loading** (Optional)
Nur bei Bedarf laden.

---

## 🎯 Fazit

**Redis für Videos?** ❌ Nein

**Was stattdessen tun?**
- ✅ Videos bleiben in `/public` (statisch)
- ✅ Browser Caching nutzen (automatisch)
- ✅ Optional: Video-Format optimieren (WebM + MP4)
- ✅ CDN nutzen (Vercel macht das automatisch)

**Redis ist perfekt für:**
- ✅ Rate Limiting (✅ implementiert)
- ✅ TAN Store (✅ implementiert)
- ✅ Query Caching (zukunft)

**Redis ist NICHT für:**
- ❌ Videos
- ❌ Bilder (außer Thumbnails)
- ❌ Große Dateien (> 1 MB)

