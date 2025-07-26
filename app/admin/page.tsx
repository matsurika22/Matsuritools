'use client'

import { useEffect, useState } from 'react'
import { Shield, Users, Package, CreditCard, Key, TrendingUp } from 'lucide-react'
import { getAllUsers, getAllPacks, getAllCards, getAllAccessCodes } from '@/lib/supabase/admin'

interface DashboardStats {
  totalUsers: number
  totalPacks: number
  totalCards: number
  totalAccessCodes: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalPacks: 0,
    totalCards: 0,
    totalAccessCodes: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [users, packs, cards, accessCodes] = await Promise.all([
          getAllUsers(),
          getAllPacks(),
          getAllCards(),
          getAllAccessCodes()
        ])

        setStats({
          totalUsers: users.length,
          totalPacks: packs.length,
          totalCards: cards.length,
          totalAccessCodes: accessCodes.length
        })
      } catch (error) {
        console.error('Error loading dashboard stats:', error)
      } finally {
        setLoading(false)
      }
    }

    loadStats()
  }, [])

  const statCards = [
    {
      title: 'ユーザー数',
      value: stats.totalUsers,
      icon: Users,
      color: 'bg-blue-500',
      href: '/admin/users'
    },
    {
      title: '弾数',
      value: stats.totalPacks,
      icon: Package,
      color: 'bg-green-500',
      href: '/admin/packs'
    },
    {
      title: 'カード数',
      value: stats.totalCards,
      icon: CreditCard,
      color: 'bg-purple-500',
      href: '/admin/cards'
    },
    {
      title: 'アクセスコード数',
      value: stats.totalAccessCodes,
      icon: Key,
      color: 'bg-orange-500',
      href: '/admin/access-codes'
    }
  ]

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="text-center sm:text-left">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
          管理ダッシュボード
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2 text-sm sm:text-base">
          Matsuritoolsの管理画面
        </p>
      </div>

      {/* 統計カード */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        {statCards.map((card) => {
          const Icon = card.icon
          
          return (
            <div
              key={card.title}
              className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6 hover:shadow-lg transition-shadow cursor-pointer active:scale-95"
              onClick={() => window.location.href = card.href}
            >
              <div className="flex flex-col sm:flex-row items-center sm:items-start">
                <div className={`${card.color} p-2 sm:p-3 rounded-lg mb-2 sm:mb-0`}>
                  <Icon className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
                </div>
                <div className="sm:ml-4 text-center sm:text-left">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
                    {card.title}
                  </p>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">
                    {loading ? '...' : card.value.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* クイックアクション */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-4 text-center sm:text-left">
          クイックアクション
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <button
            onClick={() => window.location.href = '/admin/users'}
            className="p-3 sm:p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 transition-colors text-center sm:text-left active:scale-95"
          >
            <Users className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400 mb-2 mx-auto sm:mx-0" />
            <h3 className="font-medium text-gray-900 dark:text-white text-sm sm:text-base">ユーザー管理</h3>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
              ユーザーロールの変更
            </p>
          </button>

          <button
            onClick={() => window.location.href = '/admin/packs'}
            className="p-3 sm:p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-green-500 dark:hover:border-green-400 transition-colors text-center sm:text-left active:scale-95"
          >
            <Package className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400 mb-2 mx-auto sm:mx-0" />
            <h3 className="font-medium text-gray-900 dark:text-white text-sm sm:text-base">新しい弾を追加</h3>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
              弾の登録・編集
            </p>
          </button>

          <button
            onClick={() => window.location.href = '/admin/access-codes'}
            className="p-3 sm:p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-orange-500 dark:hover:border-orange-400 transition-colors text-center sm:text-left active:scale-95 sm:col-span-2 lg:col-span-1"
          >
            <Key className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400 mb-2 mx-auto sm:mx-0" />
            <h3 className="font-medium text-gray-900 dark:text-white text-sm sm:text-base">アクセスコード発行</h3>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
              新しいコードの作成
            </p>
          </button>
        </div>
      </div>

      {/* システム情報 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-4 text-center sm:text-left">
          システム情報
        </h2>
        <div className="space-y-3">
          <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700 last:border-b-0">
            <span className="text-sm sm:text-base text-gray-600 dark:text-gray-400">バージョン</span>
            <span className="font-medium text-sm sm:text-base text-gray-900 dark:text-white">v1.0.0</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700 last:border-b-0">
            <span className="text-sm sm:text-base text-gray-600 dark:text-gray-400">環境</span>
            <span className="font-medium text-sm sm:text-base text-gray-900 dark:text-white">Development</span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-sm sm:text-base text-gray-600 dark:text-gray-400">最終更新</span>
            <span className="font-medium text-sm sm:text-base text-gray-900 dark:text-white">
              {new Date().toLocaleDateString('ja-JP')}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}