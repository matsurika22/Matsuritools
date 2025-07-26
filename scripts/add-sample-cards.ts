// サンプルカードデータを直接データベースに追加

import { createClient } from '@supabase/supabase-js'

require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function addSampleCards() {
  console.log('🃏 サンプルカードデータを追加中...')
  
  try {
    // 弾とレアリティのIDを取得
    const { data: packs } = await supabase
      .from('packs')
      .select('id, name')
      .limit(1)
    
    const { data: rarities } = await supabase
      .from('rarities')
      .select('id, name')
    
    if (!packs || packs.length === 0) {
      console.error('❌ 弾データがありません')
      return
    }
    
    if (!rarities || rarities.length === 0) {
      console.error('❌ レアリティデータがありません')
      return
    }

    const pack = packs[0]
    const rarityMap = new Map(rarities.map(r => [r.name, r.id]))

    console.log(`📦 対象弾: ${pack.name} (${pack.id})`)
    console.log(`📊 利用可能レアリティ: ${rarities.map(r => r.name).join(', ')}`)

    // サンプルカードデータ
    const sampleCards = [
      {
        id: 'DM25RP1-001',
        name: 'ボルメテウス・ホワイト・ドラゴン',
        card_number: 'DM25RP1-001',
        pack_id: pack.id,
        rarity: 'MR',
        buyback_price: 8000,
        reference_price: 12000
      },
      {
        id: 'DM25RP1-002', 
        name: 'アルカディア・スパーク',
        card_number: 'DM25RP1-002',
        pack_id: pack.id,
        rarity: 'SR',
        buyback_price: 2500,
        reference_price: 4000
      },
      {
        id: 'DM25RP1-003',
        name: 'ボルシャック・ドラゴン',
        card_number: 'DM25RP1-003', 
        pack_id: pack.id,
        rarity: 'VR',
        buyback_price: 800,
        reference_price: 1500
      },
      {
        id: 'DM25RP1-004',
        name: 'クリムゾン・ハンマー',
        card_number: 'DM25RP1-004',
        pack_id: pack.id,
        rarity: 'R',
        buyback_price: 150,
        reference_price: 300
      },
      {
        id: 'DM25RP1-005',
        name: 'ブルー・ソルジャー',
        card_number: 'DM25RP1-005',
        pack_id: pack.id,
        rarity: 'U',
        buyback_price: 20,
        reference_price: 50
      },
      {
        id: 'DM25RP1-006',
        name: 'ファイター・デュエル',
        card_number: 'DM25RP1-006',
        pack_id: pack.id,
        rarity: 'C',
        buyback_price: 5,
        reference_price: 10
      }
    ]

    let insertedCount = 0

    for (const card of sampleCards) {
      const rarityId = rarityMap.get(card.rarity)
      if (!rarityId) {
        console.error(`❌ レアリティ ${card.rarity} が見つかりません`)
        continue
      }

      const cardData = {
        id: card.id,
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
        .upsert(cardData, { onConflict: 'id' })
      
      if (error) {
        console.error(`❌ カード ${card.name} 挿入エラー:`, error.message)
      } else {
        console.log(`✅ カード ${card.name} (${card.rarity}) を追加`)
        insertedCount++
      }
    }

    console.log(`\n🎉 ${insertedCount}枚のサンプルカードを追加しました！`)

    // 確認
    const { count } = await supabase
      .from('cards')
      .select('*', { count: 'exact', head: true })
    
    console.log(`📊 現在のカード総数: ${count}枚`)

  } catch (error) {
    console.error('❌ サンプルカード追加エラー:', error)
  }
}

addSampleCards()