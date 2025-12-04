'use client'

import { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import type { LlmProvider } from '@/lib/types/voice'

interface LlmKeyInfo {
  provider: LlmProvider
  hasKey: boolean
  maskedKey: string | null
}

export default function SettingsPage() {
  const { user, isLoaded } = useUser()
  const [sheetId, setSheetId] = useState<string | null>(null)
  const [loadingSheet, setLoadingSheet] = useState(true)
  const [llmKeys, setLlmKeys] = useState<LlmKeyInfo[]>([])
  const [activeProvider, setActiveProvider] = useState<LlmProvider>('openai')
  const [updatingKey, setUpdatingKey] = useState(false)
  const [newKeyValue, setNewKeyValue] = useState('')

  useEffect(() => {
    const fetchSheet = async () => {
      try {
        const response = await fetch('/api/sheets/connect')
        const data = await response.json()
        if (response.ok && data.sheet_id) {
          setSheetId(data.sheet_id)
        }
      } catch (err) {
        console.error('Error loading sheet info:', err)
      } finally {
        setLoadingSheet(false)
      }
    }

    fetchSheet()
  }, [])

  useEffect(() => {
    const fetchLlmConfig = async () => {
      try {
        const res = await fetch('/api/llm/config')
        if (!res.ok) return
        const data = await res.json()
        setLlmKeys(data.keys || [])
        if (data.activeProvider) {
          setActiveProvider(data.activeProvider)
        }
      } catch (err) {
        console.error('Error loading LLM config:', err)
      }
    }

    fetchLlmConfig()
  }, [])

  const sheetUrl = sheetId ? `https://docs.google.com/spreadsheets/d/${sheetId}` : null

  const currentKeyInfo = llmKeys.find((k) => k.provider === activeProvider)

  const handleSaveKey = async () => {
    if (!newKeyValue.trim()) return
    setUpdatingKey(true)
    try {
      const res = await fetch('/api/llm/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: activeProvider,
          apiKey: newKeyValue
        })
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save key')
      }
      setLlmKeys(data.keys || [])
      setNewKeyValue('')
    } catch (err) {
      console.error('Error saving LLM key:', err)
    } finally {
      setUpdatingKey(false)
    }
  }

  return (
    <div className="bg-background">
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-3xl font-bold text-foreground mb-4 text-center">Settings</h2>
        {!isLoaded && (
          <div className="text-center text-muted-foreground">Loading settings...</div>
        )}
        {isLoaded && !user && (
          <div className="text-center text-muted-foreground">
            Please sign in to manage your settings.
          </div>
        )}
        {isLoaded && user && (
          <div className="bg-card border border-border rounded-lg shadow-lg p-6 space-y-6">
            <section>
              <h3 className="text-lg font-semibold text-foreground mb-2">Connected Sheet</h3>
              {loadingSheet ? (
                <p className="text-sm text-muted-foreground">Loading sheet information...</p>
              ) : sheetUrl ? (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">
                    You currently have a Google Sheet connected to this workspace.
                  </p>
                  <a
                    href={sheetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary underline break-all"
                  >
                    {sheetUrl}
                  </a>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No sheet is connected yet. Use the “Connect Sheet” option in the top-right menu.
                </p>
              )}
            </section>

            <section>
              <h3 className="text-lg font-semibold text-foreground mb-2">General</h3>
              <p className="text-muted-foreground text-sm">
                This is a basic settings page. You can extend it later with notification preferences,
                theme options, or other app-specific controls.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-foreground mb-2">AI Providers (keys)</h3>
              <p className="text-muted-foreground text-sm mb-3">
                You can keep keys in the backend environment, or optionally store per-user keys here.
                When displaying, only the first and last 4 characters are shown.
              </p>

              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {(['openai', 'gemini', 'deepseek', 'openrouter'] as LlmProvider[]).map(
                    (provider) => (
                      <button
                        key={provider}
                        type="button"
                        onClick={() => setActiveProvider(provider)}
                        className={`px-3 py-1.5 text-xs rounded-full border ${
                          activeProvider === provider
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-muted text-muted-foreground border-border'
                        }`}
                      >
                        {provider === 'openai' && 'ChatGPT / OpenAI'}
                        {provider === 'gemini' && 'Gemini'}
                        {provider === 'deepseek' && 'DeepSeek'}
                        {provider === 'openrouter' && 'OpenRouter'}
                      </button>
                    )
                  )}
                </div>

                <div className="border border-border rounded-lg p-3 space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-foreground">Current key</span>
                    <span className="text-xs text-muted-foreground">
                      {currentKeyInfo?.hasKey
                        ? currentKeyInfo.maskedKey || '••••'
                        : 'No key stored (using backend env if configured)'}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-xs text-muted-foreground">
                      New key (only first / last 4 characters will be shown later)
                    </label>
                    <input
                      type="password"
                      value={newKeyValue}
                      onChange={(e) => setNewKeyValue(e.target.value)}
                      className="w-full px-3 py-2 bg-background text-foreground border border-input rounded-lg focus:ring-2 focus:ring-ring text-xs"
                      placeholder="sk-..."
                    />
                    <button
                      type="button"
                      onClick={handleSaveKey}
                      disabled={updatingKey || !newKeyValue.trim()}
                      className="px-3 py-1.5 text-xs rounded-lg bg-primary text-primary-foreground disabled:opacity-50 hover:opacity-90"
                    >
                      {updatingKey ? 'Saving...' : 'Save key for this provider'}
                    </button>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  )
}
