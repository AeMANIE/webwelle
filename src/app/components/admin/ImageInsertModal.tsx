'use client';

import { useState } from 'react';
import { X, Maximize2, Minimize2, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';

interface ImageInsertModalProps {
  imageUrl: string;
  onInsert: (imageUrl: string, size: 'small' | 'medium' | 'large' | 'full', align: 'left' | 'center' | 'right') => void;
  onClose: () => void;
}

export default function ImageInsertModal({ imageUrl, onInsert, onClose }: ImageInsertModalProps) {
  const [size, setSize] = useState<'small' | 'medium' | 'large' | 'full'>('medium');
  const [align, setAlign] = useState<'left' | 'center' | 'right'>('center');

  const sizeOptions = [
    { value: 'small' as const, label: 'Klein (300px)', icon: Minimize2 },
    { value: 'medium' as const, label: 'Mittel (600px)', icon: Maximize2 },
    { value: 'large' as const, label: 'Groß (900px)', icon: Maximize2 },
    { value: 'full' as const, label: 'Vollständig (100%)', icon: Maximize2 },
  ];

  const alignOptions = [
    { value: 'left' as const, label: 'Links', icon: AlignLeft },
    { value: 'center' as const, label: 'Zentriert', icon: AlignCenter },
    { value: 'right' as const, label: 'Rechts', icon: AlignRight },
  ];

  const sizeStyles: Record<string, string> = {
    small: 'max-width: 300px;',
    medium: 'max-width: 600px;',
    large: 'max-width: 900px;',
    full: 'max-width: 100%; width: 100%;',
  };

  const alignStyles: Record<string, string> = {
    left: 'float: left; margin-right: 1em;',
    center: 'display: block; margin: 1em auto;',
    right: 'float: right; margin-left: 1em;',
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-card border border-border rounded-lg max-w-2xl w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-foreground">Bild einfügen</h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-muted rounded transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Bild-Vorschau */}
          <div className="mb-6 border border-border rounded-lg p-4 bg-muted/30">
            <div className="flex justify-center">
              <img
                src={imageUrl}
                alt="Preview"
                style={{ 
                  maxWidth: size === 'small' ? '300px' : size === 'medium' ? '600px' : size === 'large' ? '900px' : '100%',
                  width: size === 'full' ? '100%' : 'auto',
                  height: 'auto',
                  display: align === 'center' ? 'block' : 'inline-block',
                  margin: align === 'center' ? '1em auto' : align === 'left' ? '1em 1em 1em 0' : '1em 0 1em 1em',
                  float: align === 'left' ? 'left' : align === 'right' ? 'right' : 'none',
                }}
                className="rounded"
              />
            </div>
          </div>

          {/* Größen-Auswahl */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-foreground mb-2">Größe</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {sizeOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setSize(option.value)}
                    className={`p-3 rounded-lg border transition-colors flex flex-col items-center gap-2 ${
                      size === option.value
                        ? 'bg-brand text-brand-foreground border-brand'
                        : 'bg-background text-foreground border-border hover:border-brand'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-xs">{option.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Ausrichtung */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-foreground mb-2">Ausrichtung</label>
            <div className="flex gap-2">
              {alignOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setAlign(option.value)}
                    className={`flex-1 p-3 rounded-lg border transition-colors flex items-center justify-center gap-2 ${
                      align === option.value
                        ? 'bg-brand text-brand-foreground border-brand'
                        : 'bg-background text-foreground border-border hover:border-brand'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{option.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Hinweis */}
          <div className="mb-4 p-3 bg-info/10 border border-info/20 rounded-lg">
            <p className="text-sm text-info">
              💡 <strong>Tipp:</strong> Klicken Sie zuerst im Text-Editor an die gewünschte Stelle, bevor Sie das Bild einfügen. 
              Das Bild wird dann genau an dieser Position eingefügt.
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => {
                onInsert(imageUrl, size, align);
                onClose();
              }}
              className="flex-1 px-4 py-2 bg-brand text-brand-foreground rounded-lg hover:bg-brand/90 transition-colors font-medium"
            >
              An Cursor-Position einfügen
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors"
            >
              Abbrechen
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

