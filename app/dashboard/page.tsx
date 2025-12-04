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
  const [showConnectSheet, setShowConnectSheet] = useState(false)

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
      } else {
        setShowConnectSheet(true)
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
      <div className="bg-background flex items-center justify-center py-24">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-background">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {showConnectSheet && (
          <div className="mb-10 flex justify-center">
            <SheetConnectForm />
          </div>
        )}

        <div className="mb-8 max-w-3xl mx-auto">
          <TaskCreateForm sheetId={sheetId || undefined} onTaskCreated={fetchTasks} />
        </div>

        <div className="max-w-5xl mx-auto">
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
          <TaskList tasks={tasks} sheetId={sheetId || undefined} onTaskUpdated={fetchTasks} />
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
