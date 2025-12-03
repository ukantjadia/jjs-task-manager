'use client'

import { useState, useMemo } from 'react'

interface Task {
  task_id: string
  task_text: string
  project_name: string | null
  status: string
  priority: string | null
  due_date: string | null
  task_created_at: string
}

interface TaskListProps {
  tasks: Task[]
  sheetId: string
  onTaskUpdated?: () => void
}

type ViewMode = 'list' | 'grid'
type GroupBy = 'none' | 'project' | 'status' | 'priority'

export default function TaskList({ tasks, sheetId, onTaskUpdated }: TaskListProps) {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [groupBy, setGroupBy] = useState<GroupBy>('none')

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sheet_id: sheetId,
          status: newStatus
        })
      })

      if (!response.ok) throw new Error('Failed to update task')

      if (onTaskUpdated) onTaskUpdated()
    } catch (err) {
      console.error('Error updating task:', err)
    }
  }

  const getPriorityColor = (priority: string | null) => {
    switch (priority) {
      case 'High': return 'text-destructive'
      case 'Medium': return 'text-accent-foreground'
      case 'Low': return 'text-muted-foreground'
      default: return 'text-muted-foreground'
    }
  }

  const isOverdue = (dueDate: string | null, status: string) => {
    if (!dueDate || ['Finished', 'Closed', 'Dropped'].includes(status)) return false
    return new Date(dueDate) < new Date()
  }

  // Group tasks based on groupBy option
  const groupedTasks = useMemo(() => {
    if (groupBy === 'none') {
      return { 'All Tasks': tasks }
    }

    const groups: Record<string, Task[]> = {}

    tasks.forEach(task => {
      let key = 'Uncategorized'

      if (groupBy === 'project') {
        key = task.project_name || 'No Project'
      } else if (groupBy === 'status') {
        key = task.status
      } else if (groupBy === 'priority') {
        key = task.priority || 'No Priority'
      }

      if (!groups[key]) {
        groups[key] = []
      }
      groups[key].push(task)
    })

    return groups
  }, [tasks, groupBy])


  if (tasks.length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg shadow-lg p-12 text-center">
        <p className="text-muted-foreground text-lg">No tasks yet</p>
        <p className="text-sm text-muted-foreground mt-2">Create your first task above!</p>
      </div>
    )
  }

  const renderTaskCard = (task: Task) => (
    <div
      key={task.task_id}
      className={`bg-card border border-border rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer ${
        viewMode === 'grid'
          ? 'p-4'
          : 'p-4'
      }`}
      onClick={() => setSelectedTask(task)}
    >
      <div className={`flex items-start gap-3 ${viewMode === 'grid' ? 'flex-col' : ''}`}>
        <input
          type="checkbox"
          checked={task.status === 'Finished'}
          onChange={(e) => {
            e.stopPropagation()
            handleStatusChange(task.task_id, e.target.checked ? 'Finished' : 'Started')
          }}
          className="mt-1 w-5 h-5 rounded border-input focus:ring-2 focus:ring-ring flex-shrink-0"
        />

        <div className="flex-1 min-w-0">
          <p
            className={`text-foreground font-medium ${
              task.status === 'Finished' ? 'line-through opacity-60' : ''
            } ${
              viewMode === 'grid'
                ? 'line-clamp-3 text-sm'
                : 'line-clamp-2'
            }`}
            title={task.task_text}
          >
            {task.task_text}
          </p>

          <div className={`flex flex-wrap gap-2 mt-2 text-xs sm:text-sm ${
            viewMode === 'grid' ? 'flex-col' : ''
          }`}>
            {task.project_name && (
              <span className="bg-primary/10 text-primary px-2 py-1 rounded inline-block">
                {task.project_name}
              </span>
            )}

            {task.priority && (
              <span className={`${getPriorityColor(task.priority)} font-medium inline-block`}>
                {task.priority}
              </span>
            )}

            {task.due_date && (
              <span className={isOverdue(task.due_date, task.status) ? 'text-destructive font-medium' : 'text-muted-foreground'}>
                {isOverdue(task.due_date, task.status) ? '⚠️ ' : '📅 '}
                {new Date(task.due_date).toLocaleDateString()}
              </span>
            )}

            <span className="text-muted-foreground">
              {task.status}
            </span>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="space-y-4">
      {/* View Controls */}
      <div className="flex flex-wrap gap-3 items-center justify-between bg-card border border-border rounded-lg p-3">
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm text-muted-foreground font-medium">View:</span>
          <div className="flex gap-1 border border-input rounded-lg p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 text-sm rounded transition-colors ${
                viewMode === 'list'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              List
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1 text-sm rounded transition-colors ${
                viewMode === 'grid'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Grid
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm text-muted-foreground font-medium">Group by:</span>
          <select
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value as GroupBy)}
            className="px-3 py-1 text-sm bg-background text-foreground border border-input rounded-lg focus:ring-2 focus:ring-ring"
          >
            <option value="none">None</option>
            <option value="project">Project</option>
            <option value="status">Status</option>
            <option value="priority">Priority</option>
          </select>
        </div>
      </div>

      {/* Task Display */}
      {groupBy === 'none' ? (
        <div className={viewMode === 'grid'
          ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'
          : 'space-y-3'
        }>
          {tasks.map(renderTaskCard)}
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedTasks).map(([groupName, groupTasks]) => (
            <div key={groupName}>
              <h3 className="text-lg font-semibold text-foreground mb-3 pb-2 border-b border-border">
                {groupName} ({groupTasks.length})
              </h3>
              <div className={viewMode === 'grid'
                ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'
                : 'space-y-3'
              }>
                {groupTasks.map(renderTaskCard)}
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedTask && (
        <TaskEditModal
          task={selectedTask}
          sheetId={sheetId}
          onClose={() => setSelectedTask(null)}
          onUpdated={onTaskUpdated}
        />
      )}

      {selectedTask && (
        <TaskEditModal
          task={selectedTask}
          sheetId={sheetId}
          onClose={() => setSelectedTask(null)}
          onUpdated={onTaskUpdated}
        />
      )}
    </div>
  )
}

