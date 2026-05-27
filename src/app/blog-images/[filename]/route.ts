import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

// Statische Bilder aus public/blog-images servieren
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ filename: string }> }
) {
  try {
    const params = await context.params;
    const filename = params.filename;

    // Sicherheitsprüfung: Nur erlaubte Dateinamen
    if (!filename || filename.includes('..') || filename.includes('/')) {
      return new NextResponse('Not Found', { status: 404 });
    }

    // Pfad zum Bild
    const imagePath = join(process.cwd(), 'public', 'blog-images', filename);

    // Prüfe ob Datei existiert
    if (!existsSync(imagePath)) {
      return new NextResponse('Not Found', { status: 404 });
    }

    // Datei lesen
    const fileBuffer = await readFile(imagePath);

    // MIME-Type bestimmen
    const ext = filename.split('.').pop()?.toLowerCase();
    let contentType = 'image/png';
    
    switch (ext) {
      case 'jpg':
      case 'jpeg':
        contentType = 'image/jpeg';
        break;
      case 'png':
        contentType = 'image/png';
        break;
      case 'webp':
        contentType = 'image/webp';
        break;
      case 'gif':
        contentType = 'image/gif';
        break;
      case 'svg':
        contentType = 'image/svg+xml';
        break;
    }

    // Bild zurückgeben mit korrekten Headers
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400, s-maxage=86400',
        'Content-Length': fileBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Fehler beim Servieren des Bildes:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

