import { createClient } from '@supabase/supabase-js'
import { config } from '@/lib/config/env'

// クライアント用Supabase設定（セキュリティ強化）
export const supabase = createClient(
  config.supabase.url,
  config.supabase.anonKey,
  {
    auth: {
      // セキュリティ設定
      persistSession: true,
      detectSessionInUrl: true,
      autoRefreshToken: true,
      // セッション管理の強化
      storageKey: 'matsuritools-auth-token',
    },
    db: {
      // データベース接続の最適化
      schema: 'public',
    },
    global: {
      // 406エラー対策: Accept headerを明示的に設定
      headers: {
        'X-Client-Info': 'matsuritools@1.0.0',
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...(config.app.environment === 'production' && {
          'X-Requested-With': 'XMLHttpRequest',
        }),
      },
    },
    // リアルタイム機能（必要に応じて有効化）
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  }
)

// サービスロール用クライアント（サーバーサイドのみ）
export const supabaseAdmin = config.supabase.serviceRoleKey
  ? createClient(
      config.supabase.url,
      config.supabase.serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
        global: {
          headers: {
            'X-Client-Info': 'matsuritools-admin@1.0.0',
          },
        },
      }
    )
  : null

// クライアントサイドでのサービスロールアクセス防止
if (typeof window !== 'undefined' && supabaseAdmin) {
  console.error('❌ Service role client should not be used on client side!')
}