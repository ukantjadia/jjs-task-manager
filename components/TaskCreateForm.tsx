'use client'

import { useState } from 'react'

interface TaskCreateFormProps {
  sheetId: string
  onTaskCreated?: () => void
}

export default function TaskCreateForm({ sheetId, onTaskCreated }: TaskCreateFormProps) {
  const [taskText, setTaskText] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [priority, setPriority] = useState<'Low' | 'Medium' | 'High' | ''>('')
  const [dueDate, setDueDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sheet_id: sheetId,
          raw_text: taskText,
          priority: priority || undefined,
          due_date: dueDate || undefined
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create task')
      }

      // Reset form
      setTaskText('')
      setPriority('')
      setDueDate('')
      setShowAdvanced(false)
      
      if (onTaskCreated) onTaskCreated()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-card border border-border rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-bold text-foreground mb-4">
        ➕ Quick Add Task
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <input
            type="text"
            value={taskText}
            onChange={(e) => setTaskText(e.target.value)}
            placeholder="project: task description"
            className="w-full px-4 py-3 bg-background text-foreground border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent text-lg"
            required
          />
          <p className="text-xs text-muted-foreground mt-1">
            Tip: Start with project keyword (e.g., "capra: write outline")
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          {showAdvanced ? '▼' : '▶'} Advanced Options
        </button>

        {showAdvanced && (
          <div className="space-y-4 p-4 bg-muted rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="w-full px-3 py-2 bg-background text-foreground border border-input rounded-lg focus:ring-2 focus:ring-ring"
                >
                  <option value="">Not Set</option>
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Due Date
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 bg-background text-foreground border border-input rounded-lg focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {loading ? 'Creating...' : 'Create Task'}
        </button>
      </form>
    </div>
  )
}
