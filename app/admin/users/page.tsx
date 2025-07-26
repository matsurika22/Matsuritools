'use client'

import { useState, useEffect } from 'react'
import { Users, UserCheck, UserX, Shield, Search, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getAllUsers, updateUserRole, type AdminUser } from '@/lib/supabase/admin'
import { getUserErrorMessage } from '@/lib/utils/error-handler'
import { LoadingSpinner, LoadingTable } from '@/components/ui/loading-spinner'
import { useMemoizedData } from '@/lib/hooks/use-memoized-data'
import { useDebounce, useDebouncedCallback } from '@/lib/hooks/use-debounce'
import { AvatarImage } from '@/components/ui/lazy-image'

const roleLabels = {
  user: '一般ユーザー',
  friend: '知り合い',
  admin: '管理者'
}

const roleColors = {
  user: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  friend: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
  admin: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
}

export default function UsersPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | 'user' | 'friend' | 'admin'>('all')
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null)
  
  // デバウンスされた検索キーワード
  const debouncedSearchTerm = useDebounce(searchTerm, 300)
  
  // メモ化されたユーザーデータ取得
  const {
    data: users,
    loading,
    error,
    refresh: refreshUsers
  } = useMemoizedData('admin-users', getAllUsers, {
    cacheTime: 2 * 60 * 1000, // 2分間キャッシュ
    dependencies: [] // ユーザーデータは外部要因で変わらない
  })

  const handleRoleChange = async (userId: string, newRole: 'user' | 'admin' | 'friend') => {
    try {
      setUpdatingUserId(userId)
      await updateUserRole(userId, newRole)
      
      // データを再取得
      await refreshUsers()
      
      // 成功メッセージは控えめに
    } catch (err) {
      const errorMessage = getUserErrorMessage(err, 'ロール更新')
      alert(errorMessage)
    } finally {
      setUpdatingUserId(null)
    }
  }

  const filteredUsers = (users || []).filter(user => {
    const searchLower = debouncedSearchTerm.toLowerCase()
    const matchesSearch = user.email.toLowerCase().includes(searchLower) || 
                         user.handle_name?.toLowerCase().includes(searchLower)
    const matchesRole = roleFilter === 'all' || user.role === roleFilter
    return matchesSearch && matchesRole
  })

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            ユーザー管理
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
            登録ユーザーの管理とロール変更
          </p>
        </div>
        <div className="flex items-center space-x-2 bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-lg">
          <Users className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {(users || []).length}人のユーザー
          </span>
        </div>
      </div>

      {/* フィルター */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="メールアドレスまたはHNで検索..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as any)}
              className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm"
            >
              <option value="all">全てのロール</option>
              <option value="user">一般ユーザー</option>
              <option value="friend">知り合い</option>
              <option value="admin">管理者</option>
            </select>
          </div>
        </div>
      </div>

      {/* ユーザー一覧 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-6">
            <LoadingTable rows={5} columns={4} />
          </div>
        ) : error ? (
          <div className="p-6">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-3">
                <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <span className="text-red-800 dark:text-red-200 font-medium">エラーが発生しました</span>
              </div>
              <p className="text-red-700 dark:text-red-300 text-sm mb-3">{error}</p>
              <button 
                onClick={refreshUsers}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium transition-colors"
              >
                再試行
              </button>
            </div>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-8 text-center">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              {searchTerm || roleFilter !== 'all' ? '該当するユーザーが見つかりません' : 'ユーザーがいません'}
            </p>
          </div>
        ) : (
          <>
            {/* デスクトップ表示 */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      ユーザー
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      ロール
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      登録日
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      アクション
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {user.email.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {user.handle_name || 'HN未設定'}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${roleColors[user.role]}`}>
                          {roleLabels[user.role]}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {new Date(user.created_at).toLocaleDateString('ja-JP')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <select
                          value={user.role}
                          onChange={(e) => handleRoleChange(user.id, e.target.value as any)}
                          disabled={updatingUserId === user.id}
                          className="rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-2 py-1 text-xs"
                        >
                          <option value="user">一般ユーザー</option>
                          <option value="friend">知り合い</option>
                          <option value="admin">管理者</option>
                        </select>
                        {updatingUserId === user.id && (
                          <div className="inline-flex ml-2">
                            <LoadingSpinner size="sm" />
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* モバイル表示 */}
            <div className="md:hidden space-y-3">
              {filteredUsers.map((user) => (
                <div key={user.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {user.email.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="ml-3 flex-1">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {user.handle_name || 'HN未設定'}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 break-all">
                          {user.email}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {new Date(user.created_at).toLocaleDateString('ja-JP')} 登録
                        </div>
                      </div>
                    </div>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${roleColors[user.role]}`}>
                      {roleLabels[user.role]}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      ID: {user.id.slice(0, 12)}...
                    </div>
                    <div className="flex items-center space-x-2">
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user.id, e.target.value as any)}
                        disabled={updatingUserId === user.id}
                        className="rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-2 py-1 text-xs"
                      >
                        <option value="user">一般ユーザー</option>
                        <option value="friend">知り合い</option>
                        <option value="admin">管理者</option>
                      </select>
                      {updatingUserId === user.id && (
                        <LoadingSpinner size="sm" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* 説明 */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-4">
        <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
          ロールの説明
        </h3>
        <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
          <li><strong>一般ユーザー:</strong> アクセスコードが必要</li>
          <li><strong>知り合い:</strong> アクセスコード不要で全弾利用可能</li>
          <li><strong>管理者:</strong> この管理画面にアクセス可能</li>
        </ul>
      </div>
    </div>
  )
}