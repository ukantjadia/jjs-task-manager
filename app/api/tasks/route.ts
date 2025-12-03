import { NextRequest, NextResponse } from 'next/server'
import { auth, currentUser, clerkClient } from '@clerk/nextjs/server'
import { GoogleSheetsService } from '@/lib/services/googleSheets.service'
import { ProjectService } from '@/lib/services/project.service'
import { TaskService } from '@/lib/services/task.service'
import { LogService } from '@/lib/services/log.service'
import { createTaskSchema } from '@/lib/utils/validators'

async function getServices(sheetId: string, accessToken: string) {
    const sheetsService = new GoogleSheetsService(accessToken, sheetId)
    const projectService = new ProjectService(sheetsService)
    const taskService = new TaskService(sheetsService, projectService)
    const logService = new LogService(sheetsService, taskService)

    return { sheetsService, projectService, taskService, logService }
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

        // Get sheet ID from query or user metadata
        const { searchParams } = new URL(request.url)
        const { getSheetIdFromRequest } = await import('@/lib/utils/clerkHelpers')
        const sheetId = await getSheetIdFromRequest(searchParams)

        if (!sheetId) {
            return NextResponse.json({
                error: 'Sheet ID required. Please connect a Google Sheet first.'
            }, { status: 400 })
        }

        const client = await clerkClient()
        const oauthTokensResponse = await client.users.getUserOauthAccessToken(userId, 'oauth_google')
        if (!oauthTokensResponse.data || oauthTokensResponse.data.length === 0) {
            return NextResponse.json({ error: 'No Google access token' }, { status: 403 })
        }
        const token = oauthTokensResponse.data[0].token

        const { taskService } = await getServices(sheetId, token)

        // Parse filters
        const filters: any = {}
        if (searchParams.get('project')) filters.project = searchParams.get('project')
        if (searchParams.get('status')) filters.status = searchParams.get('status')?.split(',')
        if (searchParams.get('relevancy')) filters.relevancy = searchParams.get('relevancy')
        if (searchParams.get('overdue')) filters.overdue = searchParams.get('overdue') === 'true'
        if (searchParams.get('from_date')) filters.from_date = searchParams.get('from_date')
        if (searchParams.get('to_date')) filters.to_date = searchParams.get('to_date')
        if (searchParams.get('limit')) filters.limit = parseInt(searchParams.get('limit')!)
        if (searchParams.get('offset')) filters.offset = parseInt(searchParams.get('offset')!)

        const tasks = await taskService.list(filters)

        return NextResponse.json({
            tasks,
            total: tasks.length,
            limit: filters.limit || 100,
            offset: filters.offset || 0
        })
    } catch (error: any) {
        console.error('Task list error:', error)
        return NextResponse.json(
            { error: 'Failed to list tasks', details: error.message },
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
        const validated = createTaskSchema.parse(body)

        // Get sheet ID from body or user metadata
        const { getSheetIdFromRequest } = await import('@/lib/utils/clerkHelpers')
        const sheetId = await getSheetIdFromRequest(undefined, body)
        if (!sheetId) {
            return NextResponse.json({
                error: 'Sheet ID required. Please connect a Google Sheet first.'
            }, { status: 400 })
        }

        const client = await clerkClient()
        const oauthTokensResponse = await client.users.getUserOauthAccessToken(userId, 'oauth_google')
        if (!oauthTokensResponse.data || oauthTokensResponse.data.length === 0) {
            return NextResponse.json({ error: 'No Google access token' }, { status: 403 })
        }
        const token = oauthTokensResponse.data[0].token

        const { taskService, logService } = await getServices(sheetId, token)

        const task = await taskService.create(validated)

        // Log the creation
        await logService.log({
            log_type: 'task',
            action: 'CREATE',
            entity_id: task.task_id,
            context: `Created task '${task.task_text}'${task.project_name ? ` in project ${task.project_name}` : ''}`,
            metadata: {
                priority: task.priority,
                due_date: task.due_date,
                status: task.status
            }
        })

        return NextResponse.json({ task }, { status: 201 })
    } catch (error: any) {
        console.error('Task creation error:', error)

        if (error.name === 'ZodError') {
            return NextResponse.json(
                { error: 'Validation failed', details: error.errors },
                { status: 400 }
            )
        }

        return NextResponse.json(
            { error: 'Failed to create task', details: error.message },
            { status: 500 }
        )
    }
}
