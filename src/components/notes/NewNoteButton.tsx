"use client"

import { useState } from 'react'
import { Plus, PenTool, FileText, Lightbulb, Calendar, CheckSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'

interface NewNoteButtonProps {
  onCreateNote: (type: string) => void
}

const noteTypes = [
  {
    id: 'text',
    label: 'Note de texte',
    icon: <FileText className="h-4 w-4" />,
    description: 'Une note simple avec du texte'
  },
  {
    id: 'checklist',
    label: 'Liste de tâches',
    icon: <CheckSquare className="h-4 w-4" />,
    description: 'Une liste avec des cases à cocher'
  },
  {
    id: 'idea',
    label: 'Idée',
    icon: <Lightbulb className="h-4 w-4" />,
    description: 'Capturez vos idées rapidement'
  },
  {
    id: 'journal',
    label: 'Journal',
    icon: <Calendar className="h-4 w-4" />,
    description: 'Note datée pour le journal'
  }
]

export function NewNoteButton({ onCreateNote }: NewNoteButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()

  const handleCreateNote = (type: string) => {
    onCreateNote(type)
    router.push('/notes/new')
  }

  return (
    <div className="fixed bottom-8 right-8 z-50">
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              size="lg"
              className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-shadow bg-primary text-primary-foreground"
            >
              <motion.div
                animate={{ rotate: isOpen ? 45 : 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 10 }}
              >
                <Plus className="h-6 w-6" />
              </motion.div>
            </Button>
          </motion.div>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent 
          align="end" 
          sideOffset={8}
          className="w-64"
        >
          <div className="p-2">
            <h3 className="font-medium text-sm mb-2 px-2">Créer une nouvelle note</h3>
            <div className="space-y-1">
              {noteTypes.map((type) => (
                <DropdownMenuItem
                  key={type.id}
                  onClick={() => handleCreateNote(type.id)}
                  className="flex items-start gap-3 p-3 cursor-pointer rounded-md"
                >
                  <div className="mt-0.5">
                    {type.icon}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-sm">{type.label}</div>
                    <div className="text-xs text-muted-foreground">
                      {type.description}
                    </div>
                  </div>
                </DropdownMenuItem>
              ))}
            </div>
            
            <DropdownMenuSeparator className="my-2" />
            
            <DropdownMenuItem className="flex items-center gap-3 p-3">
              <PenTool className="h-4 w-4" />
              <span className="text-sm">Import depuis un fichier</span>
            </DropdownMenuItem>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}