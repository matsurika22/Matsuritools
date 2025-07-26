'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Mail, RefreshCw, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase/client'

export default function VerifyEmailPage() {
  const router = useRouter()
  const [email, setEmail] = useState<string>('')
  const [isResending, setIsResending] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // 現在のユーザー情報を取得
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setEmail(user.email || '')
        // 既に認証済みの場合はダッシュボードへ
        if (user.email_confirmed_at) {
          router.push('/dashboard')
        }
      } else {
        // ログインしていない場合はログインページへ
        router.push('/login')
      }
    }
    getUser()

    // 認証状態の変更を監視
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'USER_UPDATED' && session?.user?.email_confirmed_at) {
        router.push('/dashboard')
      }
    })

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [router])

  const handleResendEmail = async () => {
    try {
      setIsResending(true)
      setError(null)
      setResendSuccess(false)

      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      })

      if (error) throw error

      setResendSuccess(true)
      setTimeout(() => setResendSuccess(false), 5000)
    } catch (err: any) {
      setError(err.message || '確認メールの再送信に失敗しました')
    } finally {
      setIsResending(false)
    }
  }

  const handleCheckStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user?.email_confirmed_at) {
      router.push('/dashboard')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Mail className="h-8 w-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold">メールアドレスの確認</h1>
          <p className="mt-2 text-gray-600">
            アカウントを有効化するには、メールアドレスの確認が必要です
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md space-y-4">
          <div className="text-center space-y-2">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              確認メールを送信しました：
            </p>
            <p className="font-medium">{email}</p>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-md">
            <h3 className="font-medium text-blue-900 dark:text-blue-200 mb-2">
              次のステップ：
            </h3>
            <ol className="text-sm text-blue-800 dark:text-blue-300 space-y-1 list-decimal list-inside">
              <li>受信トレイを確認してください</li>
              <li>確認メール内のリンクをクリックしてください</li>
              <li>メールが届かない場合は、迷惑メールフォルダも確認してください</li>
            </ol>
          </div>

          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md dark:bg-red-900/20 dark:border-red-800">
              {error}
            </div>
          )}

          {resendSuccess && (
            <div className="p-3 text-sm text-green-600 bg-green-50 border border-green-200 rounded-md dark:bg-green-900/20 dark:border-green-800 flex items-center">
              <CheckCircle className="h-4 w-4 mr-2" />
              確認メールを再送信しました
            </div>
          )}

          <div className="space-y-3">
            <Button
              onClick={handleResendEmail}
              disabled={isResending || resendSuccess}
              variant="outline"
              className="w-full"
            >
              {isResending ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  送信中...
                </>
              ) : (
                '確認メールを再送信'
              )}
            </Button>

            <Button
              onClick={handleCheckStatus}
              className="w-full"
            >
              認証状態を確認
            </Button>

            <Button
              onClick={() => supabase.auth.signOut().then(() => router.push('/login'))}
              variant="ghost"
              className="w-full"
            >
              ログアウト
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}