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

  // 406エラーが発生してもとりあえず動作させる
  try {
    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    if (!profile) {
      // プロファイルが取得できない場合はauth情報から作成
      return {
        id: user.id,
        email: user.email || '',
        handleName: user.user_metadata?.handle_name || 'ユーザー',
        role: 'user',
        createdAt: user.created_at || new Date().toISOString(),
        updatedAt: user.updated_at || new Date().toISOString(),
      }
    }

    return {
      id: profile.id,
      email: profile.email,
      handleName: profile.handle_name,
      role: profile.role,
      createdAt: profile.created_at,
      updatedAt: profile.updated_at,
    }
  } catch (error) {
    // エラーが発生してもauth情報で続行
    return {
      id: user.id,
      email: user.email || '',
      handleName: user.user_metadata?.handle_name || 'ユーザー',
      role: 'user',
      createdAt: user.created_at || new Date().toISOString(),
      updatedAt: user.updated_at || new Date().toISOString(),
    }
  }
}