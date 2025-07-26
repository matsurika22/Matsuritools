// エラーハンドリングとユーザーフレンドリーなメッセージ表示

import { PostgrestError } from '@supabase/supabase-js'

// エラーの種類を定義
export type AppError = {
  type: 'auth' | 'database' | 'network' | 'validation' | 'permission' | 'unknown'
  message: string
  originalError?: any
  code?: string
}

// Supabaseエラーの日本語化マッピング
const SUPABASE_ERROR_MESSAGES: Record<string, string> = {
  // 認証関連
  'invalid_credentials': 'メールアドレスまたはパスワードが正しくありません',
  'email_not_confirmed': 'メールアドレスの確認が完了していません',
  'signup_disabled': '新規登録は現在無効になっています',
  'email_already_registered': 'このメールアドレスは既に登録されています',
  'weak_password': 'パスワードが脆弱です。より安全なパスワードを使用してください',
  
  // データベース関連
  '23505': 'データが重複しています',
  '23503': '関連するデータが見つかりません',
  '42703': '指定されたフィールドが存在しません',
  '42P01': 'テーブルまたはビューが存在しません',
  '23502': '必須フィールドが入力されていません',
  
  // 権限関連
  'insufficient_privileges': 'この操作を実行する権限がありません',
  'row_level_security_violation': 'データへのアクセス権限がありません',
  
  // RLS関連
  'new row violates row-level security policy': 'データの作成権限がありません',
  'permission denied': 'アクセス権限がありません',
}

// エラーメッセージの汎用化
const GENERIC_ERROR_MESSAGES = {
  auth: 'ログインに関する問題が発生しました',
  database: 'データベースエラーが発生しました',
  network: 'ネットワーク接続に問題があります',
  validation: '入力内容に問題があります',
  permission: 'この操作を実行する権限がありません',
  unknown: '予期しないエラーが発生しました',
}

// PostgrestErrorを解析してAppErrorに変換
export function parseSupabaseError(error: PostgrestError | any): AppError {
  // PostgrestError（データベースエラー）の場合
  if (error && typeof error === 'object' && 'code' in error) {
    const code = error.code as string
    const message = error.message as string
    
    // 特定のエラーコードの処理
    if (SUPABASE_ERROR_MESSAGES[code]) {
      return {
        type: 'database',
        message: SUPABASE_ERROR_MESSAGES[code],
        originalError: error,
        code,
      }
    }
    
    // メッセージベースの処理
    for (const [key, value] of Object.entries(SUPABASE_ERROR_MESSAGES)) {
      if (message.toLowerCase().includes(key.toLowerCase())) {
        return {
          type: 'database',
          message: value,
          originalError: error,
          code,
        }
      }
    }
    
    // 権限エラーの判定
    if (message.includes('policy') || message.includes('permission') || code === 'PGRST301') {
      return {
        type: 'permission',
        message: 'この操作を実行する権限がありません',
        originalError: error,
        code,
      }
    }
    
    return {
      type: 'database',
      message: GENERIC_ERROR_MESSAGES.database,
      originalError: error,
      code,
    }
  }
  
  // 認証エラーの場合
  if (error && error.message && error.message.includes('auth')) {
    return {
      type: 'auth',
      message: GENERIC_ERROR_MESSAGES.auth,
      originalError: error,
    }
  }
  
  // ネットワークエラーの場合
  if (error && (error.name === 'NetworkError' || error.message?.includes('fetch'))) {
    return {
      type: 'network',
      message: GENERIC_ERROR_MESSAGES.network,
      originalError: error,
    }
  }
  
  // その他のエラー
  return {
    type: 'unknown',
    message: error?.message || GENERIC_ERROR_MESSAGES.unknown,
    originalError: error,
  }
}

// エラーログ出力（開発環境のみ詳細を表示）
export function logError(error: AppError, context?: string) {
  const isDevelopment = process.env.NODE_ENV === 'development'
  
  if (isDevelopment) {
    console.group(`🚨 Error${context ? ` in ${context}` : ''}`)
    console.error('Type:', error.type)
    console.error('Message:', error.message)
    if (error.code) console.error('Code:', error.code)
    if (error.originalError) console.error('Original:', error.originalError)
    console.groupEnd()
  } else {
    // 本番環境では最小限のログ
    console.error(`Error in ${context || 'app'}:`, error.message)
  }
}

// ユーザー向けのエラーメッセージ取得
export function getUserErrorMessage(error: any, context?: string): string {
  const appError = parseSupabaseError(error)
  logError(appError, context)
  return appError.message
}

// リトライ可能なエラーかどうかの判定
export function isRetryableError(error: AppError): boolean {
  return error.type === 'network' || error.code === 'PGRST204'
}

// バリデーションエラーの作成
export function createValidationError(message: string): AppError {
  return {
    type: 'validation',
    message,
  }
}

// 権限エラーの作成
export function createPermissionError(message?: string): AppError {
  return {
    type: 'permission',
    message: message || GENERIC_ERROR_MESSAGES.permission,
  }
}