"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Hash,
  Star,
  Eye,
  EyeOff,
  Plus,
  X,
  ChevronDown,
  ChevronRight
} from 'lucide-react'

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
  const [showProperties, setShowProperties] = useState(true)
  
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
      <div className="p-4 space-y-6 overflow-y-auto flex-1">
        
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
              {createdAt && updatedAt && (
                <div className="space-y-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <span>Créé le {new Date(createdAt).toLocaleDateString('fr-FR')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>Modifié le {new Date(updatedAt).toLocaleDateString('fr-FR')}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}