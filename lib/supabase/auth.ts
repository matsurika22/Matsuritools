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

  // トリガーが自動的にusersテーブルにレコードを作成するが、
  // 念のため確認と更新を行う
  if (data.user) {
    // 少し待機してトリガーの処理を待つ
    await new Promise(resolve => setTimeout(resolve, 500))

    // handle_nameが正しく設定されているか確認
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single()

    if (profileError && profileError.code !== 'PGRST116') { // PGRST116 = not found
      console.error('Profile fetch error:', profileError)
    }

    // プロフィールが存在しない、またはhandle_nameが異なる場合は更新
    if (!profile || profile.handle_name !== handleName) {
      const { error: upsertError } = await supabase
        .from('users')
        .upsert({
          id: data.user.id,
          email: data.user.email!,
          handle_name: handleName,
          role: 'user',
        })
        .select()

      if (upsertError) {
        console.error('Profile upsert error:', upsertError)
        throw upsertError
      }
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