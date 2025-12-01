import { Task } from './task'

export interface LogEntry {
  log_id: string
  timestamp: string // ISO datetime
  log_type: "project" | "task"
  action: "CREATE" | "UPDATE" | "READ"
  entity_id: string
  context: string // Human-readable description
  metadata?: Record<string, any> // JSON
}

export interface DailySummary {
  date: string
  date_range: {
    from: string
    to: string
  }
  tasks_touched: Array<{
    task_id: string
    task_text: string
    action: string
    timestamp: string
    change?: string
  }>
  overdue_tasks: Array<{
    task_id: string
    task_text: string
    due_date: string
    days_overdue: number
    project_name: string | null
    status: string
  }>
  by_project: Record<string, {
    tasks_touched: number
    tasks_created: number
    tasks_completed: number
  }>
  by_relevancy: Record<string, {
    tasks_touched: number
    percentage: number
  }>
  overall_stats: {
    total_tasks_touched: number
    tasks_created: number
    tasks_updated: number
    tasks_completed: number
    completion_rate: number
  }
}

export interface LogFilters {
  from_date?: string
  to_date?: string
  log_type?: "project" | "task"
  action?: "CREATE" | "UPDATE" | "READ"
  entity_id?: string
  limit?: number
}

export interface DateRange {
  from: string
  to: string
}
