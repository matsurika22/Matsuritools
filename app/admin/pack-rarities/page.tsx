'use client'

import { useEffect, useState } from 'react'
import { Package, Sparkles, Save, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { supabase } from '@/lib/supabase/client'

interface PackRarity {
  id: number
  pack_id: string
  rarity_id: number
  cards_per_box: number
  notes?: string
  pack?: { name: string }
  rarity?: { name: string; color: string; display_order: number }
  // ビューから取得する計算値
  total_types?: number
  rate_per_card?: number
}

export default function PackRaritiesPage() {
  const [packRarities, setPackRarities] = useState<PackRarity[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editedValues, setEditedValues] = useState<Record<number, { cards_per_box: string; notes: string }>>({})

  useEffect(() => {
    loadPackRarities()
  }, [])

  const loadPackRarities = async () => {
    try {
      setLoading(true)
      // pack_rarity_detailsビューから取得
      const { data, error } = await supabase
        .from('pack_rarity_details')
        .select('*')
        .order('pack_name, display_order')

      if (error) throw error
      
      // データを整形
      const formattedData = data?.map(item => ({
        id: item.id,
        pack_id: item.pack_id,
        rarity_id: item.rarity_id,
        cards_per_box: item.cards_per_box,
        notes: item.notes,
        pack: { name: item.pack_name },
        rarity: { 
          name: item.rarity_name, 
          color: item.rarity_color,
          display_order: item.display_order
        },
        total_types: item.total_types,
        rate_per_card: item.rate_per_card
      })) || []
      
      setPackRarities(formattedData)
    } catch (error) {
      console.error('Error loading pack rarities:', error)
      alert('封入率データの取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (id: number, field: 'cards_per_box' | 'notes', value: string) => {
    setEditedValues(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value
      }
    }))
  }

  const handleSave = async (packRarity: PackRarity) => {
    const edited = editedValues[packRarity.id]
    if (!edited) return

    try {
      setSaving(true)
      const updates: any = {}
      
      if (edited.cards_per_box !== undefined) {
        updates.cards_per_box = parseFloat(edited.cards_per_box)
      }
      
      if (edited.notes !== undefined) {
        updates.notes = edited.notes
      }

      const { error } = await supabase
        .from('pack_rarities')
        .update(updates)
        .eq('id', packRarity.id)

      if (error) throw error

      alert('封入率を更新しました')
      await loadPackRarities()
      
      // 編集値をクリア
      setEditedValues(prev => {
        const newValues = { ...prev }
        delete newValues[packRarity.id]
        return newValues
      })
    } catch (error) {
      console.error('Error updating pack rarity:', error)
      alert('封入率の更新に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  const getValue = (packRarity: PackRarity, field: 'cards_per_box' | 'notes') => {
    const edited = editedValues[packRarity.id]
    if (edited && edited[field] !== undefined) {
      return edited[field]
    }
    return field === 'cards_per_box' ? packRarity.cards_per_box.toString() : (packRarity.notes || '')
  }

  const hasChanges = (packRarity: PackRarity) => {
    const edited = editedValues[packRarity.id]
    if (!edited) return false
    
    return (
      (edited.cards_per_box !== undefined && parseFloat(edited.cards_per_box) !== packRarity.cards_per_box) ||
      (edited.notes !== undefined && edited.notes !== (packRarity.notes || ''))
    )
  }

  // 弾ごとにグループ化
  const groupedByPack = packRarities.reduce((acc, pr) => {
    const packName = pr.pack?.name || 'Unknown'
    if (!acc[packName]) acc[packName] = []
    acc[packName].push(pr)
    return acc
  }, {} as Record<string, PackRarity[]>)

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            封入率管理
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
            弾×レアリティごとの封入率を管理
          </p>
        </div>
      </div>

      {/* 説明 */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
          <div className="text-sm text-blue-800 dark:text-blue-200">
            <p className="font-semibold mb-1">封入率の設定方法</p>
            <ul className="list-disc list-inside space-y-1">
              <li>「BOX排出枚数」: 1BOXあたりに入っている枚数（例：SR 4枚）</li>
              <li>「1種あたり」: 自動計算される各カードの封入率</li>
              <li>「特記事項」: 特殊な排出パターンなどを記載</li>
            </ul>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 dark:text-gray-400 mt-2">読み込み中...</p>
        </div>
      ) : Object.keys(groupedByPack).length === 0 ? (
        <div className="p-8 text-center">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            封入率データがありません
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedByPack).map(([packName, rarities]) => (
            <div key={packName} className="bg-white dark:bg-gray-800 rounded-lg shadow">
              {/* 弾名 */}
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                  <Package className="h-5 w-5 mr-2" />
                  {packName}
                </h2>
              </div>

              {/* テーブル */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        レアリティ
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        全種類数
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        BOX排出枚数
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        1種あたり
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        特記事項
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        アクション
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {rarities.map((pr) => (
                      <tr key={pr.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span 
                            className="inline-flex px-2 py-1 text-xs font-semibold rounded-full text-white"
                            style={{ backgroundColor: pr.rarity?.color || '#6B7280' }}
                          >
                            {pr.rarity?.name}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {pr.total_types || 0}種類
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Input
                            type="number"
                            step="0.0001"
                            value={getValue(pr, 'cards_per_box')}
                            onChange={(e) => handleInputChange(pr.id, 'cards_per_box', e.target.value)}
                            className="w-24"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {(pr.rate_per_card || 0).toFixed(4)}枚
                        </td>
                        <td className="px-6 py-4">
                          <Input
                            value={getValue(pr, 'notes')}
                            onChange={(e) => handleInputChange(pr.id, 'notes', e.target.value)}
                            placeholder="例：SR以上確定パック"
                            className="w-full"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Button
                            onClick={() => handleSave(pr)}
                            disabled={!hasChanges(pr) || saving}
                            size="sm"
                            className={hasChanges(pr) ? 'bg-blue-600 hover:bg-blue-700' : ''}
                          >
                            <Save className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 統計情報 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400">総レコード数</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {packRarities.length}
              </div>
            </div>
            <Sparkles className="h-8 w-8 text-gray-400" />
          </div>
        </div>
      </div>
    </div>
  )
}