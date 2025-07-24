'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2, ArrowLeft, Save, Calculator } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { supabase } from '@/lib/supabase/client'
import { getPackCards, getUserPrices, saveUserPrices, calculateExpectedValue } from '@/lib/supabase/cards'
import type { Card, Pack } from '@/types/cards'

interface PageProps {
  params: { packId: string }
}

export default function CardsPage({ params }: PageProps) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [cards, setCards] = useState<Card[]>([])
  const [pack, setPack] = useState<Pack | null>(null)
  const [prices, setPrices] = useState<Map<string, number>>(new Map())
  const [boxPrice, setBoxPrice] = useState<number>(0)
  const [user, setUser] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    const loadData = async () => {
      try {
        // ユーザー認証チェック
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/login')
          return
        }
        setUser(user)

        // パック情報を取得
        const { data: packData } = await supabase
          .from('packs')
          .select('*')
          .eq('id', params.packId)
          .single()
        
        if (packData) {
          setPack(packData)
          setBoxPrice(packData.box_price || 0)
        }

        // カード一覧を取得
        const cardList = await getPackCards(params.packId)
        setCards(cardList)

        // ユーザーの保存済み価格を取得
        const userPrices = await getUserPrices(user.id, params.packId)
        setPrices(userPrices)
      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [params.packId, router])

  const handlePriceChange = (cardId: string, value: string) => {
    const price = parseInt(value) || 0
    const newPrices = new Map(prices)
    newPrices.set(cardId, price)
    setPrices(newPrices)
  }

  const handleSave = async () => {
    if (!user) return

    try {
      setSaving(true)
      const priceData = Array.from(prices.entries()).map(([cardId, price]) => ({
        cardId,
        price
      }))
      await saveUserPrices(user.id, priceData)
      
      // 期待値計算画面へ遷移
      router.push(`/dashboard/packs/${params.packId}/result?boxPrice=${boxPrice}`)
    } catch (error) {
      console.error('Error saving prices:', error)
      alert('保存に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    )
  }

  if (!pack) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>パック情報が見つかりません</p>
      </div>
    )
  }

  // レアリティごとにカードをグループ化
  const cardsByRarity = cards.reduce((acc, card) => {
    const rarityName = card.rarity?.name || '不明'
    if (!acc[rarityName]) {
      acc[rarityName] = []
    }
    acc[rarityName].push(card)
    return acc
  }, {} as Record<string, Card[]>)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/dashboard/packs">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              弾選択へ戻る
            </Button>
          </Link>
        </div>

        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            {pack.name} - 価格入力
          </h1>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              ボックス購入価格（円）
            </label>
            <Input
              type="number"
              value={boxPrice}
              onChange={(e) => setBoxPrice(parseInt(e.target.value) || 0)}
              className="max-w-xs"
              placeholder="例: 5500"
            />
          </div>

          <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              各カードの買取価格を入力してください。未入力のカードは10円として計算されます。
            </p>
          </div>

          {Object.entries(cardsByRarity).map(([rarityName, rarityCards]) => (
            <div key={rarityName} className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <span 
                  className="w-4 h-4 rounded-full mr-2"
                  style={{ backgroundColor: rarityCards[0]?.rarity?.color || '#808080' }}
                />
                {rarityName}
              </h2>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        番号
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        カード名
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        封入率
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        買取価格（円）
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {rarityCards.map((card) => (
                      <tr key={card.id}>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                          {card.cardNumber}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                          {card.name}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {card.boxRate < 1 ? `1/${Math.round(1/card.boxRate)}` : `${card.boxRate}枚`}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <Input
                            type="number"
                            value={prices.get(card.id) || ''}
                            onChange={(e) => handlePriceChange(card.id, e.target.value)}
                            className="w-24"
                            placeholder="10"
                            min="0"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}

          <div className="flex justify-end gap-4 mt-8">
            <Button
              onClick={handleSave}
              disabled={saving || boxPrice === 0}
              size="lg"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  保存中...
                </>
              ) : (
                <>
                  <Calculator className="mr-2 h-4 w-4" />
                  期待値を計算
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}