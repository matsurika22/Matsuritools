'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

export default function TestAuthPage() {
  const [user, setUser] = useState<any>(null)
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const { data: { user } } = await supabase.auth.getUser()
      
      setSession(session)
      setUser(user)
      console.log('Session:', session)
      console.log('User:', user)
    } catch (error) {
      console.error('Auth check error:', error)
    } finally {
      setLoading(false)
    }
  }

  const testLogin = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'mk0207yu1111@gmail.com',
        password: 'testpassword', // 適切なパスワードに変更してください
      })
      
      if (error) throw error
      
      console.log('Login successful:', data)
      alert('ログイン成功！')
      await checkAuth()
    } catch (error: any) {
      console.error('Login error:', error)
      alert('ログインエラー: ' + error.message)
    }
  }

  const testLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      
      console.log('Logout successful')
      alert('ログアウト成功！')
      await checkAuth()
    } catch (error: any) {
      console.error('Logout error:', error)
      alert('ログアウトエラー: ' + error.message)
    }
  }

  if (loading) return <div>Loading...</div>

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">認証テストページ</h1>
      
      <div className="space-y-4 mb-8">
        <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded">
          <h2 className="font-bold mb-2">セッション情報:</h2>
          <pre className="text-xs overflow-auto">
            {JSON.stringify(session, null, 2)}
          </pre>
        </div>
        
        <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded">
          <h2 className="font-bold mb-2">ユーザー情報:</h2>
          <pre className="text-xs overflow-auto">
            {JSON.stringify(user, null, 2)}
          </pre>
        </div>
      </div>

      <div className="space-x-4">
        <Button onClick={testLogin} disabled={!!user}>
          テストログイン
        </Button>
        <Button onClick={testLogout} disabled={!user}>
          ログアウト
        </Button>
        <Button onClick={checkAuth}>
          認証情報を再取得
        </Button>
        <Button onClick={() => window.location.href = '/dashboard'}>
          ダッシュボードへ移動
        </Button>
      </div>

      <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded">
        <h3 className="font-bold mb-2">テスト手順:</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          <li>「テストログイン」をクリック</li>
          <li>コンソールでログを確認</li>
          <li>「ダッシュボードへ移動」をクリック</li>
          <li>正常に遷移するか確認</li>
        </ol>
      </div>
    </div>
  )
}