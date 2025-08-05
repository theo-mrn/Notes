"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from "sonner";
import { GripVertical, Trash2, Copy, ArrowUp, ArrowDown } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { TableBlock } from './blocks/TableBlock';
import { ImageBlock } from './blocks/ImageBlock';
import { CalendarBlock } from './blocks/CalendarBlock';
import { TodoBlock } from './blocks/TodoBlock';

interface Block {
  id: string;
  type: 'paragraph' | 'heading1' | 'heading2' | 'heading3' | 'bulletList' | 'numberedList' | 'quote' | 'code' | 'divider' | 'table' | 'image' | 'calendar' | 'todoList';
  content: string;
  data?: any;
}

interface AdvancedNotionEditorProps {
  content: string;
  blocks?: Block[];
  onChange: (content: string) => void;
  onSave: (blocks?: Block[]) => void;
  placeholder?: string;
  autoSave?: boolean;
  saveInterval?: number;
  onInsertBlockRequest?: (insertFn: (type: string, data?: any) => void) => void;
}

export function AdvancedNotionEditor({ 
  content, 
  blocks: initialBlocks, 
  onChange, 
  onSave, 
  placeholder, 
  autoSave = true, 
  saveInterval = 5000,
  onInsertBlockRequest
}: AdvancedNotionEditorProps) {
  const [blocks, setBlocks] = useState<Block[]>(() => {
    console.log('Initialisation des blocs:', { initialBlocks, content });
    
    if (initialBlocks && initialBlocks.length > 0) {
      console.log('Utilisation des blocs initiaux:', initialBlocks);
      // Désérialiser les dates si nécessaire
      const deserializedBlocks = initialBlocks.map(block => ({
        ...block,
        data: block.data ? {
          ...block.data,
          // Reconvertir les strings en dates pour les blocs qui en ont besoin
          ...(block.type === 'calendar' && block.data.currentDate 
            ? { currentDate: new Date(block.data.currentDate) } 
            : {}),
          ...(block.type === 'calendar' && block.data.events 
            ? { 
                events: block.data.events.map((event: any) => ({
                  ...event,
                  date: new Date(event.date)
                }))
              } 
            : {}),
          ...(block.type === 'todoList' && block.data.items 
            ? { 
                items: block.data.items.map((item: any) => ({
                  ...item,
                  createdAt: new Date(item.createdAt)
                }))
              } 
            : {})
        } : undefined
      }));
      console.log('Blocs désérialisés:', deserializedBlocks);
      return deserializedBlocks;
    }
    
    const defaultBlocks = [{ id: '1', type: 'paragraph', content: content || '' }];
    console.log('Utilisation des blocs par défaut:', defaultBlocks);
    return defaultBlocks as Block[];
  });
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastContent, setLastContent] = useState(content || '');
  const editorRef = useRef<HTMLDivElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastCursorPosition = useRef<{blockId: string, position: number, content: string} | null>(null);

  useEffect(() => {
    if (content && blocks.length === 1 && !blocks[0].content) {
      setBlocks([{ id: '1', type: 'paragraph', content }]);
    }
  }, [content]);

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
  }, [hasUnsavedChanges, autoSave, saveInterval, isSaving, blocks]);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const handleSave = async () => {
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
      await onSave(serializedBlocks);
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
  };

  // Fonction simple pour changer un bloc
  const handleBlockChange = (blockId: string, newContent: string) => {
    setBlocks(prevBlocks =>
      prevBlocks.map(block =>
        block.id === blockId ? { ...block, content: newContent } : block
      )
    );
    setHasUnsavedChanges(true);
  };

  const handleBlockUpdate = (blockId: string, data: any) => {
    setBlocks(prevBlocks =>
      prevBlocks.map(block =>
        block.id === blockId ? { ...block, data } : block
      )
    );
    setHasUnsavedChanges(true);
  };

  const addNewBlock = (afterBlockId: string, type: Block['type'] = 'paragraph') => {
    const newBlock: Block = {
      id: Date.now().toString(),
      type,
      content: '',
      data: getDefaultDataForType(type)
    };

    setBlocks(prevBlocks => {
      const index = prevBlocks.findIndex(block => block.id === afterBlockId);
      const newBlocks = [...prevBlocks];
      newBlocks.splice(index + 1, 0, newBlock);
      return newBlocks;
    });

    setTimeout(() => {
      const newBlockElement = document.querySelector(`[data-block-id="${newBlock.id}"]`) as HTMLElement;
      if (newBlockElement) {
        newBlockElement.focus();
      }
    }, 0);
  };

  const insertBlock = useCallback((type: string, data?: any) => {
    console.log('Insertion de bloc dans l\'éditeur:', type, data);
    console.log('Position sauvegardée du curseur:', lastCursorPosition.current);
    
    const getDefaultData = (blockType: Block['type']) => {
      switch (blockType) {
        case 'table':
          return {
            rows: [['', ''], ['', '']],
            headers: false,
            alignment: ['left', 'left']
          };
        case 'image':
          return {
            src: '',
            alt: '',
            caption: '',
            alignment: 'center',
            size: 'medium'
          };
        case 'calendar':
          return {
            events: [],
            view: 'month',
            currentDate: new Date()
          };
        case 'todoList':
          return {
            items: [],
            title: 'Liste de tâches'
          };
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
        // Pas de position sauvegardée, ajouter à la fin
        console.log('Pas de position sauvegardée, ajout à la fin');
        return [...currentBlocks, newBlock];
      }

      const targetIndex = currentBlocks.findIndex(block => block.id === cursorInfo.blockId);
      if (targetIndex === -1) {
        console.log('Bloc cible non trouvé, ajout à la fin');
        return [...currentBlocks, newBlock];
      }

      const targetBlock = currentBlocks[targetIndex];
      const newBlocks = [...currentBlocks];
      const { position, content } = cursorInfo;

      console.log('Insertion avec position:', { targetIndex, position, content });

      // Si le curseur est au milieu du texte, diviser
      if (position > 0 && position < content.length) {
        const beforeText = content.substring(0, position);
        const afterText = content.substring(position);

        console.log('Division du bloc:', { beforeText, afterText });

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
        console.log('Insertion simple à l\'index:', insertAt);
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

  const duplicateBlock = (blockId: string) => {
    const blockToDuplicate = blocks.find(block => block.id === blockId);
    if (!blockToDuplicate) return;

    const duplicatedBlock: Block = {
      ...blockToDuplicate,
      id: Date.now().toString()
    };

    const originalIndex = blocks.findIndex(block => block.id === blockId);
    setBlocks(prevBlocks => {
      const newBlocks = [...prevBlocks];
      newBlocks.splice(originalIndex + 1, 0, duplicatedBlock);
      return newBlocks;
    });
    setHasUnsavedChanges(true);
  };

  const moveBlock = (blockId: string, direction: 'up' | 'down') => {
    const currentIndex = blocks.findIndex(block => block.id === blockId);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= blocks.length) return;

    setBlocks(prevBlocks => {
      const newBlocks = [...prevBlocks];
      const [movedBlock] = newBlocks.splice(currentIndex, 1);
      newBlocks.splice(newIndex, 0, movedBlock);
      return newBlocks;
    });
    setHasUnsavedChanges(true);
  };

  const getDefaultDataForType = (type: Block['type']) => {
    switch (type) {
      case 'table':
        return {
          rows: [['', ''], ['', '']],
          headers: false,
          alignment: ['left', 'left']
        };
      case 'image':
        return {
          src: '',
          alt: '',
          caption: '',
          alignment: 'center',
          size: 'medium'
        };
      case 'calendar':
        return {
          events: [],
          view: 'month',
          currentDate: new Date()
        };
      case 'todoList':
        return {
          items: [],
          title: 'Liste de tâches'
        };
      default:
        return undefined;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, blockId: string) => {
    const currentBlock = blocks.find(block => block.id === blockId);
    const currentIndex = blocks.findIndex(block => block.id === blockId);
    
    if (e.key === 'Enter') {
      e.preventDefault();
      addNewBlock(blockId);
    } else if (e.key === '/' && currentBlock?.content === '') {
      // Raccourci pour ouvrir le menu d'insertion
      e.preventDefault();
      console.log('Ouverture du menu d\'insertion pour le bloc:', blockId);
      // TODO: Ouvrir un menu contextuel d'insertion
    } else if (e.key === 'Backspace') {
      // Si le bloc est vide ou si on est au début du contenu
      const target = e.target as HTMLTextAreaElement | HTMLInputElement;
      const cursorPosition = target.selectionStart;
      
      if (cursorPosition === 0 && currentBlock?.content === '') {
        // Supprimer le bloc vide et revenir au précédent
        if (blocks.length > 1 && currentIndex > 0) {
          e.preventDefault();
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
      } else if (cursorPosition === 0 && currentBlock?.content && currentIndex > 0) {
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
  const handleDragEnd = (result: any) => {
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

  const renderBlock = (block: Block) => {
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
            data={block.data || getDefaultDataForType('table')}
            onUpdate={handleBlockUpdate}
            onDelete={deleteBlock}
          />
        );
      case 'image':
        return (
          <ImageBlock
            key={block.id}
            id={block.id}
            data={block.data || getDefaultDataForType('image')}
            onUpdate={handleBlockUpdate}
            onDelete={deleteBlock}
          />
        );
      case 'calendar':
        return (
          <CalendarBlock
            key={block.id}
            id={block.id}
            data={block.data || getDefaultDataForType('calendar')}
            onUpdate={handleBlockUpdate}
            onDelete={deleteBlock}
          />
        );
      case 'todoList':
        return (
          <TodoBlock
            key={block.id}
            id={block.id}
            data={block.data || getDefaultDataForType('todoList')}
            onUpdate={handleBlockUpdate}
            onDelete={deleteBlock}
          />
        );
      case 'divider':
        return <div className="w-full h-px bg-border my-4" />;
      case 'heading1':
        return (
          <input
            {...commonProps}
            type="text"
            className="w-full bg-transparent border-none outline-none text-3xl font-bold placeholder:text-muted-foreground"
            defaultValue={block.content}
            onChange={(e) => handleBlockChange(block.id, e.target.value)}
            placeholder="Titre 1"
          />
        );
      case 'heading2':
        return (
          <input
            {...commonProps}
            type="text"
            className="w-full bg-transparent border-none outline-none text-2xl font-semibold placeholder:text-muted-foreground"
            defaultValue={block.content}
            onChange={(e) => handleBlockChange(block.id, e.target.value)}
            placeholder="Titre 2"
          />
        );
      case 'heading3':
        return (
          <input
            {...commonProps}
            type="text"
            className="w-full bg-transparent border-none outline-none text-xl font-medium placeholder:text-muted-foreground"
            defaultValue={block.content}
            onChange={(e) => handleBlockChange(block.id, e.target.value)}
            placeholder="Titre 3"
          />
        );
      case 'quote':
        return (
          <div className="border-l-4 border-muted pl-4">
            <textarea
              {...commonProps}
              className="w-full bg-transparent border-none outline-none resize-none italic text-muted-foreground placeholder:text-muted-foreground"
              defaultValue={block.content}
              onChange={(e) => handleBlockChange(block.id, e.target.value)}
              placeholder="Citation..."
              rows={1}
            />
          </div>
        );
      case 'code':
        return (
          <div className="bg-muted rounded-md p-3 font-mono">
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
      default:
        return (
          <textarea
            {...commonProps}
            className="w-full bg-transparent border-none outline-none resize-none placeholder:text-muted-foreground"
            defaultValue={block.content}
            onChange={(e) => handleBlockChange(block.id, e.target.value)}
            placeholder=""
            rows={1}
          />
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