import { pool, createTempPool } from './database';

// Helper-Funktion: Sichere Datenbankverbindung mit Fallback
async function getDatabaseClient(): Promise<{ client: import('pg').PoolClient; tempPool: import('pg').Pool | null }> {
  let client;
  let tempPool: import('pg').Pool | null = null;
  
  try {
    client = await pool.connect();
    return { client, tempPool: null };
  } catch (connectionError) {
    const errorMsg = connectionError instanceof Error ? connectionError.message : '';
    
    // SSL-Fallback für VPS oder Hostname-Fehler
    if (errorMsg.includes('certificate') || 
        errorMsg.includes('SSL') || 
        errorMsg.includes('TLS') ||
        errorMsg.includes('unable to verify') ||
        errorMsg.includes('ENOTFOUND') ||
        errorMsg.includes('getaddrinfo')) {
      const isDevelopment = process.env.NODE_ENV !== 'production';
      const usePublicUrl = isDevelopment || errorMsg.includes('ENOTFOUND') || errorMsg.includes('getaddrinfo');
      tempPool = await createTempPool({ rejectUnauthorized: false }, usePublicUrl);
      client = await tempPool.connect();
      return { client, tempPool };
    }
    
    throw connectionError;
  }
}

export interface BlogImage {
  id: string;
  blogPostId?: string;
  fileName: string;
  filePath: string;
  fileUrl: string;
  fileSize?: number;
  mimeType?: string;
  width?: number;
  height?: number;
  format: 'landscape' | 'square' | 'portrait' | 'auto';
  altText?: string;
  caption?: string;
  position: number;
  isFeatured: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
}

// Blog-Image erstellen
export async function createBlogImage(image: Omit<BlogImage, 'id' | 'createdAt' | 'updatedAt'>): Promise<BlogImage> {
  const { client, tempPool } = await getDatabaseClient();
  
  try {
    const result = await client.query(
      `INSERT INTO blog_images (
        blog_post_id, file_name, file_path, file_url, file_size, mime_type,
        width, height, format, alt_text, caption, position, is_featured, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *`,
      [
        image.blogPostId || null,
        image.fileName,
        image.filePath,
        image.fileUrl,
        image.fileSize || null,
        image.mimeType || null,
        image.width || null,
        image.height || null,
        image.format,
        image.altText || null,
        image.caption || null,
        image.position,
        image.isFeatured,
        image.createdBy || null,
      ]
    );
    
    const row = result.rows[0];
    return {
      id: row.id,
      blogPostId: row.blog_post_id,
      fileName: row.file_name,
      filePath: row.file_path,
      fileUrl: row.file_url,
      fileSize: row.file_size,
      mimeType: row.mime_type,
      width: row.width,
      height: row.height,
      format: row.format,
      altText: row.alt_text,
      caption: row.caption,
      position: row.position,
      isFeatured: row.is_featured,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      createdBy: row.created_by,
    };
  } finally {
    client.release();
    if (tempPool) await tempPool.end();
  }
}

// Alle Bilder für einen Blog-Post abrufen
export async function getBlogImagesByPostId(postId: string): Promise<BlogImage[]> {
  const { client, tempPool } = await getDatabaseClient();
  
  try {
    const result = await client.query(
      'SELECT * FROM blog_images WHERE blog_post_id = $1 ORDER BY position ASC, created_at ASC',
      [postId]
    );
    
    return result.rows.map(row => ({
      id: row.id,
      blogPostId: row.blog_post_id,
      fileName: row.file_name,
      filePath: row.file_path,
      fileUrl: row.file_url,
      fileSize: row.file_size,
      mimeType: row.mime_type,
      width: row.width,
      height: row.height,
      format: row.format,
      altText: row.alt_text,
      caption: row.caption,
      position: row.position,
      isFeatured: row.is_featured,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      createdBy: row.created_by,
    }));
  } finally {
    client.release();
    if (tempPool) await tempPool.end();
  }
}

// Alle hochgeladenen Bilder abrufen (für Galerie)
export async function getAllBlogImages(limit = 50): Promise<BlogImage[]> {
  const { client, tempPool } = await getDatabaseClient();
  
  try {
    const result = await client.query(
      'SELECT * FROM blog_images ORDER BY created_at DESC LIMIT $1',
      [limit]
    );
    
    return result.rows.map(row => ({
      id: row.id,
      blogPostId: row.blog_post_id,
      fileName: row.file_name,
      filePath: row.file_path,
      fileUrl: row.file_url,
      fileSize: row.file_size,
      mimeType: row.mime_type,
      width: row.width,
      height: row.height,
      format: row.format,
      altText: row.alt_text,
      caption: row.caption,
      position: row.position,
      isFeatured: row.is_featured,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      createdBy: row.created_by,
    }));
  } finally {
    client.release();
    if (tempPool) await tempPool.end();
  }
}

// Blog-Image aktualisieren
export async function updateBlogImage(id: string, updates: Partial<BlogImage>): Promise<BlogImage | null> {
  const { client, tempPool } = await getDatabaseClient();
  
  try {
    const fields: string[] = [];
    const values: unknown[] = [];
    let paramCount = 1;
    
    if (updates.altText !== undefined) {
      fields.push(`alt_text = $${paramCount++}`);
      values.push(updates.altText || null);
    }
    if (updates.caption !== undefined) {
      fields.push(`caption = $${paramCount++}`);
      values.push(updates.caption || null);
    }
    if (updates.position !== undefined) {
      fields.push(`position = $${paramCount++}`);
      values.push(updates.position);
    }
    if (updates.format) {
      fields.push(`format = $${paramCount++}`);
      values.push(updates.format);
    }
    if (updates.isFeatured !== undefined) {
      fields.push(`is_featured = $${paramCount++}`);
      values.push(updates.isFeatured);
    }
    
    if (fields.length === 0) {
      return null;
    }
    
    fields.push(`updated_at = NOW()`);
    values.push(id);
    
    const result = await client.query(
      `UPDATE blog_images SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const row = result.rows[0];
    return {
      id: row.id,
      blogPostId: row.blog_post_id,
      fileName: row.file_name,
      filePath: row.file_path,
      fileUrl: row.file_url,
      fileSize: row.file_size,
      mimeType: row.mime_type,
      width: row.width,
      height: row.height,
      format: row.format,
      altText: row.alt_text,
      caption: row.caption,
      position: row.position,
      isFeatured: row.is_featured,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      createdBy: row.created_by,
    };
  } finally {
    client.release();
    if (tempPool) await tempPool.end();
  }
}

// Blog-Image löschen
export async function deleteBlogImage(id: string): Promise<boolean> {
  const { client, tempPool } = await getDatabaseClient();
  
  try {
    const result = await client.query(
      'DELETE FROM blog_images WHERE id = $1',
      [id]
    );
    
    return result.rowCount !== null && result.rowCount > 0;
  } finally {
    client.release();
    if (tempPool) await tempPool.end();
  }
}

