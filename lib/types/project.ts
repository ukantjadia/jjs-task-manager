export interface Project {
  project_id: string
  project_name: string
  project_keywords: string[] // Split from CSV in sheet
  project_description: string
  relevancy: "work" | "personal" | "other"
  project_created_at: string // ISO date
  project_edited_at: string
  project_description_edited_at: string
}

export interface CreateProjectInput {
  project_name: string
  project_keywords: string[]
  project_description: string
  relevancy: "work" | "personal" | "other"
}

export interface ProjectFilters {
  relevancy?: "work" | "personal" | "other"
  keyword_contains?: string
}
