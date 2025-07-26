// 期待値計算ロジック（BOX内重複制限対応版）

export interface CardWithPrice {
  id: string
  name: string
  rarity: {
    name: string
    color: string
  }
  buyback_price: number
  box_rate?: number  // 旧システム用（後方互換性）
}

export interface PackRarityInfo {
  rarity_name: string
  total_types: number      // 全種類数
  cards_per_box: number    // BOX排出枚数
  allows_duplicates: boolean // 重複を許可するか
}

export interface CalculationResult {
  expectedValue: number      // 期待値
  plusProbability: number    // プラス確率
  breakdown: {
    rarity: string
    expectedValue: number
    contribution: number     // 全体への寄与度（%）
  }[]
}

/**
 * BOX期待値を計算
 * C,UC以外は重複なしの前提で計算
 */
export function calculateBoxExpectation(
  cards: CardWithPrice[],
  packRarities: PackRarityInfo[],
  boxPrice: number
): CalculationResult {
  
  // レアリティごとにカードをグループ化
  const cardsByRarity = new Map<string, CardWithPrice[]>()
  cards.forEach(card => {
    // rarityがオブジェクトの場合とそうでない場合の両方に対応
    const rarityName = typeof card.rarity === 'object' ? card.rarity.name : (card.rarity || 'Unknown')
    if (!cardsByRarity.has(rarityName)) {
      cardsByRarity.set(rarityName, [])
    }
    cardsByRarity.get(rarityName)!.push(card)
  })
  

  let totalExpectedValue = 0
  const breakdown: CalculationResult['breakdown'] = []

  // 各レアリティの期待値を計算
  packRarities.forEach(rarityInfo => {
    const cards = cardsByRarity.get(rarityInfo.rarity_name) || []
    if (cards.length === 0) return

    let rarityExpectedValue = 0

    if (rarityInfo.allows_duplicates) {
      // C,UCなど重複ありの場合：単純な期待値計算
      cards.forEach(card => {
        const cardRate = rarityInfo.cards_per_box / rarityInfo.total_types
        rarityExpectedValue += card.buyback_price * cardRate
      })
    } else {
      // 重複なしの場合：組み合わせを考慮した期待値計算
      rarityExpectedValue = calculateNoDuplicateExpectation(
        cards,
        rarityInfo.cards_per_box,
        rarityInfo.total_types
      )
    }

    totalExpectedValue += rarityExpectedValue
    breakdown.push({
      rarity: rarityInfo.rarity_name,
      expectedValue: rarityExpectedValue,
      contribution: 0 // 後で計算
    })
  })

  // 寄与度を計算
  breakdown.forEach(item => {
    item.contribution = totalExpectedValue > 0 
      ? (item.expectedValue / totalExpectedValue) * 100 
      : 0
  })

  // プラス確率の計算（簡易版）
  // TODO: より正確な確率分布を使用した計算に改良
  const plusProbability = calculatePlusProbability(
    totalExpectedValue,
    boxPrice,
    cards.length
  )

  return {
    expectedValue: totalExpectedValue,
    plusProbability,
    breakdown
  }
}

/**
 * 重複なしでの期待値計算
 * n種類からk枚を重複なしで選ぶ場合の期待値
 */
function calculateNoDuplicateExpectation(
  cards: CardWithPrice[],
  cardsPerBox: number,
  totalTypes: number
): number {
  // カードを価格でソート（降順）
  const sortedCards = [...cards].sort((a, b) => b.buyback_price - a.buyback_price)
  
  // 実際の排出枚数（種類数を超えない）
  const actualCards = Math.min(cardsPerBox, totalTypes)
  
  if (actualCards >= totalTypes) {
    // 全種類が出る場合
    return cards.reduce((sum, card) => sum + card.buyback_price, 0)
  }

  // 各カードが選ばれる確率は等しい
  const selectionProbability = actualCards / totalTypes
  
  // 期待値 = Σ(カード価格 × 選ばれる確率)
  return cards.reduce((sum, card) => {
    return sum + (card.buyback_price * selectionProbability)
  }, 0)
}

