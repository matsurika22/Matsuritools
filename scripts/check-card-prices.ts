import { supabase } from './supabase-client'

async function checkCardPrices() {
  console.log('🔍 カードの買取価格データを確認中...')
  
  try {
    // DM25-RP2のカードを取得（最初の10枚）
    const { data: cards } = await supabase
      .from('cards')
      .select('id, name, card_number, parameters')
      .eq('pack_id', 'DM25-RP2')
      .limit(10)
    
    console.log('\nDM25-RP2の最初の10枚:')
    cards?.forEach(card => {
      console.log(`\n${card.card_number}: ${card.name}`)
      console.log(`  ID: ${card.id}`)
      console.log(`  parameters: ${JSON.stringify(card.parameters)}`)
      if (card.parameters) {
        console.log(`  buyback_price: ${card.parameters.buyback_price || '未設定'}`)
        console.log(`  reference_price: ${card.parameters.reference_price || '未設定'}`)
      }
    })
    
    // 買取価格が設定されているカードの数を確認
    const { data: allCards } = await supabase
      .from('cards')
      .select('parameters')
      .eq('pack_id', 'DM25-RP2')
    
    let priceCount = 0
    let totalCards = allCards?.length || 0
    
    allCards?.forEach(card => {
      if (card.parameters?.buyback_price && card.parameters.buyback_price > 0) {
        priceCount++
      }
    })
    
    console.log(`\n📊 DM25-RP2の価格設定状況:`)
    console.log(`  総カード数: ${totalCards}`)
    console.log(`  買取価格設定済み: ${priceCount}`)
    console.log(`  未設定: ${totalCards - priceCount}`)
    
  } catch (error) {
    console.error('❌ エラー:', error)
  }
}

checkCardPrices()