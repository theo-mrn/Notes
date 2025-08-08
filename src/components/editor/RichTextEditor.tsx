"use client";

import { useState, useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import type { ReactNode } from 'react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  onFocus?: (e: React.FocusEvent) => void;
  placeholder?: string;
  className?: string;
  'data-block-id'?: string;
}

export interface RichTextEditorRef {
  focus: () => void;
  getTextarea: () => HTMLTextAreaElement | null;
  enterEditMode: () => HTMLTextAreaElement | null;
}

export const RichTextEditor = forwardRef<RichTextEditorRef, RichTextEditorProps>(({
  value,
  onChange,
  onKeyDown,
  onFocus,
  placeholder,
  className,
  'data-block-id': blockId,
}, ref) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const displayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  // Exposer les méthodes via ref
  useImperativeHandle(ref, () => ({
    focus: () => {
      if (isEditing && textareaRef.current) {
        textareaRef.current.focus();
      } else {
        handleDisplayClick();
      }
    },
    getTextarea: () => textareaRef.current,
    enterEditMode: () => {
      if (!isEditing) {
        setIsEditing(true);
        setEditValue(value);
        // Attendre que le textarea soit créé
        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.focus();
          }
        }, 0);
      }
      return textareaRef.current;
    },
  }));

  // Fonction pour convertir le markdown/HTML en JSX pour l'affichage
  const renderFormattedText = (text: string) => {
    if (!text) return null;

    const parts: (string | ReactNode)[] = [];
    let lastIndex = 0;
    let keyCounter = 0;

    // Regex pour détecter les différents formats
    const formatRegex = /(\*\*([^*]+)\*\*)|(\*([^*]+)\*)|(<u>([^<]+)<\/u>)|(`([^`]+)`)/g;
    let match;
    let hasMatches = false;

    while ((match = formatRegex.exec(text)) !== null) {
      hasMatches = true;
      
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

    // Si aucun formatage trouvé, retourner le texte tel quel avec gestion des retours à la ligne
    if (!hasMatches) {
      return text.split('\n').map((line, index, array) => (
        <span key={index}>
          {line}
          {index < array.length - 1 && <br />}
        </span>
      ));
    }

    // Gérer les retours à la ligne dans les parties formatées
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

  const handleDisplayClick = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    setIsEditing(true);
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        // Placer le curseur à la fin
        const length = textareaRef.current.value.length;
        textareaRef.current.setSelectionRange(length, length);
      }
    }, 0);
  };

  const handleTextareaBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    // Ne pas fermer l'édition si on clique sur les boutons de la toolbar
    const relatedTarget = e.relatedTarget as HTMLElement;
    if (relatedTarget && (relatedTarget.closest('.editor-toolbar') || relatedTarget.matches('button'))) {
      // Garder le focus sur le textarea après le formatage
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
        }
      }, 100);
      return;
    }
    
    setIsEditing(false);
    onChange(editValue);
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditValue(e.target.value);
  };

  const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Escape') {
      setIsEditing(false);
      setEditValue(value); // Annuler les changements
      return;
    }
    
    if (onKeyDown) {
      onKeyDown(e);
    }
  };

  const handleTextareaFocus = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    if (onFocus) {
      onFocus(e);
    }
  };

  if (isEditing) {
    return (
      <textarea
        ref={textareaRef}
        value={editValue}
        onChange={handleTextareaChange}
        onBlur={handleTextareaBlur}
        onKeyDown={handleTextareaKeyDown}
        onFocus={handleTextareaFocus}
        className={className}
        placeholder={placeholder}
        data-block-id={blockId}
        rows={1}
        style={{ minHeight: '1.5rem' }}
      />
    );
  }

  return (
    <div
      ref={displayRef}
      onClick={handleDisplayClick}
      className={`${className} cursor-text min-h-[1.5rem] py-1`}
      data-block-id={blockId}
      style={{ wordBreak: 'break-word' }}
    >
      {renderFormattedText(value)}
    </div>
  );
});

RichTextEditor.displayName = 'RichTextEditor';