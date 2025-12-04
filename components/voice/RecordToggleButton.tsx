'use client'

import type { VoiceStatus } from '@/lib/types/voice'

interface RecordToggleButtonProps {
  status: VoiceStatus
  onStart: () => void
  onStop: () => void
}

export function RecordToggleButton({ status, onStart, onStop }: RecordToggleButtonProps) {
  const isRecording = status === 'recording'

  const handleClick = () => {
    if (isRecording) onStop()
    else onStart()
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`w-28 h-28 rounded-full flex items-center justify-center shadow-2xl border-4 border-background text-3xl transition-transform ${
        isRecording
          ? 'bg-red-500 text-white hover:scale-105'
          : 'bg-primary text-primary-foreground hover:scale-105'
      }`}
      aria-label={isRecording ? 'Stop recording' : 'Start recording'}
    >
      {isRecording ? '⏹️' : '🎙️'}
    </button>
  )
}
