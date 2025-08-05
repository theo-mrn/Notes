"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { 
  Plus, 
  MoreHorizontal, 
  Trash2,
  Copy,
  CheckSquare,
  Square,
  X
} from 'lucide-react'

interface TodoItem {
  id: string
  text: string
  completed: boolean
  createdAt: Date
}

interface TodoBlockProps {
  id: string
  data: {
    items: TodoItem[]
    title?: string
  }
  onUpdate: (id: string, data: any) => void
  onDelete: (id: string) => void
}

export function TodoBlock({ id, data, onUpdate, onDelete }: TodoBlockProps) {
  const [items, setItems] = useState<TodoItem[]>(data.items || [])
  const [title, setTitle] = useState(data.title || 'Liste de tâches')
  const [newItemText, setNewItemText] = useState('')

  const updateData = (newItems: TodoItem[], newTitle?: string) => {
    setItems(newItems)
    if (newTitle !== undefined) setTitle(newTitle)
    onUpdate(id, { 
      items: newItems, 
      title: newTitle !== undefined ? newTitle : title 
    })
  }

  const addItem = () => {
    if (newItemText.trim()) {
      const newItem: TodoItem = {
        id: Date.now().toString(),
        text: newItemText.trim(),
        completed: false,
        createdAt: new Date()
      }
      const newItems = [...items, newItem]
      updateData(newItems)
      setNewItemText('')
    }
  }

  const toggleItem = (itemId: string) => {
    const newItems = items.map(item =>
      item.id === itemId ? { ...item, completed: !item.completed } : item
    )
    updateData(newItems)
  }

  const updateItemText = (itemId: string, text: string) => {
    const newItems = items.map(item =>
      item.id === itemId ? { ...item, text } : item
    )
    updateData(newItems)
  }

  const deleteItem = (itemId: string) => {
    const newItems = items.filter(item => item.id !== itemId)
    updateData(newItems)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addItem()
    }
  }

  const completedCount = items.filter(item => item.completed).length
  const totalCount = items.length
  const progressPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0

  return (
    <div className="my-4 border rounded-lg overflow-hidden bg-card">
      {/* Header */}
      <div className="p-4 bg-muted/30 border-b">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <Input
              value={title}
              onChange={(e) => updateData(items, e.target.value)}
              className="font-medium text-base border-none shadow-none p-0 h-auto bg-transparent focus:bg-background"
              placeholder="Titre de la liste..."
            />
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              <span>{completedCount} / {totalCount} terminées</span>
              {totalCount > 0 && (
                <div className="flex-1 max-w-32">
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-green-500 transition-all duration-300"
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => {
                const allCompleted = items.every(item => item.completed)
                const newItems = items.map(item => ({ ...item, completed: !allCompleted }))
                updateData(newItems)
              }}>
                {items.every(item => item.completed) ? (
                  <>
                    <Square className="h-4 w-4 mr-2" />
                    Tout décocher
                  </>
                ) : (
                  <>
                    <CheckSquare className="h-4 w-4 mr-2" />
                    Tout cocher
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                const newItems = items.filter(item => !item.completed)
                updateData(newItems)
              }}>
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer les terminées
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDelete(id)}>
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer la liste
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Copy className="h-4 w-4 mr-2" />
                Dupliquer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Items */}
      <div className="p-4">
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-3 group">
              <Checkbox
                checked={item.completed}
                onCheckedChange={() => toggleItem(item.id)}
                className="mt-0.5"
              />
              <Input
                value={item.text}
                onChange={(e) => updateItemText(item.id, e.target.value)}
                className={`flex-1 border-none shadow-none p-0 h-auto bg-transparent focus:bg-muted/50 ${
                  item.completed ? 'line-through text-muted-foreground' : ''
                }`}
                placeholder="Nouvelle tâche..."
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => deleteItem(item.id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
          
          {/* Add new item */}
          <div className="flex items-center gap-3 pt-2 border-t border-dashed">
            <div className="w-4 h-4 flex items-center justify-center">
              <Plus className="h-3 w-3 text-muted-foreground" />
            </div>
            <Input
              value={newItemText}
              onChange={(e) => setNewItemText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ajouter une tâche..."
              className="flex-1 border-none shadow-none p-0 h-auto bg-transparent placeholder:text-muted-foreground"
            />
            {newItemText.trim() && (
              <Button
                variant="ghost"
                size="sm"
                onClick={addItem}
                className="h-6 w-6 p-0"
              >
                <Plus className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        {items.length === 0 && (
          <div className="text-center py-6 text-muted-foreground">
            <CheckSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Aucune tâche dans cette liste</p>
            <p className="text-xs">Commencez par ajouter votre première tâche</p>
          </div>
        )}
      </div>
    </div>
  )
}