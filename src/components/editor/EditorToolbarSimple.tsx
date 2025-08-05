"use client"

import { Button } from '@/components/ui/button'
import { 
  Bold, 
  Italic, 
  Underline, 
  Code,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight
} from 'lucide-react'

interface EditorToolbarProps {
  onFormat: (format: string, value?: any) => void
  activeFormats: string[]
  currentBlockType: string
}

export function EditorToolbar({ onFormat, activeFormats, currentBlockType }: EditorToolbarProps) {
  return (
    <div className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
      <div className="flex items-center gap-2 p-3 overflow-x-auto">
        
        {/* Formatage de base */}
        <div className="flex items-center gap-1">
          <Button
            variant={activeFormats.includes('bold') ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onFormat('bold')}
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            variant={activeFormats.includes('italic') ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onFormat('italic')}
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            variant={activeFormats.includes('underline') ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onFormat('underline')}
          >
            <Underline className="h-4 w-4" />
          </Button>
          <Button
            variant={activeFormats.includes('code') ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onFormat('inlineCode')}
          >
            <Code className="h-4 w-4" />
          </Button>
        </div>

        <div className="w-px h-6 bg-border mx-2" />

        {/* Alignement */}
        <div className="flex items-center gap-1">
          <Button
            variant={activeFormats.includes('align-left') ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onFormat('align', 'left')}
          >
            <AlignLeft className="h-4 w-4" />
          </Button>
          <Button
            variant={activeFormats.includes('align-center') ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onFormat('align', 'center')}
          >
            <AlignCenter className="h-4 w-4" />
          </Button>
          <Button
            variant={activeFormats.includes('align-right') ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onFormat('align', 'right')}
          >
            <AlignRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="w-px h-6 bg-border mx-2" />

        {/* Listes */}
        <div className="flex items-center gap-1">
          <Button
            variant={activeFormats.includes('bulletList') ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onFormat('bulletList')}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant={activeFormats.includes('numberedList') ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onFormat('numberedList')}
          >
            <ListOrdered className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}