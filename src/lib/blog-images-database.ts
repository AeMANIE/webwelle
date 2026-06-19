import { pool, createTempPool } from './database';
import { queryBlogImagesByPostId } from './blog-images-query';

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

// Stelle sicher, dass die blog_images Tabelle existiert
async function ensureBlogImagesTable(): Promise<void> {
  const { client, tempPool } = await getDatabaseClient();
  
  try {
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'blog_images'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      await client.query(`
        CREATE TABLE blog_images (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          post_id UUID REFERENCES blog_posts(id) ON DELETE CASCADE,
          article_id INT,
          source_system VARCHAR(20) DEFAULT 'webwelle',
          image_role VARCHAR(20) DEFAULT 'featured',
          file_name VARCHAR(255) NOT NULL,
          file_path VARCHAR(500) NOT NULL,
          file_url VARCHAR(500) NOT NULL,
          file_size INTEGER,
          mime_type VARCHAR(100),
          width INTEGER,
          height INTEGER,
          format VARCHAR(20) DEFAULT 'auto',
          alt_text TEXT,
          caption TEXT,
          position INTEGER DEFAULT 0,
          is_featured BOOLEAN DEFAULT FALSE,
          blur_data_url TEXT,
          prompt_used TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          created_by VARCHAR(255)
        );
        CREATE INDEX IF NOT EXISTS idx_blog_images_post_id ON blog_images(post_id);
        CREATE INDEX IF NOT EXISTS idx_blog_images_position ON blog_images(post_id, position);
        CREATE INDEX IF NOT EXISTS idx_blog_images_featured ON blog_images(is_featured);
      `);
      console.log('✅ blog_images Tabelle wurde erstellt');
    }
  } catch (error) {
    console.error('Fehler beim Erstellen der blog_images Tabelle:', error);
    throw error;
  } finally {
    client.release();
    if (tempPool) await tempPool.end();
  }
}

function mapBlogImageRow(row: Record<string, unknown>): BlogImage {
  const postId = (row.post_id ?? row.blog_post_id) as string | undefined;
  return {
    id: row.id as string,
    blogPostId: postId,
    fileName: row.file_name as string,
    filePath: row.file_path as string,
    fileUrl: row.file_url as string,
    fileSize: row.file_size as number | undefined,
    mimeType: row.mime_type as string | undefined,
    width: row.width as number | undefined,
    height: row.height as number | undefined,
    format: (row.format as BlogImage['format']) || 'auto',
    altText: row.alt_text as string | undefined,
    caption: row.caption as string | undefined,
    position: row.position as number,
    isFeatured: Boolean(row.is_featured),
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
    createdBy: row.created_by as string | undefined,
  };
}

// Blog-Image erstellen
export async function createBlogImage(image: Omit<BlogImage, 'id' | 'createdAt' | 'updatedAt'>): Promise<BlogImage> {
  // Stelle sicher, dass die Tabelle existiert
  await ensureBlogImagesTable();
  
  const { client, tempPool } = await getDatabaseClient();
  
  try {
    const result = await client.query(
      `INSERT INTO blog_images (
        post_id, file_name, file_path, file_url, file_size, mime_type,
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
    return mapBlogImageRow(row);
  } catch (error) {
    console.error('Fehler beim Erstellen des Blog-Images:', error);
    throw error;
  } finally {
    client.release();
    if (tempPool) await tempPool.end();
  }
}

// Alle Bilder für einen Blog-Post abrufen
export async function getBlogImagesByPostId(postId: string): Promise<BlogImage[]> {
  // Stelle sicher, dass die Tabelle existiert
  await ensureBlogImagesTable();
  
  const { client, tempPool } = await getDatabaseClient();
  
  try {
    const rows = await queryBlogImagesByPostId(client, postId, 'position, created_at');
    return rows.map(mapBlogImageRow);
  } catch (error) {
    console.error('Fehler beim Abrufen der Blog-Images:', error);
    // Wenn Tabelle nicht existiert, leere Liste zurückgeben
    if (error instanceof Error && error.message.includes('does not exist')) {
      return [];
    }
    throw error;
  } finally {
    client.release();
    if (tempPool) await tempPool.end();
  }
}

// Alle hochgeladenen Bilder abrufen (für Galerie)
export async function getAllBlogImages(limit = 50): Promise<BlogImage[]> {
  // Stelle sicher, dass die Tabelle existiert
  await ensureBlogImagesTable();
  
  const { client, tempPool } = await getDatabaseClient();
  
  try {
    const result = await client.query(
      'SELECT * FROM blog_images ORDER BY created_at DESC LIMIT $1',
      [limit]
    );
    
    return result.rows.map(mapBlogImageRow);
  } catch (error) {
    console.error('Fehler beim Abrufen aller Blog-Images:', error);
    // Wenn Tabelle nicht existiert, leere Liste zurückgeben
    if (error instanceof Error && error.message.includes('does not exist')) {
      return [];
    }
    throw error;
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
    return mapBlogImageRow(row);
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

