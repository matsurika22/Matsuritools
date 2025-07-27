import { supabase } from './supabase-client'
import { GoogleSheetsService } from '../lib/services/google-sheets'

async function restoreAllCards() {
  console.log('🔧 すべてのカードデータを安全に復元中...')
  
  try {
    const googleSheetsId = process.env.GOOGLE_SHEETS_ID!
    const sheetsService = new GoogleSheetsService(googleSheetsId)
    
    // スプレッドシートからすべてのカードを取得
    console.log('📄 スプレッドシートからすべてのカードデータを取得中...')
    const allCards = await sheetsService.fetchCardData()
    
    // 弾別にカードを分類
    const cardsByPack = new Map<string, any[]>()
    allCards.forEach(card => {
      if (!cardsByPack.has(card.pack_id)) {
        cardsByPack.set(card.pack_id, [])
      }
      cardsByPack.get(card.pack_id)!.push(card)
    })
    
    console.log('📊 弾別カード数（スプレッドシート）:')
    cardsByPack.forEach((cards, packId) => {
      console.log(`  ${packId}: ${cards.length}枚`)
    })
    
    // 現在のデータベースの状況確認
    console.log('\n📊 現在のデータベース状況:')
    for (const packId of cardsByPack.keys()) {
      const { count } = await supabase
        .from('cards')
        .select('id', { count: 'exact' })
        .eq('pack_id', packId)
      
      console.log(`  ${packId}: ${count || 0}枚`)
    }
    
    // レアリティIDマップを作成
    const { data: rarityData } = await supabase
      .from('rarities')
      .select('id, name')
    
    const rarityMap = new Map(rarityData?.map((r: any) => [r.name, r.id]) || [])
    
    // 各弾のカードを復元
    for (const [packId, cards] of cardsByPack) {
      console.log(`\n🔧 ${packId} を復元中...`)
      
      let insertedCount = 0
      let updatedCount = 0
      let errorCount = 0
      
      // 既存カードの確認
      const { data: existingCards } = await supabase
        .from('cards')
        .select('id')
        .eq('pack_id', packId)
      
      const existingIds = new Set(existingCards?.map(card => card.id) || [])
      
      for (const card of cards) {
        const rarityId = rarityMap.get(card.rarity)
        if (!rarityId) {
          console.log(`⚠️ レアリティ ${card.rarity} が見つかりません: ${card.name}`)
          errorCount++
          continue
        }
        
        const cardData = {
          id: card.card_number,
          name: card.name,
          card_number: card.card_number,
          pack_id: card.pack_id,
          rarity_id: rarityId,
          parameters: {
            buyback_price: card.buyback_price,
            reference_price: card.reference_price
          }
        }
        
        const isExisting = existingIds.has(card.card_number)
        
        const { error } = await supabase
          .from('cards')
          .upsert(cardData, { onConflict: 'id' })
        
        if (error) {
          errorCount++
        } else {
          if (isExisting) {
            updatedCount++
          } else {
            insertedCount++
          }
        }
      }
      
      console.log(`  新規追加: ${insertedCount}枚, 更新: ${updatedCount}枚, エラー: ${errorCount}枚`)
    }
    
    // 最終結果確認
    console.log('\n📊 最終結果:')
    for (const packId of cardsByPack.keys()) {
      const { count } = await supabase
        .from('cards')
        .select('id', { count: 'exact' })
        .eq('pack_id', packId)
      
      const expectedCount = cardsByPack.get(packId)!.length
      const status = count === expectedCount ? '✅' : '⚠️'
      console.log(`  ${packId}: ${count || 0}枚 / ${expectedCount}枚 ${status}`)
    }
    
  } catch (error) {
    console.error('❌ 復元処理でエラー:', error)
  }
}

restoreAllCards()