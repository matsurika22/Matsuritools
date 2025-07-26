// データベース初期化スクリプト
// npm run seed で実行

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

// 環境変数の読み込み
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 環境変数が設定されていません')
  console.error('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl)
  console.error('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey)
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

interface CardData {
  name: string
  rarity: string
  buyback_price: number
  market_price?: number
}

// デュエル・マスターズ第1弾のカードデータ
const FIRST_PACK_CARDS: CardData[] = [
  // MR (マスターレア)
  { name: 'ボルメテウス・ホワイト・ドラゴン', rarity: 'MR', buyback_price: 8000, market_price: 12000 },
  { name: 'アルカディア・スパーク', rarity: 'MR', buyback_price: 5000, market_price: 8000 },
  { name: '超竜バジュラ', rarity: 'MR', buyback_price: 4000, market_price: 7000 },
  { name: 'ヘブンズ・ゲート', rarity: 'MR', buyback_price: 3000, market_price: 5000 },

  // SR (スーパーレア)
  { name: '聖霊王アルファディオス', rarity: 'SR', buyback_price: 2500, market_price: 4000 },
  { name: 'ダイヤモンド・ソード', rarity: 'SR', buyback_price: 2000, market_price: 3500 },
  { name: 'コッコ・ルピア', rarity: 'SR', buyback_price: 1800, market_price: 3000 },
  { name: 'フォース・アゲイン', rarity: 'SR', buyback_price: 1500, market_price: 2500 },
  { name: 'スピリット・クエイク', rarity: 'SR', buyback_price: 1200, market_price: 2000 },
  { name: 'ライトニング・ソード', rarity: 'SR', buyback_price: 1000, market_price: 1800 },

  // VR (ベリーレア)
  { name: 'ボルシャック・ドラゴン', rarity: 'VR', buyback_price: 800, market_price: 1500 },
  { name: '青銅の鎧', rarity: 'VR', buyback_price: 600, market_price: 1200 },
  { name: 'ディメンション・ゲート', rarity: 'VR', buyback_price: 500, market_price: 1000 },
  { name: 'エマージェンシー・タイフーン', rarity: 'VR', buyback_price: 400, market_price: 800 },
  { name: 'アクア・サーファー', rarity: 'VR', buyback_price: 350, market_price: 700 },
  { name: '炎槍と水剣の裁', rarity: 'VR', buyback_price: 300, market_price: 600 },
  { name: '森羅の意志', rarity: 'VR', buyback_price: 250, market_price: 500 },
  { name: '霊騎コルテオ', rarity: 'VR', buyback_price: 200, market_price: 400 },

  // R (レア)
  { name: 'ホーリー・スパーク', rarity: 'R', buyback_price: 150, market_price: 300 },
  { name: 'バトル・スペード', rarity: 'R', buyback_price: 120, market_price: 250 },
  { name: 'ヘル・スラッシュ', rarity: 'R', buyback_price: 100, market_price: 200 },
  { name: 'スパイラル・ゲート', rarity: 'R', buyback_price: 80, market_price: 180 },
  { name: 'コロコッタ', rarity: 'R', buyback_price: 60, market_price: 150 },
  { name: 'スカルガイ', rarity: 'R', buyback_price: 50, market_price: 120 },
  { name: 'ライトニング・ソード', rarity: 'R', buyback_price: 40, market_price: 100 },
  { name: 'ガイアール・カイザー', rarity: 'R', buyback_price: 30, market_price: 80 },

  // U (アンコモン)
  { name: 'クリムゾン・ハンマー', rarity: 'U', buyback_price: 20, market_price: 50 },
  { name: 'ブルー・ソルジャー', rarity: 'U', buyback_price: 15, market_price: 40 },
  { name: 'フレイム・スラッシュ', rarity: 'U', buyback_price: 12, market_price: 35 },
  { name: 'アース・スピア', rarity: 'U', buyback_price: 10, market_price: 30 },
  { name: 'ウォーター・ガン', rarity: 'U', buyback_price: 8, market_price: 25 },
  { name: 'パワー・アタック', rarity: 'U', buyback_price: 5, market_price: 20 },

  // C (コモン)
  { name: 'ファイター・デュエル', rarity: 'C', buyback_price: 5, market_price: 10 },
  { name: 'ピーコック', rarity: 'C', buyback_price: 3, market_price: 8 },
  { name: 'バトル・キック', rarity: 'C', buyback_price: 2, market_price: 5 },
  { name: 'フレイム・アタック', rarity: 'C', buyback_price: 1, market_price: 3 },
]

async function seedDatabase() {
  console.log('🌱 データベースの初期化を開始します...')
  
  try {
    // 1. レアリティデータの挿入
    console.log('📊 レアリティデータを挿入中...')
    const rarities = [
      { name: 'C', color: '#6B7280', sort_order: 1 },   // コモン (グレー)
      { name: 'U', color: '#10B981', sort_order: 2 },   // アンコモン (緑)
      { name: 'R', color: '#3B82F6', sort_order: 3 },   // レア (青)
      { name: 'VR', color: '#8B5CF6', sort_order: 4 },  // ベリーレア (紫)
      { name: 'SR', color: '#F59E0B', sort_order: 5 },  // スーパーレア (オレンジ)
      { name: 'MR', color: '#EF4444', sort_order: 6 }   // マスターレア (赤)
    ]

    for (const rarity of rarities) {
      const { error } = await supabase
        .from('rarities')
        .upsert(rarity, { onConflict: 'name' })
      
      if (error) {
        console.error(`レアリティ ${rarity.name} の挿入でエラー:`, error)
      }
    }
    console.log('✅ レアリティデータの挿入完了')

    // 2. 弾データの挿入
    console.log('📦 弾データを挿入中...')
    const packData = {
      name: '第1弾 聖拳編',
      release_date: '2002-05-30',
      box_price: 12000,
      packs_per_box: 24,
      cards_per_pack: 11
    }

    const { data: pack, error: packError } = await supabase
      .from('packs')
      .upsert(packData, { onConflict: 'name' })
      .select('id')
      .single()

    if (packError) {
      console.error('弾データの挿入でエラー:', packError)
      return
    }
    console.log('✅ 弾データの挿入完了')

    // 3. レアリティIDの取得
    const { data: rarityData, error: rarityError } = await supabase
      .from('rarities')
      .select('id, name')

    if (rarityError) {
      console.error('レアリティデータの取得でエラー:', rarityError)
      return
    }

    const rarityMap = new Map(rarityData.map(r => [r.name, r.id]))

    // 4. カードデータの挿入
    console.log('🃏 カードデータを挿入中...')
    let insertedCount = 0
    
    for (const card of FIRST_PACK_CARDS) {
      const rarityId = rarityMap.get(card.rarity)
      if (!rarityId) {
        console.error(`レアリティ ${card.rarity} が見つかりません`)
        continue
      }

      const cardData = {
        name: card.name,
        pack_id: pack.id,
        rarity_id: rarityId,
        buyback_price: card.buyback_price,
        market_price: card.market_price || card.buyback_price * 1.5
      }

      const { error: cardError } = await supabase
        .from('cards')
        .upsert(cardData, { onConflict: 'name,pack_id' })

      if (cardError) {
        console.error(`カード ${card.name} の挿入でエラー:`, cardError)
      } else {
        insertedCount++
      }
    }
    console.log(`✅ カードデータの挿入完了 (${insertedCount}枚)`)

    // 5. サンプルアクセスコードの作成
    console.log('🔑 アクセスコードを作成中...')
    const accessCodes = [
      {
        code: 'DEMO2024',
        pack_id: pack.id,
        max_uses: 100,
        valid_until: '2024-12-31T23:59:59Z'
      },
      {
        code: 'FRIEND2024',
        pack_id: pack.id,
        max_uses: 50,
        valid_until: '2024-12-31T23:59:59Z'
      },
      {
        code: 'TEST2024',
        pack_id: pack.id,
        max_uses: 10,
        valid_until: '2024-08-31T23:59:59Z'
      }
    ]

    for (const accessCode of accessCodes) {
      const { error } = await supabase
        .from('access_codes')
        .upsert(accessCode, { onConflict: 'code' })
      
      if (error) {
        console.error(`アクセスコード ${accessCode.code} の作成でエラー:`, error)
      }
    }
    console.log('✅ アクセスコードの作成完了')

    // 6. データ確認
    console.log('\n📈 挿入されたデータの確認:')
    
    const { data: rarityCount } = await supabase
      .from('rarities')
      .select('*', { count: 'exact', head: true })
    console.log(`- レアリティ: ${rarityCount?.length || 0}件`)

    const { data: packCount } = await supabase
      .from('packs')
      .select('*', { count: 'exact', head: true })
    console.log(`- 弾: ${packCount?.length || 0}件`)

    const { data: cardCount } = await supabase
      .from('cards')
      .select('*', { count: 'exact', head: true })
    console.log(`- カード: ${cardCount?.length || 0}件`)

    const { data: codeCount } = await supabase
      .from('access_codes')
      .select('*', { count: 'exact', head: true })
    console.log(`- アクセスコード: ${codeCount?.length || 0}件`)

    console.log('\n🎉 データベースの初期化が完了しました！')
    console.log('\n🔑 利用可能なアクセスコード:')
    console.log('- DEMO2024 (100回まで使用可能)')
    console.log('- FRIEND2024 (50回まで使用可能)')
    console.log('- TEST2024 (10回まで使用可能)')

  } catch (error) {
    console.error('❌ 初期化処理でエラーが発生しました:', error)
    process.exit(1)
  }
}

// スクリプト実行
if (require.main === module) {
  seedDatabase()
}