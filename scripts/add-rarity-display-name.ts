// raritiesテーブルにdisplay_nameカラムを追加

import { createClient } from '@supabase/supabase-js'

require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function addDisplayNameColumn() {
  console.log('📦 レアリティテーブルにdisplay_nameカラムを追加...\n')
  
  try {
    // カラムを追加
    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE rarities 
        ADD COLUMN IF NOT EXISTS display_name TEXT;
      `
    })
    
    if (alterError) {
      console.error('❌ カラム追加エラー:', alterError)
      
      // 代替方法：手動でデフォルト値を設定
      console.log('⚠️  手動でdisplay_name値を設定します...')
      
      const displayNames = {
        'DM': 'ドリームレア',
        'OR': 'オーバーレア',
        'SR': 'スーパーレア',
        'VR': 'ベリーレア',
        'R': 'レア',
        'UC': 'アンコモン',
        'C': 'コモン',
        'DM㊙': 'シークレットドリームレア',
        '㊙': 'シークレットレア',
        'TD': 'キャラプレミアムトレジャー',
        'SP': '金トレジャー',
        'TR': '銀トレジャー',
        'T': '黒トレジャー',
        'U': 'アンコモン（旧）',
        'MR': 'マスターレア'
      }
      
      for (const [name, displayName] of Object.entries(displayNames)) {
        const { error } = await supabase
          .from('rarities')
          .update({ display_name: displayName })
          .eq('name', name)
        
        if (error) {
          console.error(`❌ ${name} 更新エラー:`, error)
        } else {
          console.log(`✅ ${name} → ${displayName}`)
        }
      }
    } else {
      console.log('✅ display_nameカラムを追加しました')
      
      // デフォルト値を設定
      await supabase
        .from('rarities')
        .update({ display_name: supabase.rpc('name') })
        .is('display_name', null)
    }
    
    // 確認
    const { data: rarities } = await supabase
      .from('rarities')
      .select('name, display_name, display_order')
      .order('display_order')
    
    console.log('\n📋 更新後のレアリティ一覧:')
    rarities?.forEach(r => {
      console.log(`  ${r.display_order}. ${r.name} - ${r.display_name || '(未設定)'}`)
    })
    
  } catch (error) {
    console.error('❌ エラー:', error)
  }
}

addDisplayNameColumn()