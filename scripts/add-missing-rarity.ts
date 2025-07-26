// 不足しているレアリティ「T」を追加

import { createClient } from '@supabase/supabase-js'

require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function addMissingRarity() {
  console.log('🔧 不足しているレアリティ「T」を追加中...')
  
  const newRarity = {
    name: 'T',
    color: '#059669', // Emerald color
    display_order: 7 // MRの後
  }
  
  const { data, error } = await supabase
    .from('rarities')
    .insert(newRarity)
    .select()
  
  if (error) {
    console.error('❌ レアリティ追加エラー:', error.message)
  } else {
    console.log('✅ レアリティ「T」を追加しました:', data)
  }
  
  // 再度同期を実行するための案内
  console.log('\n📌 次のステップ:')
  console.log('1. Google Sheetsのレアリティマスターシートに以下を追加してください:')
  console.log('   A列: T')
  console.log('   B列: #059669')
  console.log('   C列: 7')
  console.log('2. その後、npm run sync-sheets を再実行してください')
}

addMissingRarity()