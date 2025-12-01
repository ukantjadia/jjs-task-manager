import { z } from 'zod'

export const createTaskSchema = z.object({
  raw_text: z.string().min(1).max(500),
  project_keyword: z.string().optional(),
  priority: z.enum(['Low', 'Medium', 'High']).optional(),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  status: z.enum(['Started', 'In Progress', 'On Hold', 'Blocked', 'Nearly Finished', 'Finished', 'Closed', 'Dropped']).optional()
})

export const updateTaskSchema = z.object({
  task_text: z.string().min(1).max(500).optional(),
  status: z.string().optional(),
  priority: z.enum(['Low', 'Medium', 'High']).nullable().optional(),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  project_id: z.string().nullable().optional()
})

export const createProjectSchema = z.object({
  project_name: z.string().min(1).max(100),
  project_keywords: z.array(z.string()).min(1).max(5),
  project_description: z.string(),
  relevancy: z.enum(['work', 'personal', 'other'])
})

export const updateProjectSchema = z.object({
  project_name: z.string().min(1).max(100).optional(),
  project_keywords: z.array(z.string()).min(1).max(5).optional(),
  project_description: z.string().optional(),
  relevancy: z.enum(['work', 'personal', 'other']).optional()
})

export const connectSheetSchema = z.object({
  sheet_url: z.string().optional(),
  sheet_id: z.string().optional()
}).refine(data => data.sheet_url || data.sheet_id, {
  message: "Either sheet_url or sheet_id must be provided"
})
