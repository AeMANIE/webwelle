'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import 'react-quill/dist/quill.snow.css';

// Dynamischer Import für React Quill (nur Client-Side)
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });

interface BlogPost {
  id?: string;
  title: string;
  slug: string;
  excerpt?: string;
  content?: string;
  author?: string;
  featuredImageUrl?: string;
  metaDescription?: string;
  tags?: string[];
  featured?: boolean;
  status?: 'draft' | 'published';
}

interface BlogEditorProps {
  post?: BlogPost;
  onSave: () => void;
}

export default function BlogEditor({ post, onSave }: BlogEditorProps) {
  const [title, setTitle] = useState(post?.title || '');
  const [slug, setSlug] = useState(post?.slug || '');
  const [excerpt, setExcerpt] = useState(post?.excerpt || '');
  const [content, setContent] = useState(post?.content || '');
  const [author, setAuthor] = useState(post?.author || 'SEO-Team WebWelle');
  const [featuredImageUrl, setFeaturedImageUrl] = useState(post?.featuredImageUrl || '');
  const [metaDescription, setMetaDescription] = useState(post?.metaDescription || '');
  const [tags, setTags] = useState((post?.tags || []).join(', '));
  const [featured, setFeatured] = useState(post?.featured || false);
  const [status, setStatus] = useState<'draft' | 'published'>(post?.status || 'draft');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Auto-generate slug from title
  useEffect(() => {
    if (!post && title && !slug) {
      const generatedSlug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setSlug(generatedSlug);
    }
  }, [title, slug, post]);

  const handleSave = async () => {
    if (!title || !slug || !content) {
      setError('Titel, Slug und Inhalt sind erforderlich');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const tagsArray = tags
        .split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0);

      const payload = {
        title,
        slug,
        excerpt: excerpt || null,
        content,
        author,
        featuredImageUrl: featuredImageUrl || null,
        metaDescription: metaDescription || null,
        tags: tagsArray,
        featured,
        status,
      };

      const url = post?.id ? `/api/admin/blog/${post.id}` : '/api/admin/blog';
      const method = post?.id ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Fehler beim Speichern');
      }

      onSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Speichern');
    } finally {
      setSaving(false);
    }
  };

  const quillModules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['link', 'image'],
      ['clean'],
    ],
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-4">
          {post?.id ? 'Blog-Post bearbeiten' : 'Neuen Blog-Post erstellen'}
        </h2>
      </div>

      {/* Titel */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Titel *
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground"
          placeholder="Blog-Post Titel"
        />
      </div>

      {/* Slug */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Slug (URL) *
        </label>
        <input
          type="text"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground font-mono text-sm"
          placeholder="blog-post-slug"
        />
      </div>

      {/* Excerpt */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Kurzbeschreibung
        </label>
        <textarea
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          rows={3}
          className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground"
          placeholder="Kurze Zusammenfassung des Artikels"
        />
      </div>

      {/* Content */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Inhalt *
        </label>
        {typeof window !== 'undefined' && (
          <ReactQuill
            theme="snow"
            value={content}
            onChange={setContent}
            modules={quillModules}
            className="bg-background text-foreground"
            style={{ minHeight: '400px' }}
          />
        )}
      </div>

      {/* Meta Description */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Meta-Beschreibung (SEO)
        </label>
        <textarea
          value={metaDescription}
          onChange={(e) => setMetaDescription(e.target.value)}
          rows={2}
          className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground"
          placeholder="Meta-Beschreibung für Suchmaschinen"
        />
      </div>

      {/* Featured Image */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Featured Image URL
        </label>
        <input
          type="url"
          value={featuredImageUrl}
          onChange={(e) => setFeaturedImageUrl(e.target.value)}
          className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground"
          placeholder="https://example.com/image.jpg"
        />
      </div>

      {/* Tags */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Tags (kommagetrennt)
        </label>
        <input
          type="text"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground"
          placeholder="SEO, Marketing, Webdesign"
        />
      </div>

      {/* Author */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Autor
        </label>
        <input
          type="text"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground"
          placeholder="SEO-Team WebWelle"
        />
      </div>

      {/* Featured & Status */}
      <div className="flex items-center gap-6">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={featured}
            onChange={(e) => setFeatured(e.target.checked)}
            className="w-4 h-4"
          />
          <span className="text-sm text-foreground">Featured Post</span>
        </label>
        <div className="flex items-center gap-2">
          <label className="text-sm text-foreground">Status:</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as 'draft' | 'published')}
            className="px-3 py-1 bg-background border border-border rounded text-foreground"
          >
            <option value="draft">Entwurf</option>
            <option value="published">Veröffentlicht</option>
          </select>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500 rounded-lg p-4">
          <p className="text-red-500 text-sm">{error}</p>
        </div>
      )}

      {/* Save Button */}
      <div className="flex gap-4">
        <button
          onClick={handleSave}
          disabled={saving || !title || !content}
          className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Speichern...' : 'Speichern'}
        </button>
        {status === 'draft' && (
          <button
            onClick={() => {
              setStatus('published');
              setTimeout(handleSave, 100);
            }}
            disabled={saving || !title || !content}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Veröffentlichen
          </button>
        )}
      </div>
    </div>
  );
}

