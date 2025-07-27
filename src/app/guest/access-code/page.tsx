'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { validateGuestAccessCode } from '@/lib/supabase/guest-access-codes'
import { useGuestAuth } from '@/hooks/use-guest-auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
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
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">ゲストアクセス</CardTitle>
          <CardDescription>
            アクセスコードを入力して、期待値計算機能をご利用ください
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
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
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || !code}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              アクセスする
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              <p>会員登録せずに期待値計算機能をお試しいただけます</p>
              <p className="mt-2">
                より多くの機能をご利用になりたい場合は
                <Button 
                  variant="link" 
                  className="p-0 h-auto font-normal"
                  onClick={() => router.push('/register')}
                >
                  会員登録
                </Button>
                をお願いします
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}