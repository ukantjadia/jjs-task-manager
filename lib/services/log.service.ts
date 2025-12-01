import { v4 as uuidv4 } from 'uuid'
import { GoogleSheetsService } from './googleSheets.service'
import { TaskService } from './task.service'
import { LogEntry, DailySummary, LogFilters, DateRange } from '../types/log'
import { formatDateTime, getLogSheetName, parseLogSheetName, isDateInRange, getDaysOverdue, isOverdue, parseDate } from '../utils/dateHelpers'

export class LogService {
  constructor(
    private sheetsService: GoogleSheetsService,
    private taskService: TaskService
  ) {}

  private parseLogRow(row: any[]): LogEntry {
    return {
      log_id: row[0] || '',
      timestamp: row[1] || '',
      log_type: (row[2] || 'task') as "project" | "task",
      action: (row[3] || 'CREATE') as "CREATE" | "UPDATE" | "READ",
      entity_id: row[4] || '',
      context: row[5] || '',
      metadata: row[6] ? JSON.parse(row[6]) : undefined
    }
  }

  private buildLogRow(entry: LogEntry): any[] {
    return [
      entry.log_id,
      entry.timestamp,
      entry.log_type,
      entry.action,
      entry.entity_id,
      entry.context,
      entry.metadata ? JSON.stringify(entry.metadata) : ''
    ]
  }

  async getCurrentLogSheet(): Promise<string> {
    const sheets = await this.sheetsService.listSheets()
    const today = new Date()
    
    // Find sheet that contains today
    for (const sheetName of sheets) {
      if (!sheetName.startsWith('DailyLog_')) continue
      
      const dateRange = parseLogSheetName(sheetName)
      if (dateRange && isDateInRange(today, dateRange.from, dateRange.to)) {
        return sheetName
      }
    }
    
    // No valid sheet found, create new one
    return await this.createNewLogSheet()
  }

  private async createNewLogSheet(): Promise<string> {
    const today = new Date()
    const sheetName = getLogSheetName(today)
    
    await this.sheetsService.getOrCreateSheet(sheetName)
    await this.sheetsService.appendRows(sheetName, [[
      'log_id',
      'timestamp',
      'log_type',
      'action',
      'entity_id',
      'context',
      'metadata'
    ]])
    
    return sheetName
  }

  async log(entry: Omit<LogEntry, 'log_id' | 'timestamp'>): Promise<void> {
    const sheetName = await this.getCurrentLogSheet()
    
    const logEntry: LogEntry = {
      log_id: uuidv4(),
      timestamp: formatDateTime(new Date()),
      ...entry
    }
    
    await this.sheetsService.appendRows(sheetName, [this.buildLogRow(logEntry)])
  }

  async getLogs(filters: LogFilters = {}): Promise<LogEntry[]> {
    const sheets = await this.sheetsService.listSheets()
    const logSheets = sheets.filter(s => s.startsWith('DailyLog_'))
    
    let allLogs: LogEntry[] = []
    
    for (const sheetName of logSheets) {
      const rows = await this.sheetsService.readAll(sheetName)
      if (rows.length <= 1) continue
      
      const logs = rows.slice(1).map(row => this.parseLogRow(row))
      allLogs = allLogs.concat(logs)
    }
    
    // Apply filters
    if (filters.from_date) {
      const fromDate = parseDate(filters.from_date)
      allLogs = allLogs.filter(log => parseDate(log.timestamp) >= fromDate)
    }
    
    if (filters.to_date) {
      const toDate = parseDate(filters.to_date)
      toDate.setHours(23, 59, 59, 999)
      allLogs = allLogs.filter(log => parseDate(log.timestamp) <= toDate)
    }
    
    if (filters.log_type) {
      allLogs = allLogs.filter(log => log.log_type === filters.log_type)
    }
    
    if (filters.action) {
      allLogs = allLogs.filter(log => log.action === filters.action)
    }
    
    if (filters.entity_id) {
      allLogs = allLogs.filter(log => log.entity_id === filters.entity_id)
    }
    
    // Sort by timestamp descending
    allLogs.sort((a, b) => parseDate(b.timestamp).getTime() - parseDate(a.timestamp).getTime())
    
    // Apply limit
    if (filters.limit) {
      allLogs = allLogs.slice(0, filters.limit)
    }
    
    return allLogs
  }

  async getSummary(dateRange: DateRange): Promise<DailySummary> {
    const logs = await this.getLogs({
      from_date: dateRange.from,
      to_date: dateRange.to,
      log_type: 'task'
    })
    
    // Get unique task IDs touched
    const taskIds = new Set(logs.map(log => log.entity_id))
    
    // Load current task details
    const tasks = await Promise.all(
      Array.from(taskIds).map(id => this.taskService.findById(id))
    )
    const validTasks = tasks.filter(t => t !== null)
    
    // Build tasks touched list
    const tasksTouched = logs.map(log => {
      const task = validTasks.find(t => t?.task_id === log.entity_id)
      return {
        task_id: log.entity_id,
        task_text: task?.task_text || 'Unknown task',
        action: log.action,
        timestamp: log.timestamp,
        change: log.metadata?.change
      }
    })
    
    // Find overdue tasks
    const overdueTasks = validTasks
      .filter(task => isOverdue(task!.due_date, task!.status))
      .map(task => ({
        task_id: task!.task_id,
        task_text: task!.task_text,
        due_date: task!.due_date!,
        days_overdue: getDaysOverdue(task!.due_date!),
        project_name: task!.project_name,
        status: task!.status
      }))
    
    // Aggregate by project
    const byProject: Record<string, { tasks_touched: number; tasks_created: number; tasks_completed: number }> = {}
    
    for (const task of validTasks) {
      const projectName = task!.project_name || 'No Project'
      if (!byProject[projectName]) {
        byProject[projectName] = { tasks_touched: 0, tasks_created: 0, tasks_completed: 0 }
      }
      
      byProject[projectName].tasks_touched++
      
      const taskLogs = logs.filter(l => l.entity_id === task!.task_id)
      if (taskLogs.some(l => l.action === 'CREATE')) {
        byProject[projectName].tasks_created++
      }
      if (task!.status === 'Finished' || task!.status === 'Closed') {
        byProject[projectName].tasks_completed++
      }
    }
    
    // Aggregate by relevancy (would need project data)
    const byRelevancy: Record<string, { tasks_touched: number; percentage: number }> = {
      work: { tasks_touched: 0, percentage: 0 },
      personal: { tasks_touched: 0, percentage: 0 },
      other: { tasks_touched: 0, percentage: 0 }
    }
    
    // Calculate overall stats
    const overallStats = {
      total_tasks_touched: taskIds.size,
      tasks_created: logs.filter(l => l.action === 'CREATE').length,
      tasks_updated: logs.filter(l => l.action === 'UPDATE').length,
      tasks_completed: validTasks.filter(t => t!.status === 'Finished' || t!.status === 'Closed').length,
      completion_rate: taskIds.size > 0 
        ? (validTasks.filter(t => t!.status === 'Finished' || t!.status === 'Closed').length / taskIds.size) * 100 
        : 0
    }
    
    return {
      date: dateRange.from === dateRange.to ? dateRange.from : '',
      date_range: dateRange,
      tasks_touched: tasksTouched,
      overdue_tasks: overdueTasks,
      by_project: byProject,
      by_relevancy: byRelevancy,
      overall_stats: overallStats
    }
  }
}
