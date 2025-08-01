import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

// .env.localファイルを読み込む
dotenv.config({ path: path.join(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 環境変数が設定されていません')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkSyncResult() {
  console.log('🔍 同期結果を確認中...\n')
  
  try {
    // 特定のカードを確認（貴布人 テブルカッケ＝エディ）
    const targetCardNumber = '6/77'
    const targetPackId = 'DM25-RP1'
    
    // 新しいID形式でカードを検索
    const newCardId = `${targetPackId}__${targetCardNumber}`
    console.log(`検索するカードID: ${newCardId}`)
    
    const { data: cardWithNewId, error: newIdError } = await supabase
      .from('cards')
      .select('*')
      .eq('id', newCardId)
      .single()
    
    if (cardWithNewId) {
      console.log('\n✅ 新ID形式のカードが見つかりました:')
      console.log(`ID: ${cardWithNewId.id}`)
      console.log(`名前: ${cardWithNewId.name}`)
      console.log(`カード番号: ${cardWithNewId.card_number}`)
      console.log(`parameters:`, cardWithNewId.parameters)
      
      if (cardWithNewId.parameters?.buyback_price) {
        console.log(`\n💰 買取価格: ${cardWithNewId.parameters.buyback_price}円`)
      } else {
        console.log('\n⚠️  parametersに買取価格が設定されていません')
      }
    } else {
      console.log('❌ 新ID形式のカードが見つかりません')
    }
    
    // 旧ID形式でも検索
    const { data: cardWithOldId } = await supabase
      .from('cards')
      .select('*')
      .eq('card_number', targetCardNumber)
      .eq('pack_id', targetPackId)
    
    if (cardWithOldId && cardWithOldId.length > 0) {
      console.log('\n📋 同じカード番号のカード一覧:')
      cardWithOldId.forEach(card => {
        console.log(`\nID: ${card.id}`)
        console.log(`名前: ${card.name}`)
        console.log(`parameters:`, card.parameters)
      })
    }
    
    // 最近更新されたカードを確認
    console.log('\n\n📅 最近更新されたカード（DM25-RP1）:')
    const { data: recentCards } = await supabase
      .from('cards')
      .select('id, name, card_number, parameters, updated_at')
      .eq('pack_id', targetPackId)
      .order('updated_at', { ascending: false })
      .limit(10)
    
    if (recentCards) {
      recentCards.forEach(card => {
        const updateTime = new Date(card.updated_at).toLocaleString('ja-JP')
        console.log(`\n${updateTime}: ${card.card_number} ${card.name}`)
        console.log(`ID: ${card.id}`)
        if (card.parameters?.buyback_price) {
          console.log(`買取価格: ${card.parameters.buyback_price}円`)
        }
      })
    }
    
    // parametersフィールドがnullのカードを確認
    console.log('\n\n⚠️  parameters未設定のカード数を確認:')
    const { data: nullParamsCards, count: nullCount } = await supabase
      .from('cards')
      .select('*', { count: 'exact', head: true })
      .eq('pack_id', targetPackId)
      .is('parameters', null)
    
    console.log(`DM25-RP1でparametersがnullのカード: ${nullCount}枚`)
    
    const { data: hasParamsCards, count: hasCount } = await supabase
      .from('cards')
      .select('*', { count: 'exact', head: true })
      .eq('pack_id', targetPackId)
      .not('parameters', 'is', null)
    
    console.log(`DM25-RP1でparametersが設定されているカード: ${hasCount}枚`)
    
  } catch (error) {
    console.error('❌ エラー:', error)
  }
}

checkSyncResult()