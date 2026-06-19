'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import QuillEditor from './QuillEditor';
import { Eye, Save, Upload, X, CheckCircle, AlertCircle, Search, Image as ImageIcon, FileText, Settings, Zap, Images } from 'lucide-react';
// CSS für ReactQuill importieren
import 'react-quill/dist/quill.snow.css';
import BlogImageGallery from './BlogImageGallery';
import ImageInsertModal from './ImageInsertModal';
import type { BlogPost } from '@/lib/blog-database';
import { getBlogPreviewUrl } from '@/lib/blog-preview';
import {
  isBlogStubContent,
  normalizeHtmlForQuill,
} from '@/lib/blog-html-for-editor';

// Erweitertes Interface, das auch string für Datumsfelder akzeptiert (für Kompatibilität)
interface BlogPostInput extends Omit<Partial<BlogPost>, 'publishedAt' | 'createdAt' | 'updatedAt'> {
  publishedAt?: Date | string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

interface BlogEditorProps {
  post?: BlogPostInput;
  onSave: () => void;
}

// SEO-Analyse-Funktion
function analyzeSEO(title: string, metaDescription: string, content: string) {
  const issues: string[] = [];
  const suggestions: string[] = [];

  // Titel-Analyse
  if (title.length < 30) {
    issues.push('Titel ist zu kurz (empfohlen: 30-60 Zeichen)');
  } else if (title.length > 60) {
    issues.push('Titel ist zu lang (empfohlen: 30-60 Zeichen)');
  }

  // Meta-Description-Analyse
  if (!metaDescription) {
    issues.push('Meta-Beschreibung fehlt');
  } else if (metaDescription.length < 120) {
    suggestions.push('Meta-Beschreibung sollte mindestens 120 Zeichen haben');
  } else if (metaDescription.length > 160) {
    issues.push('Meta-Beschreibung ist zu lang (max. 160 Zeichen)');
  }

  // Content-Analyse
  const textContent = content.replace(/<[^>]*>/g, ''); // HTML-Tags entfernen
  const wordCount = textContent.split(/\s+/).filter(w => w.length > 0).length;
  
  if (wordCount < 300) {
    suggestions.push(`Artikel ist kurz (${wordCount} Wörter). Empfohlen: mindestens 300 Wörter für SEO`);
  }

  // Slug-Analyse
  if (title && !title.toLowerCase().includes(title.split(' ')[0].toLowerCase())) {
    suggestions.push('Slug sollte relevante Keywords enthalten');
  }

  return { issues, suggestions, wordCount };
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
  const [publishedAt, setPublishedAt] = useState<string>(() => {
    if (post?.publishedAt) {
      const date = post.publishedAt instanceof Date ? post.publishedAt : new Date(post.publishedAt);
      return date.toISOString().split('T')[0];
    }
    return new Date().toISOString().split('T')[0];
  });
  const [publishedAtTime, setPublishedAtTime] = useState<string>(() => {
    if (post?.publishedAt) {
      const date = post.publishedAt instanceof Date ? post.publishedAt : new Date(post.publishedAt);
      return date.toTimeString().slice(0, 5);
    }
    return new Date().toTimeString().slice(0, 5);
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [activeTab, setActiveTab] = useState<'content' | 'seo' | 'settings' | 'images'>('content');
  const [selectedImageFormat, setSelectedImageFormat] = useState<'landscape' | 'square' | 'portrait' | undefined>();
  const [imageInsertModal, setImageInsertModal] = useState<{ url: string } | null>(null);
  const [importingPipeline, setImportingPipeline] = useState(false);
  const quillEditorRef = useRef<{ 
    insertImageAtCursor?: (url: string, size?: 'small' | 'medium' | 'large' | 'full', align?: 'left' | 'center' | 'right') => void;
    saveCursorPosition?: () => void;
    restoreCursorPosition?: () => void;
    quillInstance?: any;
  }>({});
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedRef = useRef<string>('');

  // Auto-generate slug from title
  useEffect(() => {
    if (!post && title && !slug) {
      const generatedSlug = title
        .toLowerCase()
        .replace(/ä/g, 'ae')
        .replace(/ö/g, 'oe')
        .replace(/ü/g, 'ue')
        .replace(/ß/g, 'ss')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setSlug(generatedSlug);
    }
  }, [title, slug, post]);

  useEffect(() => {
    if (post?.content != null) {
      setContent(normalizeHtmlForQuill(post.content));
    }
  }, [post?.id]);

  // Auto-Save (alle 30 Sekunden)
  useEffect(() => {
    if (post?.id && (title || content)) {
      const currentState = JSON.stringify({ title, slug, content, excerpt, metaDescription });
      
      if (currentState !== lastSavedRef.current) {
        if (autoSaveTimerRef.current) {
          clearTimeout(autoSaveTimerRef.current);
        }

        autoSaveTimerRef.current = setTimeout(() => {
          handleSave(true); // Auto-save ohne Status-Änderung
        }, 30000); // 30 Sekunden
      }
    }

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [title, slug, content, excerpt, metaDescription, post?.id]);

  const handleSave = async (
    isAutoSave = false,
    overrideStatus?: 'draft' | 'published'
  ) => {
    if (!title || !slug || !content) {
      if (!isAutoSave) {
        setError('Titel, Slug und Inhalt sind erforderlich');
      }
      return;
    }

    const saveStatus: 'draft' | 'published' = overrideStatus
      ?? (isAutoSave ? (post?.status || 'draft') : status);

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const tagsArray = tags
        .split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0);

      let publishedAtDate: string | null = null;
      if (saveStatus === 'published' && !isAutoSave) {
        if (publishedAt && publishedAtTime) {
          publishedAtDate = `${publishedAt}T${publishedAtTime}:00`;
        } else {
          publishedAtDate = new Date().toISOString();
        }
      } else if (post?.publishedAt && !isAutoSave && saveStatus === 'published') {
        const date = post.publishedAt instanceof Date ? post.publishedAt : new Date(post.publishedAt);
        publishedAtDate = date.toISOString();
      }

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
        status: saveStatus,
        publishedAt: publishedAtDate,
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

      if (!isAutoSave && overrideStatus) {
        setStatus(overrideStatus);
      }

      lastSavedRef.current = JSON.stringify({ title, slug, content, excerpt, metaDescription });

      if (!isAutoSave) {
        setSuccess(
          saveStatus === 'published'
            ? 'Artikel veröffentlicht!'
            : 'Artikel erfolgreich gespeichert!'
        );
        setTimeout(() => {
          onSave();
        }, 1000);
      }
    } catch (err) {
      if (!isAutoSave) {
        setError(err instanceof Error ? err.message : 'Fehler beim Speichern');
      }
    } finally {
      setSaving(false);
    }
  };

  const previewHref =
    post?.id && slug
      ? getBlogPreviewUrl({ id: post.id, slug, status })
      : undefined;

  async function importPipelineContent() {
    if (!post?.id) return;
    setImportingPipeline(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/blog/${post.id}/import-pipeline`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || data.message || 'Import fehlgeschlagen');
      }
      if (data.post?.content) {
        setContent(normalizeHtmlForQuill(data.post.content));
      }
      setSuccess(data.message || 'Pipeline-Text importiert.');
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import fehlgeschlagen');
    } finally {
      setImportingPipeline(false);
    }
  }

  // Drag & Drop für Bilder
  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      await uploadImage(file);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  // Bild-Upload-Funktion
  const uploadImage = async (file: File) => {
    setUploadingImage(true);
    setError('');

    // Validierung
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setError('Datei ist zu groß (max. 5MB)');
      setUploadingImage(false);
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      setError('Nur Bilder (JPEG, PNG, WebP, GIF) sind erlaubt');
      setUploadingImage(false);
      return;
    }

    // Upload
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/admin/blog/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok && data.url) {
        setFeaturedImageUrl(data.url);
        setError('');
        setSuccess('Bild erfolgreich hochgeladen!');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.error || 'Fehler beim Hochladen des Bildes');
      }
    } catch (err) {
      setError('Fehler beim Hochladen des Bildes');
    } finally {
      setUploadingImage(false);
    }
  };

  const seoAnalysis = analyzeSEO(title, metaDescription, content);

  const showPipelineImport =
    Boolean(post?.id && post.sourceJobId) &&
    (isBlogStubContent(content) || seoAnalysis.wordCount < 80);

  // Quill-Module werden jetzt im QuillEditor selbst definiert (mit Bild-Upload-Handler)
  const quillModules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['link', 'image'],
      ['code-block'],
      ['clean'],
    ],
  };

  return (
    <div className="space-y-6">
      {/* Header mit Tabs */}
      <div className="border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-foreground">
            {post?.id ? 'Blog-Post bearbeiten' : 'Neuen Blog-Post erstellen'}
          </h2>
          <div className="flex items-center gap-2">
            {post?.id && previewHref && (
              <a
                href={previewHref}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors"
              >
                <Eye className="w-4 h-4" />
                Vorschau
              </a>
            )}
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="flex items-center gap-2 px-4 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors"
            >
              <Eye className="w-4 h-4" />
              {showPreview ? 'Editor' : 'Vorschau'}
            </button>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('content')}
            className={`pb-3 px-2 border-b-2 transition-colors ${
              activeTab === 'content'
                ? 'border-primary text-primary font-semibold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <FileText className="w-4 h-4 inline mr-2" />
            Inhalt
          </button>
          <button
            onClick={() => setActiveTab('seo')}
            className={`pb-3 px-2 border-b-2 transition-colors ${
              activeTab === 'seo'
                ? 'border-primary text-primary font-semibold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Search className="w-4 h-4 inline mr-2" />
            SEO
          </button>
          <button
            onClick={() => setActiveTab('images')}
            className={`pb-3 px-2 border-b-2 transition-colors ${
              activeTab === 'images'
                ? 'border-primary text-primary font-semibold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Images className="w-4 h-4 inline mr-2" />
            Bilder
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`pb-3 px-2 border-b-2 transition-colors ${
              activeTab === 'settings'
                ? 'border-primary text-primary font-semibold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Settings className="w-4 h-4 inline mr-2" />
            Einstellungen
          </button>
        </div>
      </div>

      {/* Success Message */}
      {success && (
        <div className="bg-green-500/10 border border-green-500 rounded-lg p-4 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-500" />
          <p className="text-green-500 text-sm">{success}</p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/10 border border-red-500 rounded-lg p-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <p className="text-red-500 text-sm">{error}</p>
        </div>
      )}

      {/* Vorschau */}
      {showPreview ? (
        <div className="bg-card border border-border rounded-lg p-8">
          <article>
            {featuredImageUrl && (
              <img
                src={featuredImageUrl}
                alt={title}
                className="w-full h-64 object-cover rounded-lg mb-6"
              />
            )}
            <h1 className="text-4xl font-bold text-foreground mb-4">{title || 'Titel'}</h1>
            {excerpt && (
              <p className="text-xl text-muted-foreground mb-6">{excerpt}</p>
            )}
            <div
              className="prose prose-lg max-w-none"
              dangerouslySetInnerHTML={{ __html: content || '<p>Inhalt wird hier angezeigt...</p>' }}
            />
          </article>
        </div>
      ) : (
        <>
          {/* Content Tab */}
          {activeTab === 'content' && (
            <div className="space-y-6">
              {showPipelineImport && (
                <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm">
                  <p className="text-foreground mb-2">
                    Der gespeicherte Text wirkt wie ein Pipeline-Stub oder ist sehr kurz. Du kannst
                    den vollständigen SEO-Text aus dem verknüpften Job #{post?.sourceJobId}{' '}
                    importieren (Tab Kunden-Blog → Job-Details).
                  </p>
                  <button
                    type="button"
                    onClick={importPipelineContent}
                    disabled={importingPipeline}
                    className="rounded-lg bg-brand px-3 py-1.5 text-sm font-medium text-brand-foreground disabled:opacity-50"
                  >
                    {importingPipeline ? 'Importiere…' : 'Pipeline-Text importieren'}
                  </button>
                </div>
              )}

              {/* Titel */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Titel * <span className="text-muted-foreground">({title.length} Zeichen)</span>
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
                <p className="text-xs text-muted-foreground mt-1">
                  URL: {process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/blog/{slug || 'slug'}
                </p>
              </div>

              {/* Excerpt */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Kurzbeschreibung <span className="text-muted-foreground">({excerpt.length} Zeichen)</span>
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
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-foreground">
                    Inhalt * <span className="text-muted-foreground">({seoAnalysis.wordCount} Wörter)</span>
                  </label>
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      // WICHTIG: onMouseDown wird VOR dem onClick ausgeführt
                      // So können wir die Position speichern, BEVOR der Editor den Fokus verliert
                      e.preventDefault(); // Verhindere, dass der Button den Fokus bekommt
                      
                      // Speichere Cursor-Position BEVOR der Editor den Fokus verliert
                      if (quillEditorRef.current?.saveCursorPosition) {
                        quillEditorRef.current.saveCursorPosition();
                      }
                    }}
                    onClick={() => {
                      // Wechsle zum Bilder-Tab
                      setActiveTab('images');
                    }}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm bg-brand text-brand-foreground rounded-lg hover:bg-brand/90 transition-colors"
                  >
                    <Images className="w-4 h-4" />
                    Bild aus Galerie einfügen
                  </button>
                </div>
                <QuillEditor
                  ref={quillEditorRef}
                  theme="snow"
                  value={content}
                  onChange={setContent}
                  modules={quillModules}
                  className="bg-background text-foreground"
                  style={{ minHeight: '500px' }}
                  onImageInserted={(imageUrl) => {
                    // Speichere Cursor-Position bevor Modal geöffnet wird
                    if (quillEditorRef.current?.saveCursorPosition) {
                      quillEditorRef.current.saveCursorPosition();
                    }
                    // Öffne Modal für Größen- und Ausrichtungs-Auswahl
                    setImageInsertModal({ url: imageUrl });
                  }}
                />
                <div className="mt-2">
                  <p className="text-xs text-muted-foreground">
                    💡 Tipp: Bilder werden am Ende eingefügt. Sie können sie dann per Drag & Drop an die gewünschte Stelle ziehen.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Bilder Tab */}
          {activeTab === 'images' && (
            <div className="space-y-6">
              <div className="bg-card border border-border rounded-lg p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Images className="w-5 h-5" />
                  Professionelle Bildverwaltung
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Verwalten Sie alle Bilder für diesen Artikel. Wählen Sie das Format (Landscape, Quadratisch, Portrait) und fügen Sie Bilder direkt in den Content ein.
                </p>
                
                {/* Format-Auswahl */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Bildformat für Upload
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedImageFormat('landscape')}
                      className={`px-4 py-2 rounded-lg border transition-colors ${
                        selectedImageFormat === 'landscape'
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-background text-foreground border-border hover:border-primary'
                      }`}
                    >
                      Landscape (16:9)
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedImageFormat('square')}
                      className={`px-4 py-2 rounded-lg border transition-colors ${
                        selectedImageFormat === 'square'
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-background text-foreground border-border hover:border-primary'
                      }`}
                    >
                      Quadratisch (1:1)
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedImageFormat('portrait')}
                      className={`px-4 py-2 rounded-lg border transition-colors ${
                        selectedImageFormat === 'portrait'
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-background text-foreground border-border hover:border-primary'
                      }`}
                    >
                      Portrait (3:4)
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedImageFormat(undefined)}
                      className={`px-4 py-2 rounded-lg border transition-colors ${
                        !selectedImageFormat
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-background text-foreground border-border hover:border-primary'
                      }`}
                    >
                      Auto
                    </button>
                  </div>
                </div>

                {/* Bild-Galerie */}
                <BlogImageGallery
                  postId={post?.id}
                  selectedFormat={selectedImageFormat}
                  onSelectImage={(imageUrl, format) => {
                    // Speichere Cursor-Position bevor Modal geöffnet wird
                    // Falls die Position noch nicht gespeichert wurde (z.B. wenn direkt im Bilder-Tab gearbeitet wird)
                    if (quillEditorRef.current?.saveCursorPosition) {
                      quillEditorRef.current.saveCursorPosition();
                    }
                    // Öffne Modal für Größen- und Ausrichtungs-Auswahl
                    setImageInsertModal({ url: imageUrl });
                  }}
                />
              </div>
            </div>
          )}

          {/* SEO Tab */}
          {activeTab === 'seo' && (
            <div className="space-y-6">
              {/* SEO-Analyse */}
              <div className="bg-card border border-border rounded-lg p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  SEO-Analyse
                </h3>
                
                {seoAnalysis.issues.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-red-500 mb-2">Probleme:</h4>
                    <ul className="space-y-1">
                      {seoAnalysis.issues.map((issue, index) => (
                        <li key={index} className="text-sm text-red-500 flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          {issue}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {seoAnalysis.suggestions.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-yellow-500 mb-2">Empfehlungen:</h4>
                    <ul className="space-y-1">
                      {seoAnalysis.suggestions.map((suggestion, index) => (
                        <li key={index} className="text-sm text-yellow-500 flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          {suggestion}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {seoAnalysis.issues.length === 0 && seoAnalysis.suggestions.length === 0 && (
                  <div className="flex items-center gap-2 text-green-500">
                    <CheckCircle className="w-5 h-5" />
                    <p className="text-sm">SEO-Analyse: Alles sieht gut aus!</p>
                  </div>
                )}
              </div>

              {/* Meta Description */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Meta-Beschreibung (SEO) *
                  <span className="text-muted-foreground ml-2">
                    ({metaDescription.length}/160 Zeichen)
                  </span>
                </label>
                <textarea
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground"
                  placeholder="Meta-Beschreibung für Suchmaschinen (120-160 Zeichen empfohlen)"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Diese Beschreibung erscheint in den Suchergebnissen von Google
                </p>
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
                <p className="text-xs text-muted-foreground mt-1">
                  Tags helfen bei der Kategorisierung und SEO
                </p>
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
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

              {/* Veröffentlichungsdatum */}
              {status === 'published' && (
                <div className="bg-card border border-border rounded-lg p-6">
                  <label className="block text-sm font-medium text-foreground mb-4">
                    Veröffentlichungsdatum
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-muted-foreground mb-2">Datum</label>
                      <input
                        type="date"
                        value={publishedAt}
                        onChange={(e) => setPublishedAt(e.target.value)}
                        className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Sie können auch ein Datum in der Vergangenheit wählen
                      </p>
                    </div>
                    <div>
                      <label className="block text-xs text-muted-foreground mb-2">Uhrzeit</label>
                      <input
                        type="time"
                        value={publishedAtTime}
                        onChange={(e) => setPublishedAtTime(e.target.value)}
                        className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground"
                      />
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      Gewähltes Datum: {publishedAt && publishedAtTime 
                        ? new Date(`${publishedAt}T${publishedAtTime}`).toLocaleString('de-DE', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        : 'Nicht gesetzt'}
                    </p>
                  </div>
                </div>
              )}

              {/* Featured & Status */}
              <div className="bg-card border border-border rounded-lg p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-foreground">Featured Post</label>
                    <p className="text-xs text-muted-foreground">Als Featured-Artikel auf der Blog-Seite anzeigen</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={featured}
                      onChange={(e) => setFeatured(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-foreground">Status</label>
                    <p className="text-xs text-muted-foreground">Veröffentlichungsstatus des Artikels</p>
                  </div>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as 'draft' | 'published')}
                    className="px-4 py-2 bg-background border border-border rounded-lg text-foreground"
                  >
                    <option value="draft">Entwurf</option>
                    <option value="published">Veröffentlicht</option>
                  </select>
                </div>
              </div>

              {/* Auto-Save Info */}
              {post?.id && (
                <div className="bg-muted/50 border border-border rounded-lg p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Zap className="w-4 h-4" />
                    <span>Auto-Save ist aktiv. Änderungen werden alle 30 Sekunden automatisch gespeichert.</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Bild-Einfügen Modal */}
      {imageInsertModal && (
        <ImageInsertModal
          imageUrl={imageInsertModal.url}
          onInsert={(imageUrl, size, align) => {
            // Stelle sicher, dass der Editor fokussiert ist
            if (quillEditorRef.current?.quillInstance) {
              quillEditorRef.current.quillInstance.focus();
            }
            
            // Stelle sicher, dass die Cursor-Position noch gespeichert ist
            // Falls nicht, versuche sie nochmal zu speichern
            if (quillEditorRef.current?.saveCursorPosition) {
              // Kurze Verzögerung, damit der Fokus gesetzt wird
              setTimeout(() => {
                quillEditorRef.current?.saveCursorPosition?.();
                
                // Bild an Cursor-Position einfügen
                if (quillEditorRef.current?.insertImageAtCursor) {
                  quillEditorRef.current.insertImageAtCursor(imageUrl, size, align);
                  setSuccess('Bild wurde an der Cursor-Position eingefügt!');
                  setTimeout(() => setSuccess(''), 3000);
                } else {
                  // Fallback: Am Ende einfügen
                  const sizeStyles: Record<string, string> = {
                    small: 'max-width: 300px;',
                    medium: 'max-width: 600px;',
                    large: 'max-width: 900px;',
                    full: 'max-width: 100%; width: 100%;',
                  };
                  const alignStyles: Record<string, string> = {
                    left: 'float: left; margin-right: 1em;',
                    center: 'display: block; margin: 1em auto;',
                    right: 'float: right; margin-left: 1em;',
                  };
                  const style = `${sizeStyles[size]} ${alignStyles[align]} height: auto;`;
                  const imageHtml = `<p><img src="${imageUrl}" alt="${title}" style="${style}" /></p>`;
                  setContent(content + imageHtml);
                  setSuccess('Bild wurde eingefügt!');
                  setTimeout(() => setSuccess(''), 3000);
                }
              }, 100);
            } else if (quillEditorRef.current?.insertImageAtCursor) {
              // Direkt einfügen, falls saveCursorPosition nicht verfügbar ist
              quillEditorRef.current.insertImageAtCursor(imageUrl, size, align);
              setSuccess('Bild wurde an der Cursor-Position eingefügt!');
              setTimeout(() => setSuccess(''), 3000);
            } else {
              // Fallback: Am Ende einfügen
              const sizeStyles: Record<string, string> = {
                small: 'max-width: 300px;',
                medium: 'max-width: 600px;',
                large: 'max-width: 900px;',
                full: 'max-width: 100%; width: 100%;',
              };
              const alignStyles: Record<string, string> = {
                left: 'float: left; margin-right: 1em;',
                center: 'display: block; margin: 1em auto;',
                right: 'float: right; margin-left: 1em;',
              };
              const style = `${sizeStyles[size]} ${alignStyles[align]} height: auto;`;
              const imageHtml = `<p><img src="${imageUrl}" alt="${title}" style="${style}" /></p>`;
              setContent(content + imageHtml);
              setSuccess('Bild wurde eingefügt!');
              setTimeout(() => setSuccess(''), 3000);
            }
            setImageInsertModal(null);
            setActiveTab('content');
          }}
          onClose={() => setImageInsertModal(null)}
        />
      )}

      {/* Action Buttons */}
      <div className="flex gap-4 pt-6 border-t border-border">
        <button
          onClick={() => handleSave(false)}
          disabled={saving || !title || !content}
          className="flex items-center gap-2 px-6 py-2 bg-brand text-brand-foreground rounded-lg hover:bg-brand/90 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Speichern...' : 'Speichern'}
        </button>
        {status === 'draft' && (
          <button
            onClick={() => handleSave(false, 'published')}
            disabled={saving || !title || !content}
            className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Zap className="w-4 h-4" />
            Veröffentlichen
          </button>
        )}
        {status === 'published' && (
          <button
            onClick={() => {
              setStatus('draft');
              setTimeout(() => handleSave(false), 100);
            }}
            disabled={saving}
            className="px-6 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Zurück zu Entwurf
          </button>
        )}
      </div>
    </div>
  );
}

