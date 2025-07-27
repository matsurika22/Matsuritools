'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { validateGuestAccessCode } from '@/lib/supabase/guest-access-codes'
import { useGuestAuth } from '@/hooks/use-guest-auth'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

export default function GuestAccessCodePage() {
  const router = useRouter()
  const { setGuestSession } = useGuestAuth()
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const result = await validateGuestAccessCode(code)
      
      if (!result.isValid || !result.accessCode) {
        setError(result.error || '無効なアクセスコードです')
        return
      }

      // ゲストセッションを保存
      setGuestSession({
        accessCode: code,
        packId: result.accessCode.pack.id,
        packName: result.accessCode.pack.name,
        validUntil: result.accessCode.valid_until || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30日後
        createdAt: new Date().toISOString()
      })

      // ダッシュボードへリダイレクト
      router.push('/dashboard/packs')
    } catch (err) {
      setError('エラーが発生しました。もう一度お試しください。')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">ゲストアクセス</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              アクセスコードを入力して、期待値計算機能をご利用ください
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                type="text"
                placeholder="アクセスコードを入力"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                disabled={isLoading}
                required
                className="text-center text-lg"
              />
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3">
                <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || !code}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              アクセスする
            </Button>

            <div className="text-center text-sm text-gray-600 dark:text-gray-400 space-y-2">
              <p>会員登録せずに期待値計算機能をお試しいただけます</p>
              <p>
                より多くの機能をご利用になりたい場合は
                <Button 
                  variant="link" 
                  className="p-0 h-auto font-normal text-blue-600 hover:text-blue-800"
                  onClick={() => router.push('/register')}
                >
                  会員登録
                </Button>
                をお願いします
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}