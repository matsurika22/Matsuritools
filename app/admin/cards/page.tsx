'use client'

import { useEffect, useState } from 'react'
import { CreditCard, Plus, Edit, Trash2, Search, Filter, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  getAllCards, 
  getAllPacks, 
  getAllRarities, 
  createCard, 
  updateCard, 
  deleteCard, 
  type AdminCard 
} from '@/lib/supabase/admin'

interface Pack {
  id: string
  name: string
}

interface Rarity {
  id: string
  name: string
  color: string
}

export default function CardsPage() {
  const [cards, setCards] = useState<AdminCard[]>([])
  const [packs, setPacks] = useState<Pack[]>([])
  const [rarities, setRarities] = useState<Rarity[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [packFilter, setPackFilter] = useState<string>('all')
  const [rarityFilter, setRarityFilter] = useState<string>('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingCard, setEditingCard] = useState<AdminCard | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // フォーム用の状態
  const [formData, setFormData] = useState({
    pack_id: '',
    rarity_id: '',
    name: '',
    card_number: '',
    box_rate: ''
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      console.log('Loading cards data...')
      const [cardData, packData, rarityData] = await Promise.all([
        getAllCards().catch(err => {
          console.error('Failed to load cards:', err)
          return []
        }),
        getAllPacks().catch(err => {
          console.error('Failed to load packs:', err)
          return []
        }),
        getAllRarities().catch(err => {
          console.error('Failed to load rarities:', err)
          return []
        })
      ])
      console.log('Cards loaded:', cardData)
      setCards(cardData)
      setPacks(packData)
      setRarities(rarityData)
    } catch (error) {
      console.error('Error loading data:', error)
      alert('データの取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (submitting) return

    try {
      setSubmitting(true)
      
      const cardData = {
        pack_id: formData.pack_id,
        rarity_id: formData.rarity_id,
        name: formData.name,
        card_number: formData.card_number,
        box_rate: Number(formData.box_rate)
      }

      if (editingCard) {
        await updateCard(editingCard.id, cardData)
        alert('カードを更新しました')
      } else {
        await createCard(cardData)
        alert('カードを作成しました')
      }

      await loadData()
      resetForm()
    } catch (error) {
      console.error('Error saving card:', error)
      alert(editingCard ? 'カードの更新に失敗しました' : 'カードの作成に失敗しました')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (card: AdminCard) => {
    setEditingCard(card)
    setFormData({
      pack_id: card.pack_id,
      rarity_id: String(card.rarity_id),
      name: card.name,
      card_number: card.card_number || '',
      box_rate: (card.box_rate || 0).toString()
    })
    setShowCreateModal(true)
  }

  const handleDelete = async (card: AdminCard) => {
    if (!confirm(`「${card.name}」を削除しますか？この操作は取り消せません。`)) {
      return
    }

    try {
      await deleteCard(card.id)
      await loadData()
      alert('カードを削除しました')
    } catch (error) {
      console.error('Error deleting card:', error)
      alert('カードの削除に失敗しました')
    }
  }

  const resetForm = () => {
    setFormData({
      pack_id: '',
      rarity_id: '',
      name: '',
      card_number: '',
      box_rate: ''
    })
    setEditingCard(null)
    setShowCreateModal(false)
  }

  const filteredCards = cards.filter(card => {
    const matchesSearch = card.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (card.card_number || '').toLowerCase().includes(searchTerm.toLowerCase())
    const matchesPack = packFilter === 'all' || card.pack_id === packFilter
    const matchesRarity = rarityFilter === 'all' || card.rarity_id === rarityFilter
    return matchesSearch && matchesPack && matchesRarity
  })

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            カード管理
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
            カード情報と出現率の管理
          </p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
        >
          <Plus className="h-4 w-4 mr-2" />
          新しいカードを追加
        </Button>
      </div>

      {/* フィルターと検索 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div className="flex flex-col gap-4">
          {/* 検索 */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="カード名または番号で検索..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          {/* フィルター */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex items-center space-x-2 flex-1">
              <Package className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <select
                value={packFilter}
                onChange={(e) => setPackFilter(e.target.value)}
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm"
              >
                <option value="all">全ての弾</option>
                {packs.map(pack => (
                  <option key={pack.id} value={pack.id}>{pack.name}</option>
                ))}
              </select>
            </div>
            
            <div className="flex items-center space-x-2 flex-1">
              <Filter className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <select
                value={rarityFilter}
                onChange={(e) => setRarityFilter(e.target.value)}
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm"
              >
                <option value="all">全てのレアリティ</option>
                {rarities.map(rarity => (
                  <option key={rarity.id} value={rarity.id}>{rarity.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* カード一覧 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 dark:text-gray-400 mt-2">読み込み中...</p>
          </div>
        ) : filteredCards.length === 0 ? (
          <div className="p-8 text-center">
            <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              {searchTerm || packFilter !== 'all' || rarityFilter !== 'all' 
                ? '該当するカードが見つかりません' 
                : 'カードがまだ登録されていません'
              }
            </p>
          </div>
        ) : (
          <>
            {/* デスクトップ表示 */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      カード情報
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      弾
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      レアリティ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      買取価格
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      参考販売価格
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      アクション
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredCards.map((card) => (
                    <tr key={card.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <CreditCard className="h-5 w-5 text-gray-400 mr-3" />
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {card.name}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              #{card.card_number}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {card.pack?.name || '未設定'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {card.rarity && (
                          <span 
                            className="inline-flex px-2 py-1 text-xs font-semibold rounded-full text-white"
                            style={{ backgroundColor: card.rarity.color }}
                          >
                            {card.rarity.name}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {card.parameters?.buyback_price ? `¥${card.parameters.buyback_price.toLocaleString()}` : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {card.parameters?.reference_price ? `¥${card.parameters.reference_price.toLocaleString()}` : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <Button
                          onClick={() => handleEdit(card)}
                          size="sm"
                          variant="outline"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={() => handleDelete(card)}
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* モバイル・タブレット表示 */}
            <div className="lg:hidden space-y-4">
              {filteredCards.map((card) => (
                <div key={card.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start flex-1">
                      <CreditCard className="h-5 w-5 text-gray-400 mr-3 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {card.name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          #{card.card_number}
                        </div>
                      </div>
                    </div>
                    {card.rarity && (
                      <span 
                        className="inline-flex px-2 py-1 text-xs font-semibold rounded-full text-white ml-2 flex-shrink-0"
                        style={{ backgroundColor: card.rarity.color }}
                      >
                        {card.rarity.name}
                      </span>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">弾:</span>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {card.pack?.name || '未設定'}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">買取価格:</span>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {card.parameters?.buyback_price ? `¥${card.parameters.buyback_price.toLocaleString()}` : '-'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => handleEdit(card)}
                      size="sm"
                      variant="outline"
                      className="flex-1"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      編集
                    </Button>
                    <Button
                      onClick={() => handleDelete(card)}
                      size="sm"
                      variant="outline"
                      className="text-red-600 hover:text-red-700 flex-1"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      削除
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* 統計情報 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">総カード数</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {cards.length.toLocaleString()}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">弾数</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {packs.length}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">レアリティ数</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {rarities.length}
          </div>
        </div>
      </div>

      {/* 作成/編集モーダル */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              {editingCard ? 'カードを編集' : '新しいカードを追加'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  弾 *
                </label>
                <select
                  value={formData.pack_id}
                  onChange={(e) => setFormData({...formData, pack_id: e.target.value})}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm"
                  required
                >
                  <option value="">弾を選択...</option>
                  {packs.map(pack => (
                    <option key={pack.id} value={pack.id}>{pack.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  レアリティ *
                </label>
                <select
                  value={formData.rarity_id}
                  onChange={(e) => setFormData({...formData, rarity_id: e.target.value})}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm"
                  required
                >
                  <option value="">レアリティを選択...</option>
                  {rarities.map(rarity => (
                    <option key={rarity.id} value={rarity.id}>{rarity.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  カード名 *
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="例: 鬼丸「王」"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  カード番号 *
                </label>
                <Input
                  value={formData.card_number}
                  onChange={(e) => setFormData({...formData, card_number: e.target.value})}
                  placeholder="例: 24EX1-001"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  BOX出現率 *
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.box_rate}
                  onChange={(e) => setFormData({...formData, box_rate: e.target.value})}
                  placeholder="例: 1.5"
                  required
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                  disabled={submitting}
                  className="flex-1"
                >
                  キャンセル
                </Button>
                <Button
                  type="submit"
                  disabled={submitting || !formData.name || !formData.pack_id || !formData.rarity_id}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  {submitting ? '保存中...' : (editingCard ? '更新' : '作成')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}