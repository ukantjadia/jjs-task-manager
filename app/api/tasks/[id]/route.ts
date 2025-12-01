import { NextRequest, NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { GoogleSheetsService } from '@/lib/services/googleSheets.service'
import { ProjectService } from '@/lib/services/project.service'
import { TaskService } from '@/lib/services/task.service'
import { LogService } from '@/lib/services/log.service'
import { updateTaskSchema } from '@/lib/utils/validators'

async function getServices(sheetId: string, accessToken: string) {
  const sheetsService = new GoogleSheetsService(accessToken, sheetId)
  const projectService = new ProjectService(sheetsService)
  const taskService = new TaskService(sheetsService, projectService)
  const logService = new LogService(sheetsService, taskService)
  
  return { taskService, logService }
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

    const token = await user.getOAuthAccessToken({ provider: 'oauth_google' })
    if (!token) {
      return NextResponse.json({ error: 'No Google access token' }, { status: 403 })
    }

    const { taskService } = await getServices(sheetId, token)
    const task = await taskService.findById(id)

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    return NextResponse.json({ task })
  } catch (error: any) {
    console.error('Task get error:', error)
    return NextResponse.json(
      { error: 'Failed to get task', details: error.message },
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
    const validated = updateTaskSchema.parse(body)

    const sheetId = body.sheet_id
    if (!sheetId) {
      return NextResponse.json({ error: 'Sheet ID required' }, { status: 400 })
    }

    const token = await user.getOAuthAccessToken({ provider: 'oauth_google' })
    if (!token) {
      return NextResponse.json({ error: 'No Google access token' }, { status: 403 })
    }

    const { taskService, logService } = await getServices(sheetId, token)
    
    // Get before state
    const before = await taskService.findById(id)
    if (!before) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    const task = await taskService.update(id, validated)

    // Log the update
    const changes: string[] = []
    if (validated.status && validated.status !== before.status) {
      changes.push(`status: ${before.status} → ${validated.status}`)
    }
    if (validated.priority !== undefined && validated.priority !== before.priority) {
      changes.push(`priority: ${before.priority || 'None'} → ${validated.priority || 'None'}`)
    }

    await logService.log({
      log_type: 'task',
      action: 'UPDATE',
      entity_id: task.task_id,
      context: `Updated task '${task.task_text}'${changes.length > 0 ? `: ${changes.join(', ')}` : ''}`,
      metadata: { changes: validated }
    })

    return NextResponse.json({ task })
  } catch (error: any) {
    console.error('Task update error:', error)
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to update task', details: error.message },
      { status: 500 }
    )
  }
}

export async function DELETE(
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
    const soft = searchParams.get('soft') !== 'false'
    
    if (!sheetId) {
      return NextResponse.json({ error: 'Sheet ID required' }, { status: 400 })
    }

    const token = await user.getOAuthAccessToken({ provider: 'oauth_google' })
    if (!token) {
      return NextResponse.json({ error: 'No Google access token' }, { status: 403 })
    }

    const { taskService, logService } = await getServices(sheetId, token)
    
    const task = await taskService.findById(id)
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    await taskService.delete(id, soft)

    await logService.log({
      log_type: 'task',
      action: 'UPDATE',
      entity_id: id,
      context: `Deleted task '${task.task_text}' (${soft ? 'soft' : 'hard'})`,
      metadata: { soft }
    })

    return NextResponse.json({ success: true, message: 'Task deleted' })
  } catch (error: any) {
    console.error('Task delete error:', error)
    return NextResponse.json(
      { error: 'Failed to delete task', details: error.message },
      { status: 500 }
    )
  }
}
