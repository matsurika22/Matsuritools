'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2, ArrowLeft, Package, Calendar, Coins } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase/client'
import { getUserAccessiblePacks } from '@/lib/supabase/access-codes'
import { useGuestAuth } from '@/hooks/use-guest-auth'
import type { Pack } from '@/types/access-code'

export default function PacksPage() {
  const [loading, setLoading] = useState(true)
  const [packs, setPacks] = useState<Pack[]>([])
  const [user, setUser] = useState<any>(null)
  const router = useRouter()
  const { guestSession, isGuest, initializeGuest } = useGuestAuth()

  useEffect(() => {
    const loadData = async () => {
      try {
        // ゲストセッションをチェック
        initializeGuest()
        
        // ユーザー認証チェック
        const { data: { user } } = await supabase.auth.getUser()
        
        // ログインユーザーもゲストユーザーもいない場合
        if (!user && !guestSession) {
          router.push('/login')
          return
        }
        
        // ゲストユーザーの場合
        if (!user && guestSession) {
          // ゲストセッションからパック情報を作成
          setPacks([{
            id: guestSession.packId,
            name: guestSession.packName,
            releaseDate: null,
            boxPrice: null,
            packsPerBox: null
          } as Pack])
          setLoading(false)
          return
        }
        
        setUser(user)

        // 通常ユーザーの場合、アクセス可能な弾を取得
        const accessiblePacks = await getUserAccessiblePacks(user.id)
        setPacks(accessiblePacks)
      } catch (error) {
        console.error('Error loading packs:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [router, guestSession])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
        <div className="mb-4 sm:mb-6 flex items-center justify-between">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">ダッシュボードへ戻る</span>
              <span className="sm:hidden">戻る</span>
            </Button>
          </Link>
          
          {!isGuest && (
            <Link href="/access-code">
              <Button variant="outline" size="sm">
                <span className="hidden sm:inline">新しいコードを追加</span>
                <span className="sm:hidden">コード追加</span>
              </Button>
            </Link>
          )}
        </div>

        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6">
          弾選択
        </h1>

        {packs.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-8 text-center">
            <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              アクセス可能な弾がありません
            </p>
            {isGuest ? (
              <Link href="/register">
                <Button>
                  会員登録して利用する
                </Button>
              </Link>
            ) : (
              <Link href="/access-code">
                <Button>
                  アクセスコードを登録
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2">
            {packs.map((pack) => (
              <Link
                key={pack.id}
                href={`/dashboard/packs/${pack.id}/cards`}
                className="block"
              >
                <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4 sm:p-6 hover:shadow-lg transition-shadow cursor-pointer">
                  <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-2 sm:mb-3">
                    {pack.name}
                  </h2>
                  
                  <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center">
                      <Calendar className="mr-2 h-3 sm:h-4 w-3 sm:w-4 flex-shrink-0" />
                      <span className="truncate">
                        発売日: {pack.releaseDate ? new Date(pack.releaseDate).toLocaleDateString('ja-JP') : '未定'}
                      </span>
                    </div>
                    
                    {pack.boxPrice && (
                      <div className="flex items-center">
                        <Coins className="mr-2 h-3 sm:h-4 w-3 sm:w-4 flex-shrink-0" />
                        <span>定価: ¥{pack.boxPrice.toLocaleString()}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center">
                      <Package className="mr-2 h-3 sm:h-4 w-3 sm:w-4 flex-shrink-0" />
                      <span>{pack.packsPerBox ? `${pack.packsPerBox}パック/箱` : 'パック構成未定'}</span>
                    </div>
                  </div>

                  <div className="mt-3 sm:mt-4 flex justify-end">
                    <Button size="sm" className="text-xs sm:text-sm">
                      価格入力へ →
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