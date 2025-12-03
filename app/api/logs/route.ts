import { NextRequest, NextResponse } from 'next/server'
import { auth, currentUser, clerkClient } from '@clerk/nextjs/server'
import { GoogleSheetsService } from '@/lib/services/googleSheets.service'
import { ProjectService } from '@/lib/services/project.service'
import { TaskService } from '@/lib/services/task.service'
import { LogService } from '@/lib/services/log.service'

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

    const filters: any = {}
    if (searchParams.get('from_date')) filters.from_date = searchParams.get('from_date')
    if (searchParams.get('to_date')) filters.to_date = searchParams.get('to_date')
    if (searchParams.get('log_type')) filters.log_type = searchParams.get('log_type')
    if (searchParams.get('action')) filters.action = searchParams.get('action')
    if (searchParams.get('entity_id')) filters.entity_id = searchParams.get('entity_id')
    if (searchParams.get('limit')) filters.limit = parseInt(searchParams.get('limit')!)

    const logs = await logService.getLogs(filters)

    return NextResponse.json({
      logs,
      total: logs.length
    })
  } catch (error: any) {
    console.error('Logs get error:', error)
    return NextResponse.json(
      { error: 'Failed to get logs', details: error.message },
      { status: 500 }
    )
  }
}
