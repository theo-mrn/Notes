"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger
} from '@/components/ui/dropdown-menu'
import { 
  Bold, 
  Italic, 
  Underline, 
  Strikethrough,
  Code,
  Link,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Quote,
  Heading1,
  Heading2,
  Heading3,
  Table,
  Image,
  Calendar,
  Palette,
  Type,
  MoreHorizontal,
  ChevronDown,
  Highlight,
  CheckSquare,
  Divider,
  FileText,
  Calculator,
  Map,
  BarChart3,
  Video,
  Music,
  File,
  Paperclip
} from 'lucide-react'
import { Separator } from '@/components/ui/separator'

interface EditorToolbarProps {
  onFormat: (format: string, value?: any) => void
  activeFormats: string[]
  currentBlockType: string
}

export function EditorToolbar({ onFormat, activeFormats, currentBlockType }: EditorToolbarProps) {
  const [showAdvanced, setShowAdvanced] = useState(false)

  const textStyles = [
    { id: 'paragraph', label: 'Paragraphe', icon: <FileText className="h-4 w-4" /> },
    { id: 'heading1', label: 'Titre 1', icon: <Heading1 className="h-4 w-4" /> },
    { id: 'heading2', label: 'Titre 2', icon: <Heading2 className="h-4 w-4" /> },
    { id: 'heading3', label: 'Titre 3', icon: <Heading3 className="h-4 w-4" /> },
    { id: 'quote', label: 'Citation', icon: <Quote className="h-4 w-4" /> },
    { id: 'code', label: 'Code', icon: <Code className="h-4 w-4" /> }
  ]

  const alignments = [
    { id: 'left', icon: <AlignLeft className="h-4 w-4" />, label: 'Gauche' },
    { id: 'center', icon: <AlignCenter className="h-4 w-4" />, label: 'Centre' },
    { id: 'right', icon: <AlignRight className="h-4 w-4" />, label: 'Droite' },
    { id: 'justify', icon: <AlignJustify className="h-4 w-4" />, label: 'Justifié' }
  ]

  const insertOptions = [
    { id: 'table', label: 'Tableau', icon: <Table className="h-4 w-4" /> },
    { id: 'image', label: 'Image', icon: <Image className="h-4 w-4" /> },
    { id: 'calendar', label: 'Calendrier', icon: <Calendar className="h-4 w-4" /> },
    { id: 'divider', label: 'Séparateur', icon: <Divider className="h-4 w-4" /> },
    { id: 'checklist', label: 'Liste de tâches', icon: <CheckSquare className="h-4 w-4" /> },
    { id: 'chart', label: 'Graphique', icon: <BarChart3 className="h-4 w-4" /> },
    { id: 'calculator', label: 'Calculatrice', icon: <Calculator className="h-4 w-4" /> },
    { id: 'map', label: 'Carte', icon: <Map className="h-4 w-4" /> },
    { id: 'video', label: 'Vidéo', icon: <Video className="h-4 w-4" /> },
    { id: 'audio', label: 'Audio', icon: <Music className="h-4 w-4" /> },
    { id: 'file', label: 'Fichier', icon: <File className="h-4 w-4" /> }
  ]

  const colors = [
    { name: 'Défaut', value: 'default' },
    { name: 'Rouge', value: '#ef4444' },
    { name: 'Orange', value: '#f97316' },
    { name: 'Jaune', value: '#eab308' },
    { name: 'Vert', value: '#22c55e' },
    { name: 'Bleu', value: '#3b82f6' },
    { name: 'Indigo', value: '#6366f1' },
    { name: 'Violet', value: '#a855f7' },
    { name: 'Rose', value: '#ec4899' }
  ]

  const currentStyle = textStyles.find(style => style.id === currentBlockType) || textStyles[0]

  return (
    <div className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
      <div className="flex items-center gap-1 p-2 overflow-x-auto">
        {/* Style de texte */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2 min-w-fit">
              {currentStyle.icon}
              <span className="hidden sm:inline">{currentStyle.label}</span>
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            {textStyles.map((style) => (
              <DropdownMenuItem
                key={style.id}
                onClick={() => onFormat('blockType', style.id)}
                className="flex items-center gap-3"
              >
                {style.icon}
                <span>{style.label}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Separator orientation="vertical" className="h-6 mx-1" />

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
            variant={activeFormats.includes('strikethrough') ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onFormat('strikethrough')}
          >
            <Strikethrough className="h-4 w-4" />
          </Button>
          <Button
            variant={activeFormats.includes('code') ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onFormat('inlineCode')}
          >
            <Code className="h-4 w-4" />
          </Button>
        </div>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Couleur du texte */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <Type className="h-4 w-4" />
              <ChevronDown className="h-3 w-3 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-48">
            <div className="p-2">
              <div className="text-xs font-medium mb-2">Couleur du texte</div>
              <div className="grid grid-cols-3 gap-1">
                {colors.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => onFormat('textColor', color.value)}
                    className="w-8 h-8 rounded border-2 border-border hover:border-foreground transition-colors"
                    style={{ backgroundColor: color.value === 'default' ? 'currentColor' : color.value }}
                    title={color.name}
                  />
                ))}
              </div>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Surlignage */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <Highlight className="h-4 w-4" />
              <ChevronDown className="h-3 w-3 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-48">
            <div className="p-2">
              <div className="text-xs font-medium mb-2">Surlignage</div>
              <div className="grid grid-cols-3 gap-1">
                {colors.slice(1).map((color) => (
                  <button
                    key={color.value}
                    onClick={() => onFormat('highlight', color.value)}
                    className="w-8 h-8 rounded border-2 border-border hover:border-foreground transition-colors opacity-30"
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  />
                ))}
              </div>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Alignement */}
        <div className="flex items-center gap-1">
          {alignments.map((align) => (
            <Button
              key={align.id}
              variant={activeFormats.includes(`align-${align.id}`) ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onFormat('align', align.id)}
              title={align.label}
            >
              {align.icon}
            </Button>
          ))}
        </div>

        <Separator orientation="vertical" className="h-6 mx-1" />

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

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Lien */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onFormat('link')}
        >
          <Link className="h-4 w-4" />
        </Button>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Insérer */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2">
              <span className="hidden sm:inline">Insérer</span>
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="p-1">
              {insertOptions.map((option) => (
                <DropdownMenuItem
                  key={option.id}
                  onClick={() => onFormat('insert', option.id)}
                  className="flex items-center gap-3 cursor-pointer"
                >
                  {option.icon}
                  <span>{option.label}</span>
                </DropdownMenuItem>
              ))}
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onFormat('insert', 'embed')}>
              <Paperclip className="h-4 w-4 mr-3" />
              Intégrer (URL)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Plus d'options */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onFormat('clearFormatting')}>
              Effacer le formatage
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onFormat('duplicate')}>
              Dupliquer le block
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onFormat('delete')}>
              Supprimer le block
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}