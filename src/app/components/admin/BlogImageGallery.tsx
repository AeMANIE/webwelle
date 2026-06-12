'use client';

import { useState, useEffect } from 'react';
import { Image as ImageIcon, Upload, X, Check, Maximize2, Download, Trash2, Edit2 } from 'lucide-react';

interface BlogImage {
  id: string;
  fileUrl: string;
  fileName: string;
  format: 'landscape' | 'square' | 'portrait' | 'auto';
  altText?: string;
  caption?: string;
  width?: number;
  height?: number;
}

interface BlogImageGalleryProps {
  postId?: string;
  onSelectImage: (imageUrl: string, format?: 'landscape' | 'square' | 'portrait') => void;
  selectedFormat?: 'landscape' | 'square' | 'portrait';
}

export default function BlogImageGallery({ postId, onSelectImage, selectedFormat }: BlogImageGalleryProps) {
  const [images, setImages] = useState<BlogImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<BlogImage | null>(null);
  const [showUpload, setShowUpload] = useState(false);

  useEffect(() => {
    fetchImages();
  }, [postId]);

  // Debug: Log images when they change
  useEffect(() => {
    if (images.length > 0) {
      console.log('Bilder in Galerie:', images);
    }
  }, [images]);

  const fetchImages = async () => {
    try {
      setLoading(true);
      const url = postId 
        ? `/api/admin/blog/images?postId=${postId}`
        : '/api/admin/blog/images';
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        console.log('Geladene Bilder:', data); // Debug
        if (Array.isArray(data)) {
          setImages(data);
        } else if (data.images && Array.isArray(data.images)) {
          setImages(data.images);
        } else {
          console.warn('Unerwartetes Datenformat:', data);
          setImages([]);
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Fehler beim Laden der Bilder:', response.status, errorData);
        setImages([]);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Bilder:', error);
      setImages([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (file: File, format: 'landscape' | 'square' | 'portrait' | 'auto' = 'auto') => {
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('format', format);
    if (postId) {
      formData.append('postId', postId);
    }

    try {
      const response = await fetch('/api/admin/blog/images', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok && data.image) {
        // Galerie aktualisieren
        await fetchImages();
        setShowUpload(false);
        // Öffne Modal für Größen- und Ausrichtungs-Auswahl (nicht automatisch einfügen)
        onSelectImage(data.image.fileUrl, format !== 'auto' ? format : undefined);
      } else {
        alert(data.error || 'Fehler beim Hochladen');
      }
    } catch (error) {
      console.error('Fehler beim Hochladen:', error);
      alert('Fehler beim Hochladen des Bildes');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Möchten Sie dieses Bild wirklich löschen?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/blog/images/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setImages(prev => prev.filter(img => img.id !== id));
        if (selectedImage?.id === id) {
          setSelectedImage(null);
        }
      }
    } catch (error) {
      console.error('Fehler beim Löschen:', error);
    }
  };

  const getImageClass = (format: string, width?: number, height?: number) => {
    if (format === 'landscape') {
      return 'aspect-video object-cover';
    } else if (format === 'square') {
      return 'aspect-square object-cover';
    } else if (format === 'portrait') {
      return 'aspect-[3/4] object-cover';
    }
    // Auto: Basierend auf Dimensionen
    if (width && height) {
      const ratio = width / height;
      if (ratio > 1.3) return 'aspect-video object-cover'; // Landscape
      if (ratio < 0.8) return 'aspect-[3/4] object-cover'; // Portrait
      return 'aspect-square object-cover'; // Square
    }
    return 'aspect-video object-cover'; // Default
  };

  if (loading) {
    return (
      <div className="border border-border rounded-lg p-8 text-center text-muted-foreground">
        Lade Bild-Galerie...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold text-foreground">Bild-Galerie</h3>
          {images.length > 0 && (
            <span className="text-sm text-muted-foreground">({images.length} {images.length === 1 ? 'Bild' : 'Bilder'})</span>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => fetchImages()}
            className="flex items-center gap-2 px-4 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors"
            title="Aktualisieren"
          >
            <ImageIcon className="w-4 h-4" />
            Aktualisieren
          </button>
          <button
            onClick={() => setShowUpload(!showUpload)}
            className="flex items-center gap-2 px-4 py-2 bg-brand text-brand-foreground rounded-lg hover:bg-brand/90 transition-colors"
          >
            <Upload className="w-4 h-4" />
            Bild hochladen
          </button>
        </div>
      </div>

      {/* Upload-Bereich */}
      {showUpload && (
        <div className="border-2 border-dashed border-border rounded-lg p-6">
          <div className="space-y-4">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const format = selectedFormat || 'auto';
                  handleUpload(file, format);
                }
              }}
              className="hidden"
              id="gallery-upload"
            />
            <label
              htmlFor="gallery-upload"
              className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary transition-colors"
            >
              <Upload className="w-8 h-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                Klicken Sie hier oder ziehen Sie ein Bild hierher
              </p>
            </label>
            {selectedFormat && (
              <div className="text-xs text-muted-foreground text-center">
                Format: {selectedFormat === 'landscape' ? 'Landscape (16:9)' : selectedFormat === 'square' ? 'Quadratisch (1:1)' : 'Portrait (3:4)'}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bild-Galerie */}
      {images.length === 0 && !loading ? (
        <div className="border border-border rounded-lg p-8 text-center text-muted-foreground">
          <ImageIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Noch keine Bilder hochgeladen</p>
          <p className="text-xs mt-2">Laden Sie Bilder über den "Bild hochladen" Button hoch</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((image) => (
            <div
              key={image.id}
              className="relative group border border-border rounded-lg overflow-hidden hover:border-primary transition-colors cursor-pointer"
              onClick={() => {
                setSelectedImage(image);
                onSelectImage(image.fileUrl, image.format !== 'auto' ? image.format : undefined);
              }}
            >
              <div className={`w-full ${getImageClass(image.format, image.width, image.height)} bg-muted`}>
                <img
                  src={image.fileUrl}
                  alt={image.altText || image.fileName}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    console.error('Bild konnte nicht geladen werden:', image.fileUrl);
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                <div className="flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectImage(image.fileUrl, image.format !== 'auto' ? image.format : undefined);
                    }}
                    className="p-2 bg-brand text-brand-foreground rounded hover:bg-brand/90"
                    title="Auswählen"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedImage(image);
                    }}
                    className="p-2 bg-background text-foreground rounded hover:bg-background/90"
                    title="Details"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(image.id);
                    }}
                    className="p-2 bg-destructive text-destructive-foreground rounded hover:bg-destructive/90"
                    title="Löschen"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {image.format !== 'auto' && (
                <div className="absolute top-2 left-2 px-2 py-1 bg-black/70 text-white text-xs rounded">
                  {image.format === 'landscape' ? '16:9' : image.format === 'square' ? '1:1' : '3:4'}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Bild-Details Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="bg-card border border-border rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-foreground">Bild-Details</h3>
                <button
                  onClick={() => setSelectedImage(null)}
                  className="p-2 hover:bg-muted rounded transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className={`w-full ${getImageClass(selectedImage.format, selectedImage.width, selectedImage.height)} bg-muted rounded-lg overflow-hidden`}>
                  <img
                    src={selectedImage.fileUrl}
                    alt={selectedImage.altText || selectedImage.fileName}
                    className="w-full h-full object-contain"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Dateiname:</span>
                    <p className="font-mono text-xs">{selectedImage.fileName}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Format:</span>
                    <p>{selectedImage.format === 'landscape' ? 'Landscape (16:9)' : selectedImage.format === 'square' ? 'Quadratisch (1:1)' : selectedImage.format === 'portrait' ? 'Portrait (3:4)' : 'Auto'}</p>
                  </div>
                  {selectedImage.width && selectedImage.height && (
                    <>
                      <div>
                        <span className="text-muted-foreground">Breite:</span>
                        <p>{selectedImage.width}px</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Höhe:</span>
                        <p>{selectedImage.height}px</p>
                      </div>
                    </>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      onSelectImage(selectedImage.fileUrl, selectedImage.format !== 'auto' ? selectedImage.format : undefined);
                      setSelectedImage(null);
                    }}
                    className="flex-1 px-4 py-2 bg-brand text-brand-foreground rounded-lg hover:bg-brand/90 transition-colors"
                  >
                    <Check className="w-4 h-4 inline mr-2" />
                    Bild auswählen
                  </button>
                  <a
                    href={selectedImage.fileUrl}
                    download={selectedImage.fileName}
                    className="px-4 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors"
                  >
                    <Download className="w-4 h-4 inline mr-2" />
                    Herunterladen
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