function TaskEditModal({ task, sheetId, onClose, onUpdated }: {
  task: Task
  sheetId: string
  onClose: () => void
  onUpdated?: () => void
}) {
  const [taskText, setTaskText] = useState(task.task_text)
  const [status, setStatus] = useState(task.status)
  const [priority, setPriority] = useState(task.priority || '')
  const [dueDate, setDueDate] = useState(task.due_date || '')
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/tasks/${task.task_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sheet_id: sheetId,
          task_text: taskText,
          status,
          priority: priority || null,
          due_date: dueDate || null
        })
      })

      if (!response.ok) throw new Error('Failed to update task')

      if (onUpdated) onUpdated()
      onClose()
    } catch (err) {
      console.error('Error updating task:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this task?')) return

    try {
      const response = await fetch(`/api/tasks/${task.task_id}?sheet_id=${sheetId}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to delete task')

      if (onUpdated) onUpdated()
      onClose()
    } catch (err) {
      console.error('Error deleting task:', err)
    }
  }

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-card border border-border rounded-lg shadow-xl p-6 max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-xl font-bold text-foreground">Edit Task</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-2xl">
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Task Text</label>
            <input
              type="text"
              value={taskText}
              onChange={(e) => setTaskText(e.target.value)}
              className="w-full px-4 py-2 bg-background text-foreground border border-input rounded-lg focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 bg-background text-foreground border border-input rounded-lg focus:ring-2 focus:ring-ring"
              >
                <option value="Started">Started</option>
                <option value="In Progress">In Progress</option>
                <option value="On Hold">On Hold</option>
                <option value="Blocked">Blocked</option>
                <option value="Nearly Finished">Nearly Finished</option>
                <option value="Finished">Finished</option>
                <option value="Closed">Closed</option>
                <option value="Dropped">Dropped</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-3 py-2 bg-background text-foreground border border-input rounded-lg focus:ring-2 focus:ring-ring"
              >
                <option value="">Not Set</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 bg-background text-foreground border border-input rounded-lg focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex-1 bg-primary text-primary-foreground px-6 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground px-6 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity"
            >
              Delete
            </button>
            <button
              onClick={onClose}
              className="bg-secondary text-secondary-foreground px-6 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
