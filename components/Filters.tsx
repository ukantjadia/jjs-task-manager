'use client'

import { useState } from 'react'

interface FiltersProps {
  onFilterChange: (filters: FilterState) => void
}

export interface FilterState {
  project?: string
  status: string[]
  relevancy?: string
  dateRange?: string
}

export default function Filters({ onFilterChange }: FiltersProps) {
  const [filters, setFilters] = useState<FilterState>({
    status: []
  })

  const updateFilters = (newFilters: Partial<FilterState>) => {
    const updated = { ...filters, ...newFilters }
    setFilters(updated)
    onFilterChange(updated)
  }

  const toggleStatus = (status: string) => {
    const newStatuses = filters.status.includes(status)
      ? filters.status.filter(s => s !== status)
      : [...filters.status, status]
    updateFilters({ status: newStatuses })
  }

  return (
    <div className="bg-card border border-border rounded-lg shadow-lg p-6 space-y-6">
      <h3 className="text-lg font-bold text-foreground">Filters</h3>

      {/* Status Filter */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-3">
          Status
        </label>
        <div className="space-y-2">
          {['Started', 'In Progress', 'On Hold', 'Blocked', 'Nearly Finished', 'Finished'].map((status) => (
            <label key={status} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.status.includes(status)}
                onChange={() => toggleStatus(status)}
                className="w-4 h-4 rounded border-input focus:ring-2 focus:ring-ring"
              />
              <span className="text-sm text-foreground">{status}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Relevancy Filter */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-3">
          Relevancy
        </label>
        <div className="space-y-2">
          {[
            { value: '', label: 'All' },
            { value: 'work', label: 'Work' },
            { value: 'personal', label: 'Personal' },
            { value: 'other', label: 'Other' }
          ].map((option) => (
            <label key={option.value} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="relevancy"
                checked={filters.relevancy === option.value || (!filters.relevancy && option.value === '')}
                onChange={() => updateFilters({ relevancy: option.value || undefined })}
                className="w-4 h-4 border-input focus:ring-2 focus:ring-ring"
              />
              <span className="text-sm text-foreground">{option.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Date Range Filter */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-3">
          Due Date
        </label>
        <select
          value={filters.dateRange || ''}
          onChange={(e) => updateFilters({ dateRange: e.target.value || undefined })}
          className="w-full px-3 py-2 bg-background text-foreground border border-input rounded-lg focus:ring-2 focus:ring-ring"
        >
          <option value="">All</option>
          <option value="overdue">Overdue</option>
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
        </select>
      </div>

      {/* Clear Filters */}
      <button
        onClick={() => {
          setFilters({ status: [] })
          onFilterChange({ status: [] })
        }}
        className="w-full bg-secondary text-secondary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
      >
        Clear Filters
      </button>
    </div>
  )
}
