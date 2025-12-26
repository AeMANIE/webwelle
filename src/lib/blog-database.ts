import { pool } from './database';

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  author: string;
  featuredImageUrl?: string;
  metaDescription?: string;
  tags: string[];
  featured: boolean;
  status: 'draft' | 'published';
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
}

// Alle Blog-Posts abrufen
export async function getAllBlogPosts(
  status?: 'draft' | 'published'
): Promise<BlogPost[]> {
  let client;
  let connectionError: Error | null = null;
  
  try {
    client = await pool.connect();
  } catch (error) {
    connectionError = error instanceof Error ? error : new Error('Unbekannter Fehler');
    
    // SSL-Fallback für VPS
    if (connectionError.message.includes('certificate') || 
        connectionError.message.includes('SSL') || 
        connectionError.message.includes('TLS') ||
        connectionError.message.includes('unable to verify')) {
      const { Pool: TempPool } = await import('pg');
      const tempPool = new TempPool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 10000,
      });
      
      try {
        client = await tempPool.connect();
        
        let query = 'SELECT * FROM blog_posts';
        const params: unknown[] = [];
        
        if (status) {
          query += ' WHERE status = $1';
          params.push(status);
        }
        
        query += ' ORDER BY created_at DESC';
        
        const result = await client.query(query, params);
        const posts = result.rows.map(row => ({
          id: row.id,
          title: row.title,
          slug: row.slug,
          excerpt: row.excerpt,
          content: row.content,
          author: row.author,
          featuredImageUrl: row.featured_image_url,
          metaDescription: row.meta_description,
          tags: row.tags || [],
          featured: row.featured || false,
          status: row.status,
          publishedAt: row.published_at ? new Date(row.published_at) : undefined,
          createdAt: new Date(row.created_at),
          updatedAt: new Date(row.updated_at),
          createdBy: row.created_by,
        }));
        
        client.release();
        await tempPool.end();
        return posts;
      } catch (fallbackError) {
        if (client) client.release();
        await tempPool.end();
        throw fallbackError;
      }
    }
    throw connectionError;
  }
  
  try {
    let query = 'SELECT * FROM blog_posts';
    const params: unknown[] = [];
    
    if (status) {
      query += ' WHERE status = $1';
      params.push(status);
    }
    
    query += ' ORDER BY created_at DESC';
    
    const result = await client.query(query, params);
    
    return result.rows.map(row => ({
      id: row.id,
      title: row.title,
      slug: row.slug,
      excerpt: row.excerpt,
      content: row.content,
      author: row.author,
      featuredImageUrl: row.featured_image_url,
      metaDescription: row.meta_description,
      tags: row.tags || [],
      featured: row.featured || false,
      status: row.status,
      publishedAt: row.published_at ? new Date(row.published_at) : undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      createdBy: row.created_by,
    }));
  } finally {
    client.release();
  }
}

// Einzelner Blog-Post
export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  const client = await pool.connect();
  
  try {
    const result = await client.query(
      'SELECT * FROM blog_posts WHERE slug = $1',
      [slug]
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const row = result.rows[0];
    return {
      id: row.id,
      title: row.title,
      slug: row.slug,
      excerpt: row.excerpt,
      content: row.content,
      author: row.author,
      featuredImageUrl: row.featured_image_url,
      metaDescription: row.meta_description,
      tags: row.tags || [],
      featured: row.featured || false,
      status: row.status,
      publishedAt: row.published_at ? new Date(row.published_at) : undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      createdBy: row.created_by,
    };
  } finally {
    client.release();
  }
}

