import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth, secureResponse } from '@/lib/api-security';
import { updateBlogImage, deleteBlogImage } from '@/lib/blog-images-database';

// GET: Einzelnes Bild abrufen
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAdminAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const params = await context.params;
    // Hier könnte man getBlogImageById implementieren, für jetzt einfach 404
    return secureResponse(
      { error: 'Nicht implementiert' },
      404
    );
  } catch (error) {
    console.error('Fehler beim Laden des Bildes:', error);
    return secureResponse(
      { error: 'Fehler beim Laden des Bildes' },
      500
    );
  }
}

// PUT: Bild aktualisieren
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAdminAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const params = await context.params;
    const body = await request.json();

    const updated = await updateBlogImage(params.id, {
      altText: body.altText,
      caption: body.caption,
      format: body.format,
      position: body.position,
      isFeatured: body.isFeatured,
    });

    if (!updated) {
      return secureResponse(
        { error: 'Bild nicht gefunden' },
        404
      );
    }

    return secureResponse(updated);
  } catch (error) {
    console.error('Fehler beim Aktualisieren des Bildes:', error);
    return secureResponse(
      { error: 'Fehler beim Aktualisieren des Bildes' },
      500
    );
  }
}

// DELETE: Bild löschen
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAdminAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const params = await context.params;
    const deleted = await deleteBlogImage(params.id);

    if (!deleted) {
      return secureResponse(
        { error: 'Bild nicht gefunden' },
        404
      );
    }

    return secureResponse({ success: true });
  } catch (error) {
    console.error('Fehler beim Löschen des Bildes:', error);
    return secureResponse(
      { error: 'Fehler beim Löschen des Bildes' },
      500
    );
  }
}

