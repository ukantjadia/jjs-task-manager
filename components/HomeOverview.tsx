'use client'

import { useEffect, useState } from 'react'
import { formatDate, parseDate } from '@/lib/utils/dateHelpers'
import type { Task } from '@/lib/types/task'
import TaskCreateForm from '@/components/TaskCreateForm'
import SheetConnectForm from '@/components/SheetConnectForm'
import { useState as useReactState } from 'react'
import { FloatingVoiceButton } from './voice/FloatingVoiceButton'
import { VoiceTaskPanel } from './voice/VoiceTaskPanel'

type DayKey = 'yesterday' | 'today' | 'tomorrow'

interface GroupedTasks {
  yesterday: Task[]
  today: Task[]
  tomorrow: Task[]
}

export default function HomeOverview() {
  const [sheetId, setSheetId] = useState<string | null>(null)
  const [tasks, setTasks] = useState<GroupedTasks>({
    yesterday: [],
    today: [],
    tomorrow: []
  })
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showConnectSheet, setShowConnectSheet] = useState(false)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [showVoicePanel, setShowVoicePanel] = useReactState(false)

  useEffect(() => {
    const init = async () => {
      try {
        const sheetRes = await fetch('/api/sheets/connect')
        const sheetData = await sheetRes.json()

        if (sheetData.connected && sheetData.sheet_id) {
          setSheetId(sheetData.sheet_id)
          await fetchTasks(sheetData.sheet_id)
        } else {
          setShowConnectSheet(true)
        }
      } catch (err) {
        console.error('Error loading homepage data:', err)
      } finally {
        setLoading(false)
      }
    }

    init()
  }, [])

  const fetchTasks = async (sid?: string) => {
    const id = sid || sheetId
    if (!id) return

    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const yesterday = new Date(today)
      yesterday.setDate(today.getDate() - 1)

      const tomorrow = new Date(today)
      tomorrow.setDate(today.getDate() + 1)

      const params = new URLSearchParams({
        sheet_id: id,
        from_date: formatDate(yesterday),
        to_date: formatDate(tomorrow)
      })

      const res = await fetch(`/api/tasks?${params}`)
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to load tasks')
      }

      const grouped: GroupedTasks = {
        yesterday: [],
        today: [],
        tomorrow: []
      }

      data.tasks.forEach((task: Task) => {
        if (!task.due_date) return
        const due = parseDate(task.due_date)
        const keyDate = new Date(today)

        keyDate.setHours(0, 0, 0, 0)
        const dueMid = new Date(due)
        dueMid.setHours(0, 0, 0, 0)

        const diffDays = Math.round((dueMid.getTime() - keyDate.getTime()) / (1000 * 60 * 60 * 24))

        if (diffDays === -1) grouped.yesterday.push(task)
        if (diffDays === 0) grouped.today.push(task)
        if (diffDays === 1) grouped.tomorrow.push(task)
      })

      setTasks(grouped)
    } catch (err) {
      console.error('Error fetching tasks for homepage:', err)
    }
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width - 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5
    setMousePos({ x, y })
  }

  const tableTransform = {
    transform: `translate3d(${mousePos.x * 32}px, ${mousePos.y * 32}px, 0) rotateX(${mousePos.y * -12}deg) rotateY(${mousePos.x * 12}deg)`,
    transition: 'transform 40ms linear'
  } as React.CSSProperties

  const renderEmptyState = (key: DayKey) => {
    const labels: Record<DayKey, { icon: string; text: string }> = {
      yesterday: { icon: '🕰️', text: 'Time-travel not needed, no tasks yesterday.' },
      today: { icon: '😎', text: 'You have a free day. Maybe add something fun?' },
      tomorrow: { icon: '🔮', text: 'Future is blank. Plan something awesome!' }
    }

    const item = labels[key]

    return (
      <div className="flex flex-col items-center justify-center py-6 text-center text-sm text-muted-foreground">
        <div className="text-3xl mb-2">{item.icon}</div>
        <p>{item.text}</p>
      </div>
    )
  }

  const hasAnyTasks =
    tasks.yesterday.length > 0 || tasks.today.length > 0 || tasks.tomorrow.length > 0

  return (
    <div className="relative">
      <div
        className="mt-8 mb-10 flex flex-col items-center"
        onMouseMove={handleMouseMove}
      >
        <div
          className="w-full max-w-5xl bg-card border border-border rounded-2xl shadow-xl p-6 md:p-8 backdrop-blur-md"
          style={tableTransform}
        >
          <div className="flex items-center justify-center mb-4">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2 text-center">
              <span>📅</span>
              <span>Today, Yesterday &amp; Tomorrow</span>
            </h2>
          </div>

          {!sheetId && (
            <div className="mb-4 text-sm text-muted-foreground">
              Connect a Google Sheet to see your upcoming tasks here.
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            {(['yesterday', 'today', 'tomorrow'] as DayKey[]).map((key) => (
              <div
                key={key}
                className="bg-background/70 border border-border rounded-xl p-4 flex flex-col min-h-[160px]"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-foreground capitalize">
                    {key}
                  </h3>
                  <span className="text-xs text-muted-foreground">
                    {tasks[key].length} task{tasks[key].length === 1 ? '' : 's'}
                  </span>
                </div>

                {tasks[key].length === 0 ? (
                  renderEmptyState(key)
                ) : (
                  <ul className="space-y-2 text-sm">
                    {tasks[key].slice(0, 5).map((task) => (
                      <li
                        key={task.task_id}
                        className="flex items-start gap-2 bg-card/80 border border-border rounded-lg px-3 py-2"
                      >
                        <span className="mt-[2px]">☑️</span>
                        <div className="flex-1">
                          <div className="font-medium text-foreground line-clamp-2">
                            {task.task_text}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1 flex flex-wrap gap-2">
                            {task.project_name && (
                              <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                                {task.project_name}
                              </span>
                            )}
                            {task.priority && (
                              <span className="px-1.5 py-0.5 rounded bg-accent/30 text-accent-foreground">
                                {task.priority}
                              </span>
                            )}
                          </div>
                        </div>
                      </li>
                    ))}
                    {tasks[key].length > 5 && (
                      <li className="text-xs text-muted-foreground mt-1">
                        + {tasks[key].length - 5} more
                      </li>
                    )}
                  </ul>
                )}
              </div>
            ))}
          </div>

          {!hasAnyTasks && sheetId && (
            <div className="mt-6 text-center text-sm text-muted-foreground">
              Looks suspiciously quiet. Click the floating checkbox to add your first task.
            </div>
          )}
        </div>
      </div>

      {showConnectSheet && (
        <div className="max-w-xl mx-auto mb-16">
          <SheetConnectForm />
        </div>
      )}

      {sheetId && (
        <>
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="fixed bottom-6 right-6 md:bottom-8 md:right-8 z-30 w-14 h-14 md:w-16 md:h-16 rounded-full bg-primary text-primary-foreground shadow-2xl flex items-center justify-center text-2xl md:text-3xl hover:scale-110 active:scale-95 transition-transform"
            aria-label="Add task"
          >
            ☑️
          </button>

          {showCreateModal && (
            <div
              className="fixed inset-0 z-40 bg-background/70 backdrop-blur-sm flex items-center justify-center px-4"
              onClick={() => setShowCreateModal(false)}
            >
              <div
                className="max-w-xl w-full"
                onClick={(e) => e.stopPropagation()}
              >
                <TaskCreateForm
                  sheetId={sheetId}
                  onTaskCreated={() => {
                    setShowCreateModal(false)
                    fetchTasks()
                  }}
                />
              </div>
            </div>
          )}

          <FloatingVoiceButton onOpen={() => setShowVoicePanel(true)} />

          <VoiceTaskPanel
            open={showVoicePanel}
            sheetId={sheetId}
            onClose={() => setShowVoicePanel(false)}
            onTasksCreated={() => fetchTasks()}
          />
        </>
      )}

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-background/80 rounded-full px-4 py-2 text-sm text-muted-foreground shadow">
            Loading your homepage...
          </div>
        </div>
      )}
    </div>
  )
}
