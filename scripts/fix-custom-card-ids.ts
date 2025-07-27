import { supabase } from './supabase-client'

async function fixCustomCardIds() {
  console.log('🔧 カスタムカードIDを修正中...')
  
  try {
    // まず、22/77のカードがDM25-RP1に存在するか確認
    const { data: targetCard } = await supabase
      .from('cards')
      .select('id, name, card_number')
      .eq('pack_id', 'DM25-RP1')
      .eq('card_number', '22/77')
      .single()
    
    if (!targetCard) {
      console.error('❌ DM25-RP1に22/77のカードが見つかりません')
      return
    }
    
    console.log(`対象カード: ${targetCard.id} - ${targetCard.card_number} ${targetCard.name}`)
    
    // DM25-RP1のカスタムカードIDを修正
    const { error } = await supabase
      .from('packs')
      .update({
        custom_card_ids: [targetCard.id]
      })
      .eq('id', 'DM25-RP1')
    
    if (error) {
      console.error('❌ 更新エラー:', error)
      return
    }
    
    console.log('✅ DM25-RP1のカスタムカードIDを修正しました')
    
    // 修正後の確認
    const { data: pack } = await supabase
      .from('packs')
      .select('custom_card_ids')
      .eq('id', 'DM25-RP1')
      .single()
    
    console.log('修正後のcustom_card_ids:', pack?.custom_card_ids)
    
    // カードの存在確認
    if (pack?.custom_card_ids && pack.custom_card_ids.length > 0) {
      for (const cardId of pack.custom_card_ids) {
        const { data: card } = await supabase
          .from('cards')
          .select('name, card_number')
          .eq('id', cardId)
          .single()
        
        if (card) {
          console.log(`✅ ${cardId}: ${card.card_number} ${card.name}`)
        } else {
          console.log(`❌ ${cardId}: カードが見つかりません`)
        }
      }
    }
    
  } catch (error) {
    console.error('❌ エラー:', error)
  }
}

fixCustomCardIds()