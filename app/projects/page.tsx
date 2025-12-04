'use client'

import { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'

interface Project {
  project_id: string
  project_name: string
  project_keywords: string[]
  project_description: string
  relevancy: string
  project_created_at: string
}

export default function ProjectsPage() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [sheetId, setSheetId] = useState<string | null>(null)

  useEffect(() => {
    if (isLoaded && !user) {
      router.push('/sign-in')
    }
  }, [isLoaded, user, router])

  useEffect(() => {
    checkSheetAndFetchProjects()
  }, [])

  const checkSheetAndFetchProjects = async () => {
    try {
      const sheetResponse = await fetch('/api/sheets/connect')
      const sheetData = await sheetResponse.json()

      if (sheetData.connected && sheetData.sheet_id) {
        setSheetId(sheetData.sheet_id)
        await fetchProjects(sheetData.sheet_id)
      }
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchProjects = async (sid?: string) => {
    const id = sid || sheetId
    if (!id) return

    try {
      const response = await fetch(`/api/projects?sheet_id=${id}`)
      const data = await response.json()

      if (response.ok) {
        setProjects(data.projects || [])
      }
    } catch (err) {
      console.error('Error fetching projects:', err)
    }
  }

  if (!isLoaded || loading) {
    return (
      <div className="bg-background flex items-center justify-center py-24">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="bg-background">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-foreground">Projects</h2>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-primary text-primary-foreground px-6 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity"
          >
            + Create Project
          </button>
        </div>

        {projects.length === 0 ? (
          <div className="bg-card border border-border rounded-lg shadow-lg p-12 text-center">
            <p className="text-muted-foreground text-lg mb-4">No projects yet</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:opacity-90 transition-opacity"
            >
              Create Your First Project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <div
                key={project.project_id}
                className="bg-card border border-border rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow"
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-xl font-bold text-foreground">{project.project_name}</h3>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    project.relevancy === 'work' ? 'bg-chart-1/20 text-chart-1' :
                    project.relevancy === 'personal' ? 'bg-chart-2/20 text-chart-2' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    {project.relevancy}
                  </span>
                </div>

                <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                  {project.project_description}
                </p>

                <div className="flex flex-wrap gap-2">
                  {project.project_keywords.map((keyword) => (
                    <span
                      key={keyword}
                      className="bg-primary/10 text-primary px-2 py-1 rounded text-xs font-mono"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>

                <div className="mt-4 pt-4 border-t border-border text-xs text-muted-foreground">
                  Created {new Date(project.project_created_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}

        {showCreateModal && sheetId && (
          <CreateProjectModal
            sheetId={sheetId}
            onClose={() => setShowCreateModal(false)}
            onCreated={() => {
              fetchProjects()
              setShowCreateModal(false)
            }}
          />
        )}
      </main>
    </div>
  )
}

function CreateProjectModal({ sheetId, onClose, onCreated }: {
  sheetId: string
  onClose: () => void
  onCreated: () => void
}) {
  const [name, setName] = useState('')
  const [keywords, setKeywords] = useState('')
  const [description, setDescription] = useState('')
  const [relevancy, setRelevancy] = useState<'work' | 'personal' | 'other'>('personal')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const keywordArray = keywords.split(',').map(k => k.trim().toLowerCase()).filter(k => k)

      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sheet_id: sheetId,
          project_name: name,
          project_keywords: keywordArray,
          project_description: description,
          relevancy
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create project')
      }

      onCreated()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-card border border-border rounded-lg shadow-xl p-6 max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-start mb-6">
          <h3 className="text-2xl font-bold text-foreground">Create Project</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-2xl">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Project Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Awesome Project"
              className="w-full px-4 py-2 bg-background text-foreground border border-input rounded-lg focus:ring-2 focus:ring-ring"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Keywords * (comma-separated)
            </label>
            <input
              type="text"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="project, keyword, tag"
              className="w-full px-4 py-2 bg-background text-foreground border border-input rounded-lg focus:ring-2 focus:ring-ring"
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              Use these keywords to link tasks (e.g., "project: task description")
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this project about?"
              rows={3}
              className="w-full px-4 py-2 bg-background text-foreground border border-input rounded-lg focus:ring-2 focus:ring-ring"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Relevancy *
            </label>
            <select
              value={relevancy}
              onChange={(e) => setRelevancy(e.target.value as any)}
              className="w-full px-4 py-2 bg-background text-foreground border border-input rounded-lg focus:ring-2 focus:ring-ring"
            >
              <option value="work">Work</option>
              <option value="personal">Personal</option>
              <option value="other">Other</option>
            </select>
          </div>

          {error && (
            <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Project'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="bg-secondary text-secondary-foreground px-6 py-3 rounded-lg font-medium hover:opacity-90 transition-opacity"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
