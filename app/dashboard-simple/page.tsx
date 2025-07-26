'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

export default function DashboardSimplePage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      setLoading(false)
    })
  }, [])

  if (loading) {
    return <div className="p-8">Loading...</div>
  }

  if (!user) {
    return <div className="p-8">ログインしていません</div>
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">ダッシュボード（テスト版）</h1>
      <p>ログイン成功！</p>
      <p>メール: {user.email}</p>
      <button
        onClick={() => {
          supabase.auth.signOut()
          window.location.href = '/login'
        }}
        className="mt-4 px-4 py-2 bg-red-500 text-white rounded"
      >
        ログアウト
      </button>
    </div>
  )
}