'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'

export default function Home() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)
        if (user) {
          // Vercel環境でも確実にリダイレクト
          window.location.replace('/dashboard')
        }
      } catch (error) {
        console.error('Auth check error:', error)
      } finally {
        setLoading(false)
      }
    }
    
    checkUser()
  }, [])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    )
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8 md:p-24">
      <div className="text-center space-y-6 max-w-2xl w-full">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">
          Matsuritools
        </h1>
        <p className="text-base sm:text-lg md:text-xl text-gray-600 dark:text-gray-400">
          デュエル・マスターズのボックス開封期待値を簡単計算
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mt-8 px-4 sm:px-0">
          <Link href="/login" className="w-full sm:w-auto">
            <Button size="lg" className="w-full">
              ログイン
            </Button>
          </Link>
          <Link href="/register" className="w-full sm:w-auto">
            <Button size="lg" variant="outline" className="w-full">
              新規登録
            </Button>
          </Link>
        </div>
      </div>
    </main>
  )
}