"use client";

import { useState, useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import type { ReactNode } from 'react';

export interface TextFormat {
  start: number;
  end: number;
  type: 'bold' | 'italic' | 'underline' | 'code';
}

interface TransparentRichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  onFocus?: (e: React.FocusEvent) => void;
  placeholder?: string;
  className?: string;
  'data-block-id'?: string;
  formats?: TextFormat[];
  onFormatsChange?: (formats: TextFormat[]) => void;
  onSelectionChange?: () => void;
}

export interface TransparentRichTextEditorRef {
  focus: () => void;
  getTextarea: () => HTMLTextAreaElement | null;
  enterEditMode: () => HTMLTextAreaElement | null;
  applyFormat: (type: TextFormat['type'], start: number, end: number) => void;
  getFormats: () => TextFormat[];
  getCurrentSelection: () => { start: number; end: number; text: string } | null;
  restoreSelection: (start: number, end: number) => void;
}

export const TransparentRichTextEditor = forwardRef<TransparentRichTextEditorRef, TransparentRichTextEditorProps>(({
  value,
  onChange,
  onKeyDown,
  onFocus,
  placeholder,
  className,
  'data-block-id': blockId,
  formats = [],
  onFormatsChange,
  onSelectionChange,
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [localFormats, setLocalFormats] = useState<TextFormat[]>(formats);
  const lastSelectionRef = useRef<{ start: number; end: number }>({ start: 0, end: 0 });

  // Synchroniser la valeur du textarea
  useEffect(() => {
    if (textareaRef.current && textareaRef.current.value !== value) {
      textareaRef.current.value = value;
    }
  }, [value]);

  // Synchroniser les formats
  useEffect(() => {
    setLocalFormats(formats);
  }, [formats]);

  // Fonction pour appliquer un format
  const applyFormat = (type: TextFormat['type'], start: number, end: number) => {
    console.log('applyFormat called:', { type, start, end, currentText: value });
    
    const newFormats = [...localFormats];
    
    // Vérifier si le format existe déjà à cette position exacte
    const existingIndex = newFormats.findIndex(f => 
      f.type === type && f.start === start && f.end === end
    );
    
    if (existingIndex !== -1) {
      // Supprimer le format existant
      newFormats.splice(existingIndex, 1);
      console.log('Removed existing format');
    } else if (start !== end) {
      // Ajouter le nouveau format
      newFormats.push({ type, start, end });
      console.log('Added new format');
    }
    
    setLocalFormats(newFormats);
    if (onFormatsChange) {
      onFormatsChange(newFormats);
    }
  };

  // Fonction pour obtenir la sélection courante
  const getCurrentSelection = () => {
    if (!textareaRef.current) return null;
    
    const start = textareaRef.current.selectionStart || 0;
    const end = textareaRef.current.selectionEnd || 0;
    const text = textareaRef.current.value;
    
    return { start, end, text };
  };

  // Fonction pour restaurer une sélection
  const restoreSelection = (start: number, end: number) => {
    if (!textareaRef.current) return;
    
    textareaRef.current.focus();
    textareaRef.current.setSelectionRange(start, end);
  };

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
    applyFormat,
    getFormats: () => localFormats,
    getCurrentSelection,
    restoreSelection,
  }));

  // Fonction pour convertir le texte avec formatage en JSX pour l'affichage
  const renderFormattedText = (text: string) => {
    if (!text) return <span className="text-muted-foreground">{placeholder}</span>;

    // Créer une liste de tous les points de formatage
    const formatPoints: Array<{ position: number; type: 'start' | 'end'; format: TextFormat }> = [];
    
    localFormats.forEach(format => {
      formatPoints.push({ position: format.start, type: 'start', format });
      formatPoints.push({ position: format.end, type: 'end', format });
    });
    
    // Trier par position
    formatPoints.sort((a, b) => a.position - b.position);

    const parts: (string | ReactNode)[] = [];
    let lastIndex = 0;
    let keyCounter = 0;
    const activeFormats: TextFormat[] = [];

    for (const point of formatPoints) {
      // Ajouter le texte avant ce point
      if (point.position > lastIndex) {
        const textSegment = text.substring(lastIndex, point.position);
        if (textSegment) {
          let element: ReactNode = textSegment;
          
          // Appliquer tous les formats actifs
          activeFormats.forEach(format => {
            switch (format.type) {
              case 'bold':
                element = <strong key={keyCounter++}>{element}</strong>;
                break;
              case 'italic':
                element = <em key={keyCounter++}>{element}</em>;
                break;
              case 'underline':
                element = <u key={keyCounter++}>{element}</u>;
                break;
              case 'code':
                element = (
                  <code key={keyCounter++} className="bg-muted px-1 py-0.5 rounded text-sm font-mono">
                    {element}
                  </code>
                );
                break;
            }
          });
          
          parts.push(element);
        }
      }

      // Mettre à jour les formats actifs
      if (point.type === 'start') {
        activeFormats.push(point.format);
      } else {
        const index = activeFormats.findIndex(f => 
          f.start === point.format.start && 
          f.end === point.format.end && 
          f.type === point.format.type
        );
        if (index !== -1) {
          activeFormats.splice(index, 1);
        }
      }

      lastIndex = point.position;
    }

    // Ajouter le reste du texte
    if (lastIndex < text.length) {
      const remainingText = text.substring(lastIndex);
      let element: ReactNode = remainingText;
      
      // Appliquer tous les formats actifs
      activeFormats.forEach(format => {
        switch (format.type) {
          case 'bold':
            element = <strong key={keyCounter++}>{element}</strong>;
            break;
          case 'italic':
            element = <em key={keyCounter++}>{element}</em>;
            break;
          case 'underline':
            element = <u key={keyCounter++}>{element}</u>;
            break;
          case 'code':
            element = (
              <code key={keyCounter++} className="bg-muted px-1 py-0.5 rounded text-sm font-mono">
                {element}
              </code>
            );
            break;
        }
      });
      
      parts.push(element);
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
        // Pour les éléments React, nous devons gérer les retours à la ligne différemment
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
    // Déclencher la détection des formats après un court délai
    setTimeout(() => {
      if (onSelectionChange) {
        onSelectionChange();
      }
    }, 10);
  };

  const handleTextareaBlur = () => {
    // Délai court pour permettre aux boutons d'être cliqués
    setTimeout(() => {
      setIsFocused(false);
    }, 150);
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const oldValue = value;
    
    // Ajuster les formats en fonction des changements de texte
    if (newValue.length !== oldValue.length) {
      const diff = newValue.length - oldValue.length;
      const currentCursor = e.target.selectionStart || 0;
      
      // Utiliser la sélection sauvegardée pour déterminer la zone de changement
      let changeStart: number;
      let changeEnd: number;
      
      if (diff < 0) {
        // Suppression : utiliser la sélection précédemment sauvegardée
        changeStart = lastSelectionRef.current.start;
        changeEnd = lastSelectionRef.current.end;
        
        // Si pas de sélection, utiliser la position actuelle
        if (changeStart === changeEnd) {
          changeStart = currentCursor;
          changeEnd = currentCursor - diff;
        }
      } else {
        // Insertion : le changement commence à la position du curseur moins la longueur insérée
        changeStart = currentCursor - diff;
        changeEnd = changeStart;
      }
      
      console.log('Text change detected:', {
        diff,
        changeStart,
        changeEnd,
        currentCursor,
        lastSelection: lastSelectionRef.current,
        oldValue: oldValue.substring(changeStart, changeEnd),
        formatsBefore: localFormats.length
      });
      
      const adjustedFormats = localFormats.map(format => {
        // Si le format est entièrement après la zone de changement
        if (format.start >= changeEnd) {
          return {
            ...format,
            start: Math.max(0, format.start + diff),
            end: Math.max(0, format.end + diff)
          };
        }
        // Si le format est entièrement avant la zone de changement
        else if (format.end <= changeStart) {
          return format; // Pas de changement nécessaire
        }
        // Si le format chevauche avec la zone de changement
        else {
          // Le format commence avant le changement mais se termine après/dans la zone
          if (format.start < changeStart) {
            // Si le format se termine après la zone de changement
            if (format.end > changeEnd) {
              return {
                ...format,
                end: Math.max(format.start, format.end + diff)
              };
            } else {
              // Le format se termine dans la zone supprimée, le tronquer
              return {
                ...format,
                end: changeStart
              };
            }
          }
          // Le format commence dans la zone de changement
          else {
            // Si c'est une suppression et le format commence dans la zone supprimée
            if (diff < 0 && format.start < changeEnd) {
              // Si le format se termine après la zone supprimée
              if (format.end > changeEnd) {
                return {
                  ...format,
                  start: changeStart,
                  end: Math.max(changeStart, format.end + diff)
                };
              } else {
                // Format entièrement dans la zone supprimée, le supprimer
                return null;
              }
            } else {
              // Ajustement normal pour insertion
              return {
                ...format,
                start: Math.max(0, format.start + diff),
                end: Math.max(format.start + diff, format.end + diff)
              };
            }
          }
        }
      }).filter((format): format is TextFormat => 
        format !== null && format.start < format.end && format.end <= newValue.length
      );
      
      
      setLocalFormats(adjustedFormats);
      if (onFormatsChange) {
        onFormatsChange(adjustedFormats);
      }
    }
    
    onChange(newValue);
  };

  const handleOverlayClick = () => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleTextareaMouseUp = () => {
    // Sauvegarder la sélection actuelle
    if (textareaRef.current) {
      lastSelectionRef.current = {
        start: textareaRef.current.selectionStart || 0,
        end: textareaRef.current.selectionEnd || 0
      };
    }
    setTimeout(() => {
      if (onSelectionChange) {
        onSelectionChange();
      }
    }, 10);
  };

  const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    console.log('TransparentRichTextEditor handleTextareaKeyDown:', e.key);
    
    // Sauvegarder la sélection avant une frappe de touche
    if (textareaRef.current) {
      lastSelectionRef.current = {
        start: textareaRef.current.selectionStart || 0,
        end: textareaRef.current.selectionEnd || 0
      };
    }
    
    if (onKeyDown) {
      console.log('Calling onKeyDown with:', e.key);
      onKeyDown(e);
    } else {
      console.log('No onKeyDown handler provided');
    }
  };

  const handleTextareaKeyUp = () => {
    setTimeout(() => {
      if (onSelectionChange) {
        onSelectionChange();
      }
    }, 10);
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
        onKeyDown={handleTextareaKeyDown}
        onKeyUp={handleTextareaKeyUp}
        onMouseUp={handleTextareaMouseUp}
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

TransparentRichTextEditor.displayName = 'TransparentRichTextEditor';