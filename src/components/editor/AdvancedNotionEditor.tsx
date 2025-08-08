"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from "sonner";
import { GripVertical } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { TableBlock } from './blocks/TableBlock';
import { ImageBlock } from './blocks/ImageBlock';
import { CalendarBlock } from './blocks/CalendarBlock';
import { TodoBlock } from './blocks/TodoBlock';
import { TransparentRichTextEditor, type TransparentRichTextEditorRef, type TextFormat } from './TransparentRichTextEditor';

interface TableData {
  rows: string[][];
  headers: boolean;
  alignment: ('left' | 'center' | 'right')[];
}

interface ImageData {
  src: string;
  alt: string;
  caption: string;
  alignment: 'left' | 'center' | 'right';
  size: 'small' | 'medium' | 'large' | 'full';
}

interface CalendarData {
  events: Array<{
    id: string;
    title: string;
    date: Date;
    color?: string;
  }>;
  view: 'month' | 'week' | 'agenda';
  currentDate: Date;
}

interface TodoData {
  items: Array<{
    id: string;
    text: string;
    completed: boolean;
    createdAt: Date;
  }>;
  title: string;
}

type BlockData = TableData | ImageData | CalendarData | TodoData | undefined;

export interface Block {
  id: string;
  type: 'paragraph' | 'heading1' | 'heading2' | 'heading3' | 'bulletList' | 'numberedList' | 'quote' | 'code' | 'divider' | 'table' | 'image' | 'calendar' | 'todoList';
  content: string;
  data?: unknown;
  formats?: TextFormat[];
  alignment?: 'left' | 'center' | 'right';
}

interface AdvancedNotionEditorProps {
  content: string;
  blocks?: Block[];
  onChange: (content: string) => void;
  onSave: (blocks?: Block[]) => void;
  placeholder?: string;
  autoSave?: boolean;
  saveInterval?: number;
  onInsertBlockRequest?: (insertFn: (type: string, data?: unknown) => void) => void;
  onBlockRefsRequest?: (getBlockRefsFn: () => Map<string, TransparentRichTextEditorRef>) => void;
  onSelectionChange?: () => void;
  onBlockAlignmentRequest?: (alignBlockFn: (blockId: string, alignment: 'left' | 'center' | 'right') => void) => void;
  onBlockTypeChangeRequest?: (changeBlockTypeFn: (blockId: string, newType: string) => void) => void;
  onCurrentBlocksUpdate?: (blocks: Block[]) => void;
}

