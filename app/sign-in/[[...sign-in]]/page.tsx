import { SignIn } from '@clerk/nextjs'

export default function SignInPage() {
  return (
    <div className="bg-background flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-foreground">JJ&apos;s Task Manager</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in to manage your tasks
          </p>
        </div>
        <SignIn
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "shadow-xl border border-border"
            }
          }}
          routing="path"
          path="/sign-in"
          signUpUrl="/sign-up"
        />
      </div>
    </div>
  )
}
