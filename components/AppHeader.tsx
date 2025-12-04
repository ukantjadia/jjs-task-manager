'use client'

import Link from 'next/link'
import { SignedIn, SignedOut, UserButton } from '@clerk/nextjs'
import HeaderMenu from '@/components/HeaderMenu'
import ThemeToggle from '@/components/ThemeToggle'

export default function AppHeader() {
  return (
    <header className="bg-card shadow-sm border-b border-border sticky top-0 z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          <div className="flex items-center min-w-0">
            <Link href="/" className="flex items-baseline gap-1">
              <span className="text-lg sm:text-xl font-bold text-foreground truncate">
                JJ&apos;s Task Manager
              </span>
            </Link>
          </div>

          <nav className="hidden sm:flex flex-1 justify-center">
            <div className="flex gap-4 sm:gap-6 text-sm sm:text-base">
              <Link
                href="/dashboard"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Dashboard
              </Link>
              <Link
                href="/projects"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Projects
              </Link>
              <Link
                href="/summary"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Summary
              </Link>
            </div>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />
            <SignedIn>
              <div className="hidden sm:block">
                <HeaderMenu />
              </div>
            </SignedIn>
            <SignedOut>
              <Link
                href="/sign-in"
                className="text-xs sm:text-sm bg-primary text-primary-foreground px-3 py-1.5 rounded-lg hover:opacity-90 transition-opacity"
              >
                Sign In
              </Link>
            </SignedOut>
            <SignedIn>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>
          </div>
        </div>
      </div>
    </header>
  )
}
