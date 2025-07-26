// BOX出現率を更新するスクリプト

import { createClient } from '@supabase/supabase-js'

require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// レアリティごとの標準的なBOX出現率
const defaultBoxRates: Record<string, number> = {
  'C': 50.0,    // コモン：1BOXに約50枚
  'U': 30.0,    // アンコモン：1BOXに約30枚  
  'UC': 30.0,   // アンコモン：1BOXに約30枚
  'R': 8.0,     // レア：1BOXに約8枚
  'VR': 4.0,    // ベリーレア：1BOXに約4枚
  'SR': 2.0,    // スーパーレア：1BOXに約2枚
  'MR': 0.5,    // マスターレア：2BOXに約1枚
  'OR': 0.25,   // オーバーレア：4BOXに約1枚
  'DM': 0.125,  // ドラゴンマスター：8BOXに約1枚
  'DM㊙': 0.0625, // ドラゴンマスター秘：16BOXに約1枚
  '㊙': 0.0625,   // 秘：16BOXに約1枚
  'T': 3.0,     // ツインパクト：1BOXに約3枚
  'TD': 0.5,    // タスクドラゴン：2BOXに約1枚
  'SP': 0.5,    // スペシャル：2BOXに約1枚
  'TR': 1.0     // トレジャー：1BOXに約1枚
}

async function updateBoxRates() {
  console.log('📦 BOX出現率を更新中...')
  
  try {
    // すべてのカードを取得
    const { data: cards, error: fetchError } = await supabase
      .from('cards')
      .select('id, name, rarity:rarities(name), box_rate')
    
    if (fetchError) {
      console.error('❌ カード取得エラー:', fetchError)
      return
    }
    
    let updatedCount = 0
    let skippedCount = 0
    
    for (const card of cards || []) {
      // すでにbox_rateが設定されている場合はスキップ
      if (card.box_rate !== null && card.box_rate !== undefined) {
        skippedCount++
        continue
      }
      
      const rarityName = (card.rarity && !Array.isArray(card.rarity) ? (card.rarity as any).name : '')
      const boxRate = defaultBoxRates[rarityName] || 1.0
      
      const { error: updateError } = await supabase
        .from('cards')
        .update({ box_rate: boxRate })
        .eq('id', card.id)
      
      if (updateError) {
        console.error(`❌ ${card.name} の更新エラー:`, updateError)
      } else {
        console.log(`✅ ${card.name} (${rarityName}): ${boxRate}`)
        updatedCount++
      }
    }
    
    console.log('\n📊 更新結果:')
    console.log(`  - 更新: ${updatedCount}枚`)
    console.log(`  - スキップ: ${skippedCount}枚（既に設定済み）`)
    
  } catch (error) {
    console.error('❌ エラー:', error)
  }
}

// 特定のレアリティのBOX出現率を一括更新
async function updateRarityBoxRate(rarityName: string, boxRate: number) {
  console.log(`📦 ${rarityName}のBOX出現率を${boxRate}に更新中...`)
  
  const { data: rarity } = await supabase
    .from('rarities')
    .select('id')
    .eq('name', rarityName)
    .single()
  
  if (!rarity) {
    console.error(`❌ レアリティ ${rarityName} が見つかりません`)
    return
  }
  
  const { error } = await supabase
    .from('cards')
    .update({ box_rate: boxRate })
    .eq('rarity_id', rarity.id)
  
  if (error) {
    console.error('❌ 更新エラー:', error)
  } else {
    console.log('✅ 更新完了')
  }
}

// 実行
updateBoxRates()

// 特定のレアリティを更新したい場合（コメントアウトを外して使用）
// updateRarityBoxRate('SR', 2.5)  // SRを1BOXに2.5枚に設定