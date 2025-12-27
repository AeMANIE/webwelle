import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth, secureResponse } from '@/lib/api-security';
import { createBlogImage, getAllBlogImages, getBlogImagesByPostId } from '@/lib/blog-images-database';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

// GET: Alle Bilder abrufen
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdminAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const postId = request.nextUrl.searchParams.get('postId');
    
    const images = postId 
      ? await getBlogImagesByPostId(postId)
      : await getAllBlogImages(100);

    return secureResponse(images);
  } catch (error) {
    console.error('Fehler beim Laden der Bilder:', error);
    return secureResponse(
      { error: 'Fehler beim Laden der Bilder' },
      500
    );
  }
}

// POST: Bild hochladen
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdminAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { user } = authResult;

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const format = (formData.get('format') as string) || 'auto';
    const postId = formData.get('postId') as string | null;

    if (!file) {
      return secureResponse(
        { error: 'Keine Datei hochgeladen' },
        400
      );
    }

    // Validierung
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return secureResponse(
        { error: 'Nur Bilder (JPEG, PNG, WebP, GIF) sind erlaubt' },
        400
      );
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return secureResponse(
        { error: 'Datei ist zu groß (max. 10MB)' },
        400
      );
    }

    // Bild-Dimensionen ermitteln (optional, würde sharp oder ähnliches benötigen)
    // Für jetzt: Einfach speichern
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${timestamp}-${sanitizedName}`;
    
    const uploadDir = join(process.cwd(), 'public', 'blog-images');
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filePath = join(uploadDir, fileName);
    
    await writeFile(filePath, buffer);

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const fileUrl = `${baseUrl}/blog-images/${fileName}`;

    // In Datenbank speichern
    const image = await createBlogImage({
      blogPostId: postId || undefined,
      fileName: fileName,
      filePath: filePath,
      fileUrl: fileUrl,
      fileSize: file.size,
      mimeType: file.type,
      format: format as 'landscape' | 'square' | 'portrait' | 'auto',
      position: 0,
      isFeatured: false,
      createdBy: user.email,
    });

    return secureResponse({ image }, 201);
  } catch (error) {
    console.error('Fehler beim Hochladen des Bildes:', error);
    return secureResponse(
      { error: 'Fehler beim Hochladen des Bildes' },
      500
    );
  }
}

