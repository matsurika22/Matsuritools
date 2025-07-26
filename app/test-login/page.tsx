'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'

export default function TestLoginPage() {
  const [email, setEmail] = useState('mk0207yu1111@gmail.com')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')

  const handleLogin = async () => {
    setMessage('ログイン処理開始...')
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (error) {
        setMessage(`エラー: ${error.message}`)
        return
      }
      
      setMessage('ログイン成功！3秒後にダッシュボードへ移動します')
      
      setTimeout(() => {
        window.location.href = '/dashboard'
      }, 3000)
      
    } catch (err: any) {
      setMessage(`予期しないエラー: ${err.message}`)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-4 bg-white p-8 rounded-lg shadow">
        <h1 className="text-2xl font-bold">テストログイン</h1>
        
        <div>
          <label className="block text-sm font-medium mb-2">メール</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">パスワード</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>
        
        <button
          onClick={handleLogin}
          className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600"
        >
          ログイン
        </button>
        
        {message && (
          <div className="p-3 bg-gray-100 rounded-md text-sm">
            {message}
          </div>
        )}
      </div>
    </div>
  )
}