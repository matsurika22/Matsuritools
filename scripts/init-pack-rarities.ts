// pack_rarities テーブルに初期データを投入

import { createClient } from '@supabase/supabase-js'

require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// デュエマの標準的な封入率（1BOXあたりの枚数）
const standardBoxRates: Record<string, number> = {
  'C': 50.0,      // コモン：約50枚
  'U': 30.0,      // アンコモン：約30枚  
  'UC': 30.0,     // アンコモン：約30枚
  'R': 8.0,       // レア：約8枚
  'VR': 4.0,      // ベリーレア：約4枚
  'SR': 2.0,      // スーパーレア：約2枚
  'MR': 0.5,      // マスターレア：2BOXに1枚
  'OR': 0.25,     // オーバーレア：4BOXに1枚
  'DM': 0.125,    // ドラゴンマスター：8BOXに1枚
  'DM㊙': 0.0625, // ドラゴンマスター秘：16BOXに1枚
  '㊙': 0.5,      // 秘レア：2BOXに1枚（この弾は特殊）
  'T': 3.0,       // ツインパクト：約3枚
  'TD': 0.5,      // タスクドラゴン：2BOXに1枚
  'SP': 0.5,      // スペシャル：2BOXに1枚
  'TR': 1.0       // トレジャー：約1枚
}

async function initPackRarities() {
  console.log('📦 弾×レアリティの封入率を初期化中...')
  
  try {
    // すべての弾を取得
    const { data: packs, error: packsError } = await supabase
      .from('packs')
      .select('id, name')
    
    if (packsError) {
      console.error('❌ 弾の取得エラー:', packsError)
      return
    }
    
    // すべてのレアリティを取得
    const { data: rarities, error: raritiesError } = await supabase
      .from('rarities')
      .select('id, name')
    
    if (raritiesError) {
      console.error('❌ レアリティの取得エラー:', raritiesError)
      return
    }
    
    let insertedCount = 0
    let errorCount = 0
    
    // 各弾×レアリティの組み合わせを作成
    for (const pack of packs || []) {
      console.log(`\n📋 ${pack.name} の封入率を設定中...`)
      
      for (const rarity of rarities || []) {
        const boxRate = standardBoxRates[rarity.name] || 1.0
        
        const { error } = await supabase
          .from('pack_rarities')
          .upsert({
            pack_id: pack.id,
            rarity_id: rarity.id,
            box_rate: boxRate
          }, {
            onConflict: 'pack_id,rarity_id'
          })
        
        if (error) {
          console.error(`  ❌ ${rarity.name}: ${error.message}`)
          errorCount++
        } else {
          console.log(`  ✅ ${rarity.name}: ${boxRate}枚/BOX`)
          insertedCount++
        }
      }
    }
    
    console.log('\n📊 初期化結果:')
    console.log(`  - 成功: ${insertedCount}件`)
    console.log(`  - エラー: ${errorCount}件`)
    
  } catch (error) {
    console.error('❌ エラー:', error)
  }
}

// 特定の弾の封入率を調整する関数
export async function adjustPackRarity(packId: string, rarityName: string, boxRate: number) {
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
    .from('pack_rarities')
    .upsert({
      pack_id: packId,
      rarity_id: rarity.id,
      box_rate: boxRate
    }, {
      onConflict: 'pack_id,rarity_id'
    })
  
  if (error) {
    console.error('❌ 更新エラー:', error)
  } else {
    console.log(`✅ ${packId} の ${rarityName} を ${boxRate}枚/BOX に設定`)
  }
}

// 実行
initPackRarities()

// 特定の弾の封入率を調整する例（必要に応じてコメントアウトを外す）
// adjustPackRarity('DM25-RP1', 'SR', 2.5)  // この弾のSRを2.5枚/BOXに調整