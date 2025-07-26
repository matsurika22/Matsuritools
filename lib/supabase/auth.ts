import { supabase } from './client'
import type { User } from '@/types/auth'

export async function signUp(email: string, password: string, handleName: string) {
  // シンプルにSupabase Authでユーザー作成
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        handle_name: handleName,
      }
    }
  })

  if (error) throw error

  // トリガーがusersテーブルに自動的にレコードを作成するので
  // クライアント側では何もしない
  console.log('User signed up successfully:', data.user?.id)

  return data
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) throw error
  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function getCurrentUser(): Promise<User | null> {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return null

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) return null

  return {
    id: profile.id,
    email: profile.email,
    handleName: profile.handle_name,
    role: profile.role,
    createdAt: profile.created_at,
    updatedAt: profile.updated_at,
  }
}