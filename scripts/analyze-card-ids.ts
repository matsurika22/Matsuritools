import { supabase } from './supabase-client'
import { GoogleSheetsService } from '../lib/services/google-sheets'

async function analyzeCardIds() {
  console.log('🔍 カードIDの競合問題を分析中...')
  
  try {
    const googleSheetsId = process.env.GOOGLE_SHEETS_ID!
    const sheetsService = new GoogleSheetsService(googleSheetsId)
    
    // スプレッドシートからすべてのカードを取得
    const allCards = await sheetsService.fetchCardData()
    
    // カードIDの分析
    const idCounts = new Map<string, any[]>()
    allCards.forEach(card => {
      const cardId = card.card_number
      if (!idCounts.has(cardId)) {
        idCounts.set(cardId, [])
      }
      idCounts.get(cardId)!.push(card)
    })
    
    // 重複するカードIDを確認
    console.log('🔍 重複するカードID:')
    let duplicateCount = 0
    idCounts.forEach((cards, cardId) => {
      if (cards.length > 1) {
        duplicateCount++
        console.log(`\\n  ${cardId}: ${cards.length}個の弾で使用`)
        cards.forEach(card => {
          console.log(`    - ${card.pack_id}: ${card.name} (${card.rarity})`)
        })
      }
    })
    
    console.log(`\\n📊 重複カードID数: ${duplicateCount}`)
    console.log(`📊 総カードID数: ${idCounts.size}`)
    console.log(`📊 総カード数: ${allCards.length}`)
    
    // DM25-RP1 と DM25-RP2 で重複するカードIDの詳細分析
    console.log('\\n🎯 DM25-RP1 と DM25-RP2 の重複分析:')
    const rp1Cards = allCards.filter(card => card.pack_id === 'DM25-RP1')
    const rp2Cards = allCards.filter(card => card.pack_id === 'DM25-RP2')
    
    console.log(`DM25-RP1 カード数: ${rp1Cards.length}`)
    console.log(`DM25-RP2 カード数: ${rp2Cards.length}`)
    
    const rp1Ids = new Set(rp1Cards.map(card => card.card_number))
    const rp2Ids = new Set(rp2Cards.map(card => card.card_number))
    
    const commonIds = new Set()
    rp1Ids.forEach(id => {
      if (rp2Ids.has(id)) {
        commonIds.add(id)
      }
    })
    
    console.log(`\\n⚠️ 共通カードID数: ${commonIds.size}`)
    if (commonIds.size > 0) {
      console.log('共通カードID:')
      Array.from(commonIds).slice(0, 10).forEach(id => {
        const rp1Card = rp1Cards.find(card => card.card_number === id)
        const rp2Card = rp2Cards.find(card => card.card_number === id)
        console.log(`  ${id}:`)
        console.log(`    DM25-RP1: ${rp1Card?.name}`)
        console.log(`    DM25-RP2: ${rp2Card?.name}`)
      })
      
      if (commonIds.size > 10) {
        console.log(`  ... および他${commonIds.size - 10}個`)
      }
    }
    
    // データベースの現在の状況も確認
    console.log('\\n📊 データベースの現在の状況:')
    const { data: dbCards } = await supabase
      .from('cards')
      .select('id, pack_id, name')
    
    if (dbCards) {
      const dbIdCounts = new Map<string, any[]>()
      dbCards.forEach(card => {
        if (!dbIdCounts.has(card.id)) {
          dbIdCounts.set(card.id, [])
        }
        dbIdCounts.get(card.id)!.push(card)
      })
      
      const dbDuplicates = Array.from(dbIdCounts.entries()).filter(([_, cards]) => cards.length > 1)
      console.log(`データベース内の重複ID数: ${dbDuplicates.length}`)
      
      if (dbDuplicates.length > 0) {
        console.log('データベース内の重複ID:')
        dbDuplicates.slice(0, 5).forEach(([id, cards]) => {
          console.log(`  ${id}: ${cards.length}個`)
          cards.forEach(card => console.log(`    - ${card.pack_id}: ${card.name}`))
        })
      }
    }
    
  } catch (error) {
    console.error('❌ 分析エラー:', error)
  }
}

analyzeCardIds()