'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye, Calendar, Tag } from 'lucide-react';
import BlogEditor from './BlogEditor';
import BlogGenerateModal from './BlogGenerateModal';
import { DashboardPanel } from '../dashboard/DashboardPanel';
import { getBlogPreviewUrl } from '@/lib/blog-preview';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content?: string;
  author?: string;
  status: 'draft' | 'published';
  featured: boolean;
  createdAt: string;
  publishedAt?: string;
  tags?: string[];
  sourceJobId?: number;
}

export default function BlogTab() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'published'>('all');
  const [pendingJobId, setPendingJobId] = useState<number | null>(null);

  useEffect(() => {
    fetchPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const fetchPosts = async () => {
    try {
      const url = statusFilter === 'all' 
        ? '/api/admin/blog' 
        : `/api/admin/blog?status=${statusFilter}`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setPosts(data);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Blog-Posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Möchten Sie diesen Artikel wirklich löschen?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/blog/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchPosts();
      }
    } catch (error) {
      console.error('Fehler beim Löschen:', error);
    }
  };

  async function openEditor(post: BlogPost | null) {
    if (!post?.id) {
      setEditingPost(null);
      setShowEditor(true);
      return;
    }
    try {
      const res = await fetch(`/api/admin/blog/${post.id}`);
      if (res.ok) {
        setEditingPost(await res.json());
      } else {
        setEditingPost(post);
      }
    } catch {
      setEditingPost(post);
    }
    setShowEditor(true);
  }

  if (loading) {
    return <div className="text-center py-8">Lade Blog-Artikel...</div>;
  }

  if (showEditor) {
    return (
      <div>
        <button
          onClick={() => {
            setShowEditor(false);
            setEditingPost(null);
          }}
          className="mb-4 px-4 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors"
        >
          ← Zurück zur Übersicht
        </button>
        <BlogEditor
          post={editingPost || undefined}
          onSave={() => {
            fetchPosts();
            setShowEditor(false);
            setEditingPost(null);
          }}
        />
      </div>
    );
  }

  const filtered = posts.filter(post => 
    statusFilter === 'all' ? true : post.status === statusFilter
  );

  return (
    <DashboardPanel
      title={`Blog-Artikel (${posts.length})`}
      description="Veröffentlichte und Entwurfs-Artikel verwalten"
      noPadding
      action={
        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | 'draft' | 'published')}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
          >
            <option value="all">Alle</option>
            <option value="published">Veröffentlicht</option>
            <option value="draft">Entwürfe</option>
          </select>
          <button
            type="button"
            onClick={() => openEditor(null)}
            className="flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-brand-foreground hover:bg-brand/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Neuer Artikel
          </button>
          <BlogGenerateModal
            onStarted={(jobId) => {
              setPendingJobId(jobId);
              setStatusFilter('draft');
            }}
          />
        </div>
      }
    >
      {pendingJobId && (
        <div className="mx-6 mt-4 rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          Job #{pendingJobId} läuft — der Entwurf erscheint in ca. 5–10 Min. unter{' '}
          <strong className="text-foreground">Entwürfe</strong>. Danach bearbeiten, Vorschau
          prüfen und veröffentlichen.
        </div>
      )}
      {filtered.length === 0 ? (
        <div className="px-6 py-12 text-center text-muted-foreground">
          Keine Blog-Artikel gefunden.
        </div>
      ) : (
        <div className="divide-y divide-border">
          {filtered.map((post) => (
            <div
              key={post.id}
              className="px-6 py-5 transition-colors hover:bg-muted/20"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-semibold text-foreground">
                      {post.title}
                    </h3>
                    {post.featured && (
                      <span className="px-2 py-1 bg-primary/10 text-primary text-xs font-medium rounded">
                        Featured
                      </span>
                    )}
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded ${
                        post.status === 'published'
                          ? 'bg-green-500/10 text-green-500'
                          : 'bg-yellow-500/10 text-yellow-500'
                      }`}
                    >
                      {post.status === 'published' ? 'Veröffentlicht' : 'Entwurf'}
                    </span>
                  </div>
                  
                  {post.excerpt && (
                    <p className="text-muted-foreground mb-3 line-clamp-2">
                      {post.excerpt}
                    </p>
                  )}
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {post.publishedAt
                        ? new Date(post.publishedAt).toLocaleDateString('de-DE')
                        : new Date(post.createdAt).toLocaleDateString('de-DE')}
                    </div>
                    {post.tags && post.tags.length > 0 && (
                      <div className="flex items-center gap-1">
                        <Tag className="w-4 h-4" />
                        {post.tags.slice(0, 3).join(', ')}
                      </div>
                    )}
                    <span className="text-xs font-mono">/{post.slug}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => openEditor(post)}
                    className="p-2 text-primary hover:bg-primary/10 rounded transition-colors"
                    title="Bearbeiten"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <a
                    href={getBlogPreviewUrl(post)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-primary hover:bg-primary/10 rounded transition-colors"
                    title={post.status === 'draft' ? 'Admin-Vorschau (Entwurf)' : 'Live-Vorschau'}
                  >
                    <Eye className="w-4 h-4" />
                  </a>
                  <button
                    onClick={() => handleDelete(post.id)}
                    className="p-2 text-destructive hover:bg-destructive/10 rounded transition-colors"
                    title="Löschen"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardPanel>
  );
}
