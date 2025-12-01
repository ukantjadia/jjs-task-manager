import { google, sheets_v4 } from 'googleapis'
import { withRetry } from '../utils/sheetHelpers'

export class GoogleSheetsService {
  private sheets: sheets_v4.Sheets
  private spreadsheetId: string

  constructor(accessToken: string, spreadsheetId: string) {
    const auth = new google.auth.OAuth2()
    auth.setCredentials({ access_token: accessToken })
    
    this.sheets = google.sheets({ version: 'v4', auth })
    this.spreadsheetId = spreadsheetId
  }

  async listSheets(): Promise<string[]> {
    return withRetry(async () => {
      const response = await this.sheets.spreadsheets.get({
        spreadsheetId: this.spreadsheetId
      })
      
      return response.data.sheets?.map(sheet => sheet.properties?.title || '') || []
    })
  }

  async getOrCreateSheet(sheetName: string): Promise<number> {
    const sheets = await this.listSheets()
    
    if (sheets.includes(sheetName)) {
      const response = await this.sheets.spreadsheets.get({
        spreadsheetId: this.spreadsheetId
      })
      const sheet = response.data.sheets?.find(s => s.properties?.title === sheetName)
      return sheet?.properties?.sheetId || 0
    }
    
    // Create new sheet
    return withRetry(async () => {
      const response = await this.sheets.spreadsheets.batchUpdate({
        spreadsheetId: this.spreadsheetId,
        requestBody: {
          requests: [{
            addSheet: {
              properties: { title: sheetName }
            }
          }]
        }
      })
      
      return response.data.replies?.[0]?.addSheet?.properties?.sheetId || 0
    })
  }

  async readRange(sheetName: string, range: string): Promise<any[][]> {
    return withRetry(async () => {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `${sheetName}!${range}`
      })
      
      return response.data.values || []
    })
  }

  async readAll(sheetName: string): Promise<any[][]> {
    return this.readRange(sheetName, 'A:Z')
  }

  async appendRows(sheetName: string, rows: any[][]): Promise<void> {
    return withRetry(async () => {
      await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: `${sheetName}!A:A`,
        valueInputOption: 'RAW',
        requestBody: {
          values: rows
        }
      })
    })
  }

  async updateRow(sheetName: string, rowIndex: number, values: any[]): Promise<void> {
    return withRetry(async () => {
      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: `${sheetName}!A${rowIndex}:Z${rowIndex}`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [values]
        }
      })
    })
  }

  async findRowsByColumn(
    sheetName: string,
    columnIndex: number,
    value: any
  ): Promise<{ row: any[]; index: number }[]> {
    const allRows = await this.readAll(sheetName)
    const results: { row: any[]; index: number }[] = []
    
    allRows.forEach((row, index) => {
      if (row[columnIndex] === value) {
        results.push({ row, index: index + 1 })
      }
    })
    
    return results
  }

  async initializeSheet(): Promise<void> {
    const sheets = await this.listSheets()
    
    // Create Projects sheet
    if (!sheets.includes('Projects')) {
      await this.getOrCreateSheet('Projects')
      await this.appendRows('Projects', [[
        'project_id',
        'project_name',
        'project_keywords',
        'project_description',
        'relevancy',
        'project_created_at',
        'project_edited_at',
        'project_description_edited_at'
      ]])
    }
    
    // Create Tasks sheet
    if (!sheets.includes('Tasks')) {
      await this.getOrCreateSheet('Tasks')
      await this.appendRows('Tasks', [[
        'task_id',
        'task_text',
        'project_id',
        'project_name',
        'status',
        'priority',
        'due_date',
        'task_created_at',
        'task_edited_at'
      ]])
    }
    
    // Create first DailyLog sheet
    const today = new Date()
    const endDate = new Date(today)
    endDate.setDate(today.getDate() + 9)
    
    const formatDate = (d: Date) => d.toISOString().split('T')[0]
    const logSheetName = `DailyLog_${formatDate(today)}_to_${formatDate(endDate)}`
    
    if (!sheets.includes(logSheetName)) {
      await this.getOrCreateSheet(logSheetName)
      await this.appendRows(logSheetName, [[
        'log_id',
        'timestamp',
        'log_type',
        'action',
        'entity_id',
        'context',
        'metadata'
      ]])
    }
  }
}
