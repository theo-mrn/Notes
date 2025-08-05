"use client"

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { 
  Upload, 
  Link, 
  MoreHorizontal, 
  AlignLeft, 
  AlignCenter, 
  AlignRight,
  Maximize,
  Download,
  Trash2,
  Copy,
  ExternalLink
} from 'lucide-react'
import Image from 'next/image'

interface ImageBlockProps {
  id: string
  data: {
    src?: string
    alt?: string
    caption?: string
    alignment?: 'left' | 'center' | 'right'
    size?: 'small' | 'medium' | 'large' | 'full'
    url?: string
  }
  onUpdate: (id: string, data: any) => void
  onDelete: (id: string) => void
}

export function ImageBlock({ id, data, onUpdate, onDelete }: ImageBlockProps) {
  const [src, setSrc] = useState(data.src || '')
  const [alt, setAlt] = useState(data.alt || '')
  const [caption, setCaption] = useState(data.caption || '')
  const [alignment, setAlignment] = useState(data.alignment || 'center')
  const [size, setSize] = useState(data.size || 'medium')
  const [showUrlInput, setShowUrlInput] = useState(!data.src)
  const [imageUrl, setImageUrl] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Simuler l'upload - en production, utiliser un service d'upload réel
      const reader = new FileReader()
      reader.onload = () => {
        const newSrc = reader.result as string
        setSrc(newSrc)
        setShowUrlInput(false)
        onUpdate(id, { ...data, src: newSrc, alt, caption, alignment, size })
      }
      reader.readAsDataURL(file)
    }
  }

  const handleUrlAdd = () => {
    if (imageUrl.trim()) {
      setSrc(imageUrl.trim())
      setShowUrlInput(false)
      onUpdate(id, { ...data, src: imageUrl.trim(), alt, caption, alignment, size })
    }
  }

  const updateProperty = (key: string, value: any) => {
    const newData = { ...data, [key]: value }
    onUpdate(id, newData)
    
    if (key === 'alt') setAlt(value)
    if (key === 'caption') setCaption(value)
    if (key === 'alignment') setAlignment(value)
    if (key === 'size') setSize(value)
  }

  const getSizeClass = () => {
    switch (size) {
      case 'small': return 'max-w-xs'
      case 'medium': return 'max-w-md'
      case 'large': return 'max-w-2xl'
      case 'full': return 'w-full'
      default: return 'max-w-md'
    }
  }

  const getAlignmentClass = () => {
    switch (alignment) {
      case 'left': return 'mr-auto'
      case 'right': return 'ml-auto'
      case 'center': return 'mx-auto'
      default: return 'mx-auto'
    }
  }

  if (!src || showUrlInput) {
    return (
      <div className="my-4 border-2 border-dashed border-muted-foreground/25 rounded-lg p-8">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <Upload className="h-12 w-12 text-muted-foreground/50" />
          </div>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">Ajouter une image</h3>
              <div className="flex gap-2 justify-center">
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Télécharger
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowUrlInput(true)}
                >
                  <Link className="h-4 w-4 mr-2" />
                  URL
                </Button>
              </div>
            </div>
            
            {showUrlInput && (
              <div className="flex gap-2 max-w-md mx-auto">
                <Input
                  placeholder="https://example.com/image.jpg"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleUrlAdd()}
                />
                <Button onClick={handleUrlAdd}>
                  Ajouter
                </Button>
              </div>
            )}
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>
      </div>
    )
  }

  return (
    <div className="my-4 group">
      {/* Contrôles de l'image */}
      <div className="flex items-center justify-between mb-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="flex items-center gap-2">
          {/* Alignement */}
          <div className="flex items-center border rounded">
            <Button
              variant={alignment === 'left' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => updateProperty('alignment', 'left')}
              className="rounded-none border-0"
            >
              <AlignLeft className="h-3 w-3" />
            </Button>
            <Button
              variant={alignment === 'center' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => updateProperty('alignment', 'center')}
              className="rounded-none border-0 border-l"
            >
              <AlignCenter className="h-3 w-3" />
            </Button>
            <Button
              variant={alignment === 'right' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => updateProperty('alignment', 'right')}
              className="rounded-none border-0 border-l"
            >
              <AlignRight className="h-3 w-3" />
            </Button>
          </div>

          {/* Taille */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Maximize className="h-3 w-3 mr-1" />
                {size === 'small' ? 'Petit' : 
                 size === 'medium' ? 'Moyen' : 
                 size === 'large' ? 'Grand' : 'Pleine largeur'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => updateProperty('size', 'small')}>
                Petit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => updateProperty('size', 'medium')}>
                Moyen
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => updateProperty('size', 'large')}>
                Grand
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => updateProperty('size', 'full')}>
                Pleine largeur
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setShowUrlInput(true)}>
              <Link className="h-4 w-4 mr-2" />
              Changer l'URL
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Download className="h-4 w-4 mr-2" />
              Télécharger
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Copy className="h-4 w-4 mr-2" />
              Copier le lien
            </DropdownMenuItem>
            <DropdownMenuItem>
              <ExternalLink className="h-4 w-4 mr-2" />
              Ouvrir dans un nouvel onglet
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDelete(id)} className="text-destructive">
              <Trash2 className="h-4 w-4 mr-2" />
              Supprimer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Image */}
      <div className={`${getSizeClass()} ${getAlignmentClass()}`}>
        <Image
          src={src}
          alt={alt || 'Image'}
          width={800}
          height={600}
          className="rounded-lg shadow-sm w-full h-auto"
          onError={() => {
            // Gérer l'erreur de chargement
            setSrc('')
            setShowUrlInput(true)
          }}
        />
        
        {/* Légende */}
        <Input
          value={caption}
          onChange={(e) => updateProperty('caption', e.target.value)}
          placeholder="Ajouter une légende..."
          className="mt-2 text-center border-none shadow-none text-sm text-muted-foreground bg-transparent focus:bg-background"
        />
      </div>
    </div>
  )
}