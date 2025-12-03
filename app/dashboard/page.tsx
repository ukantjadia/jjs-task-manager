'use client'

import { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import TaskCreateForm from '@/components/TaskCreateForm'
import TaskList from '@/components/TaskList'
import FilterModal from '@/components/FilterModal'
import { FilterState } from '@/components/Filters'
import SheetConnectForm from '@/components/SheetConnectForm'

export default function DashboardPage() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const [sheetId, setSheetId] = useState<string | null>(null)
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<FilterState>({ status: [] })
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false)

  useEffect(() => {
    if (isLoaded && !user) {
      router.push('/sign-in')
    }
  }, [isLoaded, user, router])

  useEffect(() => {
    checkSheetConnection()
  }, [])

  useEffect(() => {
    if (sheetId) {
      fetchTasks()
    }
  }, [sheetId, filters])

  const checkSheetConnection = async () => {
    try {
      const response = await fetch('/api/sheets/connect')
      const data = await response.json()

      if (data.connected && data.sheet_id) {
        setSheetId(data.sheet_id)
      }
    } catch (err) {
      console.error('Error checking sheet connection:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchTasks = async () => {
    try {
      const params = new URLSearchParams({ sheet_id: sheetId! })

      if (filters.status.length > 0) {
        params.append('status', filters.status.join(','))
      }
      if (filters.relevancy) {
        params.append('relevancy', filters.relevancy)
      }
      if (filters.dateRange === 'overdue') {
        params.append('overdue', 'true')
      }

      const response = await fetch(`/api/tasks?${params}`)
      const data = await response.json()

      if (response.ok) {
        setTasks(data.tasks || [])
      }
    } catch (err) {
      console.error('Error fetching tasks:', err)
    }
  }

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!sheetId) {
    return (
      <div className="min-h-screen bg-background">
        <nav className="bg-card shadow-sm border-b border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <h1 className="text-xl font-bold text-foreground">Task Manager</h1>
            </div>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <SheetConnectForm />
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="bg-card shadow-sm border-b border-border sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <h1 className="text-xl font-bold text-foreground">Task Manager</h1>
            <div className="flex gap-4">
              <a href="/projects" className="text-muted-foreground hover:text-foreground transition-colors">
                Projects
              </a>
              <a href="/summary" className="text-muted-foreground hover:text-foreground transition-colors">
                Summary
              </a>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <TaskCreateForm sheetId={sheetId} onTaskCreated={fetchTasks} />
        </div>

        <div>
          <div className="mb-4 flex flex-wrap justify-between items-center gap-3">
            <h2 className="text-2xl font-bold text-foreground">
              Tasks ({tasks.length})
            </h2>
            <div className="flex gap-2">
              <button
                onClick={() => setIsFilterModalOpen(true)}
                className="text-sm px-3 py-1.5 bg-secondary text-secondary-foreground rounded-lg hover:opacity-90 transition-opacity flex items-center gap-1.5"
              >
                <span>🔍</span>
                <span>Filters</span>
                {(filters.status.length > 0 || filters.relevancy || filters.dateRange || filters.project) && (
                  <span className="bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded-full">
                    {[
                      filters.status.length,
                      filters.relevancy ? 1 : 0,
                      filters.dateRange ? 1 : 0,
                      filters.project ? 1 : 0
                    ].reduce((a, b) => a + b, 0)}
                  </span>
                )}
              </button>
              <button
                onClick={fetchTasks}
                className="text-sm px-3 py-1.5 bg-secondary text-secondary-foreground rounded-lg hover:opacity-90 transition-opacity flex items-center gap-1.5"
              >
                <span>🔄</span>
                <span>Refresh</span>
              </button>
            </div>
          </div>
          <TaskList tasks={tasks} sheetId={sheetId} onTaskUpdated={fetchTasks} />
        </div>

        <FilterModal
          key={isFilterModalOpen ? 'open' : 'closed'} // Force remount when opening
          isOpen={isFilterModalOpen}
          onClose={() => setIsFilterModalOpen(false)}
          filters={filters}
          onFilterChange={setFilters}
          onApply={fetchTasks}
        />
      </main>
    </div>
  )
}
