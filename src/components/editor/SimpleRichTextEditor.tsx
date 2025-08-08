"use client";

import { useState, useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import type { ReactNode } from 'react';

interface SimpleRichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  onFocus?: (e: React.FocusEvent) => void;
  placeholder?: string;
  className?: string;
  'data-block-id'?: string;
}

export interface SimpleRichTextEditorRef {
  focus: () => void;
  getTextarea: () => HTMLTextAreaElement | null;
  enterEditMode: () => HTMLTextAreaElement | null;
}

export const SimpleRichTextEditor = forwardRef<SimpleRichTextEditorRef, SimpleRichTextEditorProps>(({
  value,
  onChange,
  onKeyDown,
  onFocus,
  placeholder,
  className,
  'data-block-id': blockId,
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Synchroniser la valeur du textarea
  useEffect(() => {
    if (textareaRef.current && textareaRef.current.value !== value) {
      textareaRef.current.value = value;
    }
  }, [value]);

  // Exposer les méthodes via ref
  useImperativeHandle(ref, () => ({
    focus: () => {
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    },
    getTextarea: () => textareaRef.current,
    enterEditMode: () => {
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
      return textareaRef.current;
    },
  }));

  // Fonction pour convertir le markdown/HTML en JSX pour l'affichage
  const renderFormattedText = (text: string) => {
    if (!text) return <span className="text-muted-foreground">{placeholder}</span>;

    const parts: (string | ReactNode)[] = [];
    let lastIndex = 0;
    let keyCounter = 0;

    // Regex pour détecter les différents formats
    const formatRegex = /(\*\*([^*]+)\*\*)|(\*([^*]+)\*)|(<u>([^<]+)<\/u>)|(`([^`]+)`)/g;
    let match;

    while ((match = formatRegex.exec(text)) !== null) {
      // Ajouter le texte avant le match
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }

      // Ajouter l'élément formaté
      if (match[1]) {
        // Gras **text**
        parts.push(<strong key={keyCounter++}>{match[2]}</strong>);
      } else if (match[3]) {
        // Italique *text*
        parts.push(<em key={keyCounter++}>{match[4]}</em>);
      } else if (match[5]) {
        // Souligné <u>text</u>
        parts.push(<u key={keyCounter++}>{match[6]}</u>);
      } else if (match[7]) {
        // Code `text`
        parts.push(
          <code key={keyCounter++} className="bg-muted px-1 py-0.5 rounded text-sm font-mono">
            {match[8]}
          </code>
        );
      }

      lastIndex = match.index + match[0].length;
    }

    // Ajouter le reste du texte
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    // Gérer les retours à la ligne
    const finalParts: (string | ReactNode)[] = [];
    parts.forEach((part, index) => {
      if (typeof part === 'string') {
        const lines = part.split('\n');
        lines.forEach((line, lineIndex) => {
          finalParts.push(line);
          if (lineIndex < lines.length - 1) {
            finalParts.push(<br key={`br-${index}-${lineIndex}`} />);
          }
        });
      } else {
        finalParts.push(part);
      }
    });

    return finalParts.length > 0 ? finalParts : text;
  };

  const handleTextareaFocus = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    setIsFocused(true);
    if (onFocus) {
      onFocus(e);
    }
  };

  const handleTextareaBlur = () => {
    // Délai court pour permettre aux boutons d'être cliqués
    setTimeout(() => {
      setIsFocused(false);
    }, 150);
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    console.log('SimpleRichTextEditor handleTextareaChange:', e.target.value);
    onChange(e.target.value);
  };

  const handleOverlayClick = () => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  return (
    <div className="relative">
      {/* Textarea toujours présent mais transparent quand pas focalisé */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleTextareaChange}
        onFocus={handleTextareaFocus}
        onBlur={handleTextareaBlur}
        onKeyDown={onKeyDown}
        className={`${className} ${isFocused ? 'opacity-100' : 'opacity-0 absolute inset-0'}`}
        placeholder={placeholder}
        data-block-id={blockId}
        rows={1}
        style={{ 
          minHeight: '1.5rem',
          resize: 'none',
          ...(isFocused ? {} : { pointerEvents: 'none' })
        }}
      />

      {/* Overlay avec le contenu formaté (affiché quand pas en focus) */}
      {!isFocused && (
        <div
          ref={overlayRef}
          onClick={handleOverlayClick}
          className={`${className} cursor-text min-h-[1.5rem] py-1`}
          data-block-id={blockId}
          style={{ wordBreak: 'break-word' }}
        >
          {renderFormattedText(value)}
        </div>
      )}
    </div>
  );
});

SimpleRichTextEditor.displayName = 'SimpleRichTextEditor';