/**
 * プラス確率の簡易計算
 * TODO: モンテカルロシミュレーションによる正確な計算
 */
function calculatePlusProbability(
  expectedValue: number,
  boxPrice: number,
  totalCards: number
): number {
  if (totalCards === 0) return 0
  
  // 期待値がBOX価格を上回る割合を基準に計算
  const ratio = expectedValue / boxPrice
  
  if (ratio >= 1.5) return 95    // 期待値が1.5倍以上
  if (ratio >= 1.2) return 80    // 期待値が1.2倍以上
  if (ratio >= 1.0) return 60    // 期待値がBOX価格以上
  if (ratio >= 0.8) return 30    // 期待値がBOX価格の80%以上
  if (ratio >= 0.6) return 10    // 期待値がBOX価格の60%以上
  return 5                        // それ以下
}

/**
 * レアリティが重複を許可するかどうか
 */
export function allowsDuplicates(rarityName: string): boolean {
  const duplicateAllowed = ['C', 'UC', 'U']
  return duplicateAllowed.includes(rarityName)
}

/**
 * モンテカルロシミュレーションによる詳細な期待値計算
 * （計算負荷が高いため、必要に応じて使用）
 */
export async function calculateDetailedExpectation(
  cards: CardWithPrice[],
  packRarities: PackRarityInfo[],
  boxPrice: number,
  simulations: number = 10000
): Promise<{
  expectedValue: number
  plusProbability: number
  distribution: {
    value: number
    frequency: number
  }[]
}> {
  const results: number[] = []
  
  for (let i = 0; i < simulations; i++) {
    const boxValue = simulateBoxOpening(cards, packRarities)
    results.push(boxValue)
  }
  
  // 統計計算
  const expectedValue = results.reduce((sum, val) => sum + val, 0) / results.length
  const plusCount = results.filter(val => val >= boxPrice).length
  const plusProbability = (plusCount / simulations) * 100
  
  // 分布を計算
  const distribution = calculateDistribution(results)
  
  return {
    expectedValue,
    plusProbability,
    distribution
  }
}

/**
 * 1BOX開封をシミュレート
 */
function simulateBoxOpening(
  cards: CardWithPrice[],
  packRarities: PackRarityInfo[]
): number {
  let totalValue = 0
  
  packRarities.forEach(rarityInfo => {
    const rarityCards = cards.filter(c => c.rarity.name === rarityInfo.rarity_name)
    if (rarityCards.length === 0) return
    
    if (rarityInfo.allows_duplicates) {
      // 重複ありの場合
      for (let i = 0; i < rarityInfo.cards_per_box; i++) {
        const randomCard = rarityCards[Math.floor(Math.random() * rarityCards.length)]
        totalValue += randomCard.buyback_price
      }
    } else {
      // 重複なしの場合
      const selectedCards = selectRandomCards(
        rarityCards,
        Math.min(rarityInfo.cards_per_box, rarityCards.length)
      )
      totalValue += selectedCards.reduce((sum, card) => sum + card.buyback_price, 0)
    }
  })
  
  return totalValue
}

/**
 * 重複なしでランダムにカードを選択
 */
function selectRandomCards<T>(array: T[], count: number): T[] {
  const shuffled = [...array].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}

/**
 * 結果の分布を計算
 */
function calculateDistribution(values: number[]): { value: number; frequency: number }[] {
  const bins = 20 // ビンの数
  const min = Math.min(...values)
  const max = Math.max(...values)
  const binWidth = (max - min) / bins
  
  const distribution: { value: number; frequency: number }[] = []
  
  for (let i = 0; i < bins; i++) {
    const binMin = min + i * binWidth
    const binMax = binMin + binWidth
    const count = values.filter(v => v >= binMin && v < binMax).length
    
    distribution.push({
      value: binMin + binWidth / 2,
      frequency: count
    })
  }
  
  return distribution
}