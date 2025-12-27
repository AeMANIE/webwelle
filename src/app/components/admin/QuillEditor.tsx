'use client';

import { useEffect, useState, useRef, forwardRef, useImperativeHandle } from 'react';
// Quill CSS importieren
import 'quill/dist/quill.snow.css';

// React 19 Kompatibilität: react-quill verwendet findDOMNode, das entfernt wurde
// Wir verwenden Quill direkt ohne react-quill Wrapper

interface QuillEditorProps {
  value: string;
  onChange: (value: string) => void;
  modules?: unknown;
  className?: string;
  style?: React.CSSProperties;
  theme?: string;
  onImageInserted?: (imageUrl: string) => void;
}

const QuillEditor = forwardRef<any, QuillEditorProps>(({ value, onChange, modules, className, style, theme = 'snow', onImageInserted }, ref) => {
  const [mounted, setMounted] = useState(false);
  const quillRef = useRef<HTMLDivElement>(null);
  const quillInstanceRef = useRef<any>(null);

  // Exponiere Quill-Instanz und insertImageAtCursor Funktion
  useImperativeHandle(ref, () => ({
    quillInstance: quillInstanceRef.current,
    insertImageAtCursor: (imageUrl: string, size: 'small' | 'medium' | 'large' | 'full' = 'medium', align: 'left' | 'center' | 'right' = 'center') => {
      const quill = quillInstanceRef.current;
      if (!quill) return;
      
      const range = quill.getSelection(true);
      const index = range ? range.index : quill.getLength();
      
      // Größen-Klassen
      const sizeStyles: Record<string, string> = {
        small: 'max-width: 300px;',
        medium: 'max-width: 600px;',
        large: 'max-width: 900px;',
        full: 'max-width: 100%; width: 100%;',
      };
      
      // Alignment
      const alignStyles: Record<string, string> = {
        left: 'float: left; margin-right: 1em;',
        center: 'display: block; margin: 1em auto;',
        right: 'float: right; margin-left: 1em;',
      };
      
      const style = `${sizeStyles[size]} ${alignStyles[align]} height: auto;`;
      
      try {
        // Versuche insertEmbed
        quill.insertEmbed(index, 'image', imageUrl, 'user');
        // Füge Style hinzu (nach dem Einfügen)
        setTimeout(() => {
          const img = quill.root.querySelector(`img[src="${imageUrl}"]`);
          if (img) {
            (img as HTMLImageElement).style.cssText = style;
          }
        }, 50);
      } catch (error) {
        // Fallback: HTML einfügen
        const imageHtml = `<p><img src="${imageUrl}" alt="Image" style="${style}" /></p>`;
        quill.clipboard.dangerouslyPasteHTML(index, imageHtml);
      }
      
      // Cursor nach dem Bild positionieren
      setTimeout(() => {
        const newLength = quill.getLength();
        quill.setSelection(newLength);
      }, 100);
      
      // Content aktualisieren
      setTimeout(() => {
        const content = quill.root.innerHTML;
        onChange(content);
      }, 100);
    },
  }));

  useEffect(() => {
    setMounted(true);
  }, []);

  // Quill-Editor initialisieren
  useEffect(() => {
    if (!mounted || !quillRef.current || quillInstanceRef.current) return;

    const initQuill = async () => {
      try {
        // Dynamischer Import von Quill (nur im Browser)
        const QuillModule = await import('quill');
        const Quill = QuillModule.default || QuillModule;
        if (!Quill) return;

        // Image Blot registrieren (wichtig für korrekte Bildanzeige)
        try {
          const ImageBlot = Quill.import('formats/image') as any;
          if (ImageBlot && typeof ImageBlot === 'object') {
            // Stelle sicher, dass Bilder korrekt gerendert werden
            ImageBlot.sanitize = (url: string) => {
              return url;
            };
          }
        } catch (blotError) {
          // Image Blot könnte bereits registriert sein oder nicht verfügbar
          console.warn('Image Blot konnte nicht konfiguriert werden:', blotError);
        }

        // Bild-Upload-Handler für Quill
        const imageHandler = async () => {
          const input = document.createElement('input');
          input.setAttribute('type', 'file');
          input.setAttribute('accept', 'image/*');
          input.click();

          input.onchange = async () => {
            const file = input.files?.[0];
            if (!file) return;

            // Datei validieren
            const maxSize = 5 * 1024 * 1024; // 5MB
            if (file.size > maxSize) {
              alert('Datei ist zu groß (max. 5MB)');
              return;
            }

            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
            if (!allowedTypes.includes(file.type)) {
              alert('Nur Bilder (JPEG, PNG, WebP, GIF) sind erlaubt');
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
                // Quill-Editor-Instanz verwenden, um Bild einzufügen
                const quill = quillInstanceRef.current;
                if (quill) {
                  try {
                    // Aktuelle Cursor-Position oder Ende des Contents
                    const range = quill.getSelection();
                    const index = range ? range.index : quill.getLength();
                    
                    // Bild einfügen mit insertEmbed
                    quill.insertEmbed(index, 'image', data.url, 'user');
                    
                    // Cursor nach dem Bild positionieren
                    quill.setSelection(index + 1);
                    
                    // Content aktualisieren (mit kurzer Verzögerung für Quill)
                    setTimeout(() => {
                      const content = quill.root.innerHTML;
                      onChange(content);
                    }, 100);
                    
                    // Callback aufrufen
                    if (onImageInserted) {
                      onImageInserted(data.url);
                    }
                  } catch (embedError) {
                    console.warn('insertEmbed fehlgeschlagen, verwende HTML-Fallback:', embedError);
                    // Fallback: Direkt HTML einfügen
                    const imageHtml = `<p><img src="${data.url}" alt="Uploaded image" style="max-width: 100%; height: auto; display: block; margin: 1em 0;" /></p>`;
                    const currentContent = quill.root.innerHTML;
                    quill.root.innerHTML = currentContent + imageHtml;
                    onChange(quill.root.innerHTML);
                    
                    if (onImageInserted) {
                      onImageInserted(data.url);
                    }
                  }
                } else {
                  // Fallback: Direkt HTML einfügen
                  const imageHtml = `<p><img src="${data.url}" alt="Uploaded image" style="max-width: 100%; height: auto; display: block; margin: 1em 0;" /></p>`;
                  onChange(value + imageHtml);
                  
                  // Callback aufrufen
                  if (onImageInserted) {
                    onImageInserted(data.url);
                  }
                }
              } else {
                alert(data.error || 'Fehler beim Hochladen des Bildes');
              }
            } catch (error) {
              console.error('Fehler beim Hochladen:', error);
              alert('Fehler beim Hochladen des Bildes');
            }
          };
        };

        // Erweiterte Module mit Bild-Upload
        const defaultToolbar = {
          container: [
            [{ header: [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ list: 'ordered' }, { list: 'bullet' }],
            ['link', 'image'],
            ['code-block'],
            ['clean'],
          ],
          handlers: {
            image: imageHandler,
          },
        };

        // Module zusammenstellen
        let enhancedModules: Record<string, unknown>;
        if (modules && typeof modules === 'object' && modules !== null) {
          const modulesObj = modules as Record<string, unknown>;
          if (modulesObj.toolbar && typeof modulesObj.toolbar === 'object') {
            enhancedModules = {
              ...modulesObj,
              toolbar: {
                ...(modulesObj.toolbar as Record<string, unknown>),
                handlers: {
                  ...((modulesObj.toolbar as Record<string, unknown>).handlers as Record<string, unknown> || {}),
                  image: imageHandler,
                },
              },
            };
          } else {
            enhancedModules = {
              ...modulesObj,
              toolbar: defaultToolbar,
            };
          }
        } else {
          enhancedModules = {
            toolbar: defaultToolbar,
          };
        }

        // Quill-Editor erstellen
        if (!quillRef.current) return;
        
        const quill = new Quill(quillRef.current, {
          theme: theme,
          modules: enhancedModules as any,
        });

        quillInstanceRef.current = quill;

        // Initialen Wert setzen
        if (value) {
          quill.root.innerHTML = value;
        }

        // Content-Änderungen überwachen
        quill.on('text-change', () => {
          const content = quill.root.innerHTML;
          onChange(content);
        });


        // Cleanup
        return () => {
          if (quillInstanceRef.current) {
            quillInstanceRef.current = null;
          }
        };
      } catch (error) {
        console.error('Fehler beim Initialisieren von Quill:', error);
      }
    };

    initQuill();
  }, [mounted, theme, modules]);

  // Wert aktualisieren, wenn sich value ändert (von außen)
  useEffect(() => {
    if (quillInstanceRef.current && value !== quillInstanceRef.current.root.innerHTML) {
      quillInstanceRef.current.root.innerHTML = value;
    }
  }, [value]);

  if (!mounted) {
    return (
      <div className="h-[400px] bg-background border border-border rounded-lg flex items-center justify-center text-muted-foreground">
        Editor wird geladen...
      </div>
    );
  }

  return (
    <div className={className} style={style}>
      <div 
        ref={quillRef} 
        style={{ minHeight: '400px' }}
        className="bg-background text-foreground"
      />
    </div>
  );
});

QuillEditor.displayName = 'QuillEditor';

export default QuillEditor;

