import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

/**
 * Helper: verify LIFF id_token and return userId + profile
 */
export async function verifyLiffToken(id_token: string | null | undefined, line_user_id?: string) {
  if (id_token) {
    const params = new URLSearchParams()
    params.append('id_token', id_token)
    const channelId = process.env.NEXT_PUBLIC_LIFF_ID!.split('-')[0]
    params.append('client_id', channelId)

    const res = await fetch('https://api.line.me/oauth2/v2.1/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    })

    const data = await res.json()
    if (!res.ok) {
      return { error: 'Invalid ID token', userId: null, displayName: null, pictureUrl: null }
    }
    return { error: null, userId: data.sub as string, displayName: data.name as string, pictureUrl: data.picture as string | null }
  }

  // fallback: dev mode without token
  if (line_user_id) {
    return { error: null, userId: line_user_id, displayName: null, pictureUrl: null }
  }
  return { error: 'Missing id_token', userId: null, displayName: null, pictureUrl: null }
}

/**
 * Helper: ensure user exists in users table
 */
export async function ensureUser(userId: string, displayName?: string | null, pictureUrl?: string | null) {
  await supabaseAdmin.from('users').upsert(
    {
      line_user_id: userId,
      display_name: displayName ?? null,
      picture_url: pictureUrl ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'line_user_id', ignoreDuplicates: false }
  )
}
