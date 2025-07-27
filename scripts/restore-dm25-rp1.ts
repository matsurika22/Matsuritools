import { supabase } from './supabase-client'
import { GoogleSheetsService } from '../lib/services/google-sheets'

async function restoreDm25Rp1() {
  console.log('🔧 DM25-RP1のカードデータを復元中...')
  
  try {
    const googleSheetsId = process.env.GOOGLE_SHEETS_ID!
    const sheetsService = new GoogleSheetsService(googleSheetsId)
    
    // スプレッドシートからDM25-RP1のカードを取得
    console.log('📄 スプレッドシートからDM25-RP1のデータを取得中...')
    const allCards = await sheetsService.fetchCardData()
    const rp1Cards = allCards.filter(card => card.pack_id === 'DM25-RP1')
    
    console.log(`スプレッドシートから${rp1Cards.length}枚のDM25-RP1カードを取得`)
    
    // レアリティIDマップを作成
    const { data: rarityData } = await supabase
      .from('rarities')
      .select('id, name')
    
    const rarityMap = new Map(rarityData?.map((r: any) => [r.name, r.id]) || [])
    console.log('レアリティマップ:', Object.fromEntries(rarityMap))
    
    // 既存のDM25-RP1カードを確認
    const { data: existingCards } = await supabase
      .from('cards')
      .select('id, card_number')
      .eq('pack_id', 'DM25-RP1')
    
    console.log(`現在のデータベースにある DM25-RP1カード: ${existingCards?.length || 0}枚`)
    
    let insertedCount = 0
    let updatedCount = 0
    let errorCount = 0
    
    console.log('\\n📝 カードを復元中...')
    
    for (const card of rp1Cards) {
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
      
      // 既存のカードかチェック
      const isExisting = existingCards?.some(existing => existing.id === card.card_number)
      
      const { error } = await supabase
        .from('cards')
        .upsert(cardData, { onConflict: 'id' })
      
      if (error) {
        console.log(`❌ エラー: ${card.card_number} ${card.name} - ${error.message}`)
        errorCount++
      } else {
        if (isExisting) {
          updatedCount++
          console.log(`🔄 更新: ${card.card_number} ${card.name}`)
        } else {
          insertedCount++
          console.log(`✅ 追加: ${card.card_number} ${card.name}`)
        }
      }
    }
    
    // 結果確認
    const { data: finalCards, count: finalCount } = await supabase
      .from('cards')
      .select('id', { count: 'exact' })
      .eq('pack_id', 'DM25-RP1')
    
    console.log(`\\n📊 復元結果:`)
    console.log(`- 新規追加: ${insertedCount}枚`)
    console.log(`- 更新: ${updatedCount}枚`)
    console.log(`- エラー: ${errorCount}枚`)
    console.log(`- 最終的なDM25-RP1カード数: ${finalCount || 0}枚`)
    
    if (finalCount === 144) {
      console.log('🎉 DM25-RP1の復元が完了しました！')
    } else {
      console.log(`⚠️ 期待値（144枚）と異なります`)
    }
    
  } catch (error) {
    console.error('❌ 復元処理でエラー:', error)
  }
}

restoreDm25Rp1()