// 環境変数の型安全な管理
// 本番環境でのセキュリティ強化

interface AppConfig {
  supabase: {
    url: string
    anonKey: string
    serviceRoleKey?: string
  }
  app: {
    url: string
    environment: 'development' | 'staging' | 'production'
  }
  features: {
    analytics: boolean
    errorReporting: boolean
  }
}

// 必須環境変数の検証
function validateRequiredEnvVars() {
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY'
  ]

  const missing = required.filter(key => !process.env[key])
  
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      'Please check your .env.local file and ensure all required variables are set.'
    )
  }
}

// URL形式の検証
function validateUrl(url: string, name: string): string {
  try {
    new URL(url)
    return url
  } catch {
    throw new Error(`Invalid URL format for ${name}: ${url}`)
  }
}

// 環境変数の初期化と検証
function initializeConfig(): AppConfig {
  if (typeof window === 'undefined') {
    // サーバーサイドでのみ検証実行
    validateRequiredEnvVars()
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  // URL検証
  validateUrl(supabaseUrl, 'NEXT_PUBLIC_SUPABASE_URL')

  // Supabase キーの形式検証
  if (!supabaseAnonKey.startsWith('eyJ')) {
    console.warn('NEXT_PUBLIC_SUPABASE_ANON_KEY does not appear to be a valid JWT token')
  }

  const environment = (process.env.NODE_ENV as any) || 'development'
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 
    (environment === 'production' ? 'https://yourdomain.com' : 'http://localhost:3000')

  return {
    supabase: {
      url: supabaseUrl,
      anonKey: supabaseAnonKey,
      serviceRoleKey: serviceRoleKey
    },
    app: {
      url: appUrl,
      environment
    },
    features: {
      analytics: !!process.env.NEXT_PUBLIC_ANALYTICS_ID,
      errorReporting: !!process.env.SENTRY_DSN
    }
  }
}

// 設定のエクスポート
export const config = initializeConfig()

// 開発環境での設定確認
if (config.app.environment === 'development' && typeof window === 'undefined') {
  console.log('🔧 App Configuration:')
  console.log(`- Environment: ${config.app.environment}`)
  console.log(`- Supabase URL: ${config.supabase.url}`)
  console.log(`- App URL: ${config.app.url}`)
  console.log(`- Analytics: ${config.features.analytics ? 'Enabled' : 'Disabled'}`)
  console.log(`- Error Reporting: ${config.features.errorReporting ? 'Enabled' : 'Disabled'}`)
  
  if (config.supabase.serviceRoleKey) {
    console.log('⚠️  Service Role Key detected - ensure this is not exposed to client!')
  }
}

// 型定義のエクスポート
export type { AppConfig }