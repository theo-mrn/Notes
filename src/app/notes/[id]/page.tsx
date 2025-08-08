"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AdvancedNotionEditor } from "@/components/editor/AdvancedNotionEditor";
import { InsertSidebar } from "@/components/editor/InsertSidebar";
import { EditorToolbar } from "@/components/editor/EditorToolbarSimple";
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
  const [getActiveEditorFn, setGetActiveEditorFn] = useState<(() => HTMLTextAreaElement | null) | null>(null);
  const [lastSelection, setLastSelection] = useState<{
    blockId: string,
    start: number,
    end: number,
    text: string
  } | null>(null);
  const [lastActiveBlockId, setLastActiveBlockId] = useState<string | null>(null);
  const [formatBlockFn, setFormatBlockFn] = useState<((blockId: string, newContent: string) => void) | null>(null);
  const blockRefs = useRef<Map<string, TransparentRichTextEditorRef>>(new Map());

  // Fonction pour sauvegarder la sélection actuelle
  const saveCurrentSelection = useCallback(() => {
    const activeElement = document.activeElement as HTMLTextAreaElement | HTMLInputElement;
    if (activeElement && (activeElement.tagName === 'TEXTAREA' || activeElement.tagName === 'INPUT')) {
      const blockId = activeElement.getAttribute('data-block-id');
      if (blockId) {
        const selection = {
          blockId,
          start: activeElement.selectionStart || 0,
          end: activeElement.selectionEnd || 0,
          text: activeElement.value
        };
        setLastSelection(selection);
        setLastActiveBlockId(blockId);
        return selection;
      }
    }
    return null;
  }, []);

  // Fonction pour détecter les formats actifs dans le texte
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
        let formatName = format.type;
        if (format.type === 'code') {
          formatName = 'inlineCode';
        }
        if (!formats.includes(formatName)) {
          formats.push(formatName);
        }
      }
    }

    console.log('Active formats detected from structured data:', formats, { start, end, blockFormats });
    setActiveFormats(formats);
  }, [saveCurrentSelection]);

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
  }, [saveCurrentSelection, lastSelection, blockRefs]);

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

  const handleGetActiveEditorRequest = (getFn: () => HTMLTextAreaElement | null) => {
    setGetActiveEditorFn(() => getFn);
  };

  const handleFormatRequest = (formatFn: (blockId: string, newContent: string) => void) => {
    setFormatBlockFn(() => formatFn);
  };

  const handleBlockRefsRequest = (getBlockRefsFn: () => Map<string, TransparentRichTextEditorRef>) => {
    blockRefs.current = getBlockRefsFn();
  };

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
                onGetActiveEditor={handleGetActiveEditorRequest}
                onFormatRequest={handleFormatRequest}
                onBlockRefsRequest={handleBlockRefsRequest}
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