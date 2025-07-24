'use client'

import { useRequireAuth } from '@/hooks/use-auth'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { signOut } from '@/lib/supabase/auth'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function DashboardPage() {
  const { user, loading } = useRequireAuth()
  const router = useRouter()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push('/login')
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              ダッシュボード
            </h1>
            <Button variant="outline" onClick={handleSignOut}>
              ログアウト
            </Button>
          </div>

          <div className="space-y-4">
            <div className="border-l-4 border-blue-500 pl-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                ログイン中のメールアドレス
              </p>
              <p className="text-lg font-medium text-gray-900 dark:text-white">
                {user.email}
              </p>
            </div>

            <div className="border-l-4 border-green-500 pl-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                アカウント権限
              </p>
              <p className="text-lg font-medium text-gray-900 dark:text-white">
                {user.role === 'admin' ? '管理者' : 'ユーザー'}
              </p>
            </div>

            <div className="mt-8 space-y-4">
              <Link href="/access-code">
                <Button className="w-full" size="lg">
                  アクセスコードを登録
                </Button>
              </Link>
              
              <Link href="/dashboard/packs">
                <Button className="w-full" size="lg" variant="outline">
                  弾選択へ進む
                </Button>
              </Link>
            </div>

            <div className="mt-8 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                <strong>開発中：</strong> 期待値計算機能は現在開発中です。
                アクセスコード入力、弾選択、価格入力などの機能が順次追加されます。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}