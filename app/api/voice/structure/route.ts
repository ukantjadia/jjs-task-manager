import { NextRequest, NextResponse } from 'next/server'
import { auth, currentUser, clerkClient } from '@clerk/nextjs/server'
import { GoogleSheetsService } from '@/lib/services/googleSheets.service'
import { ProjectService } from '@/lib/services/project.service'
import type { VoiceTaskExtractionInput, VoiceTaskExtractionOutput } from '@/lib/types/voice'

// Simple, deterministic splitting logic for now.
// This is designed so you can later replace the internals with real LLM calls
// without changing the route signature.
function splitTranscriptIntoTasks(transcript: string): string[] {
  const markers = [
    'task one',
    'task 1',
    'task two',
    'task 2',
    'next task',
    'new task',
    'another task',
    'next'
  ]

  const lower = transcript.toLowerCase()
  let segments: { start: number; end: number }[] = []

  // Find all marker positions
  let indices: number[] = []
  markers.forEach((marker) => {
    let idx = lower.indexOf(marker)
    while (idx !== -1) {
      indices.push(idx)
      idx = lower.indexOf(marker, idx + marker.length)
    }
  })

  indices = Array.from(new Set(indices)).sort((a, b) => a - b)

  if (indices.length === 0) {
    const cleaned = transcript.trim()
    return cleaned ? [cleaned] : []
  }

  // Build segments between markers
  for (let i = 0; i < indices.length; i++) {
    const start = indices[i]
    const end = i + 1 < indices.length ? indices[i + 1] : transcript.length
    segments.push({ start, end })
  }

  const tasks: string[] = []
  for (const seg of segments) {
    const chunk = transcript.slice(seg.start, seg.end)
    // remove the marker phrase itself and keep what follows
    let cleaned = chunk
    for (const marker of markers) {
      const idx = cleaned.toLowerCase().indexOf(marker)
      if (idx !== -1) {
        cleaned = cleaned.slice(idx + marker.length)
        break
      }
    }
    cleaned = cleaned.replace(/^[\s:,-]+/, '').trim()
    if (cleaned) {
      tasks.push(cleaned)
    }
  }

  return tasks
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const body = (await request.json()) as VoiceTaskExtractionInput & {
      sheet_id?: string
    }

    if (!body.transcript || typeof body.transcript !== 'string') {
      return NextResponse.json({ error: 'Missing transcript' }, { status: 400 })
    }

    const transcript = body.transcript

    // Get sheet id via helper just like other APIs
    const { getSheetIdFromRequest } = await import('@/lib/utils/clerkHelpers')
    const sheetId = await getSheetIdFromRequest(undefined, { sheet_id: body.sheet_id })

    if (!sheetId) {
      return NextResponse.json(
        { error: 'Sheet ID required. Please connect a Google Sheet first.' },
        { status: 400 }
      )
    }

    const client = await clerkClient()
    const oauthTokensResponse = await client.users.getUserOauthAccessToken(userId, 'oauth_google')
    if (!oauthTokensResponse.data || oauthTokensResponse.data.length === 0) {
      return NextResponse.json({ error: 'No Google access token' }, { status: 403 })
    }
    const token = oauthTokensResponse.data[0].token

    const sheetsService = new GoogleSheetsService(token, sheetId)
    const projectService = new ProjectService(sheetsService)

    const projects = await projectService.list()

    const tasksText = splitTranscriptIntoTasks(transcript)

    const tasks: VoiceTaskExtractionOutput['tasks'] = tasksText.map((text, index) => {
      const lower = text.toLowerCase()

      let matchedProjectId: string | undefined
      for (const project of projects) {
        for (const keyword of project.project_keywords) {
          if (lower.includes(keyword.toLowerCase())) {
            matchedProjectId = project.project_id
            break
          }
        }
        if (matchedProjectId) break
      }

      return {
        id: `voice-${index + 1}`,
        description: text,
        project_id: matchedProjectId
      }
    })

    const response: VoiceTaskExtractionOutput = { tasks }

    return NextResponse.json(response)
  } catch (error: any) {
    console.error('Voice structure error:', error)
    return NextResponse.json(
      { error: 'Failed to structure transcript into tasks', details: error.message },
      { status: 500 }
    )
  }
}
