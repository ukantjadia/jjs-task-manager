'use client'

interface FloatingVoiceButtonProps {
  onOpen: () => void
}

export function FloatingVoiceButton({ onOpen }: FloatingVoiceButtonProps) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="fixed bottom-6 right-24 md:bottom-8 md:right-28 z-30 w-14 h-14 md:w-16 md:h-16 rounded-full bg-secondary text-secondary-foreground shadow-2xl flex items-center justify-center text-2xl md:text-3xl hover:scale-110 active:scale-95 transition-transform"
      aria-label="Add voice task"
    >
      🎙️
    </button>
  )
}
