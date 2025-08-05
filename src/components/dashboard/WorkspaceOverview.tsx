"use client"

import { useState, useEffect } from 'react'
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  PenTool, 
  Star, 
  Calendar, 
  TrendingUp,
  Clock,
  Archive,
  Tag,
  Folder,
  BarChart3,
  ArrowUpRight
} from 'lucide-react'
import Link from 'next/link'

interface WorkspaceStats {
  totalNotes: number
  pinnedNotes: number
  recentNotes: number
  categoriesCount: number
  tagsCount: number
  todaysNotes: number
}

interface RecentNote {
  id: string
  title: string
  updatedAt: Date
  category?: {
    name: string
    color: string
  }
}

export function WorkspaceOverview() {
  const { data: session } = useSession()
  const [stats, setStats] = useState<WorkspaceStats>({
    totalNotes: 0,
    pinnedNotes: 0,
    recentNotes: 0,
    categoriesCount: 0,
    tagsCount: 0,
    todaysNotes: 0
  })
  const [recentNotes, setRecentNotes] = useState<RecentNote[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (session?.user?.id) {
      fetchWorkspaceData()
    }
  }, [session])

  const fetchWorkspaceData = async () => {
    try {
      // Fetch stats
      const statsResponse = await fetch('/api/notes/stats')
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setStats(statsData.stats)
      }

      // Fetch recent notes
      const notesResponse = await fetch('/api/notes?limit=5&sort=recent')
      if (notesResponse.ok) {
        const notesData = await notesResponse.json()
        setRecentNotes(notesData.notes)
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error)
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    {
      title: 'Total Notes',
      value: stats.totalNotes,
      icon: <PenTool className="h-4 w-4" />,
      color: 'text-blue-600',
      href: '/notes'
    },
    {
      title: 'Épinglées',
      value: stats.pinnedNotes,
      icon: <Star className="h-4 w-4" />,
      color: 'text-yellow-600',
      href: '/notes?filter=pinned'
    },
    {
      title: "Aujourd'hui",
      value: stats.todaysNotes,
      icon: <Calendar className="h-4 w-4" />,
      color: 'text-green-600',
      href: '/notes?filter=today'
    },
    {
      title: 'Catégories',
      value: stats.categoriesCount,
      icon: <Folder className="h-4 w-4" />,
      color: 'text-purple-600',
      href: '/notes?view=categories'
    }
  ]

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-3">
              <div className="h-4 bg-muted rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Salutation */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          Bonjour, {session?.user?.name?.split(' ')[0] || 'Utilisateur'} 👋
        </h1>
        <p className="text-muted-foreground">
          Voici un aperçu de votre workspace
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <Link key={index} href={stat.href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <div className={stat.color}>
                  {stat.icon}
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="flex items-center text-xs text-muted-foreground mt-1">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  <span>Par rapport à hier</span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Notes récentes */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Notes récentes</CardTitle>
            <Link href="/notes">
              <Button variant="ghost" size="sm">
                Voir tout
                <ArrowUpRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentNotes.length > 0 ? (
              recentNotes.map((note) => (
                <Link key={note.id} href={`/notes/${note.id}`}>
                  <div className="flex items-center justify-between p-3 hover:bg-accent rounded-lg transition-colors cursor-pointer">
                    <div className="flex-1">
                      <h4 className="font-medium truncate">{note.title}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {new Date(note.updatedAt).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                        {note.category && (
                          <Badge 
                            variant="secondary" 
                            className="text-xs"
                            style={{ backgroundColor: `${note.category.color}20` }}
                          >
                            {note.category.name}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <PenTool className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Aucune note récente</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Activité de la semaine */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Activité cette semaine</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-blue-600" />
                  <span className="text-sm">Notes créées</span>
                </div>
                <Badge variant="secondary">12</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm">Notes épinglées</span>
                </div>
                <Badge variant="secondary">3</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Archive className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Notes archivées</span>
                </div>
                <Badge variant="secondary">1</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-purple-600" />
                  <span className="text-sm">Nouveaux tags</span>
                </div>
                <Badge variant="secondary">5</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}