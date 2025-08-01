'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Loader2, ArrowLeft, TrendingUp, TrendingDown, Coins, Package, BarChart3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase/client'
import { getPackCards, getUserPrices, calculateExpectedValue } from '@/lib/supabase/cards'
import { useGuestAuth } from '@/hooks/use-guest-auth'
import type { Card, Pack, CalculationResult } from '@/types/cards'

interface PageProps {
  params: { packId: string }
}

export default function ResultPage({ params }: PageProps) {
  const [loading, setLoading] = useState(true)
  const [pack, setPack] = useState<Pack | null>(null)
  const [result, setResult] = useState<CalculationResult | null>(null)
  const [cards, setCards] = useState<Card[]>([])
  const [prices, setPrices] = useState<Map<string, number>>(new Map())
  const router = useRouter()
  const searchParams = useSearchParams()
  const boxPrice = parseInt(searchParams.get('boxPrice') || '0')
  const { guestSession, isGuest, initializeGuest } = useGuestAuth()

  useEffect(() => {
    const calculateResult = async () => {
      try {
        // ゲストセッションを初期化（一度だけ）
        if (!isGuest) {
          initializeGuest()
        }
        
        // ユーザー認証チェック
        const { data: { user } } = await supabase.auth.getUser()
        
        // ログインユーザーもゲストユーザーもいない場合
        if (!user && !guestSession) {
          router.push('/login')
          return
        }
        
        // ゲストユーザーの場合、パックIDをチェック
        if (!user && guestSession && guestSession.packId !== params.packId) {
          router.push('/guest/access-code')
          return
        }

        // パック情報を取得
        const { data: packData } = await supabase
          .from('packs')
          .select('*')
          .eq('id', params.packId)
          .single()
        
        if (packData) {
          setPack(packData)
        }

        // カード一覧を取得
        const cardList = await getPackCards(params.packId)
        setCards(cardList)

        // ユーザーの価格を取得（ゲストの場合はセッションストレージから）
        let userPrices: Map<string, number>
        
        if (user) {
          userPrices = await getUserPrices(user.id, params.packId)
          console.log(`Result page: Got ${userPrices.size} user prices for logged in user`)
        } else if (isGuest) {
          // ゲストユーザーの場合、セッションストレージから価格を取得
          const guestPricesData = sessionStorage.getItem(`guest_prices_${params.packId}`)
          if (guestPricesData) {
            const guestPricesArray = JSON.parse(guestPricesData)
            userPrices = new Map(guestPricesArray.map((item: any) => [item.cardId, item.price]))
            console.log(`Result page: Got ${userPrices.size} prices from guest session`)
          } else {
            userPrices = new Map()
          }
        } else {
          userPrices = new Map()
        }
        
        setPrices(userPrices)

        // ユーザー価格と買取価格をマージ（ユーザー価格を優先、なければ買取価格を使用）
        const finalPrices = new Map<string, number>()
        console.log('Merging prices for calculation:')
        
        cardList.forEach(card => {
          if (userPrices.has(card.id)) {
            finalPrices.set(card.id, userPrices.get(card.id)!)
          } else {
            // 買取価格を使用
            const buybackPrice = card.parameters?.buyback_price || 0
            finalPrices.set(card.id, buybackPrice)
          }
        })
        
        console.log(`Final prices: ${finalPrices.size} (User: ${userPrices.size}, Buyback: ${finalPrices.size - userPrices.size})`)

        // 管理者設定カードと表示レアリティのIDを取得
        const customCardIds = packData?.custom_card_ids || []
        const displayRarityIds = packData?.display_rarity_ids || []
        
        // 表示レアリティのカードIDをセットに変換
        const displayRarityIdSet = new Set(displayRarityIds.map(id => String(id)))
        
        // 計算対象のカードをフィルタリング
        // 1. 表示レアリティに含まれるカード
        // 2. カスタムカードに含まれるカード
        // 注意: 価格が0のカードも含める（正しい確率計算のため）
        const cardsForCalculation = cardList.filter(card => {
          // 表示レアリティが設定されている場合
          if (displayRarityIds.length > 0) {
            // 表示レアリティに含まれるか、カスタムカードに含まれるか
            const isDisplayRarity = card.rarity?.id && displayRarityIdSet.has(String(card.rarity.id))
            const isCustomCard = customCardIds.includes(card.id)
            return isDisplayRarity || isCustomCard
          }
          
          // 表示レアリティが設定されていない場合は全てのカードを対象に
          return true
        })
        
        console.log(`Calculating with ${cardsForCalculation.length} cards (out of ${cardList.length} total)`)
        console.log(`Cards with prices: ${cardsForCalculation.map(c => `${c.card_number}(¥${finalPrices.get(c.id)})`).slice(0, 5).join(', ')}...`)

        // 期待値を計算
        const { expectedValue, profitProbability } = await calculateExpectedValue(
          cardsForCalculation,
          finalPrices,
          boxPrice
        )

        // 計算ログを保存（ログインユーザーのみ）
        if (user) {
          await supabase
            .from('calculation_logs')
            .insert({
              user_id: user.id,
              pack_id: params.packId,
              box_price: boxPrice,
              expected_value: expectedValue,
              profit_probability: profitProbability
            })
        }

        setResult({
          expectedValue,
          profitProbability,
          boxPrice,
          totalCards: cardsForCalculation.length,
          pricesEntered: userPrices.size
        })
      } catch (error) {
        console.error('Error calculating result:', error)
      } finally {
        setLoading(false)
      }
    }

    if (boxPrice > 0) {
      calculateResult()
    } else {
      router.push(`/dashboard/packs/${params.packId}/cards`)
    }
  }, [params.packId, boxPrice, router, isGuest]) // guestSessionではなくisGuestを依存配列に使用

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-gray-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">期待値を計算中...</p>
        </div>
      </div>
    )
  }

  if (!pack || !result) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>データが見つかりません</p>
      </div>
    )
  }

  const profit = result.expectedValue - result.boxPrice
  const profitRate = (100 + (profit / result.boxPrice) * 100).toFixed(1)
  const isProfitable = profit > 0

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href={`/dashboard/packs/${params.packId}/cards`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              価格入力へ戻る
            </Button>
          </Link>
        </div>

        <div className="bg-white dark:bg-gray-800 shadow-xl rounded-lg overflow-hidden">
          <div className={`p-6 ${isProfitable ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {pack.name}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              期待値計算結果
            </p>
          </div>

          <div className="p-6 space-y-6">
            {/* メイン結果 */}
            <div className="flex justify-center">
              <div className="text-center p-6 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div className="flex justify-center mb-2">
                  <Coins className="h-8 w-8 text-yellow-500" />
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">期待値</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  ¥{result.expectedValue.toLocaleString()}
                </p>
              </div>
            </div>

            {/* 損益情報 */}
            <div className={`p-6 rounded-lg ${isProfitable ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  {isProfitable ? (
                    <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400 mr-3" />
                  ) : (
                    <TrendingDown className="h-6 w-6 text-red-600 dark:text-red-400 mr-3" />
                  )}
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">損益</p>
                    <p className={`text-2xl font-bold ${isProfitable ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {profit > 0 ? '+' : ''}{profit.toLocaleString()}円 ({profitRate}%)
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600 dark:text-gray-400">ボックス価格</p>
                  <p className="text-lg font-medium text-gray-900 dark:text-white">
                    ¥{result.boxPrice.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>


            {/* アクション */}
            <div className="flex justify-center gap-4 pt-4">
              <Link href={`/dashboard/packs/${params.packId}/cards`}>
                <Button variant="outline">
                  価格を編集
                </Button>
              </Link>
              <Link href="/dashboard/packs">
                <Button>
                  他の弾を計算
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            <strong>注意：</strong> この計算結果は投資助言ではありません。実際の結果は確率により変動します。
          </p>
        </div>
      </div>
    </div>
  )
}