'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Loader2, Shield, User } from 'lucide-react'
import Link from 'next/link'
import { useGuestAuth } from '@/hooks/use-guest-auth'

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState<string>('user')
  const router = useRouter()
  const { guestSession, isGuest, initializeGuest, clearGuest } = useGuestAuth()

  useEffect(() => {
    const getUser = async () => {
      try {
        console.log('[Dashboard] ユーザー情報を取得中...')
        
        // ゲストセッションを初期化（一度だけ）
        if (!isGuest) {
          initializeGuest()
        }
        
        const { data: { user } } = await supabase.auth.getUser()
        
        // ログインユーザーもゲストユーザーもいない場合
        if (!user && !guestSession) {
          console.log('[Dashboard] ユーザーが見つかりません。ログインページへ')
          router.push('/login')
          return
        }
        
        // ゲストユーザーの場合
        if (!user && guestSession) {
          console.log('[Dashboard] ゲストユーザーとしてアクセス中')
          setUserRole('guest')
          setLoading(false)
          return
        }
        
        console.log('[Dashboard] ユーザー情報取得成功:', user.email)
        
        // メール認証チェック（管理者以外）
        if (user.email !== 'mk0207yu1111@gmail.com' && !user.email_confirmed_at) {
          console.log('[Dashboard] メール認証が必要です')
          window.location.href = '/verify-email'
          return
        }
        
        setUser(user)
        
        // roleの取得（失敗しても続行）
        try {
          const { data } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .maybeSingle()
          
          if (data?.role) {
            setUserRole(data.role)
          }
        } catch (error) {
          console.log('[Dashboard] Role取得エラー（デフォルト値を使用）')
        }
      } catch (error) {
        console.error('[Dashboard] エラー:', error)
        router.push('/login')
      } finally {
        setLoading(false)
      }
    }

    getUser()
  }, [router, isGuest]) // guestSessionではなくisGuestを依存配列に使用

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    )
  }

  if (!user && !isGuest) {
    return null
  }

  const handleSignOut = async () => {
    try {
      if (isGuest) {
        clearGuest()
        window.location.href = '/'
      } else {
        await supabase.auth.signOut()
        window.location.href = '/login'
      }
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
            {isGuest ? (
              <>
                <div className="border-l-4 border-yellow-500 pl-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    アクセスモード
                  </p>
                  <p className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
                    <User className="mr-2 h-4 w-4" />
                    ゲストユーザー
                  </p>
                </div>
                
                <div className="border-l-4 border-blue-500 pl-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    アクセス可能な弾
                  </p>
                  <p className="text-lg font-medium text-gray-900 dark:text-white">
                    {guestSession?.packName}
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="border-l-4 border-blue-500 pl-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    ログイン中のメールアドレス
                  </p>
                  <p className="text-lg font-medium text-gray-900 dark:text-white">
                    {user?.email}
                  </p>
                </div>

                <div className="border-l-4 border-green-500 pl-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    アカウント権限
                  </p>
                  <p className="text-lg font-medium text-gray-900 dark:text-white">
                    {userRole === 'admin' ? '管理者' : userRole === 'friend' ? '知り合い' : 'ユーザー'}
                  </p>
                </div>
              </>
            )}

            <div className="mt-8 space-y-4">
              {userRole === 'admin' && (
                <Link href="/admin">
                  <Button className="w-full" size="lg" variant="secondary">
                    <Shield className="mr-2 h-4 w-4" />
                    管理画面
                  </Button>
                </Link>
              )}
              
              {!isGuest && (
                <Link href="/access-code">
                  <Button className="w-full" size="lg">
                    アクセスコードを登録
                  </Button>
                </Link>
              )}
              
              <Link href="/dashboard/packs">
                <Button className="w-full" size="lg" variant="outline">
                  弾選択へ進む
                </Button>
              </Link>
              
              {isGuest && (
                <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    ゲストユーザーとしてご利用中です。より多くの機能をご利用になりたい場合は、
                    <Link href="/register" className="underline font-medium">
                      会員登録
                    </Link>
                    をお願いします。
                  </p>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}