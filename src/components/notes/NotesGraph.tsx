"use client"

import { useRef, useEffect, useState, useCallback } from 'react'
import { useSession } from "next-auth/react"
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Plus,
  Link as LinkIcon,
  X,
  Edit,
  Trash2
} from 'lucide-react'
import Link from 'next/link'

interface NoteNode {
  id: string
  title: string
  content: string
  x: number
  y: number
  category?: {
    id: string
    name: string
    color: string
  }
  tags: string[]
  linksFrom: Array<{
    id: string
    toId: string
    label?: string
  }>
  linksTo: Array<{
    id: string
    fromId: string
    label?: string
  }>
}

interface NotesGraphProps {
  onCreateNote?: () => void
}

export function NotesGraph({ onCreateNote }: NotesGraphProps) {
  const { data: session } = useSession()
  const svgRef = useRef<SVGSVGElement>(null)
  const [notes, setNotes] = useState<NoteNode[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedNote, setSelectedNote] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [draggedNote, setDraggedNote] = useState<string | null>(null)
  const [scale, setScale] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [linking, setLinking] = useState<string | null>(null)

  useEffect(() => {
    if (session?.user?.id) {
      fetchNotesWithLinks()
    }
  }, [session])

  const fetchNotesWithLinks = async () => {
    try {
      const response = await fetch('/api/notes/graph')
      if (response.ok) {
        const data = await response.json()
        setNotes(generatePositions(data.notes))
      }
    } catch (error) {
      console.error('Erreur lors du chargement du graphique:', error)
    } finally {
      setLoading(false)
    }
  }

  const generatePositions = (notesData: any[]): NoteNode[] => {
    return notesData.map((note, index) => ({
      ...note,
      x: note.x || (Math.cos(index * 0.5) * 200 + 400),
      y: note.y || (Math.sin(index * 0.5) * 200 + 300)
    }))
  }

  const handleNoteClick = (noteId: string, event: React.MouseEvent) => {
    event.stopPropagation()
    if (linking) {
      if (linking !== noteId) {
        createLink(linking, noteId)
      }
      setLinking(null)
    } else {
      setSelectedNote(selectedNote === noteId ? null : noteId)
    }
  }

  const handleNoteDoubleClick = (noteId: string) => {
    window.open(`/notes/${noteId}`, '_blank')
  }

  const startDrag = (noteId: string, event: React.MouseEvent) => {
    if (event.detail === 1) { // Simple click
      setIsDragging(true)
      setDraggedNote(noteId)
    }
  }

  const handleMouseMove = useCallback((event: React.MouseEvent) => {
    if (isDragging && draggedNote) {
      const rect = svgRef.current?.getBoundingClientRect()
      if (rect) {
        const x = (event.clientX - rect.left - pan.x) / scale
        const y = (event.clientY - rect.top - pan.y) / scale
        
        setNotes(prev => prev.map(note =>
          note.id === draggedNote ? { ...note, x, y } : note
        ))
      }
    }
  }, [isDragging, draggedNote, scale, pan])

  const handleMouseUp = () => {
    if (isDragging && draggedNote) {
      // Sauvegarder la position
      const note = notes.find(n => n.id === draggedNote)
      if (note) {
        saveNotePosition(draggedNote, note.x, note.y)
      }
    }
    setIsDragging(false)
    setDraggedNote(null)
  }

  const saveNotePosition = async (noteId: string, x: number, y: number) => {
    try {
      await fetch(`/api/notes/${noteId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ x, y })
      })
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de position:', error)
    }
  }

  const createLink = async (fromId: string, toId: string) => {
    try {
      const response = await fetch('/api/notes/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fromId, toId })
      })
      
      if (response.ok) {
        fetchNotesWithLinks() // Recharger les données
      }
    } catch (error) {
      console.error('Erreur lors de la création du lien:', error)
    }
  }

  const zoomIn = () => setScale(prev => Math.min(prev * 1.2, 3))
  const zoomOut = () => setScale(prev => Math.max(prev / 1.2, 0.3))
  const resetView = () => {
    setScale(1)
    setPan({ x: 0, y: 0 })
  }

  const renderLinks = () => {
    const links: JSX.Element[] = []
    
    notes.forEach(note => {
      note.linksFrom.forEach(link => {
        const toNote = notes.find(n => n.id === link.toId)
        if (toNote) {
          links.push(
            <line
              key={`${note.id}-${toNote.id}`}
              x1={note.x}
              y1={note.y}
              x2={toNote.x}
              y2={toNote.y}
              stroke="#6b7280"
              strokeWidth="2"
              strokeDasharray="5,5"
              opacity="0.6"
            />
          )
          
          // Flèche
          const angle = Math.atan2(toNote.y - note.y, toNote.x - note.x)
          const arrowX = toNote.x - Math.cos(angle) * 50
          const arrowY = toNote.y - Math.sin(angle) * 50
          
          links.push(
            <polygon
              key={`arrow-${note.id}-${toNote.id}`}
              points={`${arrowX},${arrowY} ${arrowX - 8},${arrowY - 4} ${arrowX - 8},${arrowY + 4}`}
              fill="#6b7280"
              opacity="0.6"
              transform={`rotate(${angle * 180 / Math.PI} ${arrowX} ${arrowY})`}
            />
          )
        }
      })
    })
    
    return links
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Chargement du graphique...</p>
      </div>
    )
  }

  return (
    <div className="relative w-full h-[600px] border rounded-lg overflow-hidden bg-muted/10">
      {/* Contrôles */}
      <div className="absolute top-4 left-4 z-10 flex gap-2">
        <Button variant="secondary" size="sm" onClick={zoomIn}>
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button variant="secondary" size="sm" onClick={zoomOut}>
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button variant="secondary" size="sm" onClick={resetView}>
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>

      {/* Mode lien */}
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <Button
          variant={linking ? "default" : "secondary"}
          size="sm"
          onClick={() => setLinking(linking ? null : 'select')}
        >
          <LinkIcon className="h-4 w-4 mr-2" />
          {linking ? 'Annuler' : 'Créer lien'}
        </Button>
        {onCreateNote && (
          <Button variant="secondary" size="sm" onClick={onCreateNote}>
            <Plus className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Instructions */}
      {linking && (
        <div className="absolute bottom-4 left-4 z-10">
          <Card>
            <CardContent className="p-3">
              <p className="text-sm text-muted-foreground">
                Cliquez sur une note source, puis sur une note destination
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* SVG Canvas */}
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="cursor-grab"
      >
        <g transform={`translate(${pan.x}, ${pan.y}) scale(${scale})`}>
          {/* Liens */}
          {renderLinks()}
          
          {/* Notes */}
          {notes.map(note => (
            <g key={note.id}>
              {/* Note card */}
              <foreignObject
                x={note.x - 75}
                y={note.y - 40}
                width="150"
                height="80"
                className={`cursor-pointer ${
                  selectedNote === note.id ? 'ring-2 ring-blue-500' : ''
                } ${
                  linking === note.id ? 'ring-2 ring-green-500' : ''
                }`}
              >
                <Card
                  className={`w-full h-full transition-all hover:shadow-md ${
                    note.category ? 'border-l-4' : ''
                  }`}
                  style={{
                    borderLeftColor: note.category?.color || 'transparent'
                  }}
                  onClick={(e) => handleNoteClick(note.id, e)}
                  onDoubleClick={() => handleNoteDoubleClick(note.id)}
                  onMouseDown={(e) => startDrag(note.id, e)}
                >
                  <CardContent className="p-3">
                    <h4 className="font-medium text-xs truncate mb-1">
                      {note.title}
                    </h4>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {note.content.substring(0, 50)}...
                    </p>
                    {note.tags.length > 0 && (
                      <div className="flex gap-1 mt-2">
                        {note.tags.slice(0, 2).map(tag => (
                          <Badge key={tag} variant="secondary" className="text-xs px-1">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </foreignObject>
            </g>
          ))}
        </g>
      </svg>

      {/* Détails de la note sélectionnée */}
      {selectedNote && (
        <div className="absolute bottom-4 right-4 z-10 w-80">
          <Card>
            <CardContent className="p-4">
              {(() => {
                const note = notes.find(n => n.id === selectedNote)
                if (!note) return null
                
                return (
                  <>
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-semibold">{note.title}</h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedNote(null)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-3">
                      {note.content}
                    </p>
                    <div className="flex gap-2">
                      <Link href={`/notes/${note.id}`}>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4 mr-2" />
                          Éditer
                        </Button>
                      </Link>
                      <Button
                        variant={linking === note.id ? "default" : "outline"}
                        size="sm"
                        onClick={() => setLinking(linking === note.id ? null : note.id)}
                      >
                        <LinkIcon className="h-4 w-4 mr-2" />
                        Lier
                      </Button>
                    </div>
                  </>
                )
              })()}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}