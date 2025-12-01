import { v4 as uuidv4 } from 'uuid'
import { GoogleSheetsService } from './googleSheets.service'
import { Project, CreateProjectInput, ProjectFilters } from '../types/project'
import { formatDateTime } from '../utils/dateHelpers'

export class ProjectService {
  constructor(private sheetsService: GoogleSheetsService) {}

  private parseProjectRow(row: any[]): Project {
    return {
      project_id: row[0] || '',
      project_name: row[1] || '',
      project_keywords: row[2] ? row[2].split(',').map((k: string) => k.trim()) : [],
      project_description: row[3] || '',
      relevancy: (row[4] || 'other') as "work" | "personal" | "other",
      project_created_at: row[5] || '',
      project_edited_at: row[6] || '',
      project_description_edited_at: row[7] || ''
    }
  }

  private buildProjectRow(project: Project): any[] {
    return [
      project.project_id,
      project.project_name,
      project.project_keywords.join(','),
      project.project_description,
      project.relevancy,
      project.project_created_at,
      project.project_edited_at,
      project.project_description_edited_at
    ]
  }

  async findByKeyword(keyword: string): Promise<Project | null> {
    const rows = await this.sheetsService.readAll('Projects')
    if (rows.length <= 1) return null // Only header or empty
    
    const lowerKeyword = keyword.toLowerCase()
    
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i]
      const keywords = row[2] ? row[2].split(',').map((k: string) => k.trim().toLowerCase()) : []
      
      if (keywords.includes(lowerKeyword)) {
        return this.parseProjectRow(row)
      }
    }
    
    return null
  }

  async findById(id: string): Promise<Project | null> {
    const results = await this.sheetsService.findRowsByColumn('Projects', 0, id)
    if (results.length === 0) return null
    
    return this.parseProjectRow(results[0].row)
  }

  async create(data: CreateProjectInput): Promise<Project> {
    const now = formatDateTime(new Date())
    
    const project: Project = {
      project_id: uuidv4(),
      project_name: data.project_name,
      project_keywords: data.project_keywords,
      project_description: data.project_description,
      relevancy: data.relevancy,
      project_created_at: now,
      project_edited_at: now,
      project_description_edited_at: now
    }
    
    await this.sheetsService.appendRows('Projects', [this.buildProjectRow(project)])
    
    return project
  }

  async update(id: string, data: Partial<Project>): Promise<Project> {
    const results = await this.sheetsService.findRowsByColumn('Projects', 0, id)
    if (results.length === 0) {
      throw new Error('Project not found')
    }
    
    const existing = this.parseProjectRow(results[0].row)
    const now = formatDateTime(new Date())
    
    const updated: Project = {
      ...existing,
      ...data,
      project_edited_at: now,
      project_description_edited_at: data.project_description 
        ? now 
        : existing.project_description_edited_at
    }
    
    await this.sheetsService.updateRow('Projects', results[0].index, this.buildProjectRow(updated))
    
    return updated
  }

  async list(filters?: ProjectFilters): Promise<Project[]> {
    const rows = await this.sheetsService.readAll('Projects')
    if (rows.length <= 1) return []
    
    let projects = rows.slice(1).map(row => this.parseProjectRow(row))
    
    if (filters?.relevancy) {
      projects = projects.filter(p => p.relevancy === filters.relevancy)
    }
    
    if (filters?.keyword_contains) {
      const search = filters.keyword_contains.toLowerCase()
      projects = projects.filter(p => 
        p.project_keywords.some(k => k.toLowerCase().includes(search))
      )
    }
    
    return projects
  }
}
