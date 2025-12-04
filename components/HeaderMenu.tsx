'use client'

import { useState } from 'react'
import Link from 'next/link'

interface HeaderMenuProps {
  onConnectSheet?: () => void
}

export default function HeaderMenu({ onConnectSheet }: HeaderMenuProps) {
  const [open, setOpen] = useState(false)

  const handleConnectClick = () => {
    setOpen(false)
    if (onConnectSheet) {
      onConnectSheet()
    } else {
      // Fallback: navigate to dashboard where sheet can be connected
      window.location.href = '/dashboard?connect=1'
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="text-sm px-3 py-1.5 bg-muted text-muted-foreground rounded-full hover:bg-muted/80 transition-colors"
      >
        Profile ▾
      </button>

      {open && (
        <div
          className="absolute right-0 mt-2 w-44 bg-card border border-border rounded-lg shadow-lg py-2 z-20"
        >
          <button
            type="button"
            onClick={handleConnectClick}
            className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-muted/60"
          >
            Connect Sheet
          </button>
          <Link
            href="/settings"
            className="block px-4 py-2 text-sm text-foreground hover:bg-muted/60"
            onClick={() => setOpen(false)}
          >
            Settings
          </Link>
          <Link
            href="/profile"
            className="block px-4 py-2 text-sm text-foreground hover:bg-muted/60"
            onClick={() => setOpen(false)}
          >
            Profile
          </Link>
        </div>
      )}
    </div>
  )
}
