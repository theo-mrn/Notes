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
  onInsertBlock?: (type: string) => void;
}

export function EditorToolbar({ onFormat, activeFormats, currentBlockType, onInsertBlock }: EditorToolbarProps) {
  return (
    <div className="editor-toolbar sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
      <div className="flex items-center gap-2 p-3 overflow-x-auto">
        {/* Insertion de blocs classiques */}
        <div className="flex items-center gap-1 mr-4">
          <Button size="sm" variant="ghost" title="Titre 1" onClick={() => onInsertBlock && onInsertBlock('heading1')}>
            <span className="font-bold text-lg">H1</span>
          </Button>
          <Button size="sm" variant="ghost" title="Titre 2" onClick={() => onInsertBlock && onInsertBlock('heading2')}>
            <span className="font-bold">H2</span>
          </Button>
          <Button size="sm" variant="ghost" title="Titre 3" onClick={() => onInsertBlock && onInsertBlock('heading3')}>
            <span className="font-bold">H3</span>
          </Button>
          <Button size="sm" variant="ghost" title="Paragraphe" onClick={() => onInsertBlock && onInsertBlock('paragraph')}>
            <span className="">¶</span>
          </Button>
          <Button size="sm" variant="ghost" title="Citation" onClick={() => onInsertBlock && onInsertBlock('quote')}>
            <span className="italic">“”</span>
          </Button>
          <Button size="sm" variant="ghost" title="Liste à puces" onClick={() => onInsertBlock && onInsertBlock('bulletList')}>
            <List className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" title="Liste numérotée" onClick={() => onInsertBlock && onInsertBlock('numberedList')}>
            <ListOrdered className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" title="Todo" onClick={() => onInsertBlock && onInsertBlock('todoList')}>
            <span className="">☑️</span>
          </Button>
          <Button size="sm" variant="ghost" title="Image" onClick={() => onInsertBlock && onInsertBlock('image')}>
            <span className="">🖼️</span>
          </Button>
          <Button size="sm" variant="ghost" title="Code" onClick={() => onInsertBlock && onInsertBlock('code')}>
            <Code className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" title="Séparateur" onClick={() => onInsertBlock && onInsertBlock('divider')}>
            <span className="">―</span>
          </Button>
        </div>
        
        {/* Formatage de base */}
        <div className="flex items-center gap-1 mr-2 px-2 py-1 rounded bg-muted/40">
          <Button
            variant={activeFormats.includes('bold') ? 'default' : 'ghost'}
            size="sm"
            title="Gras (Ctrl+B)"
            aria-label="Gras"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onFormat('bold')}
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            variant={activeFormats.includes('italic') ? 'default' : 'ghost'}
            size="sm"
            title="Italique (Ctrl+I)"
            aria-label="Italique"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onFormat('italic')}
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            variant={activeFormats.includes('underline') ? 'default' : 'ghost'}
            size="sm"
            title="Souligné (Ctrl+U)"
            aria-label="Souligné"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onFormat('underline')}
          >
            <Underline className="h-4 w-4" />
          </Button>
          <Button
            variant={activeFormats.includes('code') ? 'default' : 'ghost'}
            size="sm"
            title="Code en ligne (Ctrl+E)"
            aria-label="Code en ligne"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onFormat('inlineCode')}
          >
            <Code className="h-4 w-4" />
          </Button>
        </div>

        <div className="w-px h-6 bg-border mx-2" />

        {/* Alignement */}
        <div className="flex items-center gap-1 mr-2 px-2 py-1 rounded bg-muted/40">
          <Button
            variant={activeFormats.includes('align-left') ? 'default' : 'ghost'}
            size="sm"
            title="Aligner à gauche"
            aria-label="Aligner à gauche"
            onClick={() => onFormat('align', 'left')}
          >
            <AlignLeft className="h-4 w-4" />
          </Button>
          <Button
            variant={activeFormats.includes('align-center') ? 'default' : 'ghost'}
            size="sm"
            title="Centrer"
            aria-label="Centrer"
            onClick={() => onFormat('align', 'center')}
          >
            <AlignCenter className="h-4 w-4" />
          </Button>
          <Button
            variant={activeFormats.includes('align-right') ? 'default' : 'ghost'}
            size="sm"
            title="Aligner à droite"
            aria-label="Aligner à droite"
            onClick={() => onFormat('align', 'right')}
          >
            <AlignRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="w-px h-6 bg-border mx-2" />

        {/* Listes */}
        <div className="flex items-center gap-1 px-2 py-1 rounded bg-muted/40">
          <Button
            variant={activeFormats.includes('bulletList') ? 'default' : 'ghost'}
            size="sm"
            title="Liste à puces"
            aria-label="Liste à puces"
            onClick={() => onFormat('bulletList')}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant={activeFormats.includes('numberedList') ? 'default' : 'ghost'}
            size="sm"
            title="Liste numérotée"
            aria-label="Liste numérotée"
            onClick={() => onFormat('numberedList')}
          >
            <ListOrdered className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}