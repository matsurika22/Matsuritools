import { supabase } from './supabase-client'

async function checkPackStructure() {
  console.log('🔍 packsテーブルの構造を確認中...')
  
  try {
    // パックデータを取得して構造を確認
    const { data: pack } = await supabase
      .from('packs')
      .select('*')
      .eq('id', 'DM25-RP1')
      .single()
    
    console.log('\nDM25-RP1のデータ:')
    console.log('custom_card_ids:', pack?.custom_card_ids)
    console.log('custom_card_ids type:', typeof pack?.custom_card_ids)
    console.log('custom_card_ids is array:', Array.isArray(pack?.custom_card_ids))
    
    // null値でクリアしてから再設定を試みる
    console.log('\n🔧 custom_card_idsをリセット...')
    const { error: resetError } = await supabase
      .from('packs')
      .update({ custom_card_ids: null })
      .eq('id', 'DM25-RP1')
    
    if (resetError) {
      console.error('リセットエラー:', resetError)
      return
    }
    
    // 正しいIDで更新
    console.log('🔧 正しいIDで更新...')
    const { error: updateError } = await supabase
      .from('packs')
      .update({ custom_card_ids: ['DM25-RP1__22/77'] })
      .eq('id', 'DM25-RP1')
    
    if (updateError) {
      console.error('更新エラー:', updateError)
      return
    }
    
    // 再度確認
    const { data: updatedPack } = await supabase
      .from('packs')
      .select('custom_card_ids')
      .eq('id', 'DM25-RP1')
      .single()
    
    console.log('\n✅ 更新後のcustom_card_ids:', updatedPack?.custom_card_ids)
    
  } catch (error) {
    console.error('❌ エラー:', error)
  }
}

checkPackStructure()