import { supabase } from './client'
import type { User } from '@/types/auth'

export async function signUp(email: string, password: string, handleName: string) {
  // 既存ユーザーチェックは一時的に無効化（RLSエラー回避）
  // TODO: RLSポリシー修正後に有効化

  // Supabase Authでユーザー作成（メタデータにhandle_nameを含める）
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

  // トリガーが自動的にusersテーブルにレコードを作成するので、
  // クライアント側での作成は行わない
  // トリガーの処理を待つため少し待機
  if (data.user) {
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // プロフィールが作成されたか確認（読み取りのみ）
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single()

    if (profileError) {
      console.log('Profile not found yet, but trigger should create it:', profileError)
    } else {
      console.log('Profile created by trigger:', profile)
    }
  }

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