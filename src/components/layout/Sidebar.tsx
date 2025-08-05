"use client"

import { useState } from 'react'
import { useSession } from "next-auth/react"
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ChevronDown, 
  ChevronRight, 
  Plus, 
  Search,
  Hash,
  Folder,
  Star,
  Archive,
  Trash2,
  Settings,
  User,
  Home,
  PenTool,
  Calendar,
  Tag,
  Filter,
  Menu,
  X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface SidebarProps {
  isOpen: boolean
  onToggle: () => void
}

interface Category {
  id: string
  name: string
  color: string
  noteCount: number
}

interface QuickAction {
  icon: React.ReactNode
  label: string
  href: string
  badge?: number
}

export function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const { data: session } = useSession()
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedSections, setExpandedSections] = useState<string[]>(['workspace', 'categories'])

  // Mock data - à remplacer par de vraies données
  const categories: Category[] = [
    { id: '1', name: 'Personnel', color: '#3b82f6', noteCount: 12 },
    { id: '2', name: 'Travail', color: '#10b981', noteCount: 8 },
    { id: '3', name: 'Projets', color: '#f59e0b', noteCount: 5 },
    { id: '4', name: 'Idées', color: '#8b5cf6', noteCount: 15 }
  ]

  const quickActions: QuickAction[] = [
    { icon: <Home className="h-4 w-4" />, label: 'Dashboard', href: '/dashboard' },
    { icon: <PenTool className="h-4 w-4" />, label: 'Toutes les notes', href: '/notes', badge: 40 },
    { icon: <Star className="h-4 w-4" />, label: 'Favoris', href: '/notes?filter=pinned', badge: 5 },
    { icon: <Calendar className="h-4 w-4" />, label: 'Récentes', href: '/notes?filter=recent' },
    { icon: <Archive className="h-4 w-4" />, label: 'Archivées', href: '/notes?filter=archived', badge: 3 },
    { icon: <Trash2 className="h-4 w-4" />, label: 'Corbeille', href: '/notes?filter=trash', badge: 2 }
  ]

  const toggleSection = (section: string) => {
    setExpandedSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    )
  }

  return (
      <aside className="h-full w-full bg-background border-r border-border overflow-hidden">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={session?.user?.image || ''} />
                <AvatarFallback>
                  {session?.user?.name?.charAt(0) || <User className="h-4 w-4" />}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="text-sm font-medium truncate max-w-32">
                  {session?.user?.name || 'Utilisateur'}
                </span>
                <span className="text-xs text-muted-foreground">Workspace</span>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={onToggle}
              className="md:hidden"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Search */}
          <div className="p-4 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Recherche rapide..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-9"
              />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-2 space-y-1">
              
              {/* Quick Actions */}
              <div className="mb-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleSection('workspace')}
                  className="w-full justify-start px-2 h-8 text-xs font-medium text-muted-foreground"
                >
                  {expandedSections.includes('workspace') ? (
                    <ChevronDown className="h-3 w-3 mr-1" />
                  ) : (
                    <ChevronRight className="h-3 w-3 mr-1" />
                  )}
                  WORKSPACE
                </Button>
                
                <AnimatePresence>
                  {expandedSections.includes('workspace') && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="ml-2 space-y-1"
                    >
                      {quickActions.map((action, index) => (
                        <Link key={index} href={action.href}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start px-2 h-8 text-sm hover:bg-accent"
                          >
                            <span className="mr-3">{action.icon}</span>
                            <span className="flex-1 text-left">{action.label}</span>
                            {action.badge && (
                              <Badge variant="secondary" className="h-5 text-xs">
                                {action.badge}
                              </Badge>
                            )}
                          </Button>
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Categories */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleSection('categories')}
                    className="flex-1 justify-start px-2 h-8 text-xs font-medium text-muted-foreground"
                  >
                    {expandedSections.includes('categories') ? (
                      <ChevronDown className="h-3 w-3 mr-1" />
                    ) : (
                      <ChevronRight className="h-3 w-3 mr-1" />
                    )}
                    CATÉGORIES
                  </Button>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
                
                <AnimatePresence>
                  {expandedSections.includes('categories') && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="ml-2 space-y-1"
                    >
                      {categories.map((category) => (
                        <Link key={category.id} href={`/notes?category=${category.id}`}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start px-2 h-8 text-sm hover:bg-accent"
                          >
                            <div 
                              className="w-3 h-3 rounded-full mr-3"
                              style={{ backgroundColor: category.color }}
                            />
                            <span className="flex-1 text-left">{category.name}</span>
                            <Badge variant="secondary" className="h-5 text-xs">
                              {category.noteCount}
                            </Badge>
                          </Button>
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Tags populaires */}
              <div className="mb-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleSection('tags')}
                  className="w-full justify-start px-2 h-8 text-xs font-medium text-muted-foreground"
                >
                  {expandedSections.includes('tags') ? (
                    <ChevronDown className="h-3 w-3 mr-1" />
                  ) : (
                    <ChevronRight className="h-3 w-3 mr-1" />
                  )}
                  TAGS POPULAIRES
                </Button>
                
                <AnimatePresence>
                  {expandedSections.includes('tags') && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="ml-2 space-y-1"
                    >
                      {['important', 'urgent', 'idée', 'projet', 'perso'].map((tag) => (
                        <Link key={tag} href={`/notes?tag=${tag}`}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start px-2 h-8 text-sm hover:bg-accent"
                          >
                            <Hash className="h-3 w-3 mr-3" />
                            <span className="flex-1 text-left">{tag}</span>
                          </Button>
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t p-4 space-y-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start px-2 h-8"
            >
              <Settings className="h-4 w-4 mr-3" />
              Paramètres
            </Button>
          </div>
        </div>
      </aside>
  )
}