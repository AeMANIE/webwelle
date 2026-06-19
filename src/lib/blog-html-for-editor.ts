/** Prepare n8n/SEO HTML for Quill (strips unsupported wrappers, ensures block tags). */
export function normalizeHtmlForQuill(html: string): string {
  let text = String(html || '').trim();
  if (!text) return '<p><br></p>';

  text = text.replace(/^Hier ist der[^\n]{0,120}:?\s*/i, '');
  text = text.replace(/<\/?article[^>]*>/gi, '');

  const fence = text.match(/```(?:html)?\s*([\s\S]*?)```/i);
  if (fence) text = fence[1].trim();

  if (!/<[a-z][\s>/]/i.test(text)) {
    const parts: string[] = [];
    for (const line of text.split(/\n+/)) {
      const t = line.trim();
      if (!t) continue;
      if (/^#{1}\s+/.test(t)) parts.push(`<h1>${t.replace(/^#+\s+/, '')}</h1>`);
      else if (/^#{2}\s+/.test(t)) parts.push(`<h2>${t.replace(/^#+\s+/, '')}</h2>`);
      else if (/^#{3}\s+/.test(t)) parts.push(`<h3>${t.replace(/^#+\s+/, '')}</h3>`);
      else if (/^[-*]\s+/.test(t)) parts.push(`<li>${t.replace(/^[-*]\s+/, '')}</li>`);
      else parts.push(`<p>${t}</p>`);
    }
    text = parts.join('\n');
  }

  if (!/<(p|h[1-6]|ul|ol|li|blockquote|div)\b/i.test(text)) {
    text = `<p>${text.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>`;
  }

  return text;
}

export function countWordsFromHtml(html: string): number {
  return String(html || '')
    .replace(/<[^>]+>/g, ' ')
    .split(/\s+/)
    .filter(Boolean).length;
}

export function isBlogStubContent(html: string): boolean {
  const text = String(html || '');
  const words = countWordsFromHtml(text);
  return /Entwurf folgt\./i.test(text) && words < 50;
}
