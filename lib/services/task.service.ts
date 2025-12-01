import { v4 as uuidv4 } from 'uuid'
import { GoogleSheetsService } from './googleSheets.service'
import { ProjectService } from './project.service'
import { Task, CreateTaskInput, TaskFilters, TaskStatus } from '../types/task'
import { formatDateTime, isOverdue, parseDate } from '../utils/dateHelpers'

export class TaskService {
  constructor(
    private sheetsService: GoogleSheetsService,
    private projectService: ProjectService
  ) {}

  private parseTaskRow(row: any[]): Task {
    return {
      task_id: row[0] || '',
      task_text: row[1] || '',
      project_id: row[2] || null,
      project_name: row[3] || null,
      status: (row[4] || 'Started') as TaskStatus,
      priority: row[5] || null,
      due_date: row[6] || null,
      task_created_at: row[7] || '',
      task_edited_at: row[8] || ''
    }
  }

  private buildTaskRow(task: Task): any[] {
    return [
      task.task_id,
      task.task_text,
      task.project_id || '',
      task.project_name || '',
      task.status,
      task.priority || '',
      task.due_date || '',
      task.task_created_at,
      task.task_edited_at
    ]
  }

  private extractProjectKeyword(rawText: string): string | null {
    const match = rawText.match(/^(\w+):/)
    return match ? match[1].toLowerCase() : null
  }

  async create(data: CreateTaskInput): Promise<Task> {
    const now = formatDateTime(new Date())
    
    // Extract or use provided keyword
    const keyword = data.project_keyword || this.extractProjectKeyword(data.raw_text)
    
    // Find project if keyword exists
    let project = null
    if (keyword) {
      project = await this.projectService.findByKeyword(keyword)
    }
    
    const task: Task = {
      task_id: uuidv4(),
      task_text: data.raw_text,
      project_id: project?.project_id || null,
      project_name: project?.project_name || null,
      status: data.status || 'Started',
      priority: data.priority || null,
      due_date: data.due_date || null,
      task_created_at: now,
      task_edited_at: now
    }
    
    await this.sheetsService.appendRows('Tasks', [this.buildTaskRow(task)])
    
    return task
  }

  async update(id: string, data: Partial<Task>): Promise<Task> {
    const results = await this.sheetsService.findRowsByColumn('Tasks', 0, id)
    if (results.length === 0) {
      throw new Error('Task not found')
    }
    
    const existing = this.parseTaskRow(results[0].row)
    const now = formatDateTime(new Date())
    
    const updated: Task = {
      ...existing,
      ...data,
      task_edited_at: now
    }
    
    await this.sheetsService.updateRow('Tasks', results[0].index, this.buildTaskRow(updated))
    
    return updated
  }

  async findById(id: string): Promise<Task | null> {
    const results = await this.sheetsService.findRowsByColumn('Tasks', 0, id)
    if (results.length === 0) return null
    
    return this.parseTaskRow(results[0].row)
  }

  async list(filters: TaskFilters = {}): Promise<Task[]> {
    const rows = await this.sheetsService.readAll('Tasks')
    if (rows.length <= 1) return []
    
    let tasks = rows.slice(1).map(row => this.parseTaskRow(row))
    
    // Filter by project
    if (filters.project) {
      const project = await this.projectService.findByKeyword(filters.project)
      if (project) {
        tasks = tasks.filter(t => t.project_id === project.project_id)
      } else {
        tasks = tasks.filter(t => t.project_id === filters.project)
      }
    }
    
    // Filter by status
    if (filters.status && filters.status.length > 0) {
      tasks = tasks.filter(t => filters.status!.includes(t.status))
    }
    
    // Filter by relevancy (via project)
    if (filters.relevancy) {
      const projects = await this.projectService.list({ relevancy: filters.relevancy as any })
      const projectIds = projects.map(p => p.project_id)
      tasks = tasks.filter(t => t.project_id && projectIds.includes(t.project_id))
    }
    
    // Filter by overdue
    if (filters.overdue) {
      tasks = tasks.filter(t => isOverdue(t.due_date, t.status))
    }
    
    // Filter by date range
    if (filters.from_date) {
      const fromDate = parseDate(filters.from_date)
      tasks = tasks.filter(t => {
        if (!t.due_date) return false
        return parseDate(t.due_date) >= fromDate
      })
    }
    
    if (filters.to_date) {
      const toDate = parseDate(filters.to_date)
      tasks = tasks.filter(t => {
        if (!t.due_date) return false
        return parseDate(t.due_date) <= toDate
      })
    }
    
    // Sort: overdue first, then by due date, then by created date
    tasks.sort((a, b) => {
      const aOverdue = isOverdue(a.due_date, a.status)
      const bOverdue = isOverdue(b.due_date, b.status)
      
      if (aOverdue && !bOverdue) return -1
      if (!aOverdue && bOverdue) return 1
      
      if (a.due_date && b.due_date) {
        return parseDate(a.due_date).getTime() - parseDate(b.due_date).getTime()
      }
      
      if (a.due_date && !b.due_date) return -1
      if (!a.due_date && b.due_date) return 1
      
      return parseDate(b.task_created_at).getTime() - parseDate(a.task_created_at).getTime()
    })
    
    // Apply limit and offset
    const offset = filters.offset || 0
    const limit = filters.limit || 100
    
    return tasks.slice(offset, offset + limit)
  }

  async delete(id: string, soft: boolean = true): Promise<void> {
    if (soft) {
      await this.update(id, { status: 'Dropped' })
    } else {
      const results = await this.sheetsService.findRowsByColumn('Tasks', 0, id)
      if (results.length === 0) {
        throw new Error('Task not found')
      }
      
      // Hard delete - would need to implement row deletion in sheets service
      // For now, just mark as dropped
      await this.update(id, { status: 'Dropped' })
    }
  }
}
