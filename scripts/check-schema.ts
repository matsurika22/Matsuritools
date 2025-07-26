// データベーススキーマ確認スクリプト

import { createClient } from '@supabase/supabase-js'

require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkSchema() {
  console.log('🔍 データベーススキーマを確認中...')
  
  try {
    // raritiesテーブルの構造確認
    console.log('\n📊 raritiesテーブル:')
    const { data: rarities, error: raritiesError } = await supabase
      .from('rarities')
      .select('*')
      .limit(1)
    
    if (raritiesError) {
      console.error('raritiesテーブルエラー:', raritiesError.message)
    } else if (rarities && rarities.length > 0) {
      console.log('利用可能なカラム:', Object.keys(rarities[0]))
    }

    // cardsテーブルの構造確認
    console.log('\n🃏 cardsテーブル:')
    const { data: cards, error: cardsError } = await supabase
      .from('cards')
      .select('*')
      .limit(1)
    
    if (cardsError) {
      console.error('cardsテーブルエラー:', cardsError.message)
    } else if (cards && cards.length > 0) {
      console.log('利用可能なカラム:', Object.keys(cards[0]))
    } else {
      console.log('cardsテーブルは空です')
    }

    // packsテーブルの確認
    console.log('\n📦 packsテーブル:')
    const { data: packs, error: packsError } = await supabase
      .from('packs')
      .select('*')
      .limit(1)
    
    if (packsError) {
      console.error('packsテーブルエラー:', packsError.message)
    } else if (packs && packs.length > 0) {
      console.log('利用可能なカラム:', Object.keys(packs[0]))
    } else {
      console.log('packsテーブルは空です')
    }

    // 既存データの確認
    console.log('\n📈 既存データ数:')
    
    const { count: raritiesCount } = await supabase
      .from('rarities')
      .select('*', { count: 'exact', head: true })
    console.log(`- レアリティ: ${raritiesCount || 0}件`)

    const { count: packsCount } = await supabase
      .from('packs')
      .select('*', { count: 'exact', head: true })
    console.log(`- 弾: ${packsCount || 0}件`)

    const { count: cardsCount } = await supabase
      .from('cards')
      .select('*', { count: 'exact', head: true })
    console.log(`- カード: ${cardsCount || 0}件`)

  } catch (error) {
    console.error('❌ スキーマ確認エラー:', error)
  }
}

checkSchema()