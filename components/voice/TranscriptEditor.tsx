'use client'

interface TranscriptEditorProps {
  value: string
  onChange: (value: string) => void
  onRegenerate: () => void
  onReRecord: () => void
  disabled?: boolean
}

export function TranscriptEditor({
  value,
  onChange,
  onRegenerate,
  onReRecord,
  disabled
}: TranscriptEditorProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">Transcript</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={5}
        className="w-full px-3 py-2 bg-background text-foreground border border-input rounded-lg focus:ring-2 focus:ring-ring resize-y text-sm"
        placeholder='Speak like: "task one write introduction for report. next task send email to professor."'
        disabled={disabled}
      />
      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
        <span>Markers: &quot;task one&quot;, &quot;next task&quot;, &quot;new task&quot;, &quot;another task&quot;, &quot;next&quot;.</span>
      </div>
      <div className="flex gap-2 mt-2">
        <button
          type="button"
          onClick={onRegenerate}
          className="px-3 py-1.5 text-xs rounded-lg bg-secondary text-secondary-foreground hover:opacity-90"
        >
          🔁 Regenerate tasks from transcript
        </button>
        <button
          type="button"
          onClick={onReRecord}
          className="px-3 py-1.5 text-xs rounded-lg bg-muted text-muted-foreground hover:bg-muted/80"
        >
          ♻️ Re-record
        </button>
      </div>
    </div>
  )
}
