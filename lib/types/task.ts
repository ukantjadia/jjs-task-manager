export type TaskStatus = 
  | "Started"
  | "In Progress"
  | "On Hold"
  | "Blocked"
  | "Nearly Finished"
  | "Finished"
  | "Closed"
  | "Dropped"

export interface Task {
  task_id: string
  task_text: string // Full text with prefix
  project_id: string | null
  project_name: string | null // Denormalized
  status: TaskStatus
  priority: "Low" | "Medium" | "High" | null
  due_date: string | null // ISO date
  task_created_at: string
  task_edited_at: string
}

export interface CreateTaskInput {
  raw_text: string
  project_keyword?: string
  status?: TaskStatus
  priority?: "Low" | "Medium" | "High"
  due_date?: string
}

export interface TaskFilters {
  project?: string
  status?: string[]
  relevancy?: string
  overdue?: boolean
  from_date?: string
  to_date?: string
  limit?: number
  offset?: number
}
