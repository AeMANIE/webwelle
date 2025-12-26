'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

// React 19 Kompatibilität: react-quill verwendet findDOMNode, das entfernt wurde
// Wir verwenden einen Wrapper, der das Problem umgeht
// Die neueste Version von react-quill sollte ohne findDOMNode funktionieren

// Wrapper für ReactQuill mit sicherer Fehlerbehandlung und React 19 Kompatibilität
// react-quill für React 18.3.1
const ReactQuillNoSSR = dynamic(
  () => import('react-quill').then((mod) => {
    // Sicherstellen, dass das Modul korrekt geladen wird
    if (!mod) {
      throw new Error('react-quill konnte nicht geladen werden');
    }
    // react-quill exportiert standardmäßig als default
    const ReactQuill = mod.default || mod;
    if (!ReactQuill) {
      throw new Error('ReactQuill Komponente nicht gefunden');
    }
    return { default: ReactQuill };
  }).catch((error) => {
    console.error('Fehler beim Laden von react-quill:', error);
    // Fallback: Leere Komponente
    return { 
      default: () => (
        <div className="h-[400px] bg-background border border-border rounded-lg flex items-center justify-center text-red-500">
          Fehler beim Laden des Editors. Bitte Seite neu laden.
        </div>
      )
    };
  }),
  { 
    ssr: false,
    loading: () => (
      <div className="h-[400px] bg-background border border-border rounded-lg flex items-center justify-center text-muted-foreground">
        Editor wird geladen...
      </div>
    )
  }
);

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

  useEffect(() => {
    setMounted(true);
  }, []);

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
          // Bild-URL in aktuellen Content einfügen
          const currentContent = value;
          const imageTag = `<img src="${data.url}" alt="Uploaded image" style="max-width: 100%; height: auto;" />`;
          
          // Einfach am Ende einfügen (Quill wird das Bild automatisch rendern)
          onChange(currentContent + imageTag);
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

  // Wenn modules übergeben wurde, versuche toolbar zu erweitern
  let enhancedModules: Record<string, unknown>;
  if (modules && typeof modules === 'object' && modules !== null) {
    const modulesObj = modules as Record<string, unknown>;
    if (modulesObj.toolbar && typeof modulesObj.toolbar === 'object') {
      // Toolbar erweitern
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
      // Toolbar hinzufügen
      enhancedModules = {
        ...modulesObj,
        toolbar: defaultToolbar,
      };
    }
  } else {
    // Standard-Module
    enhancedModules = {
      toolbar: defaultToolbar,
    };
  }

  if (!mounted) {
    return (
      <div className="h-[400px] bg-background border border-border rounded-lg flex items-center justify-center text-muted-foreground">
        Editor wird geladen...
      </div>
    );
  }

  return (
    <div className={className} style={style}>
      <ReactQuillNoSSR
        theme={theme}
        value={value}
        onChange={onChange}
        modules={enhancedModules}
        style={{ minHeight: '400px' }}
      />
    </div>
  );
}

