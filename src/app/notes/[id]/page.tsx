"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AdvancedNotionEditor } from "@/components/editor/AdvancedNotionEditor";
import { InsertSidebar } from "@/components/editor/InsertSidebar";
import { EditorToolbar } from "@/components/editor/EditorToolbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Star, Share, MoreHorizontal } from "lucide-react";
import type { Block } from "@/components/editor/AdvancedNotionEditor";
import type { TransparentRichTextEditorRef } from "@/components/editor/TransparentRichTextEditor";

interface Note {
  id: string;
  title: string;
  content: string;
  blocks?: Block[];
  isPinned: boolean;
  isArchived: boolean;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  category?: {
    id: string;
    name: string;
    color: string;
  };
}

export default function NoteEditPage() {
  const { data: session } = useSession();
  const params = useParams();
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [insertBlockFn, setInsertBlockFn] = useState<((type: string, data?: unknown) => void) | null>(null);
  const [activeFormats, setActiveFormats] = useState<string[]>([]);
  const [lastSelection, setLastSelection] = useState<{
    blockId: string,
    start: number,
    end: number,
    text: string
  } | null>(null);
  const [currentBlockId, setCurrentBlockId] = useState<string | null>(null);
  const [alignBlockFn, setAlignBlockFn] = useState<((blockId: string, alignment: 'left' | 'center' | 'right') => void) | null>(null);
  const [changeBlockTypeFn, setChangeBlockTypeFn] = useState<((blockId: string, newType: string) => void) | null>(null);
  const [currentBlocks, setCurrentBlocks] = useState<Block[] | null>(null);
  const blockRefs = useRef<Map<string, TransparentRichTextEditorRef>>(new Map());
  const lastFocusedElement = useRef<HTMLElement | null>(null);
  const lastCursorPosition = useRef<{ start: number; end: number }>({ start: 0, end: 0 });

  // Fonction pour restaurer le focus automatiquement
  const restoreEditorFocus = useCallback(() => {
    if (lastFocusedElement.current) {
      // Restaurer le focus avec la position du curseur
      lastFocusedElement.current.focus();
      if (lastFocusedElement.current instanceof HTMLTextAreaElement || lastFocusedElement.current instanceof HTMLInputElement) {
        lastFocusedElement.current.setSelectionRange(
          lastCursorPosition.current.start, 
          lastCursorPosition.current.end
        );
      }
    } else {
      // Fallback : focuser sur le premier élément d'édition disponible
      const firstEditableElement = document.querySelector('[data-block-id]') as HTMLElement;
      if (firstEditableElement) {
        firstEditableElement.focus();
        lastFocusedElement.current = firstEditableElement;
      }
    }
  }, []);

  // Fonction pour sauvegarder la sélection actuelle
  const saveCurrentSelection = useCallback(() => {
    const activeElement = document.activeElement as HTMLTextAreaElement | HTMLInputElement;
    if (activeElement && (activeElement.tagName === 'TEXTAREA' || activeElement.tagName === 'INPUT')) {
      const blockId = activeElement.getAttribute('data-block-id');
      if (blockId) {
        // Sauvegarder l'élément et la position du curseur pour le système de focus
        lastFocusedElement.current = activeElement;
        lastCursorPosition.current = {
          start: activeElement.selectionStart || 0,
          end: activeElement.selectionEnd || 0
        };
        
        const selection = {
          blockId,
          start: activeElement.selectionStart || 0,
          end: activeElement.selectionEnd || 0,
          text: activeElement.value
        };
        setLastSelection(selection);
        setCurrentBlockId(blockId);
        return selection;
      }
    }
    return null;
  }, []);

  // Fonction pour détecter les formats actifs dans le texte et l'alignement du bloc
  const updateActiveFormats = useCallback(() => {
    const activeElement = document.activeElement as HTMLTextAreaElement | HTMLInputElement;
    if (!activeElement || (activeElement.tagName !== 'TEXTAREA' && activeElement.tagName !== 'INPUT')) {
      setActiveFormats([]);
      return;
    }

    // Sauvegarder la sélection quand on détecte les formats
    saveCurrentSelection();

    const start = activeElement.selectionStart || 0;
    const end = activeElement.selectionEnd || 0;
    const blockId = activeElement.getAttribute('data-block-id');
    
    if (!blockId) {
      setActiveFormats([]);
      return;
    }

    // Obtenir les formats du bloc correspondant via blockRefs
    const blockRef = blockRefs.current.get(blockId);
    if (!blockRef) {
      // Fallback: détection par markdown pour les éditeurs sans formats structurés
      const text = activeElement.value;
      const selectedText = text.substring(start, end);
      
      const formats: string[] = [];
      
      // Fonction helper pour vérifier les balises markdown
      const isInMarkdownFormat = (openTag: string, closeTag: string): boolean => {
        const beforeText = text.substring(0, start);
        const afterText = text.substring(end);
        
        const lastOpenIndex = beforeText.lastIndexOf(openTag);
        if (lastOpenIndex === -1) return false;
        
        const nextCloseIndex = afterText.indexOf(closeTag);
        if (nextCloseIndex === -1) return false;
        
        const textAfterLastOpen = beforeText.substring(lastOpenIndex + openTag.length);
        return textAfterLastOpen.indexOf(openTag) === -1;
      };
      
      // Détecter les formats markdown
      if (isInMarkdownFormat('**', '**') || 
          (selectedText.startsWith('**') && selectedText.endsWith('**') && selectedText.length > 4)) {
        formats.push('bold');
      }
      
      if (!formats.includes('bold') && (
          isInMarkdownFormat('*', '*') || 
          (selectedText.startsWith('*') && selectedText.endsWith('*') && 
           selectedText.length > 2 && !selectedText.startsWith('**')))) {
        formats.push('italic');
      }
      
      if (isInMarkdownFormat('<u>', '</u>') || 
          (selectedText.startsWith('<u>') && selectedText.endsWith('</u>'))) {
        formats.push('underline');
      }
      
      if (isInMarkdownFormat('`', '`') || 
          (selectedText.startsWith('`') && selectedText.endsWith('`') && selectedText.length > 2)) {
        formats.push('inlineCode');
      }
      
      setActiveFormats(formats);
      return;
    }

    // Utiliser les formats structurés du TransparentRichTextEditor
    const blockFormats = blockRef.getFormats();
    const formats: string[] = [];
    
    // Vérifier quels formats s'appliquent à la sélection actuelle
    for (const format of blockFormats) {
      // Si la sélection chevauche avec le format
      if ((start >= format.start && start < format.end) || 
          (end > format.start && end <= format.end) ||
          (start <= format.start && end >= format.end)) {
        // Mapper les types de format pour correspondre aux noms de la toolbar
        let formatName: string = format.type;
        if (format.type === 'code') {
          formatName = 'inlineCode'; // Map to toolbar format name
        }
        if (!formats.includes(formatName)) {
          formats.push(formatName);
        }
      }
    }

    console.log('Active formats detected from structured data:', formats, { start, end, blockFormats });
    
    // Détecter l'alignement et le type du bloc actuel
    const blocksToUse = currentBlocks || note?.blocks;
    if (blockId && blocksToUse) {
      const currentBlock = blocksToUse.find(block => block.id === blockId);
      if (currentBlock?.alignment) {
        formats.push(`align-${currentBlock.alignment}`);
      } else {
        // Alignement par défaut
        formats.push('align-left');
      }
      
      // Ajouter le type de bloc s'il s'agit d'une liste
      if (currentBlock?.type === 'bulletList' || currentBlock?.type === 'numberedList') {
        formats.push(currentBlock.type);
      }
    }
    
    setActiveFormats(formats);
  }, [saveCurrentSelection, note?.blocks, currentBlocks]);

  const fetchNote = useCallback(async () => {
    try {
      const response = await fetch(`/api/notes/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setNote(data.note);
        setTitle(data.note.title);
        setContent(data.note.content);
      }
    } catch (error) {
      console.error("Erreur lors du chargement de la note:", error);
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    if (params.id && params.id !== "new") {
      fetchNote();
    } else {
      // Nouvelle note
      setNote({
        id: "new",
        title: "",
        content: "",
        isPinned: false,
        isArchived: false,
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date()
      });
      setLoading(false);
    }
  }, [params.id, fetchNote]);

  const handleSave = async (blocks?: Block[]) => {
    // Sauvegarde intelligente : ne sauvegarde que s'il y a du contenu
    const hasTitle = title.trim().length > 0;
    const hasContent = content.trim().length > 0;
    const hasBlocks = blocks && blocks.length > 0;
    
    // Si c'est une nouvelle note et qu'il n'y a ni titre ni contenu, ne pas sauvegarder
    if (params.id === "new" && !hasTitle && !hasContent && !hasBlocks) {
      return; // Silencieusement ignorer
    }

    try {
      const method = params.id === "new" ? "POST" : "PUT";
      const url = params.id === "new" ? "/api/notes" : `/api/notes/${params.id}`;
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim() || "Sans titre",
          content: content || "",
          blocks: blocks || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
        console.error('Erreur de sauvegarde:', response.status, errorData);
        throw new Error(errorData.error || `Erreur ${response.status} lors de la sauvegarde`);
      }

      const data = await response.json();
      
      // Si c'est une nouvelle note, rediriger vers l'URL avec l'ID
      if (params.id === "new" && data.note?.id) {
        window.history.replaceState(null, '', `/notes/${data.note.id}`);
      }
      
      console.log("Note sauvegardée avec succès");
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
      throw error; // Re-throw pour que l'éditeur puisse gérer l'erreur
    }
  };

  const handleFormat = useCallback((format: string, value?: unknown) => {
    console.log('Format:', format, value);
    
    // Gérer l'alignement (format de bloc)
    if (format === 'align') {
      const alignment = value as 'left' | 'center' | 'right';
      if (alignBlockFn && currentBlockId) {
        alignBlockFn(currentBlockId, alignment);
        return;
      }
      console.warn('Pas de fonction d\'alignement ou de bloc actif');
      return;
    }
    
    // Gérer les changements de type de bloc (listes)
    if (format === 'bulletList' || format === 'numberedList') {
      if (changeBlockTypeFn && currentBlockId) {
        changeBlockTypeFn(currentBlockId, format);
        return;
      }
      console.warn('Pas de fonction de changement de type de bloc ou de bloc actif');
      return;
    }
    
    // Sauvegarder la sélection actuelle avant de perdre le focus
    const currentSelection = saveCurrentSelection();
    
    // Utiliser la sélection courante ou la dernière sauvegardée
    const selection = currentSelection || lastSelection;
    
    if (!selection || selection.start === selection.end) {
      console.warn('Aucune sélection de texte disponible');
      return;
    }

    const { blockId, start, end } = selection;
    console.log('Applying format to selection:', { format, blockId, start, end });

    // Trouver la référence du bloc
    const blockRef = blockRefs.current?.get(blockId);
    
    if (blockRef && typeof blockRef === 'object' && 'applyFormat' in blockRef) {
      const formatType = format === 'inlineCode' ? 'code' : format as 'bold' | 'italic' | 'underline' | 'code';
      console.log('Using block ref applyFormat:', formatType);
      
      // Appliquer le format
      blockRef.applyFormat(formatType, start, end);
      
      // Restaurer la sélection et sortir du mode édition pour voir le formatage
      setTimeout(() => {
        if (blockRef.restoreSelection) {
          blockRef.restoreSelection(start, end);
          setTimeout(() => {
            const textarea = blockRef.getTextarea();
            if (textarea) {
              textarea.blur();
              console.log('Exited edit mode to show formatting');
            }
          }, 50);
        }
      }, 10);
    } else {
      console.warn('Block ref not found or applyFormat method not available');
    }
  }, [saveCurrentSelection, lastSelection, blockRefs, alignBlockFn, currentBlockId, changeBlockTypeFn]);

  const handleTogglePinned = () => {
    if (note) {
      setNote({ ...note, isPinned: !note.isPinned });
      // TODO: Sauvegarder l'état épinglé
    }
  };

  const handleInsertBlock = (type: string, data?: unknown) => {
    console.log('Tentative d\'insertion de bloc:', type, data);
    if (insertBlockFn) {
      insertBlockFn(type, data);
    } else {
      console.warn('Fonction d\'insertion de bloc non disponible');
    }
  };

  const handleInsertBlockRequest = (insertFn: (type: string, data?: unknown) => void) => {
    setInsertBlockFn(() => insertFn);
  };


  const handleBlockRefsRequest = (getBlockRefsFn: () => Map<string, TransparentRichTextEditorRef>) => {
    blockRefs.current = getBlockRefsFn();
  };

  const handleBlockAlignmentRequest = (alignFn: (blockId: string, alignment: 'left' | 'center' | 'right') => void) => {
    setAlignBlockFn(() => alignFn);
  };

  const handleBlockTypeChangeRequest = (changeTypeFn: (blockId: string, newType: string) => void) => {
    setChangeBlockTypeFn(() => changeTypeFn);
  };

  const handleCurrentBlocksUpdate = (blocks: Block[]) => {
    setCurrentBlocks(blocks);
  };

  // Système de maintien du focus sur l'éditeur
  useEffect(() => {
    let focusTimer: NodeJS.Timeout;
    
    const handleFocusOut = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      const relatedTarget = e.relatedTarget as HTMLElement;
      
      // Si le focus va vers un élément d'édition, ne rien faire
      if (relatedTarget && relatedTarget.hasAttribute('data-block-id')) {
        return;
      }
      
      // Si le focus va vers certains éléments spécifiques (comme les boutons de toolbar), programmer la restauration
      if (relatedTarget && (
        relatedTarget.closest('.editor-toolbar') ||
        relatedTarget.closest('button') ||
        relatedTarget.closest('nav') ||
        relatedTarget.closest('header')
      )) {
        // Délai court pour permettre l'action (comme le clic sur un bouton)
        focusTimer = setTimeout(() => {
          restoreEditorFocus();
        }, 100);
      }
    };

    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      
      // Si le focus revient sur un élément d'édition, annuler la restauration programmée
      if (target && target.hasAttribute('data-block-id')) {
        if (focusTimer) {
          clearTimeout(focusTimer);
        }
      }
    };

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      
      // Si on clique sur la navbar, un bouton, etc., restaurer le focus après l'action
      if (target && (
        target.closest('nav') ||
        target.closest('header') ||
        target.closest('.editor-toolbar') ||
        (target.tagName === 'BUTTON' && !target.closest('[data-block-id]'))
      )) {
        setTimeout(() => {
          // Vérifier si on n'est pas déjà dans un élément d'édition
          const currentActive = document.activeElement as HTMLElement;
          if (!currentActive || !currentActive.hasAttribute('data-block-id')) {
            restoreEditorFocus();
          }
        }, 50);
      }
    };

    document.addEventListener('focusout', handleFocusOut);
    document.addEventListener('focusin', handleFocusIn);
    document.addEventListener('click', handleClick);

    return () => {
      if (focusTimer) clearTimeout(focusTimer);
      document.removeEventListener('focusout', handleFocusOut);
      document.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('click', handleClick);
    };
  }, [restoreEditorFocus]);

  // Gestionnaire de raccourcis clavier global
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'b':
            e.preventDefault();
            handleFormat('bold');
            break;
          case 'i':
            e.preventDefault();
            handleFormat('italic');
            break;
          case 'u':
            e.preventDefault();
            handleFormat('underline');
            break;
          case 'e':
            e.preventDefault();
            handleFormat('inlineCode');
            break;
        }
      }
    };

    const handleSelectionChange = () => {
      // Petit délai pour s'assurer que la sélection est bien mise à jour
      setTimeout(() => {
        saveCurrentSelection();
        updateActiveFormats();
      }, 10);
    };

    const handleMouseUp = () => {
      setTimeout(() => {
        saveCurrentSelection();
        updateActiveFormats();
      }, 10);
    };

    const handleFocus = () => {
      setTimeout(() => {
        saveCurrentSelection();
        updateActiveFormats();
      }, 10);
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('selectionchange', handleSelectionChange);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('focusin', handleFocus);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('selectionchange', handleSelectionChange);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('focusin', handleFocus);
    };
  }, [updateActiveFormats, handleFormat, saveCurrentSelection]);

  // Appel initial pour détecter les formats au montage
  useEffect(() => {
    // Délai court pour que l'éditeur soit monté
    const timer = setTimeout(() => {
      updateActiveFormats();
    }, 100);
    
    return () => clearTimeout(timer);
  }, [updateActiveFormats]);

  // Initialiser le focus sur l'éditeur au chargement
  useEffect(() => {
    if (!loading && note) {
      setTimeout(() => {
        restoreEditorFocus();
      }, 200);
    }
  }, [loading, note, restoreEditorFocus]);

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Veuillez vous connecter pour accéder à cette note.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header minimal */}
      <div className="flex items-center justify-between px-6 py-3 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          
          {note?.category && (
            <Badge 
              variant="secondary"
              className="flex items-center gap-2"
            >
              <div 
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: note.category.color }}
              />
              {note.category.name}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleTogglePinned}>
            <Star className={`h-4 w-4 ${note?.isPinned ? 'fill-current' : ''}`} />
          </Button>
          <Button variant="ghost" size="sm">
            <Share className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Zone d'édition principale */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Nouvelle Toolbar enrichie */}
          <EditorToolbar
            onFormat={handleFormat}
            activeFormats={activeFormats}
            currentBlockType="paragraph"
            onInsertBlock={insertBlockFn ? (type) => insertBlockFn(type) : undefined}
          />

          {/* Éditeur */}
          <div className="flex-1 overflow-auto">
            <div className="max-w-4xl mx-auto px-8 py-8">
              {/* Titre */}
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={() => {
                  if (title.trim().length > 0) {
                    handleSave().catch(console.error);
                  }
                }}
                placeholder="Titre de votre note..."
                className="w-full text-4xl font-bold bg-transparent border-none outline-none resize-none placeholder:text-muted-foreground mb-6 focus:outline-none"
              />

              {/* Métadonnées discrètes */}
              {note && params.id !== "new" && note.updatedAt && (
                <div className="flex items-center gap-4 text-xs text-muted-foreground mb-8">
                  <span>
                    Modifié le {new Date(note.updatedAt).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                  </span>
                </div>
              )}



              {/* Éditeur */}
              <AdvancedNotionEditor
                content={content}
                blocks={note?.blocks || undefined}
                onChange={setContent}
                onSave={handleSave}
                placeholder=""
                onInsertBlockRequest={handleInsertBlockRequest}
                onBlockRefsRequest={handleBlockRefsRequest}
                onBlockAlignmentRequest={handleBlockAlignmentRequest}
                onBlockTypeChangeRequest={handleBlockTypeChangeRequest}
                onCurrentBlocksUpdate={handleCurrentBlocksUpdate}
                onSelectionChange={updateActiveFormats}
              />
            </div>
          </div>
        </div>

        {/* Sidebar droite simplifiée */}
        <InsertSidebar
          onInsertBlock={handleInsertBlock}
          allowedBlocks={["table", "calendar"]}
        />
      </div>
    </div>
  );
}