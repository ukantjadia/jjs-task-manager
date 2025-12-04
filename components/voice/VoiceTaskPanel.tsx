'use client'

import { useEffect, useRef, useState } from 'react'
import { VoiceStatus, type ParsedVoiceTask } from '@/lib/types/voice'
import { VoiceStatusIndicator } from './VoiceStatusIndicator'
import { RecordToggleButton } from './RecordToggleButton'
import { TranscriptEditor } from './TranscriptEditor'
import { ParsedTaskList } from './ParsedTaskList'

interface VoiceTaskPanelProps {
  open: boolean
  sheetId: string | null
  onClose: () => void
  onTasksCreated?: () => void
}

export function VoiceTaskPanel({ open, sheetId, onClose, onTasksCreated }: VoiceTaskPanelProps) {
  const [status, setStatus] = useState<VoiceStatus>('ready')
  const [error, setError] = useState<string | null>(null)
  const [transcriptRaw, setTranscriptRaw] = useState('')
  const [transcriptEditable, setTranscriptEditable] = useState('')
  const [parsedTasks, setParsedTasks] = useState<ParsedVoiceTask[]>([])
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([])
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<BlobPart[]>([])

  useEffect(() => {
    if (!open) {
      reset()
    }
  }, [open])

  const reset = () => {
    setStatus('ready')
    setError(null)
    setTranscriptRaw('')
    setTranscriptEditable('')
    setParsedTasks([])
    setSelectedTaskIds([])
    chunksRef.current = []
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
  }

  const startRecording = async () => {
    try {
      setError(null)
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      chunksRef.current = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data)
        }
      }

      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop())
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        await uploadAndTranscribe(blob)
      }

      mediaRecorderRef.current = recorder
      recorder.start()
      setStatus('recording')
    } catch (err: any) {
      console.error('Recording error:', err)
      setError('Failed to access microphone. Please allow microphone permission.')
      setStatus('error')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop()
      setStatus('uploading')
    }
  }

  const uploadAndTranscribe = async (blob: Blob) => {
    try {
      setStatus('transcribing')
      const formData = new FormData()
      formData.append('audio', blob, 'voice-task.webm')

      const res = await fetch('/api/voice/transcribe', {
        method: 'POST',
        body: formData
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to transcribe audio')
      }

      setTranscriptRaw(data.transcript || '')
      setTranscriptEditable(data.transcript || '')
      setStatus('done')
    } catch (err: any) {
      console.error('Transcription error:', err)
      setError(err.message)
      setStatus('error')
    }
  }

  const regenerateTasks = async () => {
    try {
      if (!transcriptEditable.trim()) return
      setStatus('structuring')
      setError(null)

      const res = await fetch('/api/voice/structure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: transcriptEditable,
          sheet_id: sheetId || undefined
        })
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to analyze transcript')
      }

      const tasks: ParsedVoiceTask[] = (data.tasks || []).map((t: any, index: number) => ({
        id: t.id || `voice-${index + 1}`,
        description: t.description || '',
        project_id: t.project_id,
        due_date: t.due_date,
        priority: t.priority
      }))

      setParsedTasks(tasks)
      setSelectedTaskIds(tasks.map((t) => t.id))
      setStatus('done')
    } catch (err: any) {
      console.error('Structure error:', err)
      setError(err.message)
      setStatus('error')
    }
  }

  const toggleTask = (id: string) => {
    setSelectedTaskIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const updateTask = (id: string, patch: Partial<ParsedVoiceTask>) => {
    setParsedTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              ...patch
            }
          : t
      )
    )
  }

  const handleConfirmSelected = async () => {
    try {
      if (!sheetId) {
        setError('No sheet connected. Please connect a sheet first.')
        return
      }

      const toCreate = parsedTasks.filter((t) => selectedTaskIds.includes(t.id))
      if (toCreate.length === 0) return

      setError(null)
      setStatus('uploading')

      for (const task of toCreate) {
        const body: any = {
          sheet_id: sheetId,
          raw_text: task.description
        }
        if (task.priority) body.priority = task.priority
        if (task.due_date) body.due_date = task.due_date

        const res = await fetch('/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        })

        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data.error || 'Failed to create one of the tasks')
        }
      }

      setStatus('done')
      if (onTasksCreated) onTasksCreated()
      reset()
      onClose()
    } catch (err: any) {
      console.error('Confirm voice tasks error:', err)
      setError(err.message)
      setStatus('error')
    }
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-40 bg-background/70 backdrop-blur-sm flex items-center justify-center px-4"
      onClick={onClose}
    >
      <div
        className="max-w-2xl w-full bg-card border border-border rounded-2xl shadow-2xl p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <span>🎙️</span>
              <span>Voice Tasks</span>
            </h2>
            <p className="text-xs text-muted-foreground">
              Speak your tasks in English. Use phrases like &quot;task one&quot;, &quot;next task&quot;,
              &quot;new task&quot; to separate multiple tasks.
            </p>
          </div>
          <VoiceStatusIndicator status={status} />
        </div>

        <div className="flex flex-col items-center gap-4">
          <RecordToggleButton
            status={status}
            onStart={startRecording}
            onStop={stopRecording}
          />
          {error && (
            <div className="w-full text-xs text-destructive bg-destructive/10 border border-destructive rounded-md px-3 py-2">
              {error}
            </div>
          )}
        </div>

        <TranscriptEditor
          value={transcriptEditable}
          onChange={setTranscriptEditable}
          onRegenerate={regenerateTasks}
          onReRecord={reset}
          disabled={status === 'recording' || status === 'uploading' || status === 'transcribing'}
        />

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Parsed tasks</h3>
            <span className="text-xs text-muted-foreground">
              {selectedTaskIds.length}/{parsedTasks.length} selected
            </span>
          </div>
          <ParsedTaskList
            tasks={parsedTasks}
            selectedTaskIds={selectedTaskIds}
            onToggleTask={toggleTask}
            onUpdateTask={updateTask}
          />
        </div>

        <div className="flex justify-between items-center pt-2">
          <button
            type="button"
            onClick={onClose}
            className="text-xs px-3 py-1.5 rounded-lg bg-muted text-muted-foreground hover:bg-muted/80"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handleConfirmSelected}
            disabled={
              !sheetId ||
              selectedTaskIds.length === 0 ||
              status === 'uploading' ||
              status === 'transcribing' ||
              status === 'structuring'
            }
            className="text-xs px-4 py-2 rounded-lg bg-primary text-primary-foreground disabled:opacity-50 hover:opacity-90"
          >
            Add selected tasks to sheet
          </button>
        </div>
      </div>
    </div>
  )
}
