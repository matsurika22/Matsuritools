import { GoogleSheetsService } from '../lib/services/google-sheets'
import { config } from 'dotenv'
import { resolve } from 'path'

// .env.localを読み込み
config({ path: resolve(process.cwd(), '.env.local') })

const googleSheetsId = process.env.GOOGLE_SHEETS_ID!

async function checkDuplicateCards() {
  console.log('🔍 DM25-RP1のOR1/OR1カードを確認中...')
  
  try {
    const sheetsService = new GoogleSheetsService(googleSheetsId)
    
    // カードマスターの確認
    const allCards = await sheetsService.fetchCardData()
    
    // DM25-RP1のOR1/OR1カードを探す
    const or1Cards = allCards.filter(card => 
      card.pack_id === 'DM25-RP1' && card.card_number === 'OR1/OR1'
    )
    
    console.log(`\nDM25-RP1のOR1/OR1カード数: ${or1Cards.length}`)
    
    if (or1Cards.length > 0) {
      console.log('\n詳細:')
      or1Cards.forEach((card, index) => {
        console.log(`  ${index + 1}. ${card.name}`)
        console.log(`     レアリティ: ${card.rarity}`)
        console.log(`     買取価格: ${card.buyback_price}`)
        console.log(`     参考価格: ${card.reference_price || '未設定'}`)
      })
    }
    
    // DM25-RP1の全カード数
    const rp1Cards = allCards.filter(card => card.pack_id === 'DM25-RP1')
    console.log(`\nDM25-RP1の全カード数: ${rp1Cards.length}`)
    
    // ORレアリティのカードを確認
    const orCards = rp1Cards.filter(card => card.rarity === 'OR')
    console.log(`\nDM25-RP1のORレアリティカード:`)
    orCards.forEach(card => {
      console.log(`  ${card.card_number}: ${card.name}`)
    })
    
  } catch (error) {
    console.error('❌ エラー:', error)
  }
}

checkDuplicateCards()