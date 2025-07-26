'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

export default function DashboardPageSimple() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        console.log('[Dashboard Simple] User:', user)
        
        if (!user) {
          router.push('/login')
          return
        }
        
        setUser(user)
      } catch (error) {
        console.error('[Dashboard Simple] Error:', error)
      } finally {
        setLoading(false)
      }
    }

    checkUser()
  }, [router])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return <div className="p-8">Loading...</div>
  }

  if (!user) {
    return null
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">ダッシュボード（シンプル版）</h1>
      <p className="mb-4">ログイン中: {user.email}</p>
      <Button onClick={handleSignOut}>ログアウト</Button>
    </div>
  )
}