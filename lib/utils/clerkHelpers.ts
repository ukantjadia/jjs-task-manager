import { auth, currentUser, clerkClient } from '@clerk/nextjs/server'

/**
 * Get the Google access token for the current user
 */
export async function getGoogleAccessToken(): Promise<string | null> {
  const user = await currentUser()
  if (!user) return null

  const googleAccount = user.externalAccounts?.find(
    account => account.provider === 'google'
  )

  if (!googleAccount) return null

  return (googleAccount as any).accessToken || null
}

/**
 * Get the Sheet ID from user's public metadata
 */
export async function getUserSheetId(): Promise<string | null> {
  const { userId } = await auth()
  if (!userId) return null

  const user = await currentUser()
  if (!user) return null

  // Get from public metadata
  return (user.publicMetadata?.sheetId as string) || null
}

/**
 * Store Sheet ID in user's public metadata
 */
export async function setUserSheetId(sheetId: string): Promise<void> {
  const { userId } = await auth()
  if (!userId) throw new Error('Not authenticated')

  const client = await clerkClient()
  await client.users.updateUserMetadata(userId, {
    publicMetadata: {
      sheetId
    }
  })
}

/**
 * Get Sheet ID from request (query param, body, or metadata)
 */
export async function getSheetIdFromRequest(
  searchParams?: URLSearchParams,
  body?: any
): Promise<string | null> {
  // Priority 1: From query params
  if (searchParams?.get('sheet_id')) {
    return searchParams.get('sheet_id')
  }

  // Priority 2: From request body
  if (body?.sheet_id) {
    return body.sheet_id
  }

  // Priority 3: From user metadata
  return await getUserSheetId()
}
