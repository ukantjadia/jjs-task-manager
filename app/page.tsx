import { SignedIn, SignedOut } from '@clerk/nextjs'
import Link from 'next/link'
import HomeOverview from '@/components/HomeOverview'

export default function Home() {
  return (
    <div className="bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <SignedOut>
          <div className="text-center py-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Welcome to JJ&apos;s Task Manager
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Simple task management powered by Google Sheets
            </p>
            <div className="space-x-4">
              <Link
                href="/sign-in"
                className="inline-block bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:opacity-90 transition-opacity text-lg"
              >
                Sign In
              </Link>
              <Link
                href="/sign-up"
                className="inline-block bg-secondary text-secondary-foreground px-6 py-3 rounded-lg hover:opacity-90 transition-opacity text-lg"
              >
                Sign Up
              </Link>
            </div>

            <div className="mt-12 p-6 bg-accent rounded-lg max-w-2xl mx-auto border border-border">
              <h3 className="font-semibold text-accent-foreground mb-3">Admin Login</h3>
              <p className="text-sm text-muted-foreground mb-2">
                For testing, use the admin account:
              </p>
              <div className="bg-card p-3 rounded border border-border text-left">
                <p className="text-sm font-mono text-foreground">
                  Email: <span className="font-semibold">admin@example.com</span>
                </p>
                <p className="text-sm font-mono text-foreground">
                  Password: <span className="font-semibold">admin.1234</span>
                </p>
              </div>
            </div>
          </div>
        </SignedOut>

        <SignedIn>
          <HomeOverview />
        </SignedIn>
      </div>
    </div>
  )
}
