export function extractSheetId(input: string): string | null {
  // If it's already just an ID
  if (!input.includes('/') && !input.includes('http')) {
    return input
  }
  
  // Extract from URL: https://docs.google.com/spreadsheets/d/SHEET_ID/edit
  const match = input.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)
  return match ? match[1] : null
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error: any) {
      if (i === maxRetries - 1) throw error
      if (error.code === 429 || error.status === 429) {
        await sleep(Math.pow(2, i) * 1000)
      } else {
        throw error
      }
    }
  }
  throw new Error('Retry failed')
}
