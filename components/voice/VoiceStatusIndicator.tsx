'use client'

import type { VoiceStatus } from '@/lib/types/voice'

interface VoiceStatusIndicatorProps {
  status: VoiceStatus
}

const STATUS_CONFIG: Record<
  VoiceStatus,
  { label: string; color: string; icon: string }
> = {
  ready: { label: 'Ready', color: 'bg-emerald-500', icon: '▶️' },
  recording: { label: 'Recording', color: 'bg-red-500', icon: '⏺️' },
  uploading: { label: 'Uploading', color: 'bg-sky-500', icon: '☁️' },
  transcribing: { label: 'Transcribing', color: 'bg-violet-500', icon: '🔤' },
  structuring: { label: 'Analyzing tasks', color: 'bg-amber-500', icon: '🧩' },
  done: { label: 'Done', color: 'bg-emerald-500', icon: '✅' },
  error: { label: 'Error', color: 'bg-destructive', icon: '⚠️' }
}

export function VoiceStatusIndicator({ status }: VoiceStatusIndicatorProps) {
  const cfg = STATUS_CONFIG[status]

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted border border-border text-xs font-medium">
      <span className={`w-2.5 h-2.5 rounded-full ${cfg.color} shadow-sm`} />
      <span>{cfg.icon}</span>
      <span className="text-muted-foreground">{cfg.label}</span>
    </div>
  )
}
