import { supabase } from './client'
import type { Card, UserPrice } from '@/types/cards'

export async function getPackCards(packId: string): Promise<Card[]> {
  const { data, error } = await supabase
    .from('cards')
    .select(`
      *,
      rarities (*),
      parameters
    `)
    .eq('pack_id', packId)
    .order('card_number')

  if (error) {
    console.error('Error fetching cards:', error)
    return []
  }

  // raritiesを展開し、parametersも含める
  // snake_caseからcamelCaseに変換
  return (data || []).map(card => ({
    id: card.id,
    packId: card.pack_id,
    rarityId: card.rarity_id,
    cardNumber: card.card_number,
    name: card.name,
    imageUrl: card.image_url,
    boxRate: card.box_rate || 0,
    parameters: card.parameters || {},
    createdAt: card.created_at,
    updatedAt: card.updated_at,
    rarity: card.rarities,
    price: 0
  }))
}

export async function getUserPrices(userId: string, packId: string): Promise<Map<string, number>> {
  // まず、指定されたパックのカードIDを取得
  const { data: packCards, error: cardsError } = await supabase
    .from('cards')
    .select('id')
    .eq('pack_id', packId)
  
  if (cardsError || !packCards) {
    console.error('Error fetching pack cards:', cardsError)
    return new Map()
  }
  
  const cardIds = packCards.map(c => c.id)
  
  // ユーザー価格を取得
  const { data, error } = await supabase
    .from('user_prices')
    .select('card_id, price')
    .eq('user_id', userId)
    .in('card_id', cardIds)

  if (error) {
    console.error('Error fetching user prices:', error)
    return new Map()
  }

  console.log(`getUserPrices: Found ${data?.length || 0} prices for pack ${packId}`)

  const priceMap = new Map<string, number>()
  data?.forEach(item => {
    priceMap.set(item.card_id, item.price)
  })

  return priceMap
}

export async function saveUserPrices(userId: string, prices: { cardId: string; price: number }[]) {
  console.log(`saveUserPrices: Saving ${prices.length} prices for user ${userId}`)
  
  // 既存の価格を削除してから新規追加（upsertの代わり）
  const cardIds = prices.map(p => p.cardId)
  
  // 削除
  const { error: deleteError } = await supabase
    .from('user_prices')
    .delete()
    .eq('user_id', userId)
    .in('card_id', cardIds)
  
  if (deleteError) {
    console.error('Error deleting old prices:', deleteError)
  }

  // 挿入
  const { data, error, count } = await supabase
    .from('user_prices')
    .insert(
      prices.map(({ cardId, price }) => ({
        user_id: userId,
        card_id: cardId,
        price
      }))
    )
    .select('*')

  if (error) {
    console.error('Error saving prices:', error)
    throw error
  }
  
  console.log(`saveUserPrices: Successfully saved ${count} prices`)
  
  // 保存結果を確認
  const { data: verification } = await supabase
    .from('user_prices')
    .select('*')
    .eq('user_id', userId)
    .in('card_id', cardIds)
  
  console.log(`saveUserPrices: Verification - ${verification?.length} prices found in DB`)
}

export async function calculateExpectedValue(
  cards: Card[],
  prices: Map<string, number>,
  boxPrice: number
): Promise<{ expectedValue: number; profitProbability: number }> {
  // pack_raritiesから封入率情報を取得
  const packId = cards[0]?.packId
  if (!packId) {
    // カードがない場合
    return { expectedValue: 0, profitProbability: 0 }
  }

  const { data: packRarities } = await supabase
    .from('pack_rarity_details')
    .select('*')
    .eq('pack_id', packId)
  
  if (packRarities && packRarities.length > 0) {
    // 新システムでの計算
    const { calculateBoxExpectation, allowsDuplicates } = await import('@/lib/utils/expectation-calculator')
    
    const cardsWithPrices = cards.map(card => ({
      id: card.id,
      name: card.name,
      rarity: card.rarity ? {
        name: card.rarity.name,
        color: card.rarity.color || '#808080'
      } : {
        name: 'Unknown',
        color: '#808080'
      },
      buyback_price: prices.get(card.id) || 0
    }))
    
    const rarityInfo = packRarities.map(pr => ({
      rarity_name: pr.rarity_name,
      total_types: pr.total_types || 0,
      cards_per_box: pr.cards_per_box || 0,
      allows_duplicates: allowsDuplicates(pr.rarity_name)
    }))
    
    const result = calculateBoxExpectation(
      cardsWithPrices,
      rarityInfo,
      boxPrice
    )
    
    return {
      expectedValue: Math.round(result.expectedValue),
      profitProbability: Math.round(result.plusProbability)
    }
  } else {
    // 旧システムでの計算（後方互換性）
    let expectedValue = 0
    
    cards.forEach(card => {
      const price = prices.get(card.id) || 0
      expectedValue += price * card.boxRate
    })

    const profitProbability = expectedValue > boxPrice ? 75 : 25

    return {
      expectedValue: Math.round(expectedValue),
      profitProbability
    }
  }
}