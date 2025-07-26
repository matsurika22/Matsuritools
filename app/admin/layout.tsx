'use client'

import { useAdmin } from '@/lib/hooks/use-admin'
import { Loader2, Shield, Users, Package, CreditCard, Key, Menu, X } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { ErrorBoundary } from '@/components/ui/error-boundary'
import { LoadingScreen } from '@/components/ui/loading-spinner'

const adminNavItems = [
  { href: '/admin', label: 'ダッシュボード', icon: Shield },
  { href: '/admin/users', label: 'ユーザー管理', icon: Users },
  { href: '/admin/packs', label: '弾管理', icon: Package },
  { href: '/admin/cards', label: 'カード管理', icon: CreditCard },
  { href: '/admin/pack-rarities', label: '封入率管理', icon: Package },
  { href: '/admin/access-codes', label: 'アクセスコード', icon: Key },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isAdmin, user, loading } = useAdmin()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  if (loading) {
    return <LoadingScreen text="管理者権限を確認中..." />
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            アクセス権限がありません
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            このページは管理者のみアクセス可能です
          </p>
          <Link href="/dashboard">
            <Button>ダッシュボードへ戻る</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* モバイル用オーバーレイ */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* サイドバー */}
      <div className={`fixed inset-y-0 left-0 z-50 w-80 sm:w-64 bg-white dark:bg-gray-800 shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          {/* ヘッダー */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <Shield className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 mr-2 sm:mr-3" />
              <div>
                <h1 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                  管理画面
                </h1>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">
                  {user?.email}
                </p>
              </div>
            </div>
            {/* モバイル用閉じるボタン */}
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* ナビゲーション */}
          <nav className="flex-1 px-3 sm:px-4 py-4 sm:py-6 space-y-1 sm:space-y-2">
            {adminNavItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)} // モバイルでリンククリック時にサイドバーを閉じる
                  className={`flex items-center px-3 sm:px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <Icon className="h-5 w-5 mr-3 flex-shrink-0" />
                  <span className="text-sm sm:text-base">{item.label}</span>
                </Link>
              )
            })}
          </nav>

          {/* フッター */}
          <div className="p-3 sm:p-4 border-t border-gray-200 dark:border-gray-700">
            <Link href="/dashboard">
              <Button variant="outline" className="w-full text-sm sm:text-base">
                一般画面へ戻る
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* モバイル用ヘッダーバー */}
      <div className="lg:hidden bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex items-center">
            <Shield className="h-6 w-6 text-blue-600 mr-2" />
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
              管理画面
            </h1>
          </div>
          <div className="w-10"></div> {/* スペース調整用 */}
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="lg:ml-64">
        <main className="p-4 sm:p-6 lg:p-8 pt-20 lg:pt-8">
          {children}
        </main>
      </div>
      </div>
    </ErrorBoundary>
  )
}