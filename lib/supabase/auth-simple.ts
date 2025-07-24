import { supabase } from './client'

// usersテーブルを使わない簡易版（テスト用）
export async function signUpSimple(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })

  if (error) throw error
  return data
}

export async function signInSimple(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) throw error
  return data
}

export async function signOutSimple() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function getCurrentUserSimple() {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return null

  return {
    id: user.id,
    email: user.email!,
    role: 'user' as const,
    createdAt: user.created_at,
    updatedAt: user.created_at,
  }
}