export type LlmProvider = 'openai' | 'gemini' | 'deepseek' | 'openrouter'

export type VoiceStatus =
  | 'ready'
  | 'recording'
  | 'uploading'
  | 'transcribing'
  | 'structuring'
  | 'done'
  | 'error'

export interface ProjectProfile {
  project_id: string
  project_name: string
  project_keywords: string[]
  project_description: string
}

export interface ParsedVoiceTask {
  id: string
  description: string
  project_id?: string
  due_date?: string
  priority?: 'Low' | 'Medium' | 'High'
}

export interface VoiceSessionState {
  status: VoiceStatus
  statusMessage?: string
  transcriptRaw: string
  transcriptEditable: string
  parsedTasks: ParsedVoiceTask[]
  selectedTaskIds: string[]
  error?: string
}

export interface VoiceTaskExtractionInput {
  transcript: string
}

export interface VoiceTaskExtractionOutput {
  tasks: ParsedVoiceTask[]
}