export function AdvancedNotionEditor({ 
  content, 
  blocks: initialBlocks, 
  onSave, 
  autoSave = true, 
  saveInterval = 5000,
  onInsertBlockRequest,
  onBlockRefsRequest,
  onSelectionChange,
  onBlockAlignmentRequest,
  onBlockTypeChangeRequest,
  onCurrentBlocksUpdate
}: AdvancedNotionEditorProps) {
  const [blocks, setBlocks] = useState<Block[]>(() => {
    if (initialBlocks && initialBlocks.length > 0) {
      // Désérialiser les dates si nécessaire
      const deserializedBlocks = initialBlocks.map(block => ({
        ...block,
        data: block.data ? {
          ...block.data,
          // Reconvertir les strings en dates pour les blocs qui en ont besoin
          ...(block.type === 'calendar' && typeof block.data === 'object' && block.data !== null && 'currentDate' in block.data
            ? { currentDate: new Date(block.data.currentDate as string) } 
            : {}),
          ...(block.type === 'calendar' && typeof block.data === 'object' && block.data !== null && 'events' in block.data && Array.isArray(block.data.events)
            ? { 
                events: block.data.events.map((event: unknown) => ({
                  ...(event as object),
                  date: new Date((event as { date: string }).date)
                }))
              } 
            : {}),
          ...(block.type === 'todoList' && typeof block.data === 'object' && block.data !== null && 'items' in block.data && Array.isArray(block.data.items)
            ? { 
                items: block.data.items.map((item: unknown) => ({
                  ...(item as object),
                  createdAt: new Date((item as { createdAt: string }).createdAt)
                }))
              } 
            : {})
        } : undefined
      }));
      return deserializedBlocks;
    }
    
    return [{ id: '1', type: 'paragraph', content: content || '' }] as Block[];
  });
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastContent, setLastContent] = useState(content || '');
  const editorRef = useRef<HTMLDivElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastCursorPosition = useRef<{blockId: string, position: number, content: string} | null>(null);
  const blockRefs = useRef<Map<string, TransparentRichTextEditorRef>>(new Map());

  const handleSave = useCallback(async () => {
    if (isSaving) return;
    
    const currentContent = blocks.map(block => 
      block.type === 'paragraph' ? block.content : `[${block.type}]${block.content}`
    ).join('\n');
    if (currentContent === lastContent) {
      return;
    }
    
    setIsSaving(true);
    try {
      // Sérialiser les blocs pour la sauvegarde (convertir les dates en strings)
      const serializedBlocks = blocks.map(block => ({
        ...block,
        data: block.data ? JSON.parse(JSON.stringify(block.data)) : undefined
      }));
      
      // Sauvegarder avec les blocs structurés
      onSave(serializedBlocks);
      setLastSaved(new Date());
      setHasUnsavedChanges(false);
      setLastContent(currentContent);
      
      if (!autoSave) {
        toast.success("Note sauvegardée");
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setIsSaving(false);
    }
  }, [isSaving, blocks, lastContent, onSave, autoSave]);

  useEffect(() => {
    if (content && blocks.length === 1 && !blocks[0].content) {
      setBlocks([{ id: '1', type: 'paragraph', content }]);
    }
  }, [content, blocks]);

  // Auto-save effect
  useEffect(() => {
    if (autoSave && hasUnsavedChanges && !isSaving) {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      
      const currentContent = blocks.map(block => 
        block.type === 'paragraph' ? block.content : `[${block.type}]`
      ).join('\n').trim();
      const hasMinimumContent = currentContent.length > 3;
      
      if (hasMinimumContent) {
        saveTimeoutRef.current = setTimeout(() => {
          handleSave();
        }, saveInterval);
      }
    }

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [hasUnsavedChanges, autoSave, saveInterval, isSaving, blocks, handleSave]);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);


  // Fonction simple pour changer un bloc
  const handleBlockChange = (blockId: string, newContent: string) => {
    setBlocks(prevBlocks =>
      prevBlocks.map(block =>
        block.id === blockId ? { ...block, content: newContent } : block
      )
    );
    setHasUnsavedChanges(true);
  };

  // Fonction pour gérer les changements de formats
  const handleBlockFormatsChange = (blockId: string, formats: TextFormat[]) => {
    setBlocks(prevBlocks =>
      prevBlocks.map(block =>
        block.id === blockId ? { ...block, formats } : block
      )
    );
    setHasUnsavedChanges(true);
  };

  // Fonction pour gérer l'alignement des blocs
  const handleBlockAlignment = useCallback((blockId: string, alignment: 'left' | 'center' | 'right') => {
    // Sauvegarder la position du curseur avant le changement
    const currentElement = document.querySelector(`[data-block-id="${blockId}"]`) as HTMLTextAreaElement | HTMLInputElement;
    const cursorPosition = currentElement ? {
      start: currentElement.selectionStart || 0,
      end: currentElement.selectionEnd || 0
    } : { start: 0, end: 0 };

    setBlocks(prevBlocks =>
      prevBlocks.map(block =>
        block.id === blockId ? { ...block, alignment } : block
      )
    );
    setHasUnsavedChanges(true);

    // Restaurer le focus et la position du curseur après le re-render
    setTimeout(() => {
      const newElement = document.querySelector(`[data-block-id="${blockId}"]`) as HTMLTextAreaElement | HTMLInputElement;
      if (newElement) {
        newElement.focus();
        if (newElement.setSelectionRange) {
          newElement.setSelectionRange(cursorPosition.start, cursorPosition.end);
        }
        
        // Déclencher la détection des formats pour mettre à jour la toolbar
        if (onSelectionChange) {
          setTimeout(() => {
            onSelectionChange();
          }, 10);
        }
      }
    }, 0);
  }, [onSelectionChange]);

  // Fonction pour gérer le changement de type des blocs
  const handleBlockTypeChange = useCallback((blockId: string, newType: string) => {
    // Sauvegarder la position du curseur avant le changement
    const currentElement = document.querySelector(`[data-block-id="${blockId}"]`) as HTMLTextAreaElement | HTMLInputElement;
    const cursorPosition = currentElement ? {
      start: currentElement.selectionStart || 0,
      end: currentElement.selectionEnd || 0
    } : { start: 0, end: 0 };

    setBlocks(prevBlocks =>
      prevBlocks.map(block =>
        block.id === blockId ? { ...block, type: newType as Block['type'] } : block
      )
    );
    setHasUnsavedChanges(true);

    // Restaurer le focus et la position du curseur après le re-render
    setTimeout(() => {
      const newElement = document.querySelector(`[data-block-id="${blockId}"]`) as HTMLTextAreaElement | HTMLInputElement;
      if (newElement) {
        newElement.focus();
        if (newElement.setSelectionRange) {
          newElement.setSelectionRange(cursorPosition.start, cursorPosition.end);
        }
        
        // Déclencher la détection des formats pour mettre à jour la toolbar
        if (onSelectionChange) {
          setTimeout(() => {
            onSelectionChange();
          }, 10);
        }
      }
    }, 0);
  }, [onSelectionChange]);

  const handleBlockUpdate = (blockId: string, data: unknown) => {
    setBlocks(prevBlocks =>
      prevBlocks.map(block =>
        block.id === blockId ? { ...block, data } : block
      )
    );
    setHasUnsavedChanges(true);
  };


  const insertBlock = useCallback((type: string, data?: unknown) => {
    
    const getDefaultData = (blockType: Block['type']): BlockData => {
      switch (blockType) {
        case 'table':
          return {
            rows: [['', ''], ['', '']],
            headers: false,
            alignment: ['left', 'left'] as ('left' | 'center' | 'right')[]
          } as TableData;
        case 'image':
          return {
            src: '',
            alt: '',
            caption: '',
            alignment: 'center',
            size: 'medium'
          } as ImageData;
        case 'calendar':
          return {
            events: [],
            view: 'month' as const,
            currentDate: new Date()
          } as CalendarData;
        case 'todoList':
          return {
            items: [],
            title: 'Liste de tâches'
          } as TodoData;
        default:
          return undefined;
      }
    };

    const newBlock: Block = {
      id: Date.now().toString(),
      type: type as Block['type'],
      content: '',
      data: data || getDefaultData(type as Block['type'])
    };

    // Utiliser la position sauvegardée du curseur
    const cursorInfo = lastCursorPosition.current;

    setBlocks(currentBlocks => {
      if (!cursorInfo) {
        return [...currentBlocks, newBlock];
      }

      const targetIndex = currentBlocks.findIndex(block => block.id === cursorInfo.blockId);
      if (targetIndex === -1) {
        return [...currentBlocks, newBlock];
      }

      const targetBlock = currentBlocks[targetIndex];
      const newBlocks = [...currentBlocks];
      const { position, content } = cursorInfo;

      // Si le curseur est au milieu du texte, diviser
      if (position > 0 && position < content.length) {
        const beforeText = content.substring(0, position);
        const afterText = content.substring(position);

        // Modifier le bloc actuel
        newBlocks[targetIndex] = { ...targetBlock, content: beforeText };

        // Créer le bloc pour le texte après
        const afterBlock: Block = {
          id: (Date.now() + 1).toString(),
          type: 'paragraph',
          content: afterText
        };

        // Insérer le nouveau bloc et le bloc après
        newBlocks.splice(targetIndex + 1, 0, newBlock, afterBlock);
      } else {
        // Insertion simple
        const insertAt = position === 0 ? targetIndex : targetIndex + 1;
        newBlocks.splice(insertAt, 0, newBlock);
      }

      return newBlocks;
    });

    setHasUnsavedChanges(true);

    // Focus sur le nouveau bloc
    setTimeout(() => {
      const newBlockElement = document.querySelector(`[data-block-id="${newBlock.id}"]`) as HTMLElement;
      if (newBlockElement) {
        newBlockElement.focus();
      }
    }, 50);
  }, []);

  const deleteBlock = (blockId: string) => {
    setBlocks(prevBlocks => prevBlocks.filter(block => block.id !== blockId));
    setHasUnsavedChanges(true);
  };


  const getDefaultDataForType = (type: Block['type']): BlockData => {
    switch (type) {
      case 'table':
        return {
          rows: [['', ''], ['', '']],
          headers: false,
          alignment: ['left', 'left'] as ('left' | 'center' | 'right')[]
        } as TableData;
      case 'image':
        return {
          src: '',
          alt: '',
          caption: '',
          alignment: 'center' as const,
          size: 'medium' as const
        } as ImageData;
      case 'calendar':
        return {
          events: [],
          view: 'month' as const,
          currentDate: new Date()
        } as CalendarData;
      case 'todoList':
        return {
          items: [],
          title: 'Liste de tâches'
        } as TodoData;
      default:
        return undefined;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, blockId: string) => {
    const currentBlock = blocks.find(block => block.id === blockId);
    const currentIndex = blocks.findIndex(block => block.id === blockId);
    
    if (e.key === 'Enter') {
      e.preventDefault();
      
      // Capturer la position du curseur dans le texte
      const target = e.target as HTMLTextAreaElement | HTMLInputElement;
      const cursorPosition = target.selectionStart || 0;
      const currentContent = currentBlock?.content || '';
      
      // Diviser le contenu au point du curseur
      const beforeCursor = currentContent.substring(0, cursorPosition);
      const afterCursor = currentContent.substring(cursorPosition);
      
      // Logique pour les listes :
      // - Si on est dans un élément de liste vide, on sort de la liste (paragraphe)
      // - Sinon, on continue la liste avec le même type
      let newBlockType: Block['type'] = 'paragraph';
      let shouldExitList = false;
      
      if (currentBlock?.type === 'bulletList' || currentBlock?.type === 'numberedList') {
        const isEmptyListItem = currentContent.trim() === '';
        
        if (isEmptyListItem) {
          // Liste vide - sortir de la liste et convertir l'élément actuel en paragraphe
          shouldExitList = true;
          newBlockType = 'paragraph';
        } else {
          // Continuer avec le même type de liste
          newBlockType = currentBlock.type;
        }
      }
      
      // Créer un nouveau bloc avec le texte après le curseur
      const newBlock: Block = {
        id: Date.now().toString(),
        type: newBlockType,
        content: afterCursor,
        data: undefined
      };
      
      // Faire les opérations appropriées selon le contexte
      setBlocks(prevBlocks => {
        const index = prevBlocks.findIndex(block => block.id === blockId);
        const newBlocks = [...prevBlocks];
        
        if (shouldExitList) {
          // Convertir l'élément de liste actuel en paragraphe et créer un nouveau paragraphe
          newBlocks[index] = { 
            ...newBlocks[index], 
            type: 'paragraph', 
            content: beforeCursor 
          };
        } else {
          // Comportement normal : mettre à jour le contenu du bloc actuel
          newBlocks[index] = { ...newBlocks[index], content: beforeCursor };
        }
        
        // Insérer le nouveau bloc après
        newBlocks.splice(index + 1, 0, newBlock);
        
        return newBlocks;
      });
      
      setHasUnsavedChanges(true);
      
      // Focuser sur le nouveau bloc et placer le curseur au début
      setTimeout(() => {
        const newBlockElement = document.querySelector(`[data-block-id="${newBlock.id}"]`) as HTMLElement;
        if (newBlockElement) {
          newBlockElement.focus();
          // Placer le curseur au début du nouveau bloc
          if (newBlockElement instanceof HTMLTextAreaElement || newBlockElement instanceof HTMLInputElement) {
            newBlockElement.setSelectionRange(0, 0);
          }
        }
      }, 0);
    } else if (e.key === '/' && currentBlock?.content === '') {
      // Raccourci pour ouvrir le menu d'insertion
      e.preventDefault();
    } else if (e.key === 'Backspace') {
      const target = e.target as HTMLTextAreaElement | HTMLInputElement;
      
      // Capturer la sélection actuelle AVANT modification
      const currentSelectionStart = target.selectionStart || 0;
      const currentSelectionEnd = target.selectionEnd || 0;
      const textLength = target.value.length;
      const content = currentBlock?.content || '';
      
      // Alternative : utiliser l'API de sélection du navigateur
      const selection = window.getSelection();
      const selectedText = selection?.toString() || '';
      
      // Vérifier si on a une sélection importante (pas juste le curseur)
      const hasLargeSelection = (currentSelectionEnd - currentSelectionStart) >= Math.max(1, textLength * 0.5);
      const isFullSelection = currentSelectionStart === 0 && currentSelectionEnd === textLength && textLength > 0;
      const selectedTextMatchesContent = selectedText.length > 0 && selectedText === content.trim();
      
      // Si on a une sélection importante, traiter comme une suppression de bloc
      if (isFullSelection || hasLargeSelection || selectedTextMatchesContent) {
        e.preventDefault();
        
        // Si c'est le dernier bloc et qu'il n'est pas vide, on le vide simplement
        if (currentIndex === blocks.length - 1 && currentBlock?.content) {
          setBlocks(prevBlocks => 
            prevBlocks.map(block =>
              block.id === blockId ? { ...block, content: '' } : block
            )
          );
          setHasUnsavedChanges(true);
          return;
        }
        
        // Sinon, supprimer le bloc et aller au précédent
        if (blocks.length > 1 && currentIndex > 0) {
          const previousBlock = blocks[currentIndex - 1];
          const previousBlockContent = previousBlock.content;
          
          // Supprimer le bloc courant
          setBlocks(prevBlocks => prevBlocks.filter(block => block.id !== blockId));
          setHasUnsavedChanges(true);
          
          // Focuser sur le bloc précédent à la fin de son contenu
          setTimeout(() => {
            const previousElement = document.querySelector(`[data-block-id="${previousBlock.id}"]`) as HTMLElement;
            if (previousElement) {
              previousElement.focus();
              // Placer le curseur à la fin
              if (previousElement instanceof HTMLTextAreaElement || previousElement instanceof HTMLInputElement) {
                previousElement.setSelectionRange(previousBlockContent.length, previousBlockContent.length);
              }
            }
          }, 0);
        }
        return;
      }
      
      // Logique normale de Backspace (pour curseur ou petites sélections)
      
      if (currentSelectionStart === 0 && currentBlock?.content === '') {
        e.preventDefault();
        
        // Si on est dans une liste, d'abord convertir en paragraphe (sans perdre le focus)
        if (currentBlock?.type === 'bulletList' || currentBlock?.type === 'numberedList') {
          setBlocks(prevBlocks => 
            prevBlocks.map(block =>
              block.id === blockId ? { ...block, type: 'paragraph' } : block
            )
          );
          setHasUnsavedChanges(true);
          
          // Garder le focus sur l'élément actuel
          setTimeout(() => {
            const currentElement = document.querySelector(`[data-block-id="${blockId}"]`) as HTMLElement;
            if (currentElement) {
              currentElement.focus();
              // Garder le curseur au début
              if (currentElement instanceof HTMLTextAreaElement || currentElement instanceof HTMLInputElement) {
                currentElement.setSelectionRange(0, 0);
              }
            }
          }, 0);
          return; // S'arrêter ici, ne pas supprimer le bloc
        }
        
        // Si c'est déjà un paragraphe vide, alors supprimer le bloc et revenir au précédent
        if (blocks.length > 1 && currentIndex > 0) {
          const previousBlock = blocks[currentIndex - 1];
          const previousBlockContent = previousBlock.content;
          
          // Supprimer le bloc courant
          setBlocks(prevBlocks => prevBlocks.filter(block => block.id !== blockId));
          setHasUnsavedChanges(true);
          
          // Focuser sur le bloc précédent à la fin de son contenu
          setTimeout(() => {
            const previousElement = document.querySelector(`[data-block-id="${previousBlock.id}"]`) as HTMLElement;
            if (previousElement) {
              previousElement.focus();
              // Placer le curseur à la fin
              if (previousElement instanceof HTMLTextAreaElement || previousElement instanceof HTMLInputElement) {
                previousElement.setSelectionRange(previousBlockContent.length, previousBlockContent.length);
              }
            }
          }, 0);
        }
      } else if (currentSelectionStart === 0 && currentBlock?.content && currentIndex > 0) {
        // Fusionner avec le bloc précédent
        e.preventDefault();
        const previousBlock = blocks[currentIndex - 1];
        const previousContent = previousBlock.content;
        const currentContent = currentBlock.content;
        
        // Mettre à jour le contenu du bloc précédent
        setBlocks(prevBlocks => 
          prevBlocks
            .map(block => 
              block.id === previousBlock.id 
                ? { ...block, content: previousContent + currentContent }
                : block
            )
            .filter(block => block.id !== blockId)
        );
        setHasUnsavedChanges(true);
        
        // Focuser sur le bloc précédent à la position de jonction
        setTimeout(() => {
          const previousElement = document.querySelector(`[data-block-id="${previousBlock.id}"]`) as HTMLElement;
          if (previousElement) {
            previousElement.focus();
            // Placer le curseur à la position de jonction
            if (previousElement instanceof HTMLTextAreaElement || previousElement instanceof HTMLInputElement) {
              previousElement.setSelectionRange(previousContent.length, previousContent.length);
            }
          }
        }, 0);
      }
    } else if (e.key === 'Delete') {
      const target = e.target as HTMLTextAreaElement | HTMLInputElement;
      
      // Utiliser la sélection actuelle AVANT qu'elle ne soit modifiée par l'événement
      const currentSelectionStart = target.selectionStart || 0;
      const currentSelectionEnd = target.selectionEnd || 0;
      const textLength = target.value.length;
      const content = currentBlock?.content || '';
      
      // Alternative : utiliser l'API de sélection du navigateur
      const selection = window.getSelection();
      const selectedText = selection?.toString() || '';
      
      // Vérifier différents cas de suppression de ligne
      const isFullSelection = currentSelectionStart === 0 && currentSelectionEnd === textLength && textLength > 0;
      const isEmptyBlock = content === '' || textLength === 0;
      const hasLargeSelection = (currentSelectionEnd - currentSelectionStart) >= Math.max(1, textLength * 0.8);
      const isWholeLineSelected = currentSelectionStart === 0 && currentSelectionEnd === content.length;
      
      // Utiliser aussi l'API de sélection comme fallback
      const selectedTextMatchesContent = selectedText.length > 0 && selectedText === content.trim();
      const hasSignificantSelection = selectedText.length >= Math.max(1, content.length * 0.5);
      
      if (isFullSelection || isEmptyBlock || hasLargeSelection || isWholeLineSelected || selectedTextMatchesContent || hasSignificantSelection) {
        e.preventDefault();
        
        // Si c'est le dernier bloc et qu'il n'est pas vide, on le vide simplement
        if (currentIndex === blocks.length - 1 && currentBlock?.content) {
          setBlocks(prevBlocks => 
            prevBlocks.map(block =>
              block.id === blockId ? { ...block, content: '' } : block
            )
          );
          setHasUnsavedChanges(true);
          return;
        }
        
        // Sinon, supprimer le bloc et aller au suivant ou précédent
        if (blocks.length > 1) {
          // Déterminer vers quel bloc aller
          let targetBlockIndex: number;
          if (currentIndex < blocks.length - 1) {
            // Aller au bloc suivant
            targetBlockIndex = currentIndex;
          } else {
            // Aller au bloc précédent si on supprime le dernier
            targetBlockIndex = currentIndex - 1;
          }
          
          const targetBlock = blocks[targetBlockIndex === currentIndex ? currentIndex + 1 : targetBlockIndex];
          
          // Supprimer le bloc courant
          setBlocks(prevBlocks => prevBlocks.filter(block => block.id !== blockId));
          setHasUnsavedChanges(true);
          
          // Focuser sur le bloc cible
          setTimeout(() => {
            const targetElement = document.querySelector(`[data-block-id="${targetBlock.id}"]`) as HTMLElement;
            if (targetElement) {
              targetElement.focus();
              // Placer le curseur au début
              if (targetElement instanceof HTMLTextAreaElement || targetElement instanceof HTMLInputElement) {
                targetElement.setSelectionRange(0, 0);
              }
            }
          }, 0);
        }
      }
      // Si on est à la fin du bloc et qu'il y a un bloc suivant, fusionner
      else if (currentSelectionStart === textLength && currentIndex < blocks.length - 1) {
        e.preventDefault();
        const nextBlock = blocks[currentIndex + 1];
        const currentContent = currentBlock?.content || '';
        const nextContent = nextBlock.content;
        
        // Mettre à jour le contenu du bloc courant avec le contenu du suivant
        setBlocks(prevBlocks => 
          prevBlocks
            .map(block => 
              block.id === blockId 
                ? { ...block, content: currentContent + nextContent }
                : block
            )
            .filter(block => block.id !== nextBlock.id)
        );
        setHasUnsavedChanges(true);
        
        // Garder le focus sur le bloc courant à la position de jonction
        setTimeout(() => {
          const currentElement = document.querySelector(`[data-block-id="${blockId}"]`) as HTMLElement;
          if (currentElement && (currentElement instanceof HTMLTextAreaElement || currentElement instanceof HTMLInputElement)) {
            currentElement.setSelectionRange(currentContent.length, currentContent.length);
          }
        }, 0);
      }
    } else if (e.key === 'ArrowUp' && currentIndex > 0) {
      // Navigation vers le bloc précédent avec flèche haut
      const target = e.target as HTMLTextAreaElement | HTMLInputElement;
      const cursorPosition = target.selectionStart;
      
      // Si on est au début de la ligne ou si c'est un input
      if (cursorPosition === 0 || target instanceof HTMLInputElement) {
        e.preventDefault();
        const previousBlock = blocks[currentIndex - 1];
        const previousElement = document.querySelector(`[data-block-id="${previousBlock.id}"]`) as HTMLElement;
        if (previousElement) {
          previousElement.focus();
          // Placer le curseur à la fin
          if (previousElement instanceof HTMLTextAreaElement || previousElement instanceof HTMLInputElement) {
            const endPosition = previousElement.value.length;
            previousElement.setSelectionRange(endPosition, endPosition);
          }
        }
      }
    } else if (e.key === 'ArrowDown' && currentIndex < blocks.length - 1) {
      // Navigation vers le bloc suivant avec flèche bas
      const target = e.target as HTMLTextAreaElement | HTMLInputElement;
      const cursorPosition = target.selectionStart;
      const textLength = target.value.length;
      
      // Si on est à la fin de la ligne ou si c'est un input
      if (cursorPosition === textLength || target instanceof HTMLInputElement) {
        e.preventDefault();
        const nextBlock = blocks[currentIndex + 1];
        const nextElement = document.querySelector(`[data-block-id="${nextBlock.id}"]`) as HTMLElement;
        if (nextElement) {
          nextElement.focus();
          // Placer le curseur au début
          if (nextElement instanceof HTMLTextAreaElement || nextElement instanceof HTMLInputElement) {
            nextElement.setSelectionRange(0, 0);
          }
        }
      }
    } else if (e.ctrlKey || e.metaKey) {
      if (e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    }
  };

  // Gestion du drag & drop avec @hello-pangea/dnd
  const handleDragEnd = (result: { destination?: { index: number } | null; source: { index: number } }) => {
    if (!result.destination) {
      return;
    }

    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;

    if (sourceIndex === destinationIndex) {
      return;
    }

    setBlocks(prevBlocks => {
      const newBlocks = Array.from(prevBlocks);
      const [reorderedItem] = newBlocks.splice(sourceIndex, 1);
      newBlocks.splice(destinationIndex, 0, reorderedItem);
      return newBlocks;
    });
    
    setHasUnsavedChanges(true);
    toast.success('Bloc déplacé avec succès');
  };

  // Helper pour obtenir les classes d'alignement
  const getAlignmentClass = (alignment?: 'left' | 'center' | 'right') => {
    switch (alignment) {
      case 'center': return 'text-center';
      case 'right': return 'text-right';
      case 'left':
      default: return 'text-left';
    }
  };

  const renderBlock = (block: Block) => {
    const alignmentClass = getAlignmentClass(block.alignment);
    
    const commonProps = {
      'data-block-id': block.id,
      onKeyDown: (e: React.KeyboardEvent) => handleKeyDown(e, block.id),
      onFocus: (e: React.FocusEvent) => {
        const target = e.target as HTMLInputElement | HTMLTextAreaElement;
        const position = target.selectionStart || 0;
        lastCursorPosition.current = {
          blockId: block.id,
          position,
          content: target.value
        };
      }
    };

    switch (block.type) {
      case 'table':
        return (
          <TableBlock
            key={block.id}
            id={block.id}
            data={(block.data as TableData) || (getDefaultDataForType('table') as TableData)}
            onUpdate={handleBlockUpdate}
            onDelete={deleteBlock}
          />
        );
      case 'image':
        return (
          <ImageBlock
            key={block.id}
            id={block.id}
            data={(block.data as ImageData) || (getDefaultDataForType('image') as ImageData)}
            onUpdate={handleBlockUpdate}
            onDelete={deleteBlock}
          />
        );
      case 'calendar':
        return (
          <CalendarBlock
            key={block.id}
            id={block.id}
            data={(block.data as CalendarData) || (getDefaultDataForType('calendar') as CalendarData)}
            onUpdate={handleBlockUpdate}
            onDelete={deleteBlock}
          />
        );
      case 'todoList':
        return (
          <TodoBlock
            key={block.id}
            id={block.id}
            data={(block.data as TodoData) || (getDefaultDataForType('todoList') as TodoData)}
            onUpdate={handleBlockUpdate}
            onDelete={deleteBlock}
          />
        );
      case 'divider':
        return <div className="w-full h-px bg-border my-4" />;
      case 'heading1':
        return (
          <div className={alignmentClass}>
            <TransparentRichTextEditor
              value={block.content}
              onChange={(newContent) => handleBlockChange(block.id, newContent)}
              formats={block.formats || []}
              onFormatsChange={(formats) => handleBlockFormatsChange(block.id, formats)}
              onKeyDown={(e) => handleKeyDown(e, block.id)}
              onFocus={(e) => {
                const target = e.target as HTMLInputElement | HTMLTextAreaElement;
                const position = target.selectionStart || 0;
                lastCursorPosition.current = {
                  blockId: block.id,
                  position,
                  content: target.value
                };
              }}
              placeholder="Titre 1"
              className={`w-full bg-transparent border-none outline-none text-3xl font-bold placeholder:text-muted-foreground ${alignmentClass}`}
              data-block-id={block.id}
            />
          </div>
        );
      case 'heading2':
        return (
          <div className={alignmentClass}>
            <TransparentRichTextEditor
              value={block.content}
              onChange={(newContent) => handleBlockChange(block.id, newContent)}
              formats={block.formats || []}
              onFormatsChange={(formats) => handleBlockFormatsChange(block.id, formats)}
              onKeyDown={(e) => handleKeyDown(e, block.id)}
              onFocus={(e) => {
                const target = e.target as HTMLInputElement | HTMLTextAreaElement;
                const position = target.selectionStart || 0;
                lastCursorPosition.current = {
                  blockId: block.id,
                  position,
                  content: target.value
                };
              }}
              placeholder="Titre 2"
              className={`w-full bg-transparent border-none outline-none text-2xl font-semibold placeholder:text-muted-foreground ${alignmentClass}`}
              data-block-id={block.id}
            />
          </div>
        );
      case 'heading3':
        return (
          <div className={alignmentClass}>
            <TransparentRichTextEditor
              value={block.content}
              onChange={(newContent) => handleBlockChange(block.id, newContent)}
              formats={block.formats || []}
              onFormatsChange={(formats) => handleBlockFormatsChange(block.id, formats)}
              onKeyDown={(e) => handleKeyDown(e, block.id)}
              onFocus={(e) => {
                const target = e.target as HTMLInputElement | HTMLTextAreaElement;
                const position = target.selectionStart || 0;
                lastCursorPosition.current = {
                  blockId: block.id,
                  position,
                  content: target.value
                };
              }}
              placeholder="Titre 3"
              className={`w-full bg-transparent border-none outline-none text-xl font-medium placeholder:text-muted-foreground ${alignmentClass}`}
              data-block-id={block.id}
            />
          </div>
        );
      case 'quote':
        return (
          <div className={`border-l-4 border-muted pl-4 ${alignmentClass}`}>
            <TransparentRichTextEditor
              value={block.content}
              onChange={(newContent) => handleBlockChange(block.id, newContent)}
              formats={block.formats || []}
              onFormatsChange={(formats) => handleBlockFormatsChange(block.id, formats)}
              onKeyDown={(e) => handleKeyDown(e, block.id)}
              onFocus={(e) => {
                const target = e.target as HTMLInputElement | HTMLTextAreaElement;
                const position = target.selectionStart || 0;
                lastCursorPosition.current = {
                  blockId: block.id,
                  position,
                  content: target.value
                };
              }}
              placeholder="Citation..."
              className={`w-full bg-transparent border-none outline-none resize-none italic text-muted-foreground placeholder:text-muted-foreground ${alignmentClass}`}
              data-block-id={block.id}
            />
          </div>
        );
      case 'code':
        return (
          <div className={`bg-muted rounded-md p-3 font-mono ${alignmentClass}`}>
            <textarea
              {...commonProps}
              className="w-full bg-transparent border-none outline-none resize-none font-mono text-sm placeholder:text-muted-foreground"
              defaultValue={block.content}
              onChange={(e) => handleBlockChange(block.id, e.target.value)}
              placeholder="Code..."
              rows={3}
            />
          </div>
        );
      case 'bulletList':
        return (
          <div className={`flex items-start gap-2 ${alignmentClass}`}>
            <div className="w-2 h-2 bg-current rounded-full mt-2 flex-shrink-0 opacity-70" />
            <TransparentRichTextEditor
              ref={(ref) => {
                if (ref) {
                  blockRefs.current.set(block.id, ref);
                } else {
                  blockRefs.current.delete(block.id);
                }
              }}
              value={block.content}
              onChange={(newContent) => handleBlockChange(block.id, newContent)}
              formats={block.formats || []}
              onFormatsChange={(formats) => handleBlockFormatsChange(block.id, formats)}
              onKeyDown={(e) => handleKeyDown(e, block.id)}
              onFocus={(e) => {
                const target = e.target as HTMLInputElement | HTMLTextAreaElement;
                const position = target.selectionStart || 0;
                lastCursorPosition.current = {
                  blockId: block.id,
                  position,
                  content: target.value
                };
              }}
              onSelectionChange={onSelectionChange}
              placeholder="Élément de liste"
              className={`flex-1 w-full bg-transparent border-none outline-none resize-none placeholder:text-muted-foreground ${alignmentClass}`}
              data-block-id={block.id}
            />
          </div>
        );
      case 'numberedList':
        return (
          <div className={`flex items-start gap-2 ${alignmentClass}`}>
            <div className="min-w-[1.5rem] mt-1 text-sm font-medium text-muted-foreground flex-shrink-0">
              {blocks.filter(b => b.type === 'numberedList').indexOf(block) + 1}.
            </div>
            <TransparentRichTextEditor
              ref={(ref) => {
                if (ref) {
                  blockRefs.current.set(block.id, ref);
                } else {
                  blockRefs.current.delete(block.id);
                }
              }}
              value={block.content}
              onChange={(newContent) => handleBlockChange(block.id, newContent)}
              formats={block.formats || []}
              onFormatsChange={(formats) => handleBlockFormatsChange(block.id, formats)}
              onKeyDown={(e) => handleKeyDown(e, block.id)}
              onFocus={(e) => {
                const target = e.target as HTMLInputElement | HTMLTextAreaElement;
                const position = target.selectionStart || 0;
                lastCursorPosition.current = {
                  blockId: block.id,
                  position,
                  content: target.value
                };
              }}
              onSelectionChange={onSelectionChange}
              placeholder="Élément numéroté"
              className={`flex-1 w-full bg-transparent border-none outline-none resize-none placeholder:text-muted-foreground ${alignmentClass}`}
              data-block-id={block.id}
            />
          </div>
        );
      default:
        return (
          <div className={alignmentClass}>
            <TransparentRichTextEditor
              ref={(ref) => {
                if (ref) {
                  blockRefs.current.set(block.id, ref);
                } else {
                  blockRefs.current.delete(block.id);
                }
              }}
              value={block.content}
              onChange={(newContent) => handleBlockChange(block.id, newContent)}
              formats={block.formats || []}
              onFormatsChange={(formats) => handleBlockFormatsChange(block.id, formats)}
              onKeyDown={(e) => handleKeyDown(e, block.id)}
              onFocus={(e) => {
                const target = e.target as HTMLInputElement | HTMLTextAreaElement;
                const position = target.selectionStart || 0;
                lastCursorPosition.current = {
                  blockId: block.id,
                  position,
                  content: target.value
                };
              }}
              onSelectionChange={onSelectionChange}
              className={`w-full bg-transparent border-none outline-none resize-none placeholder:text-muted-foreground ${alignmentClass}`}
              data-block-id={block.id}
            />
          </div>
        );
    }
  };

  const formatLastSaved = () => {
    if (!lastSaved) return '';
    const now = new Date();
    const diff = now.getTime() - lastSaved.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes === 0) return 'À l\'instant';
    if (minutes === 1) return 'Il y a 1 minute';
    if (minutes < 60) return `Il y a ${minutes} minutes`;
    
    return lastSaved.toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };


  // Expose insertBlock function to parent
  useEffect(() => {
    if (onInsertBlockRequest) {
      onInsertBlockRequest(insertBlock);
    }
  }, [onInsertBlockRequest, insertBlock]);


  // Expose blockRefs to parent
  useEffect(() => {
    if (onBlockRefsRequest) {
      onBlockRefsRequest(() => blockRefs.current);
    }
  }, [onBlockRefsRequest]);

  // Expose block alignment function to parent
  useEffect(() => {
    if (onBlockAlignmentRequest) {
      onBlockAlignmentRequest(handleBlockAlignment);
    }
  }, [onBlockAlignmentRequest, handleBlockAlignment]);

  // Expose block type change function to parent
  useEffect(() => {
    if (onBlockTypeChangeRequest) {
      onBlockTypeChangeRequest(handleBlockTypeChange);
    }
  }, [onBlockTypeChangeRequest, handleBlockTypeChange]);

  // Send current blocks state to parent whenever it changes
  useEffect(() => {
    if (onCurrentBlocksUpdate) {
      onCurrentBlocksUpdate(blocks);
    }
  }, [blocks, onCurrentBlocksUpdate]);

  return (
    <div className="relative" ref={editorRef}>
      {/* Barre de statut de sauvegarde */}
      <div className="flex items-center justify-between mb-4 pb-2 border-b">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {isSaving ? (
              <>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                <span>Sauvegarde...</span>
              </>
            ) : hasUnsavedChanges ? (
              <>
                <div className="w-2 h-2 bg-orange-500 rounded-full" />
                <span>Modifications non sauvegardées</span>
              </>
            ) : lastSaved ? (
              <>
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span>Sauvegardé {formatLastSaved()}</span>
              </>
            ) : (
              <>
                <div className="w-2 h-2 bg-gray-400 rounded-full" />
                <span>Nouveau brouillon</span>
              </>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSave()}
            disabled={isSaving || !hasUnsavedChanges}
          >
            {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
          </Button>
          <div className="text-xs text-muted-foreground">
            {autoSave ? 'Auto-save activé' : 'Ctrl+S'}
          </div>
        </div>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="blocks">
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
              {blocks.map((block, index) => (
                <Draggable key={block.id} draggableId={block.id} index={index}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={`relative group ${snapshot.isDragging ? 'opacity-75' : ''}`}
                    >
                      <div {...provided.dragHandleProps} className="absolute -left-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="w-6 h-6 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded cursor-grab flex items-center justify-center">
                          <GripVertical className="h-3 w-3 text-gray-500" />
                        </div>
                      </div>
                      {renderBlock(block)}
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
}