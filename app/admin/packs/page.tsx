'use client'

import { useEffect, useState } from 'react'
import { Package, Plus, Edit, Trash2, Search, Calendar, DollarSign, BarChart3, Settings, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getAllPacks, createPack, updatePack, deletePack, type AdminPack } from '@/lib/supabase/admin'
import { getUserErrorMessage } from '@/lib/utils/error-handler'
import { LoadingSpinner, LoadingTable } from '@/components/ui/loading-spinner'

export default function PacksPage() {
  const [packs, setPacks] = useState<AdminPack[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingPack, setEditingPack] = useState<AdminPack | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // フォーム用の状態
  const [formData, setFormData] = useState({
    name: '',
    release_date: '',
    box_price: '',
    packs_per_box: '',
    cards_per_pack: ''
  })

  useEffect(() => {
    loadPacks()
  }, [])

  const loadPacks = async () => {
    try {
      setLoading(true)
      setError(null)
      const packData = await getAllPacks()
      setPacks(packData)
    } catch (err) {
      const errorMessage = getUserErrorMessage(err, '弾一覧取得')
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (submitting) return

    try {
      setSubmitting(true)
      
      const packData = {
        name: formData.name,
        release_date: formData.release_date || undefined,
        box_price: formData.box_price ? Number(formData.box_price) : undefined,
        packs_per_box: formData.packs_per_box ? Number(formData.packs_per_box) : undefined,
        cards_per_pack: formData.cards_per_pack ? Number(formData.cards_per_pack) : undefined,
      }

      if (editingPack) {
        await updatePack(editingPack.id, packData)
      } else {
        await createPack(packData)
      }

      await loadPacks()
      resetForm()
    } catch (err) {
      const errorMessage = getUserErrorMessage(err, editingPack ? '弾更新' : '弾作成')
      alert(errorMessage)
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (pack: AdminPack) => {
    setEditingPack(pack)
    setFormData({
      name: pack.name,
      release_date: pack.release_date ? pack.release_date.split('T')[0] : '',
      box_price: pack.box_price?.toString() || '',
      packs_per_box: pack.packs_per_box?.toString() || '',
      cards_per_pack: pack.cards_per_pack?.toString() || ''
    })
    setShowCreateModal(true)
  }

  const handleDelete = async (pack: AdminPack) => {
    if (!confirm(`「${pack.name}」を削除しますか？この操作は取り消せません。`)) {
      return
    }

    try {
      await deletePack(pack.id)
      await loadPacks()
    } catch (err) {
      const errorMessage = getUserErrorMessage(err, '弾削除')
      alert(errorMessage)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      release_date: '',
      box_price: '',
      packs_per_box: '',
      cards_per_pack: ''
    })
    setEditingPack(null)
    setShowCreateModal(false)
  }

  const filteredPacks = packs.filter(pack =>
    pack.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            弾管理
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
            カードパックの弾情報を管理
          </p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
        >
          <Plus className="h-4 w-4 mr-2" />
          新しい弾を追加
        </Button>
      </div>

      {/* 検索 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="弾名で検索..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* 弾一覧 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 dark:text-gray-400 mt-2">読み込み中...</p>
          </div>
        ) : filteredPacks.length === 0 ? (
          <div className="p-8 text-center">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              {searchTerm ? '該当する弾が見つかりません' : '弾がまだ登録されていません'}
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
                      弾名
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      発売日
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      BOX価格
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      パック数/BOX
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      カード数/パック
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      状態
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      アクション
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredPacks.map((pack) => (
                    <tr key={pack.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Package className="h-5 w-5 text-gray-400 mr-3" />
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {pack.name}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              ID: {pack.id}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {pack.release_date 
                          ? new Date(pack.release_date).toLocaleDateString('ja-JP')
                          : '未設定'
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {pack.box_price ? `¥${pack.box_price.toLocaleString()}` : '未設定'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {pack.packs_per_box || '未設定'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {pack.cards_per_pack || '未設定'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          pack.is_active 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                        }`}>
                          {pack.is_active ? 'アクティブ' : '無効'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <Button
                          onClick={() => handleEdit(pack)}
                          size="sm"
                          variant="outline"
                          title="編集"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={() => window.location.href = `/admin/packs/${pack.id}/rarities`}
                          size="sm"
                          variant="outline"
                          title="封入率設定"
                        >
                          <BarChart3 className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={() => window.location.href = `/admin/packs/${pack.id}/display-rarities`}
                          size="sm"
                          variant="outline"
                          title="表示レアリティ設定"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={() => window.location.href = `/admin/packs/${pack.id}/custom-cards`}
                          size="sm"
                          variant="outline"
                          title="カスタムカード設定"
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={() => handleDelete(pack)}
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:text-red-700"
                          title="削除"
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
              {filteredPacks.map((pack) => (
                <div key={pack.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start">
                      <Package className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {pack.name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {pack.release_date 
                            ? new Date(pack.release_date).toLocaleDateString('ja-JP')
                            : '発売日未設定'
                          }
                        </div>
                      </div>
                    </div>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      pack.is_active 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                    }`}>
                      {pack.is_active ? 'アクティブ' : '無効'}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">BOX価格:</span>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {pack.box_price ? `¥${pack.box_price.toLocaleString()}` : '未設定'}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">パック数:</span>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {pack.packs_per_box || '未設定'}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">カード数/パック:</span>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {pack.cards_per_pack || '未設定'}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">ID:</span>
                      <div className="font-mono text-xs text-gray-900 dark:text-white">
                        {pack.id}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => handleEdit(pack)}
                      size="sm"
                      variant="outline"
                      className="flex-1"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      編集
                    </Button>
                    <Button
                      onClick={() => handleDelete(pack)}
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

      {/* 作成/編集モーダル */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              {editingPack ? '弾を編集' : '新しい弾を追加'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  弾名 *
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="例: 24EX1 十王篇 第1弾"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  発売日
                </label>
                <Input
                  type="date"
                  value={formData.release_date}
                  onChange={(e) => setFormData({...formData, release_date: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  BOX価格 (円)
                </label>
                <Input
                  type="number"
                  value={formData.box_price}
                  onChange={(e) => setFormData({...formData, box_price: e.target.value})}
                  placeholder="例: 10800"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  パック数/BOX
                </label>
                <Input
                  type="number"
                  value={formData.packs_per_box}
                  onChange={(e) => setFormData({...formData, packs_per_box: e.target.value})}
                  placeholder="例: 24"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  カード数/パック
                </label>
                <Input
                  type="number"
                  value={formData.cards_per_pack}
                  onChange={(e) => setFormData({...formData, cards_per_pack: e.target.value})}
                  placeholder="例: 11"
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
                  disabled={submitting || !formData.name}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  {submitting ? '保存中...' : (editingPack ? '更新' : '作成')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}