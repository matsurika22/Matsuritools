import { supabase } from './client'
import type { User } from '@/types/auth'

export async function signUp(email: string, password: string, handleName: string) {
  // まず既存のユーザーをチェック
  const { data: existingUser } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .single()

  if (existingUser) {
    throw new Error('このメールアドレスは既に登録されています')
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })

  if (error) throw error

  // ユーザーテーブルにレコードを作成
  if (data.user) {
    const { error: profileError } = await supabase
      .from('users')
      .insert({
        id: data.user.id,
        email: data.user.email!,
        handle_name: handleName,
        role: 'user',
      })
      .select()
      .single()

    if (profileError) {
      console.error('Profile creation error:', profileError)
      // 既に存在する場合は、auth.usersには作成されているが
      // usersテーブルには作成されていない状態なので、更新を試みる
      if (profileError.code === '23505') {
        const { error: updateError } = await supabase
          .from('users')
          .update({
            handle_name: handleName,
            updated_at: new Date().toISOString(),
          })
          .eq('id', data.user.id)

        if (updateError) {
          throw updateError
        }
      } else {
        throw profileError
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