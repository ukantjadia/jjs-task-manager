import { NextRequest, NextResponse } from 'next/server'
import { auth, currentUser, clerkClient } from '@clerk/nextjs/server'
import { GoogleSheetsService } from '@/lib/services/googleSheets.service'
import { ProjectService } from '@/lib/services/project.service'
import { TaskService } from '@/lib/services/task.service'
import { LogService } from '@/lib/services/log.service'
import { formatDate } from '@/lib/utils/dateHelpers'

async function getServices(sheetId: string, accessToken: string) {
  const sheetsService = new GoogleSheetsService(accessToken, sheetId)
  const projectService = new ProjectService(sheetsService)
  const taskService = new TaskService(sheetsService, projectService)
  const logService = new LogService(sheetsService, taskService)

  return { logService }
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const sheetId = searchParams.get('sheet_id')

    if (!sheetId) {
      return NextResponse.json({ error: 'Sheet ID required' }, { status: 400 })
    }

    const client = await clerkClient()
    const oauthTokensResponse = await client.users.getUserOauthAccessToken(userId, 'oauth_google')
    if (!oauthTokensResponse.data || oauthTokensResponse.data.length === 0) {
      return NextResponse.json({ error: 'No Google access token' }, { status: 403 })
    }
    const token = oauthTokensResponse.data[0].token

    const { logService } = await getServices(sheetId, token)

    // Determine date range
    let fromDate: string
    let toDate: string

    if (searchParams.get('date')) {
      fromDate = toDate = searchParams.get('date')!
    } else if (searchParams.get('from_date') && searchParams.get('to_date')) {
      fromDate = searchParams.get('from_date')!
      toDate = searchParams.get('to_date')!
    } else {
      // Default to today
      const today = formatDate(new Date())
      fromDate = toDate = today
    }

    const summary = await logService.getSummary({ from: fromDate, to: toDate })

    return NextResponse.json({ summary })
  } catch (error: any) {
    console.error('Summary get error:', error)
    return NextResponse.json(
      { error: 'Failed to get summary', details: error.message },
      { status: 500 }
    )
  }
}
