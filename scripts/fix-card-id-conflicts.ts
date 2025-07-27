import { supabase } from './supabase-client'
import { GoogleSheetsService } from '../lib/services/google-sheets'

async function fixCardIdConflicts() {
  console.log('🔧 カードIDの競合問題を修正中...')
  
  try {
    const googleSheetsId = process.env.GOOGLE_SHEETS_ID!
    const sheetsService = new GoogleSheetsService(googleSheetsId)
    
    // 既存のカードをすべて削除
    console.log('🗑️ 既存のカードをすべて削除中...')
    const { error: deleteError } = await supabase
      .from('cards')
      .delete()
      .neq('id', 'dummy_id_that_does_not_exist') // すべてを削除
    
    if (deleteError) {
      console.error('削除エラー:', deleteError)
      return
    }
    
    console.log('✅ 既存カードの削除完了')
    
    // スプレッドシートからすべてのカードを取得
    console.log('📄 スプレッドシートからカードデータを取得中...')
    const allCards = await sheetsService.fetchCardData()
    
    // レアリティIDマップを作成
    const { data: rarityData } = await supabase
      .from('rarities')
      .select('id, name')
    
    const rarityMap = new Map(rarityData?.map((r: any) => [r.name, r.id]) || [])
    
    console.log('📝 カードを正しいIDで再挿入中...')
    
    let insertedCount = 0
    let errorCount = 0
    
    for (const card of allCards) {
      const rarityId = rarityMap.get(card.rarity)
      if (!rarityId) {
        console.log(`⚠️ レアリティ ${card.rarity} が見つかりません: ${card.name}`)
        errorCount++
        continue
      }
      
      // 新しいカードID形式: pack_id + "__" + card_number
      const newCardId = `${card.pack_id}__${card.card_number}`
      
      const cardData = {
        id: newCardId,
        name: card.name,
        card_number: card.card_number,
        pack_id: card.pack_id,
        rarity_id: rarityId,
        parameters: {
          buyback_price: card.buyback_price,
          reference_price: card.reference_price
        }
      }
      
      const { error } = await supabase
        .from('cards')
        .insert(cardData)
      
      if (error) {
        console.log(`❌ エラー: ${newCardId} ${card.name} - ${error.message}`)
        errorCount++
      } else {
        insertedCount++
        if (insertedCount % 50 === 0) {
          console.log(`進捗: ${insertedCount}/${allCards.length} 完了`)
        }
      }
    }
    
    console.log(`\\n📊 修正結果:`)
    console.log(`- 挿入成功: ${insertedCount}枚`)
    console.log(`- エラー: ${errorCount}枚`)
    
    // 最終確認
    const { data: packList } = await supabase
      .from('packs')
      .select('id, name')
    
    if (packList) {
      console.log('\\n📦 弾別カード数（修正後）:')
      for (const pack of packList) {
        const { count } = await supabase
          .from('cards')
          .select('id', { count: 'exact' })
          .eq('pack_id', pack.id)
        
        console.log(`  ${pack.name} (${pack.id}): ${count || 0}枚`)
      }
    }
    
    // サンプルカードIDを表示
    console.log('\\n📋 新しいカードIDのサンプル:')
    const { data: sampleCards } = await supabase
      .from('cards')
      .select('id, pack_id, card_number, name')
      .limit(10)
    
    if (sampleCards) {
      sampleCards.forEach(card => {
        console.log(`  ${card.id} → ${card.pack_id}: ${card.card_number} ${card.name}`)
      })
    }
    
    console.log('\\n🎉 カードIDの競合問題が修正されました！')
    
  } catch (error) {
    console.error('❌ 修正処理でエラー:', error)
  }
}

fixCardIdConflicts()