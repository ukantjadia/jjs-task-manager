import Link from 'next/link'

export default function AppFooter() {
  return (
    <footer className="border-t border-border bg-card mt-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs sm:text-sm text-muted-foreground">
        <div className="text-center sm:text-left">
          <div className="font-semibold text-foreground">
            JJ&apos;s Task Manager
          </div>
          <div>
            A personal project by{' '}
            <Link
              href="https://ukantjadia.me"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-4 hover:text-foreground"
            >
              Ukant Jadia
            </Link>
          </div>
        </div>

        <div className="text-center sm:text-right">
          <div>
            Built with <span className="text-red-500">♥</span> love
          </div>
          <div className="text-[0.7rem] sm:text-xs">
            JJ&apos;s Task Manager is a demo / personal productivity tool.
          </div>
        </div>
      </div>
    </footer>
  )
}
