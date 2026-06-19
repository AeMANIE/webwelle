import type { PoolClient } from 'pg';

export interface BlogImageRecord {
  role: 'featured' | 'inline' | 'og';
  url: string;
  alt?: string;
  caption?: string;
  width?: number;
  height?: number;
  mimeType?: string;
  storagePath?: string;
  blurDataUrl?: string;
  promptUsed?: string;
  position?: number;
}

function isMissingColumnError(error: unknown, column: string): boolean {
  const msg = error instanceof Error ? error.message : String(error);
  return msg.includes(`column "${column}"`) || msg.includes(`column ${column}`);
}

export function mapBlogImageInputRow(row: Record<string, unknown>): BlogImageRecord {
  return {
    role: (row.image_role || 'featured') as BlogImageRecord['role'],
    url: row.file_url as string,
    alt: row.alt_text as string | undefined,
    caption: row.caption as string | undefined,
    width: row.width as number | undefined,
    height: row.height as number | undefined,
    mimeType: row.mime_type as string | undefined,
    storagePath: row.file_path as string | undefined,
    blurDataUrl: row.blur_data_url as string | undefined,
    promptUsed: row.prompt_used as string | undefined,
    position: row.position as number | undefined,
  };
}

/** Works with legacy `blog_post_id` and migrated `post_id` columns. */
export async function queryBlogImagesByPostId(
  client: PoolClient,
  postId: string,
  orderBy = 'position'
): Promise<Record<string, unknown>[]> {
  const orderClause = orderBy.includes('created_at')
    ? 'position ASC, created_at ASC'
    : 'position';

  try {
    const result = await client.query(
      `SELECT * FROM blog_images WHERE blog_post_id = $1 ORDER BY ${orderClause}`,
      [postId]
    );
    return result.rows;
  } catch (error) {
    if (!isMissingColumnError(error, 'blog_post_id')) throw error;
  }

  const result = await client.query(
    `SELECT * FROM blog_images WHERE post_id = $1 ORDER BY ${orderClause}`,
    [postId]
  );
  return result.rows;
}

export async function safeGetImagesForPost(
  client: PoolClient,
  postId: string
): Promise<BlogImageRecord[]> {
  if (!postId) return [];
  try {
    const rows = await queryBlogImagesByPostId(client, postId);
    return rows.map((row) => mapBlogImageInputRow(row));
  } catch (error) {
    console.error('safeGetImagesForPost failed:', error);
    return [];
  }
}
