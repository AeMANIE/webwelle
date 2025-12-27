'use client';

import { useEffect, useState, useRef } from 'react';
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
}

export default function QuillEditor({ value, onChange, modules, className, style, theme = 'snow' }: QuillEditorProps) {
  const [mounted, setMounted] = useState(false);
  const quillRef = useRef<HTMLDivElement>(null);
  const quillInstanceRef = useRef<any>(null);

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
                  const range = quill.getSelection(true);
                  quill.insertEmbed(range.index, 'image', data.url);
                  quill.setSelection(range.index + 1);
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
}

