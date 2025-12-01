import { format, parseISO, differenceInDays, addDays } from 'date-fns'

export function formatDate(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}

export function formatDateTime(date: Date): string {
  return date.toISOString()
}

export function parseDate(dateString: string): Date {
  return parseISO(dateString)
}

export function isOverdue(dueDate: string | null, status: string): boolean {
  if (!dueDate) return false
  if (['Finished', 'Closed', 'Dropped'].includes(status)) return false
  
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = parseDate(dueDate)
  
  return due < today
}

export function getDaysOverdue(dueDate: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = parseDate(dueDate)
  
  return differenceInDays(today, due)
}

export function getLogSheetName(date: Date): string {
  const endDate = addDays(date, 9) // 10 days total
  return `DailyLog_${formatDate(date)}_to_${formatDate(endDate)}`
}

export function parseLogSheetName(sheetName: string): { from: Date; to: Date } | null {
  const match = sheetName.match(/^DailyLog_(\d{4}-\d{2}-\d{2})_to_(\d{4}-\d{2}-\d{2})$/)
  if (!match) return null
  
  return {
    from: parseDate(match[1]),
    to: parseDate(match[2])
  }
}

export function isDateInRange(date: Date, from: Date, to: Date): boolean {
  return date >= from && date <= to
}
