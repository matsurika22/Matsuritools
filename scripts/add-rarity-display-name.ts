import { supabase } from './supabase-client'

async function addRarityDisplayName() {
  console.log('🔧 レアリティテーブルにdisplay_nameカラムを追加中...')
  
  try {
    // まずレアリティテーブルの構造を確認
    const { data: sampleRarity } = await supabase
      .from('rarities')
      .select('*')
      .limit(1)
      .single()
    
    // display_nameカラムが既に存在するかチェック
    if (sampleRarity && 'display_name' in sampleRarity) {
      console.log('✅ display_nameカラムは既に存在します')
    } else {
      console.log('⚠️ display_nameカラムが存在しません。手動でSupabaseダッシュボードから追加してください。')
      console.log('SQL: ALTER TABLE rarities ADD COLUMN display_name TEXT;')
    }
    
    // 既存データに表示名を設定
    const rarityMappings = [
      { name: 'C', display_name: 'コモン' },
      { name: 'UC', display_name: 'アンコモン' },
      { name: 'R', display_name: 'レア' },
      { name: 'VR', display_name: 'ベリーレア' },
      { name: 'SR', display_name: 'スーパーレア' },
      { name: 'MR', display_name: 'マスターレア' },
      { name: 'T', display_name: '黒トレジャー' },
      { name: 'DM', display_name: 'ドリームレア' },
      { name: 'OR', display_name: 'オーバーレア' },
      { name: 'DM㊙', display_name: 'シークレットドリームレア' },
      { name: '㊙', display_name: 'シークレットレア' },
      { name: 'TD', display_name: 'キャラプレミアムトレジャー' },
      { name: 'SP', display_name: '金トレジャー' },
      { name: 'TR', display_name: '銀トレジャー' },
      { name: 'S', display_name: 'シークレットレア' }
    ]
    
    console.log('🏷️ 表示名を設定中...')
    
    for (const mapping of rarityMappings) {
      const { error: updateError } = await supabase
        .from('rarities')
        .update({ display_name: mapping.display_name })
        .eq('name', mapping.name)
      
      if (updateError) {
        console.log(`⚠️ ${mapping.name} の更新でエラー:`, updateError.message)
      } else {
        console.log(`✅ ${mapping.name} → ${mapping.display_name}`)
      }
    }
    
    // 結果確認
    const { data: rarities } = await supabase
      .from('rarities')
      .select('name, display_name')
      .order('display_order')
    
    console.log('\n📋 更新後のレアリティ一覧:')
    rarities?.forEach(r => {
      console.log(`  ${r.name}: ${r.display_name || '未設定'}`)
    })
    
  } catch (error) {
    console.error('❌ エラー:', error)
  }
}

addRarityDisplayName()