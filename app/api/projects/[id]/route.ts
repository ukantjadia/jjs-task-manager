import { NextRequest, NextResponse } from 'next/server'
import { auth, currentUser, clerkClient } from '@clerk/nextjs/server'
import { GoogleSheetsService } from '@/lib/services/googleSheets.service'
import { ProjectService } from '@/lib/services/project.service'
import { LogService } from '@/lib/services/log.service'
import { TaskService } from '@/lib/services/task.service'
import { updateProjectSchema } from '@/lib/utils/validators'

async function getServices(sheetId: string, accessToken: string) {
  const sheetsService = new GoogleSheetsService(accessToken, sheetId)
  const projectService = new ProjectService(sheetsService)
  const taskService = new TaskService(sheetsService, projectService)
  const logService = new LogService(sheetsService, taskService)

  return { projectService, logService }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { id } = await params
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

    const { projectService } = await getServices(sheetId, token)
    const project = await projectService.findById(id)

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    return NextResponse.json({ project })
  } catch (error: any) {
    console.error('Project get error:', error)
    return NextResponse.json(
      { error: 'Failed to get project', details: error.message },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { id } = await params
    const body = await request.json()
    const validated = updateProjectSchema.parse(body)

    const sheetId = body.sheet_id
    if (!sheetId) {
      return NextResponse.json({ error: 'Sheet ID required' }, { status: 400 })
    }

    const client = await clerkClient()
    const oauthTokensResponse = await client.users.getUserOauthAccessToken(userId, 'oauth_google')
    if (!oauthTokensResponse.data || oauthTokensResponse.data.length === 0) {
      return NextResponse.json({ error: 'No Google access token' }, { status: 403 })
    }
    const token = oauthTokensResponse.data[0].token

    const { projectService, logService } = await getServices(sheetId, token)

    const before = await projectService.findById(id)
    if (!before) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const project = await projectService.update(id, validated)

    await logService.log({
      log_type: 'project',
      action: 'UPDATE',
      entity_id: project.project_id,
      context: `Updated project '${project.project_name}'`,
      metadata: { changes: validated }
    })

    return NextResponse.json({ project })
  } catch (error: any) {
    console.error('Project update error:', error)

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update project', details: error.message },
      { status: 500 }
    )
  }
}
