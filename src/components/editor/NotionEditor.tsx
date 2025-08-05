"use client";

import { useState, useRef, useEffect } from 'react';
import { 
  Bold, 
  Italic, 
  Underline, 
  Code, 
  Link,
  List,
  ListOrdered,
  Quote,
  Heading1,
  Heading2,
  Heading3,
  Image,
  Table,
  Divider,
  CheckSquare,
  Calendar,
  Hash
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from "sonner";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';

interface NotionEditorProps {
  content: string;
  onChange: (content: string) => void;
  onSave: () => void;
  placeholder?: string;
  autoSave?: boolean;
  saveInterval?: number;
}

interface Block {
  id: string;
  type: 'paragraph' | 'heading1' | 'heading2' | 'heading3' | 'bulletList' | 'numberedList' | 'quote' | 'code' | 'divider' | 'checklist';
  content: string;
  metadata?: any;
}

const blockTypes = [
  {
    id: 'paragraph',
    label: 'Paragraphe',
    icon: <Hash className="h-4 w-4" />,
    description: 'Texte simple'
  },
  {
    id: 'heading1',
    label: 'Titre 1',
    icon: <Heading1 className="h-4 w-4" />,
    description: 'Grand titre de section'
  },
  {
    id: 'heading2',
    label: 'Titre 2',
    icon: <Heading2 className="h-4 w-4" />,
    description: 'Titre de sous-section'
  },
  {
    id: 'heading3',
    label: 'Titre 3',
    icon: <Heading3 className="h-4 w-4" />,
    description: 'Petit titre'
  },
  {
    id: 'bulletList',
    label: 'Liste à puces',
    icon: <List className="h-4 w-4" />,
    description: 'Liste simple avec des puces'
  },
  {
    id: 'numberedList',
    label: 'Liste numérotée',
    icon: <ListOrdered className="h-4 w-4" />,
    description: 'Liste avec des numéros'
  },
  {
    id: 'checklist',
    label: 'Liste de tâches',
    icon: <CheckSquare className="h-4 w-4" />,
    description: 'Liste avec cases à cocher'
  },
  {
    id: 'quote',
    label: 'Citation',
    icon: <Quote className="h-4 w-4" />,
    description: 'Texte de citation'
  },
  {
    id: 'code',
    label: 'Code',
    icon: <Code className="h-4 w-4" />,
    description: 'Bloc de code'
  },
  {
    id: 'divider',
    label: 'Séparateur',
    icon: <Divider className="h-4 w-4" />,
    description: 'Ligne de séparation'
  }
];

export function NotionEditor({ 
  content, 
  onChange, 
  onSave, 
  placeholder, 
  autoSave = true, 
  saveInterval = 5000 // Augmenté à 5 secondes pour éviter les sauvegardes trop fréquentes
}: NotionEditorProps) {
  const [blocks, setBlocks] = useState<Block[]>([
    { id: '1', type: 'paragraph', content: content || '' }
  ]);
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
  const [showCommandMenu, setShowCommandMenu] = useState(false);
  const [commandMenuPosition, setCommandMenuPosition] = useState({ x: 0, y: 0 });
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastContent, setLastContent] = useState(content || ''); // Pour détecter les vrais changements
  const editorRef = useRef<HTMLDivElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Convertir le contenu en blocks au premier chargement
    if (content && blocks.length === 1 && !blocks[0].content) {
      setBlocks([{ id: '1', type: 'paragraph', content }]);
    }
  }, [content]);

  // Auto-save effect avec optimisation pour éviter les sauvegardes trop fréquentes
  useEffect(() => {
    if (autoSave && hasUnsavedChanges && !isSaving) {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      
      // Vérifier si il y a assez de contenu pour justifier une sauvegarde
      const currentContent = blocks.map(block => block.content).join('\n').trim();
      const hasMinimumContent = currentContent.length > 3; // Au moins 3 caractères
      
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

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const handleSave = async () => {
    if (isSaving) return;
    
    // Vérifier s'il y a vraiment eu des changements
    const currentContent = blocks.map(block => block.content).join('\n');
    if (currentContent === lastContent) {
      return; // Pas de changements, pas de sauvegarde
    }
    
    setIsSaving(true);
    try {
      await onSave();
      setLastSaved(new Date());
      setHasUnsavedChanges(false);
      setLastContent(currentContent);
      
      // Toast uniquement pour sauvegarde manuelle
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

  const handleBlockChange = (blockId: string, newContent: string) => {
    setBlocks(prevBlocks =>
      prevBlocks.map(block =>
        block.id === blockId ? { ...block, content: newContent } : block
      )
    );
    
    // Mettre à jour le contenu global
    const updatedContent = blocks
      .map(block => block.id === blockId ? newContent : block.content)
      .join('\n');
    onChange(updatedContent);
    
    // Marquer comme modifié seulement si le contenu a vraiment changé
    if (updatedContent !== lastContent) {
      setHasUnsavedChanges(true);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, blockId: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addNewBlock(blockId);
    } else if (e.key === '/' && e.currentTarget.textContent === '/') {
      e.preventDefault();
      setActiveBlockId(blockId);
      setShowCommandMenu(true);
      
      // Positionner le menu de commandes
      const rect = e.currentTarget.getBoundingClientRect();
      setCommandMenuPosition({
        x: rect.left,
        y: rect.bottom + 8
      });
    } else if (e.ctrlKey || e.metaKey) {
      if (e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    }
  };

  const addNewBlock = (afterBlockId: string) => {
    const newBlock: Block = {
      id: Date.now().toString(),
      type: 'paragraph',
      content: ''
    };

    setBlocks(prevBlocks => {
      const index = prevBlocks.findIndex(block => block.id === afterBlockId);
      const newBlocks = [...prevBlocks];
      newBlocks.splice(index + 1, 0, newBlock);
      return newBlocks;
    });

    // Focus sur le nouveau block
    setTimeout(() => {
      const newBlockElement = document.querySelector(`[data-block-id="${newBlock.id}"]`) as HTMLElement;
      if (newBlockElement) {
        newBlockElement.focus();
      }
    }, 0);
  };

  const changeBlockType = (blockId: string, newType: Block['type']) => {
    setBlocks(prevBlocks =>
      prevBlocks.map(block =>
        block.id === blockId ? { ...block, type: newType } : block
      )
    );
    setShowCommandMenu(false);
  };

  const renderBlock = (block: Block) => {
    const commonProps = {
      'data-block-id': block.id,
      className: "w-full bg-transparent border-none outline-none resize-none min-h-[1.5rem] focus:outline-none",
      value: block.content,
      onChange: (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) =>
        handleBlockChange(block.id, e.target.value),
      onKeyDown: (e: React.KeyboardEvent) => handleKeyDown(e, block.id),
      placeholder: block.content === '' ? (block.type === 'paragraph' ? placeholder : '') : '',
      autoFocus: false
    };

    switch (block.type) {
      case 'heading1':
        return (
          <input
            key={block.id}
            {...commonProps}
            className={`${commonProps.className} text-3xl font-bold`}
            placeholder="Titre 1"
          />
        );
      case 'heading2':
        return (
          <input
            key={block.id}
            {...commonProps}
            className={`${commonProps.className} text-2xl font-semibold`}
            placeholder="Titre 2"
          />
        );
      case 'heading3':
        return (
          <input
            key={block.id}
            {...commonProps}
            className={`${commonProps.className} text-xl font-medium`}
            placeholder="Titre 3"
          />
        );
      case 'quote':
        return (
          <div key={block.id} className="border-l-4 border-muted pl-4">
            <textarea
              {...commonProps}
              className={`${commonProps.className} italic text-muted-foreground`}
              placeholder="Citation..."
              rows={1}
            />
          </div>
        );
      case 'code':
        return (
          <div key={block.id} className="bg-muted rounded-md p-3 font-mono">
            <textarea
              {...commonProps}
              className={`${commonProps.className} font-mono text-sm bg-transparent`}
              placeholder="Code..."
              rows={3}
            />
          </div>
        );
      case 'bulletList':
        return (
          <div key={block.id} className="flex items-start gap-3">
            <span className="w-2 h-2 bg-foreground rounded-full mt-2 flex-shrink-0"></span>
            <textarea
              {...commonProps}
              placeholder="Élément de liste..."
              rows={1}
            />
          </div>
        );
      case 'numberedList':
        return (
          <div key={block.id} className="flex items-start gap-3">
            <span className="text-muted-foreground mt-0.5 flex-shrink-0">1.</span>
            <textarea
              {...commonProps}
              placeholder="Élément numéroté..."
              rows={1}
            />
          </div>
        );
      case 'checklist':
        return (
          <div key={block.id} className="flex items-start gap-3">
            <input 
              type="checkbox" 
              className="mt-1 flex-shrink-0" 
              onChange={() => {}} 
            />
            <textarea
              {...commonProps}
              placeholder="Tâche à faire..."
              rows={1}
            />
          </div>
        );
      case 'divider':
        return (
          <div key={block.id} className="w-full h-px bg-border my-4" />
        );
      default:
        return (
          <textarea
            key={block.id}
            {...commonProps}
            placeholder={placeholder || "Tapez '/' pour voir les commandes..."}
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

      <div className="space-y-2">
        {blocks.map(renderBlock)}
      </div>

      {/* Menu de commandes */}
      {showCommandMenu && (
        <div 
          className="fixed z-50 w-80 bg-popover border rounded-md shadow-lg"
          style={{ 
            left: commandMenuPosition.x, 
            top: commandMenuPosition.y 
          }}
        >
          <div className="p-2">
            <div className="text-xs font-medium text-muted-foreground mb-2 px-2">
              BLOCKS BASIQUES
            </div>
            <div className="space-y-1">
              {blockTypes.map((blockType) => (
                <button
                  key={blockType.id}
                  onClick={() => activeBlockId && changeBlockType(activeBlockId, blockType.id as Block['type'])}
                  className="w-full flex items-start gap-3 p-2 text-left hover:bg-accent rounded-sm transition-colors"
                >
                  <div className="mt-0.5">
                    {blockType.icon}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-sm">{blockType.label}</div>
                    <div className="text-xs text-muted-foreground">
                      {blockType.description}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Cliquer à l'extérieur pour fermer le menu */}
      {showCommandMenu && (
        <div 
          className="fixed inset-0 z-40"
          onClick={() => setShowCommandMenu(false)}
        />
      )}
    </div>
  );
}