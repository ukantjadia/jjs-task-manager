import { NextRequest, NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { GoogleSheetsService } from '@/lib/services/googleSheets.service'
import { extractSheetId } from '@/lib/utils/sheetHelpers'
import { connectSheetSchema } from '@/lib/utils/validators'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const body = await request.json()
    const validated = connectSheetSchema.parse(body)

    // Extract sheet ID
    const sheetId = extractSheetId(validated.sheet_url || validated.sheet_id || '')
    if (!sheetId) {
      return NextResponse.json({ error: 'Invalid sheet URL or ID' }, { status: 400 })
    }

    // Get Google access token from Clerk
    // Note: You need to implement proper token retrieval based on your Clerk setup
    // This is a placeholder - see documentation for proper implementation
    const googleAccount = user.externalAccounts?.find(a => a.provider === 'google')
    const token = (googleAccount as any)?.accessToken
    
    if (!token) {
      return NextResponse.json(
        { error: 'No Google access token found. Please reconnect your Google account.' },
        { status: 403 }
      )
    }

    // Test access and initialize
    const sheetsService = new GoogleSheetsService(token, sheetId)
    
    try {
      await sheetsService.listSheets()
    } catch (error: any) {
      return NextResponse.json(
        { error: 'Cannot access sheet', details: error.message },
        { status: 403 }
      )
    }

    // Initialize sheet structure
    await sheetsService.initializeSheet()

    // Store sheet ID in user metadata
    const { setUserSheetId } = await import('@/lib/utils/clerkHelpers')
    await setUserSheetId(sheetId)
    
    return NextResponse.json({
      success: true,
      sheet_id: sheetId,
      initialized: true
    })
  } catch (error: any) {
    console.error('Sheet connection error:', error)
    return NextResponse.json(
      { error: 'Failed to connect sheet', details: error.message },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get from user metadata
    const { getUserSheetId } = await import('@/lib/utils/clerkHelpers')
    const sheetId = await getUserSheetId()
    
    return NextResponse.json({
      sheet_id: sheetId,
      connected: !!sheetId
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to get connection status', details: error.message },
      { status: 500 }
    )
  }
}
