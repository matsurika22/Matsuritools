export interface Rarity {
  id: number
  packId: string
  name: string
  cardsPerBox: number
  totalCards: number
  color: string | null
  displayOrder: number
  createdAt: string
  updatedAt: string
}

export interface Card {
  id: string
  packId: string
  rarityId: number
  cardNumber: string
  name: string
  imageUrl: string | null
  boxRate: number
  parameters?: {
    buyback_price?: number
    reference_price?: number
    [key: string]: any
  }
  createdAt: string
  updatedAt: string
  // 追加フィールド（JOIN用）
  rarity?: Rarity
  price?: number
}

export interface UserPrice {
  id: number
  userId: string
  cardId: string
  price: number
  updatedAt: string
}

export interface Pack {
  id: string
  name: string
  box_price?: number
  display_rarity_ids?: string[]
  custom_card_ids?: string[]
}

export interface CalculationResult {
  expectedValue: number
  profitProbability: number
  boxPrice: number
  totalCards: number
  pricesEntered: number
}