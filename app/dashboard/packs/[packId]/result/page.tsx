'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Loader2, ArrowLeft, TrendingUp, TrendingDown, Coins, Package, BarChart3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase/client'
import { getPackCards, getUserPrices, calculateExpectedValue } from '@/lib/supabase/cards'
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

  useEffect(() => {
    const calculateResult = async () => {
      try {
        // ユーザー認証チェック
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/login')
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

        // ユーザーの価格を取得
        const userPrices = await getUserPrices(user.id, params.packId)
        console.log(`Result page: Got ${userPrices.size} user prices`)
        setPrices(userPrices)

        // ユーザー価格がない場合はデータベースの価格を使用
        const finalPrices = new Map(userPrices)
        if (userPrices.size === 0) {
          console.log('No user prices found, using database prices')
          cardList.forEach(card => {
            if (!finalPrices.has(card.id)) {
              finalPrices.set(card.id, card.parameters?.buyback_price || 0)
            }
          })
        }

        // 価格が設定されているカードのみをフィルタリング（表示されていたカードのみ）
        const cardsWithPrices = cardList.filter(card => finalPrices.has(card.id))
        console.log(`Calculating with ${cardsWithPrices.length} cards that have prices (out of ${cardList.length} total)`)

        // 期待値を計算
        const { expectedValue, profitProbability } = await calculateExpectedValue(
          cardsWithPrices,
          finalPrices,
          boxPrice
        )

        // 計算ログを保存
        await supabase
          .from('calculation_logs')
          .insert({
            user_id: user.id,
            pack_id: params.packId,
            box_price: boxPrice,
            expected_value: expectedValue,
            profit_probability: profitProbability
          })

        setResult({
          expectedValue,
          profitProbability,
          boxPrice,
          totalCards: cardsWithPrices.length,
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
  }, [params.packId, boxPrice, router])

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