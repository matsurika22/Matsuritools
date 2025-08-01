import dotenv from 'dotenv'
import path from 'path'

// .env.localファイルを読み込む
dotenv.config({ path: path.join(process.cwd(), '.env.local') })

console.log('🔍 環境変数を確認中...\n')

const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'GOOGLE_SHEETS_ID',
  'GOOGLE_SHEETS_API_KEY'
]

const envStatus: Record<string, boolean> = {}

requiredEnvVars.forEach(varName => {
  const value = process.env[varName]
  const isSet = !!value
  envStatus[varName] = isSet
  
  console.log(`${isSet ? '✅' : '❌'} ${varName}: ${isSet ? '設定済み' : '未設定'}`)
  
  if (varName === 'GOOGLE_SHEETS_ID' && isSet) {
    console.log(`   値: ${value}`)
  }
})

console.log('\n📋 まとめ:')
const missingVars = Object.entries(envStatus)
  .filter(([_, isSet]) => !isSet)
  .map(([varName, _]) => varName)

if (missingVars.length === 0) {
  console.log('✅ すべての必要な環境変数が設定されています')
} else {
  console.log(`❌ ${missingVars.length}個の環境変数が未設定です:`)
  missingVars.forEach(varName => {
    console.log(`   - ${varName}`)
  })
  
  console.log('\n📝 設定方法:')
  console.log('1. .env.localファイルに以下を追加:')
  missingVars.forEach(varName => {
    if (varName === 'GOOGLE_SHEETS_ID') {
      console.log(`   ${varName}=your_google_sheets_id_here`)
    } else if (varName === 'GOOGLE_SHEETS_API_KEY') {
      console.log(`   ${varName}=your_google_api_key_here`)
    }
  })
  
  console.log('\n2. Vercelの環境変数にも同じ値を設定してください')
}