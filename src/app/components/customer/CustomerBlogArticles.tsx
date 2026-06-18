'use client';

import { useEffect, useState } from 'react';
import sanitizeHtml from 'sanitize-html';

interface CustomerArticle {
  id: number;
  title: string | null;
  keyword: string;
  metaDesc: string | null;
  htmlContent: string | null;
  wordCount: number | null;
  customerNote: string | null;
  customerVisibleAt: string;
}

export default function CustomerBlogArticles() {
  const [articles, setArticles] = useState<CustomerArticle[]>([]);
  const [hasBlog, setHasBlog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<CustomerArticle | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/customer/blog-articles')
      .then((r) => r.json())
      .then((data) => {
        setHasBlog(Boolean(data.hasBlogPackage));
        setArticles(data.articles || []);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <p className="py-8 text-center text-muted-foreground">Lade SEO-Artikel…</p>;
  }

  if (!hasBlog && articles.length === 0) {
    return null;
  }

  async function copyHtml(article: CustomerArticle) {
    const text = article.htmlContent || '';
    await navigator.clipboard.writeText(text);
    setMessage('HTML in Zwischenablage kopiert.');
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Ihre freigegebenen SEO-Artikel — nur für Sie sichtbar (nicht öffentlich indexiert).
      </p>
      {message && <p className="text-sm text-green-600">{message}</p>}

      {articles.length === 0 ? (
        <p className="text-muted-foreground">
          Noch keine Artikel freigegeben. Sobald Ihre Artikel bereit sind, erscheinen sie hier.
        </p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-3">
            {articles.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => setSelected(a)}
                className={`w-full text-left rounded-lg border p-4 transition-colors ${
                  selected?.id === a.id ? 'border-brand bg-brand/5' : 'border-border hover:bg-muted/30'
                }`}
              >
                <p className="font-medium">{a.title || a.keyword}</p>
                <p className="text-xs text-muted-foreground">{a.keyword}</p>
                {a.wordCount != null && (
                  <p className="text-xs text-muted-foreground mt-1">{a.wordCount} Wörter</p>
                )}
              </button>
            ))}
          </div>

          {selected && (
            <div className="rounded-xl border border-border p-4 space-y-3">
              <h3 className="font-semibold">{selected.title || selected.keyword}</h3>
              {selected.customerNote && (
                <p className="text-sm text-muted-foreground bg-muted/30 rounded p-3">
                  {selected.customerNote}
                </p>
              )}
              {selected.htmlContent && (
                <div
                  className="prose prose-sm max-w-none max-h-96 overflow-y-auto border rounded p-3"
                  dangerouslySetInnerHTML={{
                    __html: sanitizeHtml(selected.htmlContent, {
                      allowedTags: sanitizeHtml.defaults.allowedTags,
                      allowedAttributes: { a: ['href', 'name', 'target', 'rel'] },
                    }),
                  }}
                />
              )}
              <button
                type="button"
                onClick={() => copyHtml(selected)}
                className="text-sm bg-brand text-brand-foreground px-4 py-2 rounded-lg"
              >
                HTML kopieren
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
