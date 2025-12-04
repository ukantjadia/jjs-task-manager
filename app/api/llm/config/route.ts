import { NextRequest, NextResponse } from 'next/server'
import { auth, currentUser, clerkClient } from '@clerk/nextjs/server'
import type { LlmProvider } from '@/lib/types/voice'

interface StoredKeys {
  [provider: string]: string | undefined
}

function maskKey(key: string | undefined | null): string | null {
  if (!key) return null
  if (key.length <= 8) return key
  const first = key.slice(0, 4)
  const last = key.slice(-4)
  return `${first}••••••${last}`
}

export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await currentUser()
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const privateMeta = (user.privateMetadata || {}) as {
      llm_keys?: StoredKeys
      llm_active_provider?: LlmProvider
    }

    const stored = privateMeta.llm_keys || {}

    const providers: LlmProvider[] = ['openai', 'gemini', 'deepseek', 'openrouter']

    const keys = providers.map((provider) => {
      const val = stored[provider]
      return {
        provider,
        hasKey: !!val,
        maskedKey: maskKey(val)
      }
    })

    return NextResponse.json({
      keys,
      activeProvider: privateMeta.llm_active_provider || 'openai'
    })
  } catch (error: any) {
    console.error('LLM config GET error:', error)
    return NextResponse.json(
      { error: 'Failed to load LLM config', details: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = (await request.json()) as {
      provider: LlmProvider
      apiKey: string
    }

    if (!body.provider || !body.apiKey) {
      return NextResponse.json({ error: 'provider and apiKey are required' }, { status: 400 })
    }

    const client = await clerkClient()
    const user = await client.users.getUser(userId)

    const privateMeta = (user.privateMetadata || {}) as {
      llm_keys?: StoredKeys
      llm_active_provider?: LlmProvider
    }

    const existing = privateMeta.llm_keys || {}

    const updatedKeys: StoredKeys = {
      ...existing,
      [body.provider]: body.apiKey
    }

    const updatedMeta = {
      ...privateMeta,
      llm_keys: updatedKeys
    }

    await client.users.updateUser(userId, {
      privateMetadata: updatedMeta
    })

    const providers: LlmProvider[] = ['openai', 'gemini', 'deepseek', 'openrouter']
    const keys = providers.map((provider) => {
      const val = updatedKeys[provider]
      return {
        provider,
        hasKey: !!val,
        maskedKey: maskKey(val)
      }
    })

    return NextResponse.json({
      keys,
      activeProvider: privateMeta.llm_active_provider || 'openai'
    })
  } catch (error: any) {
    console.error('LLM config POST error:', error)
    return NextResponse.json(
      { error: 'Failed to save LLM key', details: error.message },
      { status: 500 }
    )
  }
}
