import { GoogleSheetsService } from '../lib/services/google-sheets'
import { config } from 'dotenv'
import { resolve } from 'path'

// .env.localを読み込み
config({ path: resolve(process.cwd(), '.env.local') })

const googleSheetsId = process.env.GOOGLE_SHEETS_ID!

async function checkSheetsStructure() {
  console.log('📋 Google Sheetsの構造を確認中...')
  
  try {
    const sheetsService = new GoogleSheetsService(googleSheetsId)
    
    // 弾マスターの確認
    console.log('\n🏷️ 弾マスター:')
    const packs = await sheetsService.fetchPackData()
    packs.forEach(pack => {
      console.log(`  ${pack.id}: ${pack.name}`)
    })
    
    // カードマスターの確認（最初の10件）
    console.log('\n📄 カードマスター（最初の10件）:')
    const allCards = await sheetsService.fetchCardData()
    allCards.slice(0, 10).forEach(card => {
      console.log(`  ${card.pack_id}: ${card.card_number} - ${card.name} (${card.rarity})`)
    })
    
    // 弾別のカード数
    console.log('\n📊 弾別カード数（スプレッドシート）:')
    const packCounts = new Map<string, number>()
    allCards.forEach(card => {
      const count = packCounts.get(card.pack_id) || 0
      packCounts.set(card.pack_id, count + 1)
    })
    
    packCounts.forEach((count, packId) => {
      const pack = packs.find(p => p.id === packId)
      console.log(`  ${packId} (${pack?.name || '不明'}): ${count}枚`)
    })
    
    // DM25-RP1のカードを確認
    console.log('\n🔍 DM25-RP1のカード詳細（スプレッドシート）:')
    const rp1Cards = allCards.filter(card => card.pack_id === 'DM25-RP1')
    console.log(`  合計: ${rp1Cards.length}枚`)
    
    if (rp1Cards.length > 0) {
      // 最初の5枚と最後の5枚を表示
      console.log('  最初の5枚:')
      rp1Cards.slice(0, 5).forEach(card => {
        console.log(`    ${card.card_number}: ${card.name} (${card.rarity})`)
      })
      
      if (rp1Cards.length > 10) {
        console.log('  ...')
        console.log('  最後の5枚:')
        rp1Cards.slice(-5).forEach(card => {
          console.log(`    ${card.card_number}: ${card.name} (${card.rarity})`)
        })
      } else if (rp1Cards.length > 5) {
        console.log('  残り:')
        rp1Cards.slice(5).forEach(card => {
          console.log(`    ${card.card_number}: ${card.name} (${card.rarity})`)
        })
      }
    }
    
  } catch (error) {
    console.error('❌ エラー:', error)
  }
}

checkSheetsStructure()