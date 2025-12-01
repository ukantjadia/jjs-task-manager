import { NextRequest, NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { GoogleSheetsService } from '@/lib/services/googleSheets.service'
import { ProjectService } from '@/lib/services/project.service'
import { LogService } from '@/lib/services/log.service'
import { TaskService } from '@/lib/services/task.service'
import { createProjectSchema } from '@/lib/utils/validators'

async function getServices(sheetId: string, accessToken: string) {
  const sheetsService = new GoogleSheetsService(accessToken, sheetId)
  const projectService = new ProjectService(sheetsService)
  const taskService = new TaskService(sheetsService, projectService)
  const logService = new LogService(sheetsService, taskService)
  
  return { projectService, logService }
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

    const token = await user.getOAuthAccessToken({ provider: 'oauth_google' })
    if (!token) {
      return NextResponse.json({ error: 'No Google access token' }, { status: 403 })
    }

    const { projectService } = await getServices(sheetId, token)

    const filters: any = {}
    if (searchParams.get('relevancy')) {
      filters.relevancy = searchParams.get('relevancy')
    }
    if (searchParams.get('keyword_contains')) {
      filters.keyword_contains = searchParams.get('keyword_contains')
    }

    const projects = await projectService.list(filters)

    return NextResponse.json({ projects })
  } catch (error: any) {
    console.error('Project list error:', error)
    return NextResponse.json(
      { error: 'Failed to list projects', details: error.message },
      { status: 500 }
    )
  }
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

    const body = await request.json()
    const validated = createProjectSchema.parse(body)

    const sheetId = body.sheet_id
    if (!sheetId) {
      return NextResponse.json({ error: 'Sheet ID required' }, { status: 400 })
    }

    const token = await user.getOAuthAccessToken({ provider: 'oauth_google' })
    if (!token) {
      return NextResponse.json({ error: 'No Google access token' }, { status: 403 })
    }

    const { projectService, logService } = await getServices(sheetId, token)

    // Check for duplicate name or keywords
    const existingProjects = await projectService.list()
    const nameLower = validated.project_name.toLowerCase()
    
    if (existingProjects.some(p => p.project_name.toLowerCase() === nameLower)) {
      return NextResponse.json(
        {
          error: 'Project name or keyword already exists',
          details: { conflicting_field: 'project_name', existing_value: validated.project_name }
        },
        { status: 409 }
      )
    }

    for (const keyword of validated.project_keywords) {
      const existing = await projectService.findByKeyword(keyword)
      if (existing) {
        return NextResponse.json(
          {
            error: 'Project name or keyword already exists',
            details: { conflicting_field: 'project_keywords', existing_value: keyword }
          },
          { status: 409 }
        )
      }
    }

    const project = await projectService.create(validated)

    await logService.log({
      log_type: 'project',
      action: 'CREATE',
      entity_id: project.project_id,
      context: `Created project '${project.project_name}' with keywords: ${project.project_keywords.join(', ')}`,
      metadata: { relevancy: project.relevancy }
    })

    return NextResponse.json({ project }, { status: 201 })
  } catch (error: any) {
    console.error('Project creation error:', error)
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to create project', details: error.message },
      { status: 500 }
    )
  }
}
