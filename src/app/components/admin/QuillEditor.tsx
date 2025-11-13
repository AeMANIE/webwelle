'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

// Wrapper für ReactQuill mit sicherer Fehlerbehandlung
const ReactQuillNoSSR = dynamic(
  () => import('react-quill').then((mod) => mod.default || mod),
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
    // CSS wird bereits in BlogEditor.tsx importiert, hier nur mounted setzen
  }, []);

  if (!mounted) {
    return (
      <div className="h-[400px] bg-background border border-border rounded-lg flex items-center justify-center text-muted-foreground">
        Editor wird geladen...
      </div>
    );
  }

  return (
    <ReactQuillNoSSR
      theme={theme}
      value={value}
      onChange={onChange}
      modules={modules}
      className={className}
      style={style}
    />
  );
}

