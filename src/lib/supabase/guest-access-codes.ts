import { supabase } from './client'
import type { Database } from '@/types/database'

type AccessCode = Database['public']['Tables']['access_codes']['Row']

export interface ValidateGuestAccessCodeResult {
  isValid: boolean
  accessCode?: AccessCode & {
    pack: {
      id: string
      name: string
    }
  }
  error?: string
}

// ゲスト用アクセスコード検証（ログイン不要）
export async function validateGuestAccessCode(code: string): Promise<ValidateGuestAccessCodeResult> {
  try {
    // 入力値の正規化（スペース削除のみ、大文字小文字は保持）
    const normalizedCode = code.replace(/\s/g, '')
    
    if (!normalizedCode) {
      return { isValid: false, error: 'アクセスコードを入力してください' }
    }

    // アクセスコードを検索（大文字小文字を区別しない）
    const { data: accessCode, error: fetchError } = await supabase
      .from('access_codes')
      .select(`
        *,
        pack:packs!inner(
          id,
          name
        )
      `)
      .ilike('code', normalizedCode)
      .single()

    if (fetchError || !accessCode) {
      return { isValid: false, error: '無効なアクセスコードです' }
    }

    // 有効期限チェック
    const now = new Date()
    
    if (accessCode.valid_from) {
      const validFrom = new Date(accessCode.valid_from)
      if (validFrom > now) {
        return { isValid: false, error: 'このアクセスコードはまだ有効ではありません' }
      }
    }

    if (accessCode.valid_until) {
      const validUntil = new Date(accessCode.valid_until)
      if (validUntil < now) {
        return { isValid: false, error: 'このアクセスコードの有効期限が切れています' }
      }
    }

    // 使用回数制限チェック
    if (accessCode.max_uses && accessCode.current_uses >= accessCode.max_uses) {
      return { isValid: false, error: 'このアクセスコードの使用回数が上限に達しています' }
    }

    // ゲストアクセスの場合は使用回数をカウントアップ
    await supabase
      .from('access_codes')
      .update({ current_uses: accessCode.current_uses + 1 })
      .eq('id', accessCode.id)

    return { 
      isValid: true, 
      accessCode: accessCode as any
    }

  } catch (error) {
    console.error('Guest access code validation error:', error)
    return { isValid: false, error: 'エラーが発生しました' }
  }
}