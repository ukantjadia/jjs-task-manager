'use client'

import { useState } from 'react'
import { FilterState } from './Filters'

interface FilterModalProps {
  isOpen: boolean
  onClose: () => void
  filters: FilterState
  onFilterChange: (filters: FilterState) => void
  onApply: () => void
  key?: string | number // Allow key prop to force remount
}

export default function FilterModal({ isOpen, onClose, filters, onFilterChange, onApply }: FilterModalProps) {
  // Initialize with current filters - will be reset when component remounts via key
  const [localFilters, setLocalFilters] = useState<FilterState>(filters)

  if (!isOpen) return null

  const updateFilters = (newFilters: Partial<FilterState>) => {
    const updated = { ...localFilters, ...newFilters }
    setLocalFilters(updated)
  }

  const toggleStatus = (status: string) => {
    const newStatuses = localFilters.status.includes(status)
      ? localFilters.status.filter(s => s !== status)
      : [...localFilters.status, status]
    updateFilters({ status: newStatuses })
  }

  const handleClear = () => {
    const cleared = { status: [] }
    setLocalFilters(cleared)
    onFilterChange(cleared)
  }

  const handleApply = () => {
    onFilterChange(localFilters)
    onApply()
    onClose()
  }

  const hasActiveFilters = () => {
    return (
      localFilters.status.length > 0 ||
      !!localFilters.relevancy ||
      !!localFilters.dateRange ||
      !!localFilters.project
    )
  }

  return (
    <div
      className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div
        className="bg-card border border-border rounded-lg shadow-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-6">
          <h3 className="text-xl font-bold text-foreground">Filters</h3>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground text-2xl leading-none"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Active Filters Display */}
        {hasActiveFilters() && (
          <div className="mb-6 p-4 bg-secondary/50 rounded-lg">
            <p className="text-sm font-medium text-foreground mb-2">Active Filters:</p>
            <div className="flex flex-wrap gap-2">
              {localFilters.status.length > 0 && (
                <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded">
                  Status: {localFilters.status.join(', ')}
                </span>
              )}
              {localFilters.relevancy && (
                <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded">
                  Relevancy: {localFilters.relevancy}
                </span>
              )}
              {localFilters.dateRange && (
                <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded">
                  Date: {localFilters.dateRange}
                </span>
              )}
              {localFilters.project && (
                <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded">
                  Project: {localFilters.project}
                </span>
              )}
            </div>
          </div>
        )}

        <div className="space-y-6">
          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-3">
              Status
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {['Started', 'In Progress', 'On Hold', 'Blocked', 'Nearly Finished', 'Finished'].map((status) => (
                <label key={status} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={localFilters.status.includes(status)}
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
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
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
                    checked={localFilters.relevancy === option.value || (!localFilters.relevancy && option.value === '')}
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
              value={localFilters.dateRange || ''}
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
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-6 pt-4 border-t border-border">
          <button
            onClick={handleClear}
            className="flex-1 bg-secondary text-secondary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Clear All
          </button>
          <button
            onClick={handleApply}
            className="flex-1 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  )
}
