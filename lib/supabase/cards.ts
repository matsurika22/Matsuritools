import { supabase } from './client'
import type { Card, UserPrice } from '@/types/cards'

export async function getPackCards(packId: string): Promise<Card[]> {
  const { data, error } = await supabase
    .from('cards')
    .select(`
      *,
      rarities (*)
    `)
    .eq('pack_id', packId)
    .order('card_number')

  if (error) {
    console.error('Error fetching cards:', error)
    return []
  }

  // raritiesを展開
  return (data || []).map(card => ({
    ...card,
    rarity: card.rarities
  }))
}

export async function getUserPrices(userId: string, packId: string): Promise<Map<string, number>> {
  const { data, error } = await supabase
    .from('user_prices')
    .select(`
      card_id,
      price,
      cards!inner (
        pack_id
      )
    `)
    .eq('user_id', userId)
    .eq('cards.pack_id', packId)

  if (error) {
    console.error('Error fetching user prices:', error)
    return new Map()
  }

  const priceMap = new Map<string, number>()
  data?.forEach(item => {
    priceMap.set(item.card_id, item.price)
  })

  return priceMap
}

export async function saveUserPrices(userId: string, prices: { cardId: string; price: number }[]) {
  // 既存の価格を削除してから新規追加（upsertの代わり）
  const cardIds = prices.map(p => p.cardId)
  
  // 削除
  await supabase
    .from('user_prices')
    .delete()
    .eq('user_id', userId)
    .in('card_id', cardIds)

  // 挿入
  const { error } = await supabase
    .from('user_prices')
    .insert(
      prices.map(({ cardId, price }) => ({
        user_id: userId,
        card_id: cardId,
        price
      }))
    )

  if (error) {
    console.error('Error saving prices:', error)
    throw error
  }
}

export async function calculateExpectedValue(
  cards: Card[],
  prices: Map<string, number>,
  boxPrice: number
): Promise<{ expectedValue: number; profitProbability: number }> {
  // 期待値計算
  let expectedValue = 0
  
  cards.forEach(card => {
    const price = prices.get(card.id) || 10 // デフォルト10円
    expectedValue += price * card.boxRate
  })

  // 簡易的なプラス確率計算（実際はもっと複雑）
  // ここでは期待値がボックス価格を超える確率を簡易計算
  const profitProbability = expectedValue > boxPrice ? 75 : 25

  return {
    expectedValue: Math.round(expectedValue),
    profitProbability
  }
}