// Blog-Post nach ID
export async function getBlogPostById(id: string): Promise<BlogPost | null> {
  const client = await pool.connect();
  
  try {
    const result = await client.query(
      'SELECT * FROM blog_posts WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const row = result.rows[0];
    return {
      id: row.id,
      title: row.title,
      slug: row.slug,
      excerpt: row.excerpt,
      content: row.content,
      author: row.author,
      featuredImageUrl: row.featured_image_url,
      metaDescription: row.meta_description,
      tags: row.tags || [],
      featured: row.featured || false,
      status: row.status,
      publishedAt: row.published_at ? new Date(row.published_at) : undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      createdBy: row.created_by,
    };
  } finally {
    client.release();
  }
}

// Blog-Post erstellen
export async function createBlogPost(post: Omit<BlogPost, 'id' | 'createdAt' | 'updatedAt'>): Promise<BlogPost> {
  const client = await pool.connect();
  
  try {
    const result = await client.query(
      `INSERT INTO blog_posts (
        title, slug, excerpt, content, author, featured_image_url, 
        meta_description, tags, featured, status, published_at, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *`,
      [
        post.title,
        post.slug,
        post.excerpt || null,
        post.content,
        post.author,
        post.featuredImageUrl || null,
        post.metaDescription || null,
        post.tags,
        post.featured,
        post.status,
        post.status === 'published' ? new Date() : null,
        post.createdBy || null,
      ]
    );
    
    const row = result.rows[0];
    return {
      id: row.id,
      title: row.title,
      slug: row.slug,
      excerpt: row.excerpt,
      content: row.content,
      author: row.author,
      featuredImageUrl: row.featured_image_url,
      metaDescription: row.meta_description,
      tags: row.tags || [],
      featured: row.featured || false,
      status: row.status,
      publishedAt: row.published_at ? new Date(row.published_at) : undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      createdBy: row.created_by,
    };
  } finally {
    client.release();
  }
}

// Blog-Post aktualisieren
export async function updateBlogPost(id: string, updates: Partial<BlogPost>): Promise<BlogPost | null> {
  const client = await pool.connect();
  
  try {
    const fields: string[] = [];
    const values: unknown[] = [];
    let paramCount = 1;
    
    if (updates.title) {
      fields.push(`title = $${paramCount++}`);
      values.push(updates.title);
    }
    if (updates.slug) {
      fields.push(`slug = $${paramCount++}`);
      values.push(updates.slug);
    }
    if (updates.excerpt !== undefined) {
      fields.push(`excerpt = $${paramCount++}`);
      values.push(updates.excerpt || null);
    }
    if (updates.content) {
      fields.push(`content = $${paramCount++}`);
      values.push(updates.content);
    }
    if (updates.author) {
      fields.push(`author = $${paramCount++}`);
      values.push(updates.author);
    }
    if (updates.featuredImageUrl !== undefined) {
      fields.push(`featured_image_url = $${paramCount++}`);
      values.push(updates.featuredImageUrl || null);
    }
    if (updates.metaDescription !== undefined) {
      fields.push(`meta_description = $${paramCount++}`);
      values.push(updates.metaDescription || null);
    }
    if (updates.tags) {
      fields.push(`tags = $${paramCount++}`);
      values.push(updates.tags);
    }
    if (updates.featured !== undefined) {
      fields.push(`featured = $${paramCount++}`);
      values.push(updates.featured);
    }
    if (updates.status) {
      fields.push(`status = $${paramCount++}`);
      values.push(updates.status);
      if (updates.status === 'published' && !updates.publishedAt) {
        fields.push(`published_at = $${paramCount++}`);
        values.push(new Date());
      }
    }
    if (updates.publishedAt !== undefined) {
      fields.push(`published_at = $${paramCount++}`);
      values.push(updates.publishedAt || null);
    }
    
    if (fields.length === 0) {
      return await getBlogPostById(id);
    }
    
    fields.push(`updated_at = NOW()`);
    values.push(id);
    
    const result = await client.query(
      `UPDATE blog_posts SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const row = result.rows[0];
    return {
      id: row.id,
      title: row.title,
      slug: row.slug,
      excerpt: row.excerpt,
      content: row.content,
      author: row.author,
      featuredImageUrl: row.featured_image_url,
      metaDescription: row.meta_description,
      tags: row.tags || [],
      featured: row.featured || false,
      status: row.status,
      publishedAt: row.published_at ? new Date(row.published_at) : undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      createdBy: row.created_by,
    };
  } finally {
    client.release();
  }
}

// Blog-Post löschen
export async function deleteBlogPost(id: string): Promise<boolean> {
  const client = await pool.connect();
  
  try {
    const result = await client.query(
      'DELETE FROM blog_posts WHERE id = $1',
      [id]
    );
    
    return result.rowCount !== null && result.rowCount > 0;
  } finally {
    client.release();
  }
}

// Slug aus Titel generieren
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

