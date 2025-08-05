"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Hash,
  Folder,
  Star,
  Clock,
  User,
  Calendar,
  Eye,
  EyeOff,
  Share,
  Link2,
  Bookmark,
  FileText,
  ChevronRight,
  ChevronDown,
  Plus,
  X,
  Search,
  Filter,
  MoreHorizontal,
  Tag,
  Palette,
  Archive,
  Trash2,
  Copy,
  History
} from 'lucide-react'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

interface NoteSidebarProps {
  noteId?: string
  title: string
  tags: string[]
  category?: {
    id: string
    name: string
    color: string
  }
  isPublic: boolean
  isPinned: boolean
  createdAt: Date
  updatedAt: Date
  onTagAdd: (tag: string) => void
  onTagRemove: (tag: string) => void
  onCategoryChange: (categoryId: string) => void
  onTogglePublic: () => void
  onTogglePinned: () => void
}

export function NoteSidebar({
  noteId,
  title,
  tags,
  category,
  isPublic,
  isPinned,
  createdAt,
  updatedAt,
  onTagAdd,
  onTagRemove,
  onCategoryChange,
  onTogglePublic,
  onTogglePinned
}: NoteSidebarProps) {
  const [newTag, setNewTag] = useState('')
  const [showOutline, setShowOutline] = useState(true)
  const [showProperties, setShowProperties] = useState(true)
  const [showActivity, setShowActivity] = useState(false)
  const [linkedNotes, setLinkedNotes] = useState([])
  const [outline, setOutline] = useState([
    { id: '1', text: 'Introduction', level: 1, type: 'heading1' },
    { id: '2', text: 'Objectifs principaux', level: 2, type: 'heading2' },
    { id: '3', text: 'Recherche et analyse', level: 2, type: 'heading2' },
    { id: '4', text: 'Méthodologie', level: 3, type: 'heading3' },
    { id: '5', text: 'Résultats', level: 2, type: 'heading2' },
    { id: '6', text: 'Conclusion', level: 1, type: 'heading1' }
  ])

  const categories = [
    { id: '1', name: 'Personnel', color: '#3b82f6' },
    { id: '2', name: 'Travail', color: '#10b981' },
    { id: '3', name: 'Projets', color: '#f59e0b' },
    { id: '4', name: 'Idées', color: '#8b5cf6' }
  ]

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      onTagAdd(newTag.trim())
      setNewTag('')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addTag()
    }
  }

  return (
    <div className="w-80 border-l bg-muted/30 flex flex-col h-full">
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          
          {/* Plan de la note */}
          <div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowOutline(!showOutline)}
              className="w-full justify-start p-0 h-auto font-medium mb-3"
            >
              {showOutline ? <ChevronDown className="h-4 w-4 mr-2" /> : <ChevronRight className="h-4 w-4 mr-2" />}
              Plan de la note
            </Button>
            
            {showOutline && (
              <div className="space-y-1">
                {outline.map((item) => (
                  <button
                    key={item.id}
                    className="w-full text-left px-2 py-1 text-sm rounded hover:bg-accent transition-colors"
                    style={{ paddingLeft: `${8 + (item.level - 1) * 16}px` }}
                  >
                    <div className="flex items-center gap-2">
                      {item.type === 'heading1' && <Hash className="h-3 w-3 text-muted-foreground" />}
                      {item.type === 'heading2' && <Hash className="h-3 w-3 text-muted-foreground" />}
                      {item.type === 'heading3' && <Hash className="h-3 w-3 text-muted-foreground" />}
                      <span className={`${item.level === 1 ? 'font-medium' : ''} truncate`}>
                        {item.text}
                      </span>
                    </div>
                  </button>
                ))}
                {outline.length === 0 && (
                  <p className="text-xs text-muted-foreground italic px-2">
                    Ajoutez des titres pour créer un plan
                  </p>
                )}
              </div>
            )}
          </div>

          <Separator />

          {/* Propriétés de la note */}
          <div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowProperties(!showProperties)}
              className="w-full justify-start p-0 h-auto font-medium mb-3"
            >
              {showProperties ? <ChevronDown className="h-4 w-4 mr-2" /> : <ChevronRight className="h-4 w-4 mr-2" />}
              Propriétés
            </Button>
            
            {showProperties && (
              <div className="space-y-4">
                {/* Statut */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Statut</span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant={isPinned ? "default" : "ghost"}
                      size="sm"
                      onClick={onTogglePinned}
                    >
                      <Star className={`h-3 w-3 ${isPinned ? 'fill-current' : ''}`} />
                    </Button>
                    <Button
                      variant={isPublic ? "default" : "ghost"}
                      size="sm"
                      onClick={onTogglePublic}
                    >
                      {isPublic ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                    </Button>
                  </div>
                </div>

                {/* Catégorie */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Catégorie</span>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="w-full justify-start">
                        {category ? (
                          <>
                            <div 
                              className="w-3 h-3 rounded-full mr-2"
                              style={{ backgroundColor: category.color }}
                            />
                            {category.name}
                          </>
                        ) : (
                          <>
                            <Folder className="h-3 w-3 mr-2" />
                            Sans catégorie
                          </>
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-48">
                      <DropdownMenuItem onClick={() => onCategoryChange('')}>
                        <Folder className="h-4 w-4 mr-2" />
                        Sans catégorie
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {categories.map((cat) => (
                        <DropdownMenuItem
                          key={cat.id}
                          onClick={() => onCategoryChange(cat.id)}
                        >
                          <div 
                            className="w-4 h-4 rounded-full mr-2"
                            style={{ backgroundColor: cat.color }}
                          />
                          {cat.name}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Tags */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Tags</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-1">
                      {tags.map((tag) => (
                        <Badge 
                          key={tag} 
                          variant="secondary" 
                          className="text-xs flex items-center gap-1"
                        >
                          <Hash className="h-2 w-2" />
                          {tag}
                          <button
                            onClick={() => onTagRemove(tag)}
                            className="ml-1 hover:text-destructive"
                          >
                            <X className="h-2 w-2" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Nouveau tag..."
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyPress={handleKeyPress}
                        className="text-xs h-7"
                      />
                      <Button size="sm" onClick={addTag} className="h-7 px-2">
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Dates */}
                <div className="space-y-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3 w-3" />
                    <span>Créé le {createdAt.toLocaleDateString('fr-FR')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-3 w-3" />
                    <span>Modifié le {updatedAt.toLocaleDateString('fr-FR')}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Notes liées */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-sm">Notes liées</h4>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <Plus className="h-3 w-3" />
              </Button>
            </div>
            <div className="space-y-2">
              {linkedNotes.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">
                  Aucune note liée
                </p>
              ) : (
                linkedNotes.map((note: any) => (
                  <Card key={note.id} className="p-2 cursor-pointer hover:bg-accent">
                    <div className="flex items-start gap-2">
                      <FileText className="h-3 w-3 mt-0.5 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{note.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {note.type}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>

          <Separator />

          {/* Actions rapides */}
          <div>
            <h4 className="font-medium text-sm mb-3">Actions</h4>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" className="h-8 text-xs">
                <Copy className="h-3 w-3 mr-1" />
                Copier
              </Button>
              <Button variant="outline" size="sm" className="h-8 text-xs">
                <Share className="h-3 w-3 mr-1" />
                Partager
              </Button>
              <Button variant="outline" size="sm" className="h-8 text-xs">
                <History className="h-3 w-3 mr-1" />
                Historique
              </Button>
              <Button variant="outline" size="sm" className="h-8 text-xs">
                <Archive className="h-3 w-3 mr-1" />
                Archiver
              </Button>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}