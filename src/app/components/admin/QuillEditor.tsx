'use client';

import { useEffect, useState, useRef, forwardRef, useImperativeHandle } from 'react';
import 'quill/dist/quill.snow.css';
import { normalizeHtmlForQuill } from '@/lib/blog-html-for-editor';

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
  const savedCursorPositionRef = useRef<number | null>(null);

  // Exponiere Quill-Instanz und insertImageAtCursor Funktion
  useImperativeHandle(ref, () => ({
    quillInstance: quillInstanceRef.current,
    // Speichere die aktuelle Cursor-Position
    saveCursorPosition: () => {
      const quill = quillInstanceRef.current;
      if (!quill) {
        console.warn('⚠️ Quill-Instanz nicht verfügbar beim Speichern der Cursor-Position');
        return;
      }
      
      // Versuche die aktuelle Cursor-Position zu bekommen
      let range = quill.getSelection();
      
      // Falls keine Auswahl vorhanden ist (z.B. Editor hat Fokus verloren),
      // versuche die Position aus dem DOM zu ermitteln
      if (!range || range.index < 0) {
        // Versuche die letzte bekannte Position zu verwenden
        if (savedCursorPositionRef.current !== null && savedCursorPositionRef.current >= 0) {
          console.log('💾 Verwende bereits gespeicherte Position:', savedCursorPositionRef.current);
          return; // Position ist bereits gespeichert
        }
        
        // Fallback: Versuche die Position aus dem Editor zu ermitteln
        const editorElement = quill.root;
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const domRange = selection.getRangeAt(0);
          try {
            // Versuche die Position relativ zum Editor zu berechnen
            const pre = quill.scroll.domNode;
            const offset = quill.getIndex(quill.scroll, domRange.startOffset);
            if (offset >= 0) {
              savedCursorPositionRef.current = offset;
              console.log('💾 Cursor-Position aus DOM berechnet:', offset);
              return;
            }
          } catch (e) {
            console.warn('⚠️ Konnte Position nicht aus DOM berechnen:', e);
          }
        }
        
        // Letzter Fallback: Verwende die Länge des Editors
        const length = quill.getLength();
        savedCursorPositionRef.current = length > 0 ? length - 1 : 0;
        console.log('💾 Keine Cursor-Position gefunden, verwende Ende:', savedCursorPositionRef.current);
      } else {
        savedCursorPositionRef.current = range.index;
        console.log('💾 Cursor-Position gespeichert:', range.index);
      }
    },
    // Stelle die Cursor-Position wieder her
    restoreCursorPosition: () => {
      const quill = quillInstanceRef.current;
      if (!quill || savedCursorPositionRef.current === null) return;
      quill.setSelection(savedCursorPositionRef.current);
    },
    insertImageAtCursor: (imageUrl: string, size: 'small' | 'medium' | 'large' | 'full' = 'medium', align: 'left' | 'center' | 'right' = 'center') => {
      const quill = quillInstanceRef.current;
      if (!quill) return;
      
      // Verwende gespeicherte Position oder aktuelle Cursor-Position
      let index: number;
      if (savedCursorPositionRef.current !== null && savedCursorPositionRef.current >= 0) {
        index = savedCursorPositionRef.current;
        console.log('📍 Verwende gespeicherte Cursor-Position:', index);
        savedCursorPositionRef.current = null; // Zurücksetzen nach Verwendung
      } else {
        // Versuche aktuelle Cursor-Position zu bekommen
        const range = quill.getSelection(true);
        if (range && range.index >= 0) {
          index = range.index;
          console.log('📍 Verwende aktuelle Cursor-Position:', index);
        } else {
          index = quill.getLength();
          console.log('⚠️ Keine Cursor-Position gefunden, verwende Ende:', index);
        }
      }
      
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
        // Füge Style hinzu und mache Bild draggable (nach dem Einfügen)
        setTimeout(() => {
          const img = quill.root.querySelector(`img[src="${imageUrl}"]`);
          if (img) {
            const imgElement = img as HTMLImageElement;
            imgElement.style.cssText = style;
            imgElement.draggable = true;
            imgElement.style.cursor = 'move';
            imgElement.style.position = 'relative';
            imgElement.title = 'Ziehen Sie das Bild, um es zu verschieben';
          }
        }, 50);
      } catch (error) {
        // Fallback: HTML einfügen
        const imageHtml = `<p><img src="${imageUrl}" alt="Image" style="${style}" /></p>`;
        quill.clipboard.dangerouslyPasteHTML(index, imageHtml);
      }
      
      // Cursor nach dem Bild positionieren (nur wenn keine gespeicherte Position vorhanden war)
      setTimeout(() => {
        // Finde die Position des eingefügten Bildes
        const images = quill.root.querySelectorAll('img');
        let imageIndex = -1;
        images.forEach((img: Element, idx: number) => {
          const imgElement = img as HTMLImageElement;
          if (imgElement.src === imageUrl || imgElement.src.includes(imageUrl.split('/').pop() || '')) {
            imageIndex = idx;
          }
        });
        
        if (imageIndex >= 0) {
          // Setze Cursor nach dem Bild
          const imgElement = images[imageIndex] as HTMLImageElement;
          const imgParent = imgElement.parentElement;
          if (imgParent) {
            const imgOffset = Array.from(imgParent.parentElement?.children || []).indexOf(imgParent);
            const newIndex = index + 2; // Nach dem Bild und dem Absatz
            quill.setSelection(Math.min(newIndex, quill.getLength()));
          }
        } else {
          // Fallback: Cursor nach dem eingefügten Inhalt
          quill.setSelection(index + 1);
        }
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
          quill.clipboard.dangerouslyPasteHTML(normalizeHtmlForQuill(value));
        }

        // Hilfsfunktion: Verschiebe-Buttons für Bilder hinzufügen
        const addImageMoveButtons = (imgElement: HTMLImageElement, imageUrl: string, style: string) => {
          // Entferne alte Buttons falls vorhanden
          const existingButtons = imgElement.parentElement?.querySelector('.image-move-buttons');
          if (existingButtons) {
            existingButtons.remove();
          }
          
          // Erstelle Button-Container
          const buttonContainer = document.createElement('div');
          buttonContainer.className = 'image-move-buttons';
          buttonContainer.style.cssText = 'position: absolute; top: 5px; right: 5px; display: flex; gap: 4px; z-index: 1000; background: rgba(0,0,0,0.7); padding: 4px; border-radius: 4px;';
          
          // Button: Nach oben verschieben
          const moveUpBtn = document.createElement('button');
          moveUpBtn.innerHTML = '↑';
          moveUpBtn.title = 'Bild nach oben verschieben';
          moveUpBtn.style.cssText = 'background: #3b82f6; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 12px;';
          moveUpBtn.onclick = (e) => {
            e.stopPropagation();
            moveImage(imgElement, imageUrl, style, 'up');
          };
          
          // Button: Nach unten verschieben
          const moveDownBtn = document.createElement('button');
          moveDownBtn.innerHTML = '↓';
          moveDownBtn.title = 'Bild nach unten verschieben';
          moveDownBtn.style.cssText = 'background: #3b82f6; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 12px;';
          moveDownBtn.onclick = (e) => {
            e.stopPropagation();
            moveImage(imgElement, imageUrl, style, 'down');
          };
          
          buttonContainer.appendChild(moveUpBtn);
          buttonContainer.appendChild(moveDownBtn);
          
          // Stelle sicher, dass das Bild-Container position: relative hat
          const imgParent = imgElement.parentElement;
          if (imgParent) {
            const computedStyle = window.getComputedStyle(imgParent);
            if (computedStyle.position === 'static') {
              imgParent.style.position = 'relative';
            }
            imgParent.appendChild(buttonContainer);
          }
        };
        
        // Hilfsfunktion: Bild verschieben
        const moveImage = (imgElement: HTMLImageElement, imageUrl: string, style: string, direction: 'up' | 'down') => {
          const delta = quill.getContents();
          let currentIndex = -1;
          let pos = 0;
          
          // Finde die aktuelle Position des Bildes
          for (let i = 0; i < delta.ops.length; i++) {
            const op = delta.ops[i];
            if (op.insert && typeof op.insert === 'object' && op.insert.image === imageUrl) {
              currentIndex = pos;
              break;
            }
            if (typeof op.insert === 'string') {
              pos += op.insert.length;
            } else if (op.insert && typeof op.insert === 'object') {
              pos += 1;
            }
          }
          
          if (currentIndex < 0) return;
          
          // Berechne neue Position
          let newIndex = currentIndex;
          if (direction === 'up') {
            // Verschiebe nach oben (vorherige Position)
            if (currentIndex > 0) {
              newIndex = currentIndex - 1;
            } else {
              return; // Bereits ganz oben
            }
          } else {
            // Verschiebe nach unten (nächste Position)
            if (currentIndex < quill.getLength() - 1) {
              newIndex = currentIndex + 1;
            } else {
              return; // Bereits ganz unten
            }
          }
          
          // Entferne das alte Bild
          quill.deleteText(currentIndex, 1);
          
          // Berechne die neue Position nach dem Löschen
          const adjustedIndex = newIndex > currentIndex ? newIndex - 1 : newIndex;
          
          // Füge das Bild an der neuen Position ein
          setTimeout(() => {
            quill.setSelection(adjustedIndex);
            quill.insertEmbed(adjustedIndex, 'image', imageUrl, 'user');
            
            // Wende den Style wieder an
            setTimeout(() => {
              const newImg = quill.root.querySelector(`img[src="${imageUrl}"]`) as HTMLImageElement;
              if (newImg) {
                newImg.style.cssText = style;
                newImg.draggable = true;
                newImg.style.cursor = 'move';
                newImg.style.position = 'relative';
                addImageMoveButtons(newImg, imageUrl, style);
              }
              
              // Content aktualisieren
              const updatedContent = quill.root.innerHTML;
              onChange(updatedContent);
            }, 50);
          }, 10);
        };

        // Content-Änderungen überwachen
        quill.on('text-change', () => {
          const content = quill.root.innerHTML;
          onChange(content);
        });

        // Cursor-Position bei Klick speichern (für Bild-Einfügung)
        quill.root.addEventListener('click', () => {
          const range = quill.getSelection();
          if (range) {
            savedCursorPositionRef.current = range.index;
          }
        });

        // Cursor-Position bei Tastatur-Navigation speichern
        quill.on('selection-change', (range: any) => {
          if (range) {
            savedCursorPositionRef.current = range.index;
          }
        });

        // Drag & Drop für Bilder aktivieren
        const enableImageDragAndDrop = () => {
          const editorElement = quill.root;
          let draggedImageData: { src: string; style: string; alt: string } | null = null;
          let draggedImageOldIndex: number = -1;
          
          // Mache alle Bilder draggable
          const makeImagesDraggable = () => {
            const images = editorElement.querySelectorAll('img');
            images.forEach((img: Element) => {
              const imgElement = img as HTMLImageElement;
              
              // Überspringe, wenn bereits draggable
              if (imgElement.draggable) {
                return;
              }
              
              imgElement.draggable = true;
              imgElement.style.cursor = 'move';
              imgElement.style.userSelect = 'none';
              imgElement.title = 'Ziehen Sie das Bild, um es zu verschieben';
              
              // Drag-Start Event
              const dragStartHandler = (e: DragEvent) => {
                e.stopPropagation();
                console.log('🖼️ Drag gestartet für Bild:', imgElement.src);
                
                if (e.dataTransfer) {
                  e.dataTransfer.effectAllowed = 'move';
                  e.dataTransfer.setData('text/plain', imgElement.src);
                }
                
                // Finde die Position des Bildes im Delta
                const delta = quill.getContents();
                let pos = 0;
                for (let i = 0; i < delta.ops.length; i++) {
                  const op = delta.ops[i];
                  if (op.insert && typeof op.insert === 'object' && op.insert.image === imgElement.src) {
                    draggedImageOldIndex = pos;
                    console.log('📍 Alte Position gefunden:', pos);
                    break;
                  }
                  if (typeof op.insert === 'string') {
                    pos += op.insert.length;
                  } else if (op.insert && typeof op.insert === 'object') {
                    pos += 1;
                  }
                }
                
                draggedImageData = {
                  src: imgElement.src,
                  style: imgElement.style.cssText,
                  alt: imgElement.alt || ''
                };
                imgElement.style.opacity = '0.5';
              };
              
              // Drag-End Event
              const dragEndHandler = () => {
                console.log('🖼️ Drag beendet');
                imgElement.style.opacity = '1';
                if (!draggedImageData) {
                  draggedImageData = null;
                  draggedImageOldIndex = -1;
                }
              };
              
              imgElement.addEventListener('dragstart', dragStartHandler);
              imgElement.addEventListener('dragend', dragEndHandler);
            });
          };
          
          // Initial: Mache alle vorhandenen Bilder draggable
          setTimeout(() => {
            makeImagesDraggable();
          }, 500);
          
          // Drop-Zone für den Editor
          const dragOverHandler = (e: DragEvent) => {
            e.preventDefault();
            e.stopPropagation();
            if (e.dataTransfer) {
              e.dataTransfer.dropEffect = 'move';
            }
          };
          
          const dropHandler = (e: DragEvent) => {
            e.preventDefault();
            e.stopPropagation();
            
            console.log('📥 Drop Event ausgelöst');
            console.log('📦 Gespeicherte Daten:', draggedImageData, 'Alte Position:', draggedImageOldIndex);
            
            if (!draggedImageData || draggedImageOldIndex < 0) {
              console.warn('⚠️ Keine Drag-Daten verfügbar');
              draggedImageData = null;
              draggedImageOldIndex = -1;
              return;
            }
            
            // Hole die Drop-Position basierend auf der Maus-Position
            const x = e.clientX;
            const y = e.clientY;
            
            // Versuche die Position aus der Maus-Position zu berechnen
            const range = document.caretRangeFromPoint?.(x, y) || 
                         (document.caretPositionFromPoint?.(x, y)?.offsetNode ? {
                           startContainer: document.caretPositionFromPoint(x, y)?.offsetNode,
                           startOffset: document.caretPositionFromPoint(x, y)?.offset || 0
                         } : null);
            
            let dropIndex = quill.getLength();
            
            if (range) {
              try {
                // Versuche die Position im Quill-Editor zu finden
                const quillRange = quill.getSelection(true);
                if (quillRange) {
                  dropIndex = quillRange.index;
                  console.log('📍 Drop-Position aus Selection:', dropIndex);
                }
              } catch (err) {
                console.warn('⚠️ Konnte Drop-Position nicht bestimmen:', err);
              }
            }
            
            // Verhindere, dass das Bild an derselben Position bleibt
            if (Math.abs(dropIndex - draggedImageOldIndex) <= 1) {
              console.log('⚠️ Drop-Position zu nah an alter Position, ignoriere');
              draggedImageData = null;
              draggedImageOldIndex = -1;
              return;
            }
            
            console.log('🔄 Verschiebe Bild von Position', draggedImageOldIndex, 'nach', dropIndex);
            
            // Entferne das alte Bild
            quill.deleteText(draggedImageOldIndex, 1);
            
            // Berechne die neue Position (kann sich durch das Löschen geändert haben)
            const newIndex = dropIndex > draggedImageOldIndex ? dropIndex - 1 : dropIndex;
            
            // Füge das Bild an der neuen Position ein
            if (!draggedImageData) {
              draggedImageData = null;
              draggedImageOldIndex = -1;
              return;
            }
            
            const imageData = draggedImageData; // Lokale Kopie für setTimeout
            
            setTimeout(() => {
              quill.setSelection(newIndex);
              quill.insertEmbed(newIndex, 'image', imageData.src, 'user');
              console.log('✅ Bild eingefügt an Position:', newIndex);
              
              // Wende den Style wieder an
              setTimeout(() => {
                const newImg = editorElement.querySelector(`img[src="${imageData.src}"]`) as HTMLImageElement;
                if (newImg) {
                  newImg.style.cssText = imageData.style;
                  newImg.alt = imageData.alt;
                  newImg.draggable = true;
                  newImg.style.cursor = 'move';
                  newImg.style.position = 'relative';
                  addImageMoveButtons(newImg, imageData.src, imageData.style);
                }
                
                // Content aktualisieren
                const updatedContent = quill.root.innerHTML;
                onChange(updatedContent);
                
                // Mache alle Bilder wieder draggable
                setTimeout(() => {
                  makeImagesDraggable();
                }, 100);
              }, 50);
            }, 10);
            
            draggedImageData = null;
            draggedImageOldIndex = -1;
          };
          
          editorElement.addEventListener('dragover', dragOverHandler);
          editorElement.addEventListener('drop', dropHandler);
          
          // Beobachte neue Bilder (MutationObserver)
          const observer = new MutationObserver(() => {
            setTimeout(() => {
              makeImagesDraggable();
            }, 100);
          });
          
          observer.observe(editorElement, {
            childList: true,
            subtree: true,
          });
          
          // Cleanup
          return () => {
            observer.disconnect();
            editorElement.removeEventListener('dragover', dragOverHandler);
            editorElement.removeEventListener('drop', dropHandler);
          };
        };
        
        enableImageDragAndDrop();

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
    if (!quillInstanceRef.current || value === undefined) return;
    const normalized = normalizeHtmlForQuill(value);
    const current = quillInstanceRef.current.root.innerHTML;
    if (normalized !== current && value !== current) {
      const sel = quillInstanceRef.current.getSelection();
      quillInstanceRef.current.clipboard.dangerouslyPasteHTML(normalized);
      if (sel) quillInstanceRef.current.setSelection(sel);
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

