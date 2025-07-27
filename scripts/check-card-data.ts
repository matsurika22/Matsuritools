import { supabase } from './supabase-client'

async function checkCardData() {
  console.log('🔍 カードデータの詳細を確認中...')
  
  try {
    // 弾別カード数を確認
    const { data: packData } = await supabase
      .from('packs')
      .select('id, name')
    
    console.log('\n📦 弾一覧:')
    for (const pack of packData || []) {
      const { data: cards, count } = await supabase
        .from('cards')
        .select('id, name', { count: 'exact' })
        .eq('pack_id', pack.id)
      
      console.log(`  ${pack.name} (${pack.id}): ${count}枚`)
    }
    
    // DM25-RP1の詳細確認
    console.log('\n🔍 DM25-RP1の詳細:')
    const { data: rp1Cards } = await supabase
      .from('cards')
      .select('id, name, card_number, rarity:rarities(name)')
      .eq('pack_id', 'DM25-RP1')
      .order('card_number')
    
    if (rp1Cards && rp1Cards.length > 0) {
      console.log(`  合計: ${rp1Cards.length}枚`)
      rp1Cards.forEach(card => {
        console.log(`    ${card.card_number}: ${card.name} (${card.rarity?.name})`)
      })
    } else {
      console.log('  ⚠️ DM25-RP1のカードが見つかりません')
    }
    
    // DM25-RP2の詳細確認（最初の10枚のみ）
    console.log('\n🔍 DM25-RP2の詳細（最初の10枚）:')
    const { data: rp2Cards } = await supabase
      .from('cards')
      .select('id, name, card_number, rarity:rarities(name)')
      .eq('pack_id', 'DM25-RP2')
      .order('card_number')
      .limit(10)
    
    if (rp2Cards && rp2Cards.length > 0) {
      rp2Cards.forEach(card => {
        console.log(`    ${card.card_number}: ${card.name} (${card.rarity?.name})`)
      })
    }
    
  } catch (error) {
    console.error('❌ エラー:', error)
  }
}

checkCardData()