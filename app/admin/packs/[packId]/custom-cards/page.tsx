'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Search, Plus, X, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { supabase } from '@/lib/supabase/client'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import type { Card } from '@/types/cards'

interface PageProps {
  params: { packId: string }
}

interface Pack {
  id: string
  name: string
  custom_card_ids?: string[]
}

interface CardWithPack extends Card {
  pack?: {
    id: string
    name: string
  }
}

export default function CustomCardsPage({ params }: PageProps) {
  const [pack, setPack] = useState<Pack | null>(null)
  const [packCards, setPackCards] = useState<Card[]>([])
  const [customCardIds, setCustomCardIds] = useState<Set<string>>(new Set())
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRarity, setSelectedRarity] = useState<string>('all')
  const [rarities, setRarities] = useState<{id: string, name: string, color: string}[]>([])
  const [displayRarityIds, setDisplayRarityIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  const loadPackAndCards = useCallback(async () => {
    try {
      setLoading(true)
      
      // パック情報を取得
      const { data: packData, error: packError } = await supabase
        .from('packs')
        .select('id, name')
        .eq('id', params.packId)
        .single()
      
      if (packError) throw packError
      setPack(packData)
      
      // カスタムカードIDと表示レアリティIDを取得（カラムが存在する場合）
      try {
        const { data: packWithSettings } = await supabase
          .from('packs')
          .select('custom_card_ids, display_rarity_ids')
          .eq('id', params.packId)
          .single()
        
        if (packWithSettings?.custom_card_ids) {
          setCustomCardIds(new Set(packWithSettings.custom_card_ids))
        }
        if (packWithSettings?.display_rarity_ids) {
          setDisplayRarityIds(packWithSettings.display_rarity_ids)
        }
      } catch (e) {
        console.log('custom settings columns not available yet')
      }
      
      // 全レアリティを取得
      const { data: raritiesData } = await supabase
        .from('rarities')
        .select('id, name, color')
        .order('display_order')
      
      setRarities(raritiesData || [])
      
      // 現在のパックのカードのみを取得
      const { data: cardsData, error: cardsError } = await supabase
        .from('cards')
        .select(`
          id,
          card_number,
          name,
          rarity_id,
          rarities (
            id,
            name,
            color
          )
        `)
        .eq('pack_id', params.packId)
        .order('card_number')
      
      if (cardsError) throw cardsError
      
      // データを整形
      const formattedCards = cardsData?.map(card => ({
        id: card.id,
        cardNumber: card.card_number,
        name: card.name,
        rarity: card.rarities && !Array.isArray(card.rarities) ? {
          id: String((card.rarities as any).id || ''),
          name: (card.rarities as any).name || '',
          color: (card.rarities as any).color || ''
        } : undefined
      })) as Card[]
      
      setPackCards(formattedCards || [])
    } catch (error) {
      console.error('Error loading data:', error)
      alert('データの取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }, [params.packId])

  useEffect(() => {
    loadPackAndCards()
  }, [loadPackAndCards])

  const handleSave = async () => {
    if (!pack) return

    try {
      setSaving(true)
      
      const { error } = await supabase
        .from('packs')
        .update({
          custom_card_ids: Array.from(customCardIds)
        })
        .eq('id', pack.id)
      
      if (error) {
        if (error.code === '42703') {
          alert('データベースの設定が必要です。管理者に以下のSQLの実行を依頼してください：\n\nALTER TABLE packs ADD COLUMN IF NOT EXISTS custom_card_ids TEXT[] DEFAULT \'{}\';')
          return
        }
        throw error
      }
      
      alert('カスタムカード設定を保存しました')
      router.push('/admin/packs')
    } catch (error) {
      console.error('Error saving custom cards:', error)
      alert('保存に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  const toggleCard = (cardId: string) => {
    setCustomCardIds(prev => {
      const newSet = new Set(prev)
      if (newSet.has(cardId)) {
        newSet.delete(cardId)
      } else {
        newSet.add(cardId)
      }
      return newSet
    })
  }

  // フィルタリング
  const filteredCards = packCards.filter(card => {
    // 表示レアリティに含まれるカードは除外
    if (displayRarityIds.length > 0 && card.rarity?.id && displayRarityIds.includes(String(card.rarity.id))) {
      return false
    }
    
    // 検索条件
    if (searchTerm && !(
      card.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      card.cardNumber.toLowerCase().includes(searchTerm.toLowerCase())
    )) {
      return false
    }
    
    // レアリティフィルタ
    if (selectedRarity !== 'all' && String(card.rarity?.id) !== selectedRarity) {
      return false
    }
    
    return true
  })

  // 選択されたカード
  const selectedCards = packCards.filter(card => customCardIds.has(card.id))

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    )
  }

  if (!pack) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600 dark:text-gray-400">パック情報が見つかりません</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <Link href="/admin/packs">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              弾管理へ戻る
            </Button>
          </Link>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mt-4">
            {pack.name} - カスタムカード設定
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
            「その他（R以下）」に表示するカードを選択
          </p>
        </div>
      </div>

      {/* 説明 */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          ここで選択したカードは、ユーザーの価格入力画面で「その他（R以下）」セクションに表示されます。
          {displayRarityIds.length > 0 
            ? "表示レアリティに設定されていないレアリティのカードから、値段がつきやすいカードを選択してください。"
            : "表示レアリティが設定されていないため、すべてのカードが対象です。値段がつきやすいカードを選択してください。"}
        </p>
      </div>

      {/* 選択されたカード */}
      {selectedCards.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            選択中のカード（{selectedCards.length}枚）
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {selectedCards.map(card => (
              <div
                key={card.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded"
              >
                <div className="flex items-center space-x-2">
                  <span
                    className="inline-flex px-2 py-1 text-xs font-semibold rounded-full text-white"
                    style={{ backgroundColor: card.rarity?.color || '#6B7280' }}
                  >
                    {card.rarity?.name}
                  </span>
                  <span className="text-sm">
                    <span className="text-gray-500">{card.cardNumber}</span> {card.name}
                  </span>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => toggleCard(card.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* フィルター */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          フィルター
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              レアリティ
            </label>
            <select
              value={selectedRarity}
              onChange={(e) => setSelectedRarity(e.target.value)}
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm"
            >
              <option value="all">すべて</option>
              {rarities.filter(r => 
                // 表示レアリティに含まれないレアリティのみ表示
                displayRarityIds.length === 0 || !displayRarityIds.includes(r.id)
              ).map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              検索
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="カード名または番号"
                className="pl-10"
              />
            </div>
          </div>
        </div>
        {displayRarityIds.length > 0 && (
          <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              ※ 表示レアリティに設定されているカードは除外されています
            </p>
          </div>
        )}
      </div>

      {/* カード一覧 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          カード一覧（{filteredCards.length}件）
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
                  レアリティ
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredCards.map(card => (
                <tr key={card.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    {card.cardNumber}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                    {card.name}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span
                      className="inline-flex px-2 py-1 text-xs font-semibold rounded-full text-white"
                      style={{ backgroundColor: card.rarity?.color || '#6B7280' }}
                    >
                      {card.rarity?.name}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <Button
                      size="sm"
                      variant={customCardIds.has(card.id) ? "secondary" : "outline"}
                      onClick={() => toggleCard(card.id)}
                    >
                      {customCardIds.has(card.id) ? (
                        <>
                          <X className="h-4 w-4 mr-1" />
                          選択解除
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-1" />
                          選択
                        </>
                      )}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 保存ボタン */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saving}
          size="lg"
        >
          {saving ? (
            <>
              <LoadingSpinner size="sm" className="mr-2" />
              保存中...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              設定を保存
            </>
          )}
        </Button>
      </div>
    </div>
  )
}