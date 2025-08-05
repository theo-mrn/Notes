"use client"

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Table,
  Image,
  Calendar,
  CheckSquare,
  FileText,
  Quote,
  Code,
  List,
  ListOrdered,
  Minus,
  BarChart3,
  Calculator,
  MapPin,
  Video,
  Music,
  Link,
  Hash,
  Heading1,
  Heading2,
  Heading3,
  Plus
} from 'lucide-react'

interface InsertSidebarProps {
  onInsertBlock: (type: string, data?: any) => void
}

export function InsertSidebar({ onInsertBlock }: InsertSidebarProps) {
  const basicBlocks = [
    {
      id: 'paragraph',
      name: 'Paragraphe',
      description: 'Texte simple',
      icon: <FileText className="h-5 w-5" />,
      category: 'text'
    },
    {
      id: 'heading1',
      name: 'Titre 1',
      description: 'Grand titre de section',
      icon: <Heading1 className="h-5 w-5" />,
      category: 'text'
    },
    {
      id: 'heading2',
      name: 'Titre 2',
      description: 'Titre de sous-section',
      icon: <Heading2 className="h-5 w-5" />,
      category: 'text'
    },
    {
      id: 'heading3',
      name: 'Titre 3',
      description: 'Petit titre',
      icon: <Heading3 className="h-5 w-5" />,
      category: 'text'
    },
    {
      id: 'quote',
      name: 'Citation',
      description: 'Texte de citation',
      icon: <Quote className="h-5 w-5" />,
      category: 'text'
    },
    {
      id: 'code',
      name: 'Code',
      description: 'Bloc de code',
      icon: <Code className="h-5 w-5" />,
      category: 'text'
    }
  ]

  const listBlocks = [
    {
      id: 'bulletList',
      name: 'Liste à puces',
      description: 'Liste simple',
      icon: <List className="h-5 w-5" />,
      category: 'list'
    },
    {
      id: 'numberedList',
      name: 'Liste numérotée',
      description: 'Liste ordonnée',
      icon: <ListOrdered className="h-5 w-5" />,
      category: 'list'
    },
    {
      id: 'todoList',
      name: 'Liste de tâches',
      description: 'Checklist interactive',
      icon: <CheckSquare className="h-5 w-5" />,
      category: 'list'
    }
  ]

  const mediaBlocks = [
    {
      id: 'image',
      name: 'Image',
      description: 'Upload ou URL',
      icon: <Image className="h-5 w-5" />,
      category: 'media'
    },
    {
      id: 'video',
      name: 'Vidéo',
      description: 'Intégrer une vidéo',
      icon: <Video className="h-5 w-5" />,
      category: 'media'
    },
    {
      id: 'audio',
      name: 'Audio',
      description: 'Fichier audio',
      icon: <Music className="h-5 w-5" />,
      category: 'media'
    }
  ]

  const advancedBlocks = [
    {
      id: 'table',
      name: 'Tableau',
      description: 'Données structurées',
      icon: <Table className="h-5 w-5" />,
      category: 'advanced'
    },
    {
      id: 'calendar',
      name: 'Calendrier',
      description: 'Événements et dates',
      icon: <Calendar className="h-5 w-5" />,
      category: 'advanced'
    },
    {
      id: 'chart',
      name: 'Graphique',
      description: 'Visualisation de données',
      icon: <BarChart3 className="h-5 w-5" />,
      category: 'advanced'
    },
    {
      id: 'calculator',
      name: 'Calculatrice',
      description: 'Calculs interactifs',
      icon: <Calculator className="h-5 w-5" />,
      category: 'advanced'
    },
    {
      id: 'map',
      name: 'Carte',
      description: 'Localisation',
      icon: <MapPin className="h-5 w-5" />,
      category: 'advanced'
    }
  ]

  const utilityBlocks = [
    {
      id: 'divider',
      name: 'Séparateur',
      description: 'Ligne de division',
      icon: <Minus className="h-5 w-5" />,
      category: 'utility'
    },
    {
      id: 'link',
      name: 'Lien',
      description: 'Lien hypertexte',
      icon: <Link className="h-5 w-5" />,
      category: 'utility'
    }
  ]

  const BlockCard = ({ block }: { block: any }) => (
    <Card 
      className="cursor-pointer hover:bg-accent transition-colors border-dashed border-2 hover:border-solid"
      onClick={() => onInsertBlock(block.id)}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="text-muted-foreground mt-0.5">
            {block.icon}
          </div>
          <div className="flex-1">
            <h4 className="font-medium text-sm mb-1">{block.name}</h4>
            <p className="text-xs text-muted-foreground">{block.description}</p>
          </div>
          <Plus className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="w-80 border-l bg-background/50 backdrop-blur supports-[backdrop-filter]:bg-background/50 flex flex-col h-full">
      <div className="p-4 border-b">
        <h2 className="font-semibold text-lg">Insérer des éléments</h2>
        <p className="text-sm text-muted-foreground">Cliquez pour ajouter à votre note</p>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-6">
          
          {/* Blocs de texte */}
          <div>
            <h3 className="font-medium text-sm mb-3 text-muted-foreground uppercase tracking-wide">
              Texte
            </h3>
            <div className="grid gap-2">
              {basicBlocks.map((block) => (
                <BlockCard key={block.id} block={block} />
              ))}
            </div>
          </div>

          {/* Listes */}
          <div>
            <h3 className="font-medium text-sm mb-3 text-muted-foreground uppercase tracking-wide">
              Listes
            </h3>
            <div className="grid gap-2">
              {listBlocks.map((block) => (
                <BlockCard key={block.id} block={block} />
              ))}
            </div>
          </div>

          {/* Média */}
          <div>
            <h3 className="font-medium text-sm mb-3 text-muted-foreground uppercase tracking-wide">
              Média
            </h3>
            <div className="grid gap-2">
              {mediaBlocks.map((block) => (
                <BlockCard key={block.id} block={block} />
              ))}
            </div>
          </div>

          {/* Avancé */}
          <div>
            <h3 className="font-medium text-sm mb-3 text-muted-foreground uppercase tracking-wide">
              Avancé
            </h3>
            <div className="grid gap-2">
              {advancedBlocks.map((block) => (
                <BlockCard key={block.id} block={block} />
              ))}
            </div>
          </div>

          {/* Utilitaires */}
          <div>
            <h3 className="font-medium text-sm mb-3 text-muted-foreground uppercase tracking-wide">
              Utilitaires
            </h3>
            <div className="grid gap-2">
              {utilityBlocks.map((block) => (
                <BlockCard key={block.id} block={block} />
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}