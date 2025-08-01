'use client'

import { Input } from '@/components/ui/input'
import type { Card } from '@/types/cards'

interface CardPriceListProps {
  cards: Card[]
  prices: Map<string, number>
  onPriceChange: (cardId: string, value: string) => void
}

export function CardPriceList({ cards, prices, onPriceChange }: CardPriceListProps) {
  return (
    <div className="space-y-3">
      {cards.map((card) => (
        <div 
          key={card.id} 
          className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  {card.cardNumber}
                </span>
              </div>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 break-words">
                {card.name}
              </p>
            </div>
            
            <div className="flex items-center gap-2 self-end sm:self-center">
              <Input
                type="number"
                value={prices.get(card.id) || ''}
                onChange={(e) => onPriceChange(card.id, e.target.value)}
                className="w-28 text-right"
                placeholder="0"
                min="0"
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="off"
              />
              <span className="text-sm text-gray-500 dark:text-gray-400">円</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}