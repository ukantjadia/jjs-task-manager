'use client'

import type { ParsedVoiceTask } from '@/lib/types/voice'

interface ParsedTaskListProps {
  tasks: ParsedVoiceTask[]
  selectedTaskIds: string[]
  onToggleTask: (id: string) => void
  onUpdateTask: (id: string, patch: Partial<ParsedVoiceTask>) => void
}

export function ParsedTaskList({
  tasks,
  selectedTaskIds,
  onToggleTask,
  onUpdateTask
}: ParsedTaskListProps) {
  if (tasks.length === 0) {
    return (
      <div className="text-xs text-muted-foreground border border-dashed border-border rounded-lg px-3 py-2">
        No tasks parsed yet. Edit the transcript and click &quot;Regenerate tasks&quot;, or speak with
        markers like &quot;task one&quot;, &quot;next task&quot;, &quot;new task&quot;.
      </div>
    )
  }

  return (
    <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
      {tasks.map((task) => {
        const selected = selectedTaskIds.includes(task.id)
        return (
          <div
            key={task.id}
            className={`flex items-start gap-2 rounded-lg border px-2 py-2 text-xs ${
              selected ? 'border-primary bg-primary/5' : 'border-border bg-card/60'
            }`}
          >
            <input
              type="checkbox"
              checked={selected}
              onChange={() => onToggleTask(task.id)}
              className="mt-1 w-4 h-4 rounded border-input focus:ring-1 focus:ring-ring"
            />
            <div className="flex-1 space-y-1">
              <textarea
                value={task.description}
                onChange={(e) =>
                  onUpdateTask(task.id, {
                    description: e.target.value
                  })
                }
                rows={2}
                className="w-full px-2 py-1 bg-background text-foreground border border-input rounded-md text-xs focus:ring-1 focus:ring-ring resize-y"
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
