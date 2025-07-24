'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2, ArrowLeft, Package, Calendar, Coins } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase/client'
import { getUserAccessiblePacks } from '@/lib/supabase/access-codes'
import type { Pack } from '@/types/access-code'

export default function PacksPage() {
  const [loading, setLoading] = useState(true)
  const [packs, setPacks] = useState<Pack[]>([])
  const [user, setUser] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    const loadData = async () => {
      try {
        // ユーザー認証チェック
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/login')
          return
        }
        setUser(user)

        // アクセス可能な弾を取得
        const accessiblePacks = await getUserAccessiblePacks(user.id)
        setPacks(accessiblePacks)
      } catch (error) {
        console.error('Error loading packs:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              ダッシュボードへ戻る
            </Button>
          </Link>
          
          <Link href="/access-code">
            <Button variant="outline" size="sm">
              新しいコードを追加
            </Button>
          </Link>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          弾選択
        </h1>

        {packs.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-8 text-center">
            <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              アクセス可能な弾がありません
            </p>
            <Link href="/access-code">
              <Button>
                アクセスコードを登録
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {packs.map((pack) => (
              <Link
                key={pack.id}
                href={`/dashboard/packs/${pack.id}/cards`}
                className="block"
              >
                <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    {pack.name}
                  </h2>
                  
                  <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center">
                      <Calendar className="mr-2 h-4 w-4" />
                      発売日: {pack.releaseDate ? new Date(pack.releaseDate).toLocaleDateString('ja-JP') : '未定'}
                    </div>
                    
                    {pack.boxPrice && (
                      <div className="flex items-center">
                        <Coins className="mr-2 h-4 w-4" />
                        定価: ¥{pack.boxPrice.toLocaleString()}
                      </div>
                    )}
                    
                    <div className="flex items-center">
                      <Package className="mr-2 h-4 w-4" />
                      {pack.packsPerBox ? `${pack.packsPerBox}パック/箱` : 'パック構成未定'}
                    </div>
                  </div>

                  <div className="mt-4 flex justify-end">
                    <Button size="sm">
                      価格入力へ進む →
                    </Button>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}