"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { Plus, Search, Filter, Grid, List, Network, MoreHorizontal, Edit, Trash2, Pin, PinOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { NewNoteButton } from "@/components/notes/NewNoteButton";
import { NotesGraph } from "@/components/notes/NotesGraph";
import { toast } from "sonner";
import Link from "next/link";

interface Note {
  id: string;
  title: string;
  content: string;
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

export default function NotesPage() {
  const { data: session } = useSession();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list" | "graph">("grid");
  
  // États pour les dialogues
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [deletingNote, setDeletingNote] = useState<Note | null>(null);

  useEffect(() => {
    if (session?.user) {
      fetchNotes();
    }
  }, [session]);

  const fetchNotes = async () => {
    try {
      const response = await fetch("/api/notes");
      if (response.ok) {
        const data = await response.json();
        setNotes(data.notes);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des notes:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredNotes = notes.filter(note =>
    note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    note.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    note.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const pinnedNotes = filteredNotes.filter(note => note.isPinned);
  const regularNotes = filteredNotes.filter(note => !note.isPinned);

  const handleCreateNote = (type: string) => {
    console.log('Créer une nouvelle note de type:', type);
    // TODO: Implémenter la création de note
  };

  const handleRenameNote = async () => {
    if (!editingNote || !newTitle.trim()) return;

    try {
      const response = await fetch(`/api/notes/${editingNote.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: newTitle.trim(),
        }),
      });

      if (response.ok) {
        setNotes(notes.map(note => 
          note.id === editingNote.id 
            ? { ...note, title: newTitle.trim() }
            : note
        ));
        toast.success("Note renommée avec succès");
        setEditingNote(null);
        setNewTitle("");
      } else {
        toast.error("Erreur lors du renommage");
      }
    } catch (error) {
      console.error('Erreur lors du renommage:', error);
      toast.error("Erreur lors du renommage");
    }
  };

  const handleDeleteNote = async () => {
    if (!deletingNote) return;

    try {
      const response = await fetch(`/api/notes/${deletingNote.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setNotes(notes.filter(note => note.id !== deletingNote.id));
        toast.success("Note supprimée avec succès");
        setDeletingNote(null);
      } else {
        toast.error("Erreur lors de la suppression");
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      toast.error("Erreur lors de la suppression");
    }
  };

  const handleTogglePin = async (note: Note) => {
    try {
      const response = await fetch(`/api/notes/${note.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isPinned: !note.isPinned,
        }),
      });

      if (response.ok) {
        setNotes(notes.map(n => 
          n.id === note.id 
            ? { ...n, isPinned: !n.isPinned }
            : n
        ));
        toast.success(note.isPinned ? "Note désépinglée" : "Note épinglée");
      } else {
        toast.error("Erreur lors de la modification");
      }
    } catch (error) {
      console.error('Erreur lors du toggle pin:', error);
      toast.error("Erreur lors de la modification");
    }
  };

  const openRenameDialog = (note: Note) => {
    setEditingNote(note);
    setNewTitle(note.title);
  };

  const openDeleteDialog = (note: Note) => {
    setDeletingNote(note);
  };

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Veuillez vous connecter pour accéder à vos notes.</p>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold">Mes Notes</h1>
            <p className="text-muted-foreground">
              {filteredNotes.length} note{filteredNotes.length !== 1 ? 's' : ''}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filtrer
            </Button>
            
            {/* Toggle views */}
            <div className="flex border rounded-md overflow-hidden">
              <Button 
                variant={viewMode === "grid" ? "default" : "ghost"} 
                size="sm"
                onClick={() => setViewMode("grid")}
                className="rounded-none border-0"
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button 
                variant={viewMode === "list" ? "default" : "ghost"} 
                size="sm"
                onClick={() => setViewMode("list")}
                className="rounded-none border-0 border-l"
              >
                <List className="h-4 w-4" />
              </Button>
              <Button 
                variant={viewMode === "graph" ? "default" : "ghost"} 
                size="sm"
                onClick={() => setViewMode("graph")}
                className="rounded-none border-0 border-l"
              >
                <Network className="h-4 w-4" />
              </Button>
            </div>
            
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle note
            </Button>
          </div>
        </div>

        {/* Search - masqué en mode graph*/}
        {viewMode !== "graph" && (
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher dans vos notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">Chargement...</p>
          </div>
        ) : viewMode === "graph" ? (
          <NotesGraph onCreateNote={handleCreateNote} />
        ) : (
          <div className="space-y-6">
            {/* Pinned Notes */}
            {pinnedNotes.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  📌 Notes épinglées
                </h2>
                <div className={viewMode === "grid" 
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" 
                  : "space-y-4"
                }>
                  {pinnedNotes.map((note) => (
                    <NoteCard 
                      key={note.id} 
                      note={note} 
                      viewMode={viewMode}
                      onRename={openRenameDialog}
                      onDelete={openDeleteDialog}
                      onTogglePin={handleTogglePin}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Regular Notes */}
            {regularNotes.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-4">
                  {pinnedNotes.length > 0 ? "Autres notes" : "Toutes les notes"}
                </h2>
                <div className={viewMode === "grid" 
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" 
                  : "space-y-4"
                }>
                  {regularNotes.map((note) => (
                    <NoteCard 
                      key={note.id} 
                      note={note} 
                      viewMode={viewMode}
                      onRename={openRenameDialog}
                      onDelete={openDeleteDialog}
                      onTogglePin={handleTogglePin}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {filteredNotes.length === 0 && (
              <div className="text-center py-12">
                <h3 className="text-xl font-semibold mb-2">
                  {searchTerm ? "Aucune note trouvée" : "Aucune note"}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm 
                    ? "Essayez de modifier vos termes de recherche"
                    : "Utilisez le bouton + pour créer votre première note"
                  }
                </p>
              </div>
            )}
          </div>
        )}
      </div>
      
      <NewNoteButton onCreateNote={handleCreateNote} />

      {/* Dialogue de renommage */}
      <Dialog open={!!editingNote} onOpenChange={(open) => !open && setEditingNote(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Renommer la note</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Nouveau titre"
              onKeyDown={(e) => e.key === 'Enter' && handleRenameNote()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingNote(null)}>
              Annuler
            </Button>
            <Button onClick={handleRenameNote} disabled={!newTitle.trim()}>
              Renommer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialogue de suppression */}
      <AlertDialog open={!!deletingNote} onOpenChange={(open) => !open && setDeletingNote(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer la note</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer la note "{deletingNote?.title}" ? 
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteNote} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}

interface NoteCardProps {
  note: Note;
  viewMode: "grid" | "list";
  onRename: (note: Note) => void;
  onDelete: (note: Note) => void;
  onTogglePin: (note: Note) => void;
}

function NoteCard({ note, viewMode, onRename, onDelete, onTogglePin }: NoteCardProps) {
  const handleMenuClick = (e: React.MouseEvent, action: () => void) => {
    e.preventDefault();
    e.stopPropagation();
    action();
  };

  return (
    <Card className={`hover:shadow-md transition-shadow cursor-pointer group ${
      viewMode === "list" ? "flex" : ""
    }`}>
      <Link href={`/notes/${note.id}`} className="flex-1">
        <CardHeader className={viewMode === "list" ? "flex-1" : ""}>
          <div className="flex items-start justify-between">
            <CardTitle className="text-lg line-clamp-2 flex-1 pr-2">{note.title}</CardTitle>
            <div className="flex items-center gap-2">
              {note.category && (
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: note.category.color }}
                />
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0"
                    onClick={(e) => e.preventDefault()}
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={(e) => handleMenuClick(e, () => onRename(note))}>
                    <Edit className="h-4 w-4 mr-2" />
                    Renommer
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={(e) => handleMenuClick(e, () => onTogglePin(note))}>
                    {note.isPinned ? (
                      <>
                        <PinOff className="h-4 w-4 mr-2" />
                        Désépingler
                      </>
                    ) : (
                      <>
                        <Pin className="h-4 w-4 mr-2" />
                        Épingler
                      </>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={(e) => handleMenuClick(e, () => onDelete(note))}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Supprimer
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        <CardContent className={viewMode === "list" ? "flex-1" : ""}>
          <p className="text-muted-foreground line-clamp-3 mb-4">
            {note.content}
          </p>
          
          {/* Tags */}
          {note.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {note.tags.slice(0, 3).map((tag, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-muted text-xs rounded-full"
                >
                  {tag}
                </span>
              ))}
              {note.tags.length > 3 && (
                <span className="px-2 py-1 bg-muted text-xs rounded-full">
                  +{note.tags.length - 3}
                </span>
              )}
            </div>
          )}
          
          {/* Date */}
          <p className="text-xs text-muted-foreground">
            {new Date(note.updatedAt).toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "short",
              year: "numeric"
            })}
          </p>
        </CardContent>
      </Link>
    </Card>
  );
} 