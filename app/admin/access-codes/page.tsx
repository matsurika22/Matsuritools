'use client'

import { useEffect, useState } from 'react'
import { Key, Plus, Edit, Trash2, Search, Copy, Calendar, Package, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getAllAccessCodes, getAllPacks, createAccessCode } from '@/lib/supabase/admin'

interface AccessCode {
  code: string
  pack_id: string | null
  valid_from: string
  valid_until: string | null
  max_uses: number | null
  current_uses: number
  created_at: string
  pack?: { name: string }
}

interface Pack {
  id: string
  name: string
}

export default function AccessCodesPage() {
  const [accessCodes, setAccessCodes] = useState<AccessCode[]>([])
  const [packs, setPacks] = useState<Pack[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  // フォーム用の状態
  const [formData, setFormData] = useState({
    code: '',
    pack_id: '',
    valid_from: '',
    valid_until: '',
    max_uses: ''
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [accessCodeData, packData] = await Promise.all([
        getAllAccessCodes(),
        getAllPacks()
      ])
      setAccessCodes(accessCodeData)
      setPacks(packData)
    } catch (error) {
      console.error('Error loading data:', error)
      alert('データの取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const generateRandomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    const segments = []
    
    // 4文字-4文字-4文字の形式で生成
    for (let i = 0; i < 3; i++) {
      let segment = ''
      for (let j = 0; j < 4; j++) {
        segment += chars.charAt(Math.floor(Math.random() * chars.length))
      }
      segments.push(segment)
    }
    
    return segments.join('-')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (submitting) return

    try {
      setSubmitting(true)
      
      const accessCodeData = {
        code: formData.code,
        pack_id: formData.pack_id || undefined,
        valid_from: formData.valid_from,
        valid_until: formData.valid_until || undefined,
        max_uses: formData.max_uses ? Number(formData.max_uses) : undefined
      }

      await createAccessCode(accessCodeData)
      alert('アクセスコードを作成しました')
      await loadData()
      resetForm()
    } catch (error) {
      console.error('Error creating access code:', error)
      alert('アクセスコードの作成に失敗しました')
    } finally {
      setSubmitting(false)
    }
  }

  const copyToClipboard = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code)
      setCopiedCode(code)
      setTimeout(() => setCopiedCode(null), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      code: '',
      pack_id: '',
      valid_from: '',
      valid_until: '',
      max_uses: ''
    })
    setShowCreateModal(false)
  }

  const isExpired = (validUntil: string | null) => {
    if (!validUntil) return false
    return new Date(validUntil) < new Date()
  }

  const isExhausted = (currentUses: number, maxUses: number | null) => {
    if (!maxUses) return false
    return currentUses >= maxUses
  }

  const getStatusBadge = (accessCode: AccessCode) => {
    const expired = isExpired(accessCode.valid_until)
    const exhausted = isExhausted(accessCode.current_uses, accessCode.max_uses)
    
    if (expired) {
      return <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300">期限切れ</span>
    }
    if (exhausted) {
      return <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300">使用上限</span>
    }
    return <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300">有効</span>
  }

  const filteredAccessCodes = accessCodes.filter(accessCode =>
    accessCode.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (accessCode.pack?.name && accessCode.pack.name.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            アクセスコード管理
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
            ユーザーアクセス用のコード管理
          </p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
        >
          <Plus className="h-4 w-4 mr-2" />
          新しいコードを発行
        </Button>
      </div>

      {/* 検索 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="コードまたは弾名で検索..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* アクセスコード一覧 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 dark:text-gray-400 mt-2">読み込み中...</p>
          </div>
        ) : filteredAccessCodes.length === 0 ? (
          <div className="p-8 text-center">
            <Key className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              {searchTerm ? '該当するアクセスコードが見つかりません' : 'アクセスコードがまだ発行されていません'}
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
                      アクセスコード
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      対象弾
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      使用状況
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      有効期限
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
                  {filteredAccessCodes.map((accessCode) => (
                    <tr key={accessCode.code} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Key className="h-5 w-5 text-gray-400 mr-3" />
                          <div>
                            <div className="text-sm font-mono font-medium text-gray-900 dark:text-white">
                              {accessCode.code}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {new Date(accessCode.created_at).toLocaleDateString('ja-JP')} 作成
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {accessCode.pack?.name || '全弾対応'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        <div className="flex items-center">
                          <Users className="h-4 w-4 text-gray-400 mr-1" />
                          {accessCode.current_uses}
                          {accessCode.max_uses && ` / ${accessCode.max_uses}`}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {accessCode.valid_until
                          ? new Date(accessCode.valid_until).toLocaleDateString('ja-JP')
                          : '無期限'
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(accessCode)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Button
                          onClick={() => copyToClipboard(accessCode.code)}
                          size="sm"
                          variant="outline"
                          className={copiedCode === accessCode.code ? 'bg-green-50 border-green-200' : ''}
                        >
                          <Copy className="h-4 w-4" />
                          {copiedCode === accessCode.code ? 'コピー済み' : 'コピー'}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* モバイル・タブレット表示 */}
            <div className="lg:hidden space-y-4">
              {filteredAccessCodes.map((accessCode) => (
                <div key={accessCode.code} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start flex-1">
                      <Key className="h-5 w-5 text-gray-400 mr-3 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-mono font-medium text-gray-900 dark:text-white break-all">
                          {accessCode.code}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {new Date(accessCode.created_at).toLocaleDateString('ja-JP')} 作成
                        </div>
                      </div>
                    </div>
                    <div className="ml-2 flex-shrink-0">
                      {getStatusBadge(accessCode)}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">対象弾:</span>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {accessCode.pack?.name || '全弾対応'}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">使用状況:</span>
                      <div className="font-medium text-gray-900 dark:text-white flex items-center">
                        <Users className="h-3 w-3 text-gray-400 mr-1" />
                        {accessCode.current_uses}
                        {accessCode.max_uses && ` / ${accessCode.max_uses}`}
                      </div>
                    </div>
                    <div className="col-span-2">
                      <span className="text-gray-500 dark:text-gray-400">有効期限:</span>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {accessCode.valid_until
                          ? new Date(accessCode.valid_until).toLocaleDateString('ja-JP')
                          : '無期限'
                        }
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={() => copyToClipboard(accessCode.code)}
                    size="sm"
                    variant="outline"
                    className={`w-full ${copiedCode === accessCode.code ? 'bg-green-50 border-green-200' : ''}`}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    {copiedCode === accessCode.code ? 'コピー済み' : 'コードをコピー'}
                  </Button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* 統計情報 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">総コード数</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {accessCodes.length}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">有効コード</div>
          <div className="text-2xl font-bold text-green-600">
            {accessCodes.filter(code => 
              !isExpired(code.valid_until) && !isExhausted(code.current_uses, code.max_uses)
            ).length}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">期限切れ</div>
          <div className="text-2xl font-bold text-red-600">
            {accessCodes.filter(code => isExpired(code.valid_until)).length}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">総使用回数</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {accessCodes.reduce((sum, code) => sum + code.current_uses, 0)}
          </div>
        </div>
      </div>

      {/* 作成モーダル */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              新しいアクセスコードを発行
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  アクセスコード *
                </label>
                <div className="flex gap-2">
                  <Input
                    value={formData.code}
                    onChange={(e) => setFormData({...formData, code: e.target.value})}
                    placeholder="XXXX-XXXX-XXXX"
                    required
                  />
                  <Button
                    type="button"
                    onClick={() => setFormData({...formData, code: generateRandomCode()})}
                    variant="outline"
                    size="sm"
                  >
                    生成
                  </Button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  対象弾
                </label>
                <select
                  value={formData.pack_id}
                  onChange={(e) => setFormData({...formData, pack_id: e.target.value})}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm"
                >
                  <option value="">全弾対応</option>
                  {packs.map(pack => (
                    <option key={pack.id} value={pack.id}>{pack.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  有効開始日 *
                </label>
                <Input
                  type="datetime-local"
                  value={formData.valid_from}
                  onChange={(e) => setFormData({...formData, valid_from: e.target.value})}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  有効終了日
                </label>
                <Input
                  type="datetime-local"
                  value={formData.valid_until}
                  onChange={(e) => setFormData({...formData, valid_until: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  最大使用回数
                </label>
                <Input
                  type="number"
                  value={formData.max_uses}
                  onChange={(e) => setFormData({...formData, max_uses: e.target.value})}
                  placeholder="例: 100（未入力で無制限）"
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
                  disabled={submitting || !formData.code || !formData.valid_from}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  {submitting ? '作成中...' : '作成'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}