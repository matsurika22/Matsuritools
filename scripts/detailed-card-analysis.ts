import { supabase } from './supabase-client'

async function detailedCardAnalysis() {
  console.log('🔍 データベースの詳細なカード分析中...')
  
  try {
    // 現在のDM25-RP1カードの詳細確認
    console.log('\n🚨 現在のDM25-RP1カード:')
    const { data: currentRp1Cards } = await supabase
      .from('cards')
      .select('*')
      .eq('pack_id', 'DM25-RP1')
    
    console.log(`現在のDM25-RP1カード数: ${currentRp1Cards?.length || 0}枚`)
    
    if (currentRp1Cards && currentRp1Cards.length > 0) {
      currentRp1Cards.forEach(card => {
        console.log(`  ${card.card_number}: ${card.name} (rarity_id: ${card.rarity_id})`)
        console.log(`    ID: ${card.id}`)
        console.log(`    Parameters: ${JSON.stringify(card.parameters)}`)
      })
    }
    
    // DM25-RP2の確認（比較のため）
    console.log('\n📋 DM25-RP2の確認（最初の5枚）:')
    const { data: rp2Cards } = await supabase
      .from('cards')
      .select('*')
      .eq('pack_id', 'DM25-RP2')
      .limit(5)
    
    if (rp2Cards && rp2Cards.length > 0) {
      rp2Cards.forEach(card => {
        console.log(`  ${card.card_number}: ${card.name}`)
        console.log(`    ID: ${card.id}`)
      })
    }
    
    // レアリティテーブルの確認
    console.log('\n🏷️ レアリティテーブル:')
    const { data: rarities } = await supabase
      .from('rarities')
      .select('*')
      .order('display_order')
    
    if (rarities) {
      rarities.forEach(rarity => {
        console.log(`  ${rarity.name}: ${rarity.display_name || '未設定'} (id: ${rarity.id})`)
      })
    }
    
    // カードIDの重複チェック
    console.log('\n🔍 カードIDの重複チェック:')
    const { data: allCards } = await supabase
      .from('cards')
      .select('id, pack_id, card_number, name')
    
    if (allCards) {
      const idCounts = new Map<string, number>()
      allCards.forEach(card => {
        const count = idCounts.get(card.id) || 0
        idCounts.set(card.id, count + 1)
      })
      
      const duplicates = Array.from(idCounts.entries()).filter(([_, count]) => count > 1)
      if (duplicates.length > 0) {
        console.log('⚠️ 重複するカードID:')
        duplicates.forEach(([id, count]) => {
          console.log(`  ${id}: ${count}回`)
          const duplicateCards = allCards.filter(card => card.id === id)
          duplicateCards.forEach(card => {
            console.log(`    - ${card.pack_id}: ${card.card_number} ${card.name}`)
          })
        })
      } else {
        console.log('✅ カードIDの重複なし')
      }
    }
    
  } catch (error) {
    console.error('❌ エラー:', error)
  }
}

detailedCardAnalysis()