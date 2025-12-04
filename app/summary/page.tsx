'use client'

import { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { formatDate, parseDate } from '@/lib/utils/dateHelpers'
import { format } from 'date-fns'
import type { DailySummary } from '@/lib/types/log'

type DateRangePreset = 'today' | 'last7days' | 'last30days' | 'custom'

export default function SummaryPage() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const [sheetId, setSheetId] = useState<string | null>(null)
  const [summary, setSummary] = useState<DailySummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [datePreset, setDatePreset] = useState<DateRangePreset>('today')
  const [customFromDate, setCustomFromDate] = useState(formatDate(new Date()))
  const [customToDate, setCustomToDate] = useState(formatDate(new Date()))

  useEffect(() => {
    if (isLoaded && !user) {
      router.push('/sign-in')
    }
  }, [isLoaded, user, router])

  useEffect(() => {
    checkSheetConnection()
  }, [])

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

  useEffect(() => {
    if (!sheetId) return

    const getDateRange = () => {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      switch (datePreset) {
        case 'today':
          const todayStr = formatDate(today)
          return { from: todayStr, to: todayStr }
        case 'last7days':
          const sevenDaysAgo = new Date(today)
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
          return { from: formatDate(sevenDaysAgo), to: formatDate(today) }
        case 'last30days':
          const thirtyDaysAgo = new Date(today)
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29)
          return { from: formatDate(thirtyDaysAgo), to: formatDate(today) }
        case 'custom':
          return { from: customFromDate, to: customToDate }
        default:
          const todayStr2 = formatDate(today)
          return { from: todayStr2, to: todayStr2 }
      }
    }

    const fetchSummary = async () => {
      try {
        setLoading(true)
        const dateRange = getDateRange()
        const params = new URLSearchParams({
          sheet_id: sheetId,
          from_date: dateRange.from,
          to_date: dateRange.to
        })

        const response = await fetch(`/api/logs/summary?${params}`)
        const data = await response.json()

        if (response.ok && data.summary) {
          setSummary(data.summary)
        } else {
          console.error('Error fetching summary:', data.error)
        }
      } catch (err) {
        console.error('Error fetching summary:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchSummary()
  }, [sheetId, datePreset, customFromDate, customToDate])

  const getActionEmoji = (action: string) => {
    switch (action) {
      case 'CREATE': return '✏️'
      case 'UPDATE': return '📝'
      case 'READ': return '👁️'
      default: return '📌'
    }
  }

  const formatDateTime = (timestamp: string) => {
    try {
      return format(parseDate(timestamp), 'MMM d, yyyy h:mm a')
    } catch {
      return timestamp
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

  if (!sheetId) {
    return (
      <div className="bg-background">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-card border border-border rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-foreground mb-4 text-center">No Sheet Connected</h2>
            <p className="text-muted-foreground mb-4 text-center">
              Please connect a Google Sheet first to view your summary.
            </p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="bg-background">
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold text-foreground mb-6">📊 Activity Summary</h2>

          {/* Date Range Selector */}
          <div className="bg-card border border-border rounded-lg p-4 mb-6 inline-block text-left">
            <label className="block text-sm font-medium text-foreground mb-3">
              Date Range
            </label>
            <div className="flex flex-wrap gap-3 mb-4">
              <button
                onClick={() => setDatePreset('today')}
                className={`px-4 py-2 rounded-md transition-colors ${
                  datePreset === 'today'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                Today
              </button>
              <button
                onClick={() => setDatePreset('last7days')}
                className={`px-4 py-2 rounded-md transition-colors ${
                  datePreset === 'last7days'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                Last 7 Days
              </button>
              <button
                onClick={() => setDatePreset('last30days')}
                className={`px-4 py-2 rounded-md transition-colors ${
                  datePreset === 'last30days'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                Last 30 Days
              </button>
              <button
                onClick={() => setDatePreset('custom')}
                className={`px-4 py-2 rounded-md transition-colors ${
                  datePreset === 'custom'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                Custom Range
              </button>
            </div>

            {datePreset === 'custom' && (
              <div className="flex gap-4">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">From</label>
                  <input
                    type="date"
                    value={customFromDate}
                    onChange={(e) => setCustomFromDate(e.target.value)}
                    className="px-3 py-2 border border-border rounded-md bg-background text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">To</label>
                  <input
                    type="date"
                    value={customToDate}
                    onChange={(e) => setCustomToDate(e.target.value)}
                    className="px-3 py-2 border border-border rounded-md bg-background text-foreground"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {summary && (
          <div className="space-y-6">
            {/* Date Range Display */}
            <div className="bg-card border border-border rounded-lg p-4">
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {summary.date
                  ? `Summary for ${format(parseDate(summary.date), 'MMMM d, yyyy')}`
                  : `Summary from ${format(parseDate(summary.date_range.from), 'MMM d')} to ${format(parseDate(summary.date_range.to), 'MMM d, yyyy')}`
                }
              </h3>
            </div>

            {/* Overall Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-card border border-border rounded-lg p-4">
                <div className="text-sm text-muted-foreground mb-1">Tasks Touched</div>
                <div className="text-2xl font-bold text-foreground">
                  {summary.overall_stats.total_tasks_touched}
                </div>
              </div>
              <div className="bg-card border border-border rounded-lg p-4">
                <div className="text-sm text-muted-foreground mb-1">Tasks Created</div>
                <div className="text-2xl font-bold text-primary">
                  {summary.overall_stats.tasks_created}
                </div>
              </div>
              <div className="bg-card border border-border rounded-lg p-4">
                <div className="text-sm text-muted-foreground mb-1">Tasks Completed</div>
                <div className="text-2xl font-bold text-green-600">
                  {summary.overall_stats.tasks_completed}
                </div>
              </div>
              <div className="bg-card border border-border rounded-lg p-4">
                <div className="text-sm text-muted-foreground mb-1">Completion Rate</div>
                <div className="text-2xl font-bold text-foreground">
                  {summary.overall_stats.completion_rate.toFixed(1)}%
                </div>
              </div>
            </div>

            {/* Tasks Touched */}
            {summary.tasks_touched.length > 0 && (
              <div className="bg-card border border-border rounded-lg p-6">
                <h3 className="text-xl font-bold text-foreground mb-4">
                  Tasks Touched ({summary.tasks_touched.length})
                </h3>
                <div className="space-y-3">
                  {summary.tasks_touched.map((task, idx) => (
                    <div
                      key={`task-touched-${task.task_id}-${task.timestamp}-${idx}`}
                      className="border-b border-border pb-3 last:border-b-0 last:pb-0"
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-xl">{getActionEmoji(task.action)}</span>
                        <div className="flex-1">
                          <div className="font-medium text-foreground">{task.task_text}</div>
                          <div className="text-sm text-muted-foreground mt-1">
                            {task.action} • {formatDateTime(task.timestamp)}
                            {task.change && ` • ${task.change}`}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Overdue Tasks */}
            {summary.overdue_tasks.length > 0 && (
              <div className="bg-card border border-red-300 rounded-lg p-6">
                <h3 className="text-xl font-bold text-red-600 mb-4">
                  ⚠️ Overdue Tasks ({summary.overdue_tasks.length})
                </h3>
                <div className="space-y-3">
                  {summary.overdue_tasks.map((task) => (
                    <div
                      key={task.task_id}
                      className="border-b border-red-200 pb-3 last:border-b-0 last:pb-0"
                    >
                      <div className="font-medium text-foreground">{task.task_text}</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        Due: {format(parseDate(task.due_date), 'MMM d, yyyy')} •
                        {task.days_overdue} {task.days_overdue === 1 ? 'day' : 'days'} overdue •
                        {task.project_name || 'No Project'} • Status: {task.status}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* By Project */}
            {Object.keys(summary.by_project).length > 0 && (
              <div className="bg-card border border-border rounded-lg p-6">
                <h3 className="text-xl font-bold text-foreground mb-4">By Project</h3>
                <div className="space-y-4">
                  {Object.entries(summary.by_project).map(([projectName, stats], idx) => (
                    <div key={`project-${projectName}-${idx}`} className="border-b border-border pb-4 last:border-b-0 last:pb-0">
                      <div className="font-semibold text-foreground mb-2">{projectName}</div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Touched: </span>
                          <span className="font-medium text-foreground">{stats.tasks_touched}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Created: </span>
                          <span className="font-medium text-primary">{stats.tasks_created}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Completed: </span>
                          <span className="font-medium text-green-600">{stats.tasks_completed}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* By Relevancy */}
            {Object.keys(summary.by_relevancy).length > 0 && (
              <div className="bg-card border border-border rounded-lg p-6">
                <h3 className="text-xl font-bold text-foreground mb-4">By Relevancy</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {Object.entries(summary.by_relevancy).map(([relevancy, stats], idx) => (
                    <div key={`relevancy-${relevancy}-${idx}`} className="border border-border rounded-lg p-4">
                      <div className="text-sm text-muted-foreground mb-1 capitalize">{relevancy}</div>
                      <div className="text-2xl font-bold text-foreground mb-1">
                        {stats.tasks_touched}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {stats.percentage.toFixed(1)}% of total
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {summary.tasks_touched.length === 0 && summary.overdue_tasks.length === 0 && (
              <div className="bg-card border border-border rounded-lg p-12 text-center">
                <div className="text-4xl mb-4">📝</div>
                <h3 className="text-xl font-semibold text-foreground mb-2">No Activity Found</h3>
                <p className="text-muted-foreground">
                  No tasks were touched in the selected date range.
                </p>
              </div>
            )}
          </div>
        )}

        {!summary && !loading && (
          <div className="bg-card border border-border rounded-lg p-12 text-center">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-xl font-semibold text-foreground mb-2">No Summary Available</h3>
            <p className="text-muted-foreground">
              Unable to load summary data. Please try again.
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
