"use client"

import { useState } from 'react'
import { Sidebar } from './Sidebar'
import { Button } from '@/components/ui/button'
import { Menu } from 'lucide-react'
import { ModeToggle } from '@/components/ui/mode-toggle'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        ${sidebarOpen ? 'w-80' : 'w-0'} 
        md:w-80 
        transition-all duration-300 ease-in-out 
        flex-shrink-0
        ${!sidebarOpen ? 'overflow-hidden' : ''}
        ${sidebarOpen ? 'fixed md:relative z-50 md:z-auto' : 'relative'}
      `}>
        <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      </div>
      
      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center justify-between px-6 py-3 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold hidden sm:block">Mes Notes</h1>
          </div>
          
          <div className="flex items-center gap-2">
            <ModeToggle />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}