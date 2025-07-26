'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Mail, Lock, Loader2 } from 'lucide-react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { signIn } from '@/lib/supabase/auth'

export function LoginFormSimple() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email || !password) {
      setError('メールアドレスとパスワードを入力してください')
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      
      console.log('ログイン開始:', email)
      const result = await signIn(email, password)
      console.log('ログイン結果:', result)
      
      if (result?.user) {
        console.log('ログイン成功！リダイレクトします')
        // 成功メッセージを表示
        setError(null)
        // 少し待ってから強制的にリダイレクト
        setTimeout(() => {
          console.log('リダイレクト実行')
          window.location.replace('/dashboard-simple')
        }, 1000)
      }
    } catch (err: any) {
      console.error('ログインエラー:', err)
      setError(err.message || 'ログインに失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <label className="text-sm font-medium">
          メールアドレス <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="example@email.com"
            className="pl-10"
            disabled={isLoading}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">
          パスワード <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="pl-10"
            disabled={isLoading}
            required
          />
        </div>
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ログイン中...
          </>
        ) : (
          'ログイン'
        )}
      </Button>

      <p className="text-center text-sm text-gray-600">
        アカウントをお持ちでない方は{' '}
        <Link
          href="/register"
          className="font-medium text-blue-600 hover:text-blue-500"
        >
          新規登録
        </Link>
      </p>
    </form>
  )
}