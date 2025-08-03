'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Info, Package, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { supabase } from '@/lib/supabase/client'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

interface PageProps {
  params: { packId: string }
}

interface PackRarity {
  id: number
  pack_id: string
  rarity_id: number
  cards_per_box: number
  cards_per_box_reprint?: number
  notes?: string
  notes_reprint?: string
  box_input_x?: string
  box_input_y?: string
  box_input_x_reprint?: string
  box_input_y_reprint?: string
  rarity?: { 
    name: string
    color: string
    display_order: number
  }
  total_types?: number
  total_types_new?: number
  total_types_reprint?: number
  rate_per_card?: number
  rate_per_card_new?: number
  rate_per_card_reprint?: number
}

interface Pack {
  id: string
  name: string
  box_price?: number
}

interface AvailablePack {
  id: string
  name: string
}

export default function PackRaritiesPage({ params }: PageProps) {
  const [pack, setPack] = useState<Pack | null>(null)
  const [packRarities, setPackRarities] = useState<PackRarity[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editedValues, setEditedValues] = useState<Record<number, { 
    cards_per_box: string; 
    cards_per_box_reprint: string; 
    notes: string; 
    notes_reprint: string; 
  }>>({})
  const [boxInputs, setBoxInputs] = useState<Record<number, { 
    boxes: string; 
    cards: string; 
    boxes_reprint: string; 
    cards_reprint: string; 
  }>>({})
  const [availablePacks, setAvailablePacks] = useState<AvailablePack[]>([])
  const [showCopyModal, setShowCopyModal] = useState(false)

  const loadPackAndRarities = useCallback(async () => {
    try {
      setLoading(true)
      
      // パック情報を取得
      const { data: packData, error: packError } = await supabase
        .from('packs')
        .select('id, name, box_price')
        .eq('id', params.packId)
        .single()
      
      if (packError) throw packError
      setPack(packData)
      
      // pack_raritiesとcardsデータを別々に取得して計算
      const { data: packRarityData, error: packRarityError } = await supabase
        .from('pack_rarities')
        .select(`
          id, pack_id, rarity_id, cards_per_box, notes, box_input_x, box_input_y,
          cards_per_box_reprint, notes_reprint, box_input_x_reprint, box_input_y_reprint,
          rarities (name, color, display_order)
        `)
        .eq('pack_id', params.packId)
        .order('rarities(display_order)')

      if (packRarityError) throw packRarityError

      // そのパックのカードデータを取得
      const { data: cardsData, error: cardsError } = await supabase
        .from('cards')
        .select('id, rarity_id, parameters')
        .eq('pack_id', params.packId)

      if (cardsError) throw cardsError

      // レアリティごとにカード数を計算
      const cardsByRarity = new Map<number, { total: number, new: number, reprint: number }>()
      cardsData?.forEach(card => {
        const rarityId = card.rarity_id
        if (!cardsByRarity.has(rarityId)) {
          cardsByRarity.set(rarityId, { total: 0, new: 0, reprint: 0 })
        }
        const counts = cardsByRarity.get(rarityId)!
        counts.total++
        if (card.parameters?.reprint_flag) {
          counts.reprint++
        } else {
          counts.new++
        }
      })

      // データを整形（カードが存在するレアリティのみ）
      const formattedData = packRarityData?.map(item => {
        const counts = cardsByRarity.get(item.rarity_id) || { total: 0, new: 0, reprint: 0 }
        return {
          id: item.id,
          pack_id: item.pack_id,
          rarity_id: item.rarity_id,
          cards_per_box: item.cards_per_box || 0,
          cards_per_box_reprint: item.cards_per_box_reprint || 0,
          notes: item.notes,
          notes_reprint: item.notes_reprint,
          box_input_x: item.box_input_x,
          box_input_y: item.box_input_y,
          box_input_x_reprint: item.box_input_x_reprint,
          box_input_y_reprint: item.box_input_y_reprint,
          rarity: { 
            name: item.rarities?.name || 'Unknown', 
            color: item.rarities?.color || '#808080',
            display_order: item.rarities?.display_order || 999
          },
          total_types: counts.total,
          total_types_new: counts.new,
          total_types_reprint: counts.reprint,
          rate_per_card: counts.total > 0 ? (item.cards_per_box + (item.cards_per_box_reprint || 0)) / counts.total : 0,
          rate_per_card_new: counts.new > 0 ? item.cards_per_box / counts.new : 0,
          rate_per_card_reprint: counts.reprint > 0 ? (item.cards_per_box_reprint || 0) / counts.reprint : 0
        }
      })
      .filter(item => item.total_types > 0) // カードが存在するレアリティのみ表示
       || []
      
      setPackRarities(formattedData)
      
      // 既存のcards_per_boxからboxInputsを初期化
      const initialBoxInputs: Record<number, { 
        boxes: string; 
        cards: string; 
        boxes_reprint: string; 
        cards_reprint: string; 
      }> = {}
      
      formattedData.forEach(pr => {
        const boxInput = {
          boxes: '1',
          cards: '0',
          boxes_reprint: '1',
          cards_reprint: '0'
        }
        
        // 新規枠の設定
        if (pr.box_input_x && pr.box_input_y) {
          boxInput.boxes = Math.floor(parseFloat(pr.box_input_x) || 1).toString()
          boxInput.cards = Math.floor(parseFloat(pr.box_input_y) || 0).toString()
        } else {
          const cardsPerBox = pr.cards_per_box || 0
          if (cardsPerBox > 0) {
            boxInput.boxes = '1'
            boxInput.cards = Math.floor(cardsPerBox).toString()
          }
        }
        
        // 再録枠の設定
        if (pr.box_input_x_reprint && pr.box_input_y_reprint) {
          boxInput.boxes_reprint = Math.floor(parseFloat(pr.box_input_x_reprint) || 1).toString()
          boxInput.cards_reprint = Math.floor(parseFloat(pr.box_input_y_reprint) || 0).toString()
        } else {
          const cardsPerBoxReprint = pr.cards_per_box_reprint || 0
          if (cardsPerBoxReprint > 0) {
            boxInput.boxes_reprint = '1'
            boxInput.cards_reprint = Math.floor(cardsPerBoxReprint).toString()
          }
        }
        
        initialBoxInputs[pr.id] = boxInput
      })
      
      setBoxInputs(initialBoxInputs)
    } catch (error) {
      console.error('Error loading pack rarities:', error)
      alert('封入率データの取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }, [params.packId])

  useEffect(() => {
    loadPackAndRarities()
    // 他の弾一覧を取得
    loadAvailablePacks()
  }, [loadPackAndRarities])

  const loadAvailablePacks = async () => {
    try {
      const { data, error } = await supabase
        .from('packs')
        .select('id, name')
        .neq('id', params.packId)
        .order('name')

      if (error) throw error
      setAvailablePacks(data || [])
    } catch (error) {
      console.error('Error loading available packs:', error)
    }
  }

  const handleInputChange = (id: number, field: 'cards_per_box' | 'cards_per_box_reprint' | 'notes' | 'notes_reprint', value: string) => {
    setEditedValues(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value
      }
    }))
  }

  const handleBoxInputChange = (id: number, field: 'boxes' | 'cards' | 'boxes_reprint' | 'cards_reprint', value: string) => {
    // 整数のみ許可（小数点を含む値は整数に変換）
    const intValue = value === '' ? '' : Math.floor(parseFloat(value) || 0).toString()
    
    const newBoxInputs = {
      ...boxInputs,
      [id]: {
        ...boxInputs[id],
        [field]: intValue
      }
    }
    setBoxInputs(newBoxInputs)
    
    // xBOXにy枚から1BOXあたりの枚数を計算
    const input = newBoxInputs[id]
    
    // 新規枠の計算
    if (field === 'boxes' || field === 'cards') {
      if (input && input.boxes && input.cards) {
        const boxes = parseInt(input.boxes)
        const cards = parseInt(input.cards)
        if (boxes > 0 && !isNaN(cards)) {
          const cardsPerBox = cards / boxes
          handleInputChange(id, 'cards_per_box', cardsPerBox.toString())
        }
      }
    }
    
    // 再録枠の計算
    if (field === 'boxes_reprint' || field === 'cards_reprint') {
      if (input && input.boxes_reprint && input.cards_reprint) {
        const boxes = parseInt(input.boxes_reprint)
        const cards = parseInt(input.cards_reprint)
        if (boxes > 0 && !isNaN(cards)) {
          const cardsPerBox = cards / boxes
          handleInputChange(id, 'cards_per_box_reprint', cardsPerBox.toString())
        }
      }
    }
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
      
      if (edited.cards_per_box_reprint !== undefined) {
        updates.cards_per_box_reprint = parseFloat(edited.cards_per_box_reprint)
      }
      
      if (edited.notes !== undefined) {
        updates.notes = edited.notes
      }
      
      if (edited.notes_reprint !== undefined) {
        updates.notes_reprint = edited.notes_reprint
      }

      // boxInputsの値も一緒に保存
      const boxInput = boxInputs[packRarity.id]
      if (boxInput) {
        updates.box_input_x = boxInput.boxes
        updates.box_input_y = boxInput.cards
        updates.box_input_x_reprint = boxInput.boxes_reprint
        updates.box_input_y_reprint = boxInput.cards_reprint
      }

      const { data, error } = await supabase
        .from('pack_rarities')
        .update(updates)
        .eq('id', packRarity.id)
        .select()

      if (error) throw error

      alert('封入率を更新しました')
      await loadPackAndRarities()
      
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

  const handleSaveAll = async () => {
    const hasAnyChanges = Object.keys(editedValues).some(id => {
      const packRarity = packRarities.find(pr => pr.id === parseInt(id))
      return packRarity && hasChanges(packRarity)
    })

    if (!hasAnyChanges) {
      alert('変更がありません')
      return
    }

    try {
      setSaving(true)
      let successCount = 0
      let errorCount = 0

      // 変更があるものすべてを更新
      for (const [id, edited] of Object.entries(editedValues)) {
        const packRarity = packRarities.find(pr => pr.id === parseInt(id))
        if (!packRarity || !hasChanges(packRarity)) continue

        const updates: any = {}
        
        if (edited.cards_per_box !== undefined) {
          updates.cards_per_box = parseFloat(edited.cards_per_box)
        }
        
        if (edited.cards_per_box_reprint !== undefined) {
          updates.cards_per_box_reprint = parseFloat(edited.cards_per_box_reprint)
        }
        
        if (edited.notes !== undefined) {
          updates.notes = edited.notes
        }
        
        if (edited.notes_reprint !== undefined) {
          updates.notes_reprint = edited.notes_reprint
        }

        // boxInputsの値も一緒に保存
        const boxInput = boxInputs[parseInt(id)]
        if (boxInput) {
          updates.box_input_x = boxInput.boxes
          updates.box_input_y = boxInput.cards
          updates.box_input_x_reprint = boxInput.boxes_reprint
          updates.box_input_y_reprint = boxInput.cards_reprint
        }

        const { error } = await supabase
          .from('pack_rarities')
          .update(updates)
          .eq('id', parseInt(id))

        if (error) {
          console.error(`Error updating ${packRarity.rarity?.name}:`, error)
          errorCount++
        } else {
          successCount++
        }
      }

      if (errorCount > 0) {
        alert(`${successCount}件更新成功、${errorCount}件エラーが発生しました`)
      } else {
        alert(`${successCount}件の封入率を更新しました`)
      }

      await loadPackAndRarities()
      setEditedValues({})
    } catch (error) {
      console.error('Error updating pack rarities:', error)
      alert('封入率の更新に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  const getValue = (packRarity: PackRarity, field: 'cards_per_box' | 'cards_per_box_reprint' | 'notes' | 'notes_reprint') => {
    const edited = editedValues[packRarity.id]
    if (edited && edited[field] !== undefined) {
      return edited[field]
    }
    
    switch (field) {
      case 'cards_per_box':
        return packRarity.cards_per_box.toString()
      case 'cards_per_box_reprint':
        return (packRarity.cards_per_box_reprint || 0).toString()
      case 'notes':
        return packRarity.notes || ''
      case 'notes_reprint':
        return packRarity.notes_reprint || ''
      default:
        return ''
    }
  }

  // VRとSRのレアリティかどうかを判定
  const isReprintSeparated = (rarity: string) => {
    return rarity === 'VR' || rarity === 'SR'
  }

  const hasChanges = (packRarity: PackRarity) => {
    const edited = editedValues[packRarity.id]
    if (!edited) return false
    
    return (
      (edited.cards_per_box !== undefined && parseFloat(edited.cards_per_box) !== packRarity.cards_per_box) ||
      (edited.cards_per_box_reprint !== undefined && parseFloat(edited.cards_per_box_reprint) !== (packRarity.cards_per_box_reprint || 0)) ||
      (edited.notes !== undefined && edited.notes !== (packRarity.notes || '')) ||
      (edited.notes_reprint !== undefined && edited.notes_reprint !== (packRarity.notes_reprint || ''))
    )
  }

  // 初期データがない場合は作成
  const initializePackRarities = async () => {
    try {
      setSaving(true)
      
      // すべてのレアリティを取得
      const { data: rarities } = await supabase
        .from('rarities')
        .select('id, name')
        .order('display_order')
      
      if (!rarities) return
      
      // デフォルトの封入率
      const defaultRates: Record<string, number> = {
        'C': 50.0, 'U': 30.0, 'UC': 30.0, 'R': 8.0,
        'VR': 4.0, 'SR': 2.0, 'MR': 0.5, 'OR': 0.25,
        'DM': 0.125, 'DM㊙': 0.0625, '㊙': 0.5,
        'T': 3.0, 'TD': 0.5, 'SP': 0.5, 'TR': 1.0
      }
      
      // 各レアリティのデータを作成
      for (const rarity of rarities) {
        await supabase
          .from('pack_rarities')
          .upsert({
            pack_id: params.packId,
            rarity_id: rarity.id,
            cards_per_box: defaultRates[rarity.name] || 1.0,
            notes: ''
          }, {
            onConflict: 'pack_id,rarity_id'
          })
      }
      
      await loadPackAndRarities()
      alert('封入率の初期データを作成しました')
    } catch (error) {
      console.error('Error initializing pack rarities:', error)
      alert('初期データの作成に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  // 他の弾の設定をコピー
  const copyFromOtherPack = async (sourcePackId: string) => {
    try {
      setSaving(true)

      // コピー元の封入率データを取得
      const { data: sourceRarities, error: fetchError } = await supabase
        .from('pack_rarities')
        .select('rarity_id, cards_per_box, notes, box_input_x, box_input_y')
        .eq('pack_id', sourcePackId)

      if (fetchError) throw fetchError
      if (!sourceRarities || sourceRarities.length === 0) {
        alert('コピー元の弾に封入率データがありません')
        return
      }

      // コピー先に既存のデータがない場合は初期化
      if (packRarities.length === 0) {
        await initializePackRarities()
      }

      // 各レアリティの設定をコピー
      for (const sourceRarity of sourceRarities) {
        const { error: updateError } = await supabase
          .from('pack_rarities')
          .update({
            cards_per_box: sourceRarity.cards_per_box,
            notes: sourceRarity.notes,
            box_input_x: sourceRarity.box_input_x,
            box_input_y: sourceRarity.box_input_y
          })
          .eq('pack_id', params.packId)
          .eq('rarity_id', sourceRarity.rarity_id)

        if (updateError) {
          console.error('Error updating rarity:', updateError)
        }
      }

      await loadPackAndRarities()
      alert('封入率設定をコピーしました')
    } catch (error) {
      console.error('Error copying pack rarities:', error)
      alert('封入率設定のコピーに失敗しました')
    } finally {
      setSaving(false)
    }
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
            {pack.name} - 封入率設定
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
            各レアリティの1BOXあたりの排出枚数を設定
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
              <li>「BOX排出枚数」: 1BOXあたりに入っている枚数を設定</li>
              <li>「全種類数」: 登録されたカードから自動でカウント</li>
              <li>「1種あたり」: BOX排出枚数÷全種類数で自動計算</li>
              <li>C/UC以外は同じカードが重複しない前提で期待値を計算</li>
            </ul>
          </div>
        </div>
      </div>

      {/* アクションボタン */}
      <div className="flex justify-between items-center">
        {/* 他の弾からコピーボタン */}
        {availablePacks.length > 0 && (
          <div className="relative">
            <Button
              onClick={() => setShowCopyModal(!showCopyModal)}
              variant="outline"
              disabled={saving}
            >
              <Copy className="mr-2 h-4 w-4" />
              他の弾からコピー
            </Button>
            
            {/* コピー元選択モーダル */}
            {showCopyModal && (
              <div className="absolute top-full mt-2 left-0 z-10 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4">
                <h3 className="text-sm font-medium mb-3">コピー元の弾を選択</h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {availablePacks.map((availablePack) => (
                    <Button
                      key={availablePack.id}
                      onClick={() => {
                        copyFromOtherPack(availablePack.id)
                        setShowCopyModal(false)
                      }}
                      variant="ghost"
                      className="w-full justify-start text-sm"
                      disabled={saving}
                    >
                      {availablePack.name}
                    </Button>
                  ))}
                </div>
                <Button
                  onClick={() => setShowCopyModal(false)}
                  variant="ghost"
                  size="sm"
                  className="mt-3 w-full"
                >
                  キャンセル
                </Button>
              </div>
            )}
          </div>
        )}

        {/* 一括保存ボタン */}
        {packRarities.length > 0 && Object.keys(editedValues).length > 0 && (
          <Button
            onClick={handleSaveAll}
            disabled={saving || !Object.keys(editedValues).some(id => {
              const pr = packRarities.find(p => p.id === parseInt(id))
              return pr && hasChanges(pr)
            })}
            className="bg-blue-600 hover:bg-blue-700 ml-auto"
          >
            <Save className="mr-2 h-4 w-4" />
            変更をすべて保存
          </Button>
        )}
      </div>

      {/* 使い方の説明 */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-4 mb-4">
        <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
          封入率の入力方法
        </h3>
        <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
          <li>• 「xBOXにy枚」形式で入力すると、自動的に1BOXあたりの枚数を計算します</li>
          <li>• 例：2BOXに1枚 → 0.5枚/BOX、16BOXに1枚 → 0.0625枚/BOX</li>
          <li>• 1BOXあたりの枚数を直接編集することも可能です</li>
        </ul>
      </div>

      {packRarities.length === 0 ? (
        <div className="text-center py-8">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            封入率データがまだ設定されていません
          </p>
          <Button onClick={initializePackRarities} disabled={saving}>
            初期データを作成
          </Button>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  レアリティ
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <span className="hidden sm:inline">種類数</span>
                  <span className="sm:hidden">種類</span>
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <span className="hidden sm:inline">新規枠封入率</span>
                  <span className="sm:hidden">新規枠</span>
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <span className="hidden sm:inline">再録枠封入率</span>
                  <span className="sm:hidden">再録枠</span>
                </th>
                <th className="hidden sm:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  1種あたり
                </th>
                <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  特記事項
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  状態
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {packRarities.map((pr) => (
                <tr key={pr.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                    <span 
                      className="inline-flex px-2 py-1 text-xs font-semibold rounded-full text-white"
                      style={{ backgroundColor: pr.rarity?.color || '#6B7280' }}
                    >
                      {pr.rarity?.name}
                    </span>
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {isReprintSeparated(pr.rarity?.name || '') ? (
                      <div className="space-y-1">
                        <div><span className="hidden sm:inline">新規: {pr.total_types_new}種類</span><span className="sm:hidden">新:{pr.total_types_new}</span></div>
                        <div><span className="hidden sm:inline">再録: {pr.total_types_reprint}種類</span><span className="sm:hidden">再:{pr.total_types_reprint}</span></div>
                      </div>
                    ) : (
                      <div>
                        <span className="hidden sm:inline">{pr.total_types}種類</span>
                        <span className="sm:hidden">{pr.total_types}</span>
                      </div>
                    )}
                  </td>
                  <td className="px-3 sm:px-6 py-4">
                    {isReprintSeparated(pr.rarity?.name || '') ? (
                      // VR/SR: 新規枠と再録枠の両方を表示
                      <div className="flex flex-col space-y-3">
                        {/* 新規枠 */}
                        <div className="flex flex-col space-y-2">
                          <div className="text-xs font-medium text-gray-700 dark:text-gray-300">新規枠</div>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                            <div className="flex items-center space-x-1">
                              <Input
                                type="number"
                                value={boxInputs[pr.id]?.boxes || ''}
                                onChange={(e) => handleBoxInputChange(pr.id, 'boxes', e.target.value)}
                                placeholder="x"
                                className="w-16 sm:w-20 text-center text-sm sm:text-base [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                step="1"
                                min="1"
                                style={{ textAlign: 'center' }}
                              />
                              <span className="text-xs text-gray-500 whitespace-nowrap">BOXに</span>
                              <Input
                                type="number"
                                value={boxInputs[pr.id]?.cards || ''}
                                onChange={(e) => handleBoxInputChange(pr.id, 'cards', e.target.value)}
                                placeholder="y"
                                className="w-16 sm:w-20 text-center text-sm sm:text-base [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                step="1"
                                min="0"
                                style={{ textAlign: 'center' }}
                              />
                              <span className="text-xs text-gray-500">枚</span>
                            </div>
                            {/* スマホ用：現在の値を表示 */}
                            <div className="sm:hidden text-xs text-gray-600 dark:text-gray-400">
                              = {getValue(pr, 'cards_per_box')}枚/BOX
                            </div>
                          </div>
                        </div>
                        
                        {/* 再録枠 */}
                        <div className="flex flex-col space-y-2">
                          <div className="text-xs font-medium text-gray-700 dark:text-gray-300">再録枠</div>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                            <div className="flex items-center space-x-1">
                              <Input
                                type="number"
                                value={boxInputs[pr.id]?.boxes_reprint || ''}
                                onChange={(e) => handleBoxInputChange(pr.id, 'boxes_reprint', e.target.value)}
                                placeholder="x"
                                className="w-16 sm:w-20 text-center text-sm sm:text-base [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                step="1"
                                min="1"
                                style={{ textAlign: 'center' }}
                              />
                              <span className="text-xs text-gray-500 whitespace-nowrap">BOXに</span>
                              <Input
                                type="number"
                                value={boxInputs[pr.id]?.cards_reprint || ''}
                                onChange={(e) => handleBoxInputChange(pr.id, 'cards_reprint', e.target.value)}
                                placeholder="y"
                                className="w-16 sm:w-20 text-center text-sm sm:text-base [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                step="1"
                                min="0"
                                style={{ textAlign: 'center' }}
                              />
                              <span className="text-xs text-gray-500">枚</span>
                            </div>
                            {/* スマホ用：現在の値を表示 */}
                            <div className="sm:hidden text-xs text-gray-600 dark:text-gray-400">
                              = {getValue(pr, 'cards_per_box_reprint')}枚/BOX
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      // その他のレアリティ: 新規枠のみ表示
                      <div className="flex flex-col space-y-2">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                          <div className="flex items-center space-x-1">
                            <Input
                              type="number"
                              value={boxInputs[pr.id]?.boxes || ''}
                              onChange={(e) => handleBoxInputChange(pr.id, 'boxes', e.target.value)}
                              placeholder="x"
                              className="w-16 sm:w-20 text-center text-sm sm:text-base [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              step="1"
                              min="1"
                              style={{ textAlign: 'center' }}
                            />
                            <span className="text-xs text-gray-500 whitespace-nowrap">BOXに</span>
                            <Input
                              type="number"
                              value={boxInputs[pr.id]?.cards || ''}
                              onChange={(e) => handleBoxInputChange(pr.id, 'cards', e.target.value)}
                              placeholder="y"
                              className="w-16 sm:w-20 text-center text-sm sm:text-base [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              step="1"
                              min="0"
                              style={{ textAlign: 'center' }}
                            />
                            <span className="text-xs text-gray-500">枚</span>
                          </div>
                          {/* スマホ用：現在の値を表示 */}
                          <div className="sm:hidden text-xs text-gray-600 dark:text-gray-400">
                            = {getValue(pr, 'cards_per_box')}枚/BOX
                          </div>
                        </div>
                      </div>
                    )}
                    <input
                      type="hidden"
                      value={getValue(pr, 'cards_per_box')}
                    />
                    {isReprintSeparated(pr.rarity?.name || '') && (
                      <input
                        type="hidden"
                        value={getValue(pr, 'cards_per_box_reprint')}
                      />
                    )}
                  </td>
                  <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {pr.rate_per_card?.toFixed(4) || '0.0000'}枚
                  </td>
                  <td className="hidden md:table-cell px-6 py-4">
                    {isReprintSeparated(pr.rarity?.name || '') ? (
                      // VR/SR: 新規枠と再録枠の両方のメモ
                      <div className="flex flex-col space-y-2">
                        <div>
                          <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">新規枠メモ</div>
                          <Input
                            value={getValue(pr, 'notes')}
                            onChange={(e) => handleInputChange(pr.id, 'notes', e.target.value)}
                            placeholder="例：SR以上確定パック"
                            className="w-full"
                          />
                        </div>
                        <div>
                          <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">再録枠メモ</div>
                          <Input
                            value={getValue(pr, 'notes_reprint')}
                            onChange={(e) => handleInputChange(pr.id, 'notes_reprint', e.target.value)}
                            placeholder="例：再録確定パック"
                            className="w-full"
                          />
                        </div>
                      </div>
                    ) : (
                      // その他のレアリティ: 通常のメモのみ
                      <Input
                        value={getValue(pr, 'notes')}
                        onChange={(e) => handleInputChange(pr.id, 'notes', e.target.value)}
                        placeholder="例：SR以上確定パック"
                        className="w-full"
                      />
                    )}
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                    {hasChanges(pr) && (
                      <span className="text-xs text-orange-600 dark:text-orange-400">
                        ※未保存
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* BOX価格情報 */}
      {pack.box_price && (
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            BOX価格: <span className="font-bold text-gray-900 dark:text-white">¥{pack.box_price.toLocaleString()}</span>
          </p>
        </div>
      )}
    </div>
  )
}