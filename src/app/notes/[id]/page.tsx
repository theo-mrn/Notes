"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AdvancedNotionEditor } from "@/components/editor/AdvancedNotionEditor";
import { InsertSidebar } from "@/components/editor/InsertSidebar";
import { EditorToolbar } from "@/components/editor/EditorToolbarSimple";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Star, 
  Archive, 
  Trash2, 
  Share, 
  MoreHorizontal,
  Calendar,
  User
} from "lucide-react";
import { toast } from "sonner";

interface Note {
  id: string;
  title: string;
  content: string;
  blocks?: any[];
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
  const [activeFormats, setActiveFormats] = useState<string[]>([]);
  const [currentBlockType, setCurrentBlockType] = useState('paragraph');
  const [insertBlockFn, setInsertBlockFn] = useState<((type: string, data?: any) => void) | null>(null);

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
  }, [params.id]);

  const fetchNote = async () => {
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
  };

  const handleSave = async (blocks?: any[]) => {
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
          content,
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

  const handleFormat = (format: string, value?: any) => {
    console.log('Format:', format, value);
    // TODO: Implémenter le formatage
  };

  const handleTagAdd = (tag: string) => {
    if (note) {
      const newTags = [...(note.tags || []), tag];
      setNote({ ...note, tags: newTags });
      // TODO: Sauvegarder les tags
    }
  };

  const handleTagRemove = (tag: string) => {
    if (note) {
      const newTags = note.tags?.filter(t => t !== tag) || [];
      setNote({ ...note, tags: newTags });
      // TODO: Sauvegarder les tags
    }
  };

  const handleCategoryChange = (categoryId: string) => {
    console.log('Category change:', categoryId);
    // TODO: Implémenter le changement de catégorie
  };

  const handleTogglePublic = () => {
    if (note) {
      setNote({ ...note, isPublic: !note.isPublic });
      // TODO: Sauvegarder l'état public
    }
  };

  const handleTogglePinned = () => {
    if (note) {
      setNote({ ...note, isPinned: !note.isPinned });
      // TODO: Sauvegarder l'état épinglé
    }
  };

  const handleInsertBlock = (type: string, data?: any) => {
    console.log('Tentative d\'insertion de bloc:', type, data);
    if (insertBlockFn) {
      insertBlockFn(type, data);
    } else {
      console.warn('Fonction d\'insertion de bloc non disponible');
    }
  };

  const handleInsertBlockRequest = (insertFn: (type: string, data?: any) => void) => {
    setInsertBlockFn(() => insertFn);
  };

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
          {/* Barre d'outils */}
          <EditorToolbar
            onFormat={handleFormat}
            activeFormats={activeFormats}
            currentBlockType={currentBlockType}
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
              />
            </div>
          </div>
        </div>

        {/* Sidebar droite */}
        <InsertSidebar
          onInsertBlock={handleInsertBlock}
        />
      </div>
    </div>
  );
}