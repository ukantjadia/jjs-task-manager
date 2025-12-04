'use client'

import { useEffect, useState } from 'react'

type Theme = 'light' | 'dark'

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('light')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const root = document.documentElement
    const stored = window.localStorage.getItem('jj-task-theme') as Theme | null
    let initial: Theme = 'light'

    if (stored === 'light' || stored === 'dark') {
      initial = stored
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      initial = 'dark'
    }

    setTheme(initial)
    root.classList.toggle('dark', initial === 'dark')
    setMounted(true)
  }, [])

  const toggleTheme = () => {
    const next: Theme = theme === 'light' ? 'dark' : 'light'
    setTheme(next)
    const root = document.documentElement
    root.classList.toggle('dark', next === 'dark')
    window.localStorage.setItem('jj-task-theme', next)
  }

  if (!mounted) {
    return (
      <button
        type="button"
        className="inline-flex items-center justify-center h-8 px-3 rounded-full bg-muted text-muted-foreground cursor-wait"
        aria-label="Toggle theme"
      >
        <span className="text-lg">☼</span>
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="inline-flex items-center justify-center h-8 px-3 rounded-full bg-muted hover:bg-muted/80 transition-colors shadow-sm"
      aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
      title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
    >
      <span className={`text-lg ${theme === 'light' ? 'text-yellow-300' : 'text-slate-50'}`}>
        {theme === 'light' ? '☀' : '☾'}
      </span>
    </button>
  )
}
