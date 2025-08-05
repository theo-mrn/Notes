"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  MoreHorizontal,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Trash2,
  Edit,
  Copy
} from 'lucide-react'

interface Event {
  id: string
  title: string
  date: Date
  time?: string
  description?: string
  color?: string
  type?: 'event' | 'task' | 'reminder'
}

interface CalendarBlockProps {
  id: string
  data: {
    events: Event[]
    view: 'month' | 'week' | 'agenda'
    currentDate: Date
  }
  onUpdate: (id: string, data: any) => void
  onDelete: (id: string) => void
}

export function CalendarBlock({ id, data, onUpdate, onDelete }: CalendarBlockProps) {
  const [view, setView] = useState(data.view || 'month')
  const [currentDate, setCurrentDate] = useState(data.currentDate || new Date())
  const [events, setEvents] = useState<Event[]>(data.events || [
    {
      id: '1',
      title: 'Réunion équipe',
      date: new Date(),
      time: '14:00',
      color: '#3b82f6',
      type: 'event'
    },
    {
      id: '2',
      title: 'Finir le rapport',
      date: new Date(Date.now() + 86400000),
      color: '#ef4444',
      type: 'task'
    }
  ])

  const months = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ]

  const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []
    
    // Jours du mois précédent
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const prevDate = new Date(year, month, -i)
      days.push({ date: prevDate, isCurrentMonth: false })
    }
    
    // Jours du mois courant
    for (let day = 1; day <= daysInMonth; day++) {
      days.push({ date: new Date(year, month, day), isCurrentMonth: true })
    }
    
    // Jours du mois suivant pour compléter la grille
    const totalCells = Math.ceil(days.length / 7) * 7
    for (let day = 1; days.length < totalCells; day++) {
      days.push({ date: new Date(year, month + 1, day), isCurrentMonth: false })
    }
    
    return days
  }

  const getEventsForDate = (date: Date) => {
    return events.filter(event => 
      event.date.toDateString() === date.toDateString()
    )
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate)
    newDate.setMonth(currentDate.getMonth() + (direction === 'next' ? 1 : -1))
    setCurrentDate(newDate)
    onUpdate(id, { events, view, currentDate: newDate })
  }

  const addEvent = () => {
    const newEvent: Event = {
      id: Date.now().toString(),
      title: 'Nouvel événement',
      date: new Date(),
      color: '#3b82f6',
      type: 'event'
    }
    const newEvents = [...events, newEvent]
    setEvents(newEvents)
    onUpdate(id, { events: newEvents, view, currentDate })
  }

  const monthDays = getDaysInMonth(currentDate)

  return (
    <div className="my-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <CardTitle className="text-lg">
                {months[currentDate.getMonth()]} {currentDate.getFullYear()}
              </CardTitle>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigateMonth('prev')}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigateMonth('next')}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={addEvent}
              >
                <Plus className="h-3 w-3 mr-1" />
                Événement
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setView('month')}>
                    Vue mois
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setView('week')}>
                    Vue semaine
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setView('agenda')}>
                    Vue agenda
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onDelete(id)} className="text-destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Supprimer
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {view === 'month' && (
            <div className="space-y-2">
              {/* En-têtes des jours */}
              <div className="grid grid-cols-7 gap-1">
                {days.map((day) => (
                  <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
                    {day}
                  </div>
                ))}
              </div>
              
              {/* Grille du calendrier */}
              <div className="grid grid-cols-7 gap-1">
                {monthDays.map((day, index) => {
                  const dayEvents = getEventsForDate(day.date)
                  const isToday = day.date.toDateString() === new Date().toDateString()
                  
                  return (
                    <div
                      key={index}
                      className={`min-h-[80px] p-1 border rounded text-sm ${
                        day.isCurrentMonth 
                          ? 'bg-background' 
                          : 'bg-muted/50 text-muted-foreground'
                      } ${isToday ? 'ring-2 ring-primary' : ''}`}
                    >
                      <div className={`font-medium mb-1 ${isToday ? 'text-primary' : ''}`}>
                        {day.date.getDate()}
                      </div>
                      <div className="space-y-1">
                        {dayEvents.slice(0, 2).map((event) => (
                          <div
                            key={event.id}
                            className="px-1 py-0.5 rounded text-xs truncate"
                            style={{ backgroundColor: event.color + '20', color: event.color }}
                          >
                            {event.title}
                          </div>
                        ))}
                        {dayEvents.length > 2 && (
                          <div className="text-xs text-muted-foreground">
                            +{dayEvents.length - 2} autres
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
          
          {view === 'agenda' && (
            <div className="space-y-3">
              {events
                .sort((a, b) => a.date.getTime() - b.date.getTime())
                .map((event) => (
                  <div key={event.id} className="flex items-start gap-3 p-3 border rounded">
                    <div 
                      className="w-3 h-3 rounded-full mt-1 flex-shrink-0"
                      style={{ backgroundColor: event.color }}
                    />
                    <div className="flex-1">
                      <div className="font-medium">{event.title}</div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                        <div className="flex items-center gap-1">
                          <CalendarIcon className="h-3 w-3" />
                          {event.date.toLocaleDateString('fr-FR')}
                        </div>
                        {event.time && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {event.time}
                          </div>
                        )}
                        <Badge variant="secondary" className="text-xs">
                          {event.type === 'event' ? 'Événement' : 
                           event.type === 'task' ? 'Tâche' : 'Rappel'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              
              {events.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <CalendarIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Aucun événement planifié</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}