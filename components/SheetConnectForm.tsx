'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function SheetConnectForm() {
  const [sheetInput, setSheetInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)

    try {
      const response = await fetch('/api/sheets/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sheet_url: sheetInput })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to connect sheet')
      }

      setSuccess(true)
      setTimeout(() => router.refresh(), 1500)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-card border border-border rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-foreground mb-2">
        Connect Google Sheet
      </h2>
      <p className="text-muted-foreground mb-6">
        Enter your Google Sheet URL or ID to get started
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="sheet" className="block text-sm font-medium text-foreground mb-2">
            Google Sheet URL or ID
          </label>
          <input
            id="sheet"
            type="text"
            value={sheetInput}
            onChange={(e) => setSheetInput(e.target.value)}
            placeholder="https://docs.google.com/spreadsheets/d/..."
            className="w-full px-4 py-2 bg-background text-foreground border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
            required
          />
          <p className="text-xs text-muted-foreground mt-1">
            Paste the full URL or just the Sheet ID
          </p>
        </div>

        {error && (
          <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-primary/10 border border-primary text-primary px-4 py-3 rounded-lg">
            ✓ Sheet connected successfully!
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {loading ? 'Connecting...' : 'Connect Sheet'}
        </button>
      </form>

      <div className="mt-6 p-4 bg-muted rounded-lg">
        <h3 className="font-semibold text-foreground mb-2">Need a Google Sheet?</h3>
        <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
          <li>Go to <a href="https://sheets.google.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">sheets.google.com</a></li>
          <li>Create a new blank spreadsheet</li>
          <li>Copy the URL from your browser</li>
          <li>Paste it above</li>
        </ol>
      </div>
    </div>
  )
}
