import { SignUp } from '@clerk/nextjs'

export default function SignUpPage() {
  return (
    <div className="bg-background flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-foreground">JJ&apos;s Task Manager</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Create your account to get started
          </p>
        </div>
        <SignUp
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "shadow-xl border border-border"
            }
          }}
          routing="path"
          path="/sign-up"
          signInUrl="/sign-in"
        />
      </div>
    </div>
  )
}
