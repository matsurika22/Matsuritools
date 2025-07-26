'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase/client'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

interface PageProps {
  params: { packId: string }
}

interface Pack {
  id: string
  name: string
  display_rarity_ids?: string[]
}

interface Rarity {
  id: string
  name: string
  display_name: string
  color: string
  display_order: number
}

export default function DisplayRaritiesPage({ params }: PageProps) {
  const [pack, setPack] = useState<Pack | null>(null)
  const [rarities, setRarities] = useState<Rarity[]>([])
  const [displayRarityIds, setDisplayRarityIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  const loadPackAndRarities = useCallback(async () => {
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
      
      // 表示レアリティIDを取得（カラムが存在する場合）
      try {
        const { data: packWithDisplay } = await supabase
          .from('packs')
          .select('display_rarity_ids')
          .eq('id', params.packId)
          .single()
        
        if (packWithDisplay?.display_rarity_ids !== undefined) {
          console.log('Loaded display_rarity_ids:', packWithDisplay.display_rarity_ids)
          console.log('Types:', packWithDisplay.display_rarity_ids?.map((id: any) => ({ id, type: typeof id })))
          setDisplayRarityIds(new Set(packWithDisplay.display_rarity_ids || []))
        } else {
          console.log('No display_rarity_ids found for pack:', params.packId)
        }
      } catch (e) {
        console.log('display_rarity_ids column not available yet')
      }
      
      // 全レアリティを取得
      const { data: raritiesData, error: raritiesError } = await supabase
        .from('rarities')
        .select('*')
        .order('display_order')
      
      if (raritiesError) throw raritiesError
      console.log('Loaded rarities:', raritiesData?.map(r => ({ id: r.id, name: r.name, idType: typeof r.id })))
      setRarities(raritiesData || [])
      
    } catch (error) {
      console.error('Error loading data:', error)
      alert('データの取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }, [params.packId])

  useEffect(() => {
    loadPackAndRarities()
  }, [loadPackAndRarities])

  const handleSave = async () => {
    if (!pack) return

    try {
      setSaving(true)
      
      const rarityIdsArray = Array.from(displayRarityIds)
      console.log('Saving display_rarity_ids:', rarityIdsArray, 'for pack:', pack.id)
      
      const { error } = await supabase
        .from('packs')
        .update({
          display_rarity_ids: rarityIdsArray
        })
        .eq('id', pack.id)
      
      if (error) {
        console.error('Supabase error:', error)
        if (error.code === '42703') {
          alert('データベースの設定が必要です。管理者に以下のSQLの実行を依頼してください：\n\nALTER TABLE packs ADD COLUMN IF NOT EXISTS display_rarity_ids TEXT[] DEFAULT NULL;')
          return
        }
        alert(`データベースエラー: ${error.message}\nコード: ${error.code}`)
        return
      }
      
      alert('表示レアリティ設定を保存しました')
    } catch (error) {
      console.error('Error saving display rarities:', error)
      alert('保存に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  const toggleRarity = (rarityId: string) => {
    // 文字列として統一
    const stringId = String(rarityId)
    setDisplayRarityIds(prev => {
      const newSet = new Set(prev)
      if (newSet.has(stringId)) {
        newSet.delete(stringId)
      } else {
        newSet.add(stringId)
      }
      return newSet
    })
  }

  const selectAll = () => {
    setDisplayRarityIds(new Set(rarities.map(r => String(r.id))))
  }

  const deselectAll = () => {
    setDisplayRarityIds(new Set())
  }

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
            {pack.name} - 表示レアリティ設定
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
            買取金額入力画面に表示するレアリティを選択
          </p>
        </div>
      </div>

      {/* 説明 */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          ここで選択したレアリティは、ユーザーの価格入力画面で最初から表示されます。
          選択しなかったレアリティのカードは「その他」として表示されます。
          何も選択しない場合は、すべてのレアリティが表示されます。
        </p>
      </div>

      {/* 一括操作ボタン */}
      <div className="flex space-x-3">
        <Button
          variant="outline"
          size="sm"
          onClick={selectAll}
        >
          <Eye className="h-4 w-4 mr-1" />
          すべて選択
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={deselectAll}
        >
          <EyeOff className="h-4 w-4 mr-1" />
          すべて解除
        </Button>
      </div>

      {/* レアリティ一覧 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          レアリティ一覧
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {rarities.map(rarity => (
            <div
              key={rarity.id}
              className={`flex items-center justify-between p-3 rounded-lg border-2 cursor-pointer transition-all ${
                displayRarityIds.has(String(rarity.id))
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
              onClick={() => toggleRarity(rarity.id)}
            >
              <div className="flex items-center space-x-3">
                <span
                  className="inline-flex px-3 py-1 text-sm font-semibold rounded-full text-white"
                  style={{ backgroundColor: rarity.color }}
                >
                  {rarity.name}
                </span>
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {rarity.display_name}
                </span>
              </div>
              <div>
                {displayRarityIds.has(String(rarity.id)) ? (
                  <Eye className="h-5 w-5 text-blue-600" />
                ) : (
                  <EyeOff className="h-5 w-5 text-gray-400" />
                )}
              </div>
            </div>
          ))}
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