import { supabase } from './supabase-client'

async function checkCustomCards() {
  console.log('🔍 パックのカスタムカード設定を確認中...')
  
  try {
    // パックデータを取得
    const { data: packs } = await supabase
      .from('packs')
      .select('id, name, custom_card_ids, display_rarity_ids')
    
    console.log('\n📦 パック設定:')
    packs?.forEach(pack => {
      console.log(`\n${pack.name} (${pack.id}):`)
      console.log(`  custom_card_ids: ${JSON.stringify(pack.custom_card_ids)}`)
      console.log(`  display_rarity_ids: ${JSON.stringify(pack.display_rarity_ids)}`)
      
      // custom_card_idsがあれば、対応するカードを確認
      if (pack.custom_card_ids && pack.custom_card_ids.length > 0) {
        console.log('  カスタムカードの詳細:')
        pack.custom_card_ids.forEach(async (cardId: string) => {
          const { data: card } = await supabase
            .from('cards')
            .select('name, card_number')
            .eq('id', cardId)
            .single()
          
          if (card) {
            console.log(`    - ${cardId}: ${card.card_number} ${card.name}`)
          } else {
            console.log(`    - ${cardId}: ⚠️ カードが見つかりません`)
          }
        })
      }
    })
    
  } catch (error) {
    console.error('❌ エラー:', error)
  }
}

checkCustomCards()