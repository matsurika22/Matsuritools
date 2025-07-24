'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    )
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold">
          カードボックス期待値計算サービス
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400">
          デュエル・マスターズのボックス開封期待値を簡単計算
        </p>
        
        <div className="flex gap-4 justify-center mt-8">
          <Link href="/login">
            <Button size="lg">
              ログイン
            </Button>
          </Link>
          <Link href="/register">
            <Button size="lg" variant="outline">
              新規登録
            </Button>
          </Link>
        </div>
      </div>
    </main>
  )
}