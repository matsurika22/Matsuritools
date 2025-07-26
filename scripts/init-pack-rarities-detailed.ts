// pack_rarities テーブルに詳細な封入率データを投入

import { createClient } from '@supabase/supabase-js'

require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function initPackRaritiesDetailed() {
  console.log('📦 弾×レアリティの詳細封入率を初期化中...')
  
  try {
    // カードデータを取得
    const { data: allCards, error: cardsError } = await supabase
      .from('cards')
      .select('id, pack_id, rarity_id, rarity:rarities(name)')
    
    if (cardsError) {
      console.error('❌ カードデータ取得エラー:', cardsError)
      return
    }
    
    console.log('\n📊 現在のカード分布:')
    
    // 邪神vs邪神の標準的な封入率
    const dm25rp1Rates = {
      'C': { cards_per_box: 50, notes: 'コモン' },
      'U': { cards_per_box: 30, notes: 'アンコモン' },
      'UC': { cards_per_box: 30, notes: 'アンコモン' },
      'R': { cards_per_box: 8, notes: 'レア' },
      'VR': { cards_per_box: 4, notes: 'ベリーレア' },
      'SR': { cards_per_box: 4, notes: 'スーパーレア（11種から4種排出）' },
      'MR': { cards_per_box: 0.5, notes: 'マスターレア（2BOXに1枚）' },
      'OR': { cards_per_box: 0.25, notes: 'オーバーレア（4BOXに1枚）' },
      'DM': { cards_per_box: 0.125, notes: 'ドラゴンマスター（8BOXに1枚）' },
      'DM㊙': { cards_per_box: 0.0625, notes: 'ドラゴンマスター秘（16BOXに1枚）' },
      '㊙': { cards_per_box: 1, notes: '秘レア（特殊排出）' },
      'T': { cards_per_box: 3, notes: 'ツインパクト' },
      'TD': { cards_per_box: 0.5, notes: 'タスクドラゴン（2BOXに1枚）' },
      'SP': { cards_per_box: 0.5, notes: 'スペシャル（2BOXに1枚）' },
      'TR': { cards_per_box: 1, notes: 'トレジャー' }
    }
    
    // 現在の弾情報を取得
    const { data: packs } = await supabase
      .from('packs')
      .select('id, name')
    
    const { data: rarities } = await supabase
      .from('rarities')
      .select('id, name')
    
    const rarityMap = new Map(rarities?.map(r => [r.name, r.id]) || [])
    
    let insertedCount = 0
    let errorCount = 0
    
    for (const pack of packs || []) {
      console.log(`\n📋 ${pack.name} (${pack.id}) の封入率を設定中...`)
      
      // この弾の各レアリティのカード種類数を取得
      const { data: packCardCounts } = await supabase
        .from('cards')
        .select('rarity_id, rarity:rarities(name)')
        .eq('pack_id', pack.id)
      
      // レアリティごとにカウント
      const rarityCardCount = new Map<string, number>()
      packCardCounts?.forEach(card => {
        const rarityName = (card.rarity && !Array.isArray(card.rarity) ? (card.rarity as any).name : '') || ''
        rarityCardCount.set(rarityName, (rarityCardCount.get(rarityName) || 0) + 1)
      })
      
      // 各レアリティの封入率を設定  
      for (const [rarityName, rarityId] of Array.from(rarityMap.entries())) {
        const totalTypes = rarityCardCount.get(rarityName) || 0
        const rateInfo = (dm25rp1Rates as any)[rarityName] || { cards_per_box: 0, notes: '' }
        
        if (totalTypes === 0) continue // このレアリティのカードがない場合はスキップ
        
        const { error } = await supabase
          .from('pack_rarities')
          .upsert({
            pack_id: pack.id,
            rarity_id: rarityId,
            cards_per_box: rateInfo.cards_per_box,
            notes: rateInfo.notes
          }, {
            onConflict: 'pack_id,rarity_id'
          })
        
        if (error) {
          console.error(`  ❌ ${rarityName}: ${error.message}`)
          errorCount++
        } else {
          const ratePerCard = totalTypes > 0 ? rateInfo.cards_per_box / totalTypes : 0
          console.log(`  ✅ ${rarityName}: ${totalTypes}種類, ${rateInfo.cards_per_box}枚/BOX (1種あたり${ratePerCard.toFixed(4)}枚)`)
          if (rateInfo.notes) {
            console.log(`     📝 ${rateInfo.notes}`)
          }
          insertedCount++
        }
      }
    }
    
    console.log('\n📊 初期化結果:')
    console.log(`  - 成功: ${insertedCount}件`)
    console.log(`  - エラー: ${errorCount}件`)
    
    // 設定内容を確認
    console.log('\n📋 設定された封入率の確認:')
    const { data: packRarities } = await supabase
      .from('pack_rarities')
      .select(`
        *,
        pack:packs(name),
        rarity:rarities(name)
      `)
      .order('pack_id, rarity_id')
    
    packRarities?.forEach(pr => {
      console.log(`${pr.pack?.name} - ${pr.rarity?.name}: ${pr.cards_per_box}枚/BOX`)
    })
    
  } catch (error) {
    console.error('❌ エラー:', error)
  }
}

// 実行
initPackRaritiesDetailed()