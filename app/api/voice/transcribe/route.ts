import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || ''
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json(
        { error: 'Expected multipart/form-data with an audio file field named "audio"' },
        { status: 400 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('audio')

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: 'Missing audio file' },
        { status: 400 }
      )
    }

    const openaiApiKey = process.env.OPENAI_API_KEY
    if (!openaiApiKey) {
      return NextResponse.json(
        { error: 'OPENAI_API_KEY is not configured on the server' },
        { status: 500 }
      )
    }

    const bytes = await file.arrayBuffer()
    const blob = new Blob([bytes], { type: file.type || 'audio/webm' })
    const whisperForm = new FormData()
    whisperForm.append('file', blob, file.name || 'audio.webm')
    whisperForm.append('model', 'gpt-4o-mini-transcribe')
    whisperForm.append('language', 'en')

    const resp = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${openaiApiKey}`
      },
      body: whisperForm
    })

    const data = await resp.json()

    if (!resp.ok) {
      console.error('Transcription API error:', data)
      return NextResponse.json(
        { error: 'Failed to transcribe audio', details: data.error || data },
        { status: 500 }
      )
    }

    return NextResponse.json({ transcript: data.text || '' })
  } catch (error: any) {
    console.error('Voice transcribe error:', error)
    return NextResponse.json(
      { error: 'Failed to transcribe audio', details: error.message },
      { status: 500 }
    )
  }
}
