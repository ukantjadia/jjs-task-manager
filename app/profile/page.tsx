'use client'

import { useUser } from '@clerk/nextjs'

export default function ProfilePage() {
  const { user, isLoaded } = useUser()

  return (
    <div className="bg-background">
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-3xl font-bold text-foreground mb-4 text-left">Profile</h2>

        {!isLoaded && (
          <div className="text-center text-muted-foreground">Loading profile...</div>
        )}
        {isLoaded && !user && (
          <div className="text-center text-muted-foreground">
            Please sign in to view your profile.
          </div>
        )}
        {isLoaded && user && (
          <div className="bg-card border border-border rounded-lg shadow-lg p-6 space-y-4">
            <div>
              <div className="text-sm text-muted-foreground">Name</div>
              <div className="text-lg font-semibold text-foreground">
                {user.fullName || user.username || user.primaryEmailAddress?.emailAddress}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Email</div>
              <div className="text-lg text-foreground">
                {user.primaryEmailAddress?.emailAddress || 'N/A'}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
