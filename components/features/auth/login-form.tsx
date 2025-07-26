'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { Mail, Lock, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FormField } from '@/components/ui/form-field'
import { loginSchema, type LoginFormData } from '@/lib/validations/auth'
import { signIn } from '@/lib/supabase/auth'
import { supabase } from '@/lib/supabase/client'

export function LoginForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    console.log('🔵 ログインフォーム送信開始', data.email)
    try {
      setIsLoading(true)
      setError(null)
      
      console.log('🔵 signIn呼び出し中...')
      const { data: authData } = await signIn(data.email, data.password)
      console.log('🔵 signIn結果:', authData)
      
      if (authData?.user) {
        console.log('🔵 ログイン成功！ダッシュボードへリダイレクトします')
        // ログイン成功を確認してからリダイレクト
        // Vercel環境でのリダイレクトを確実にするため
        window.location.replace('/dashboard')
      } else {
        console.log('🔴 ユーザー情報が取得できませんでした')
      }
    } catch (err: any) {
      console.error('Login error:', err)
      setError('ログインエラー: ' + (err.message || 'Unknown error'))
      
      if (err.code === 'over_email_send_rate_limit' || err.message?.includes('security purposes')) {
        const waitTime = err.message?.match(/after (\d+) seconds/) ? err.message.match(/after (\d+) seconds/)[1] : '30'
        setError(`🔒 セキュリティのため、${waitTime}秒お待ちください。その後再度お試しください。`)
      } else if (err.message?.includes('Too Many Requests') || err.message?.includes('429')) {
        setError('⏱️ リクエストが多すぎます。30秒ほど待ってから再度お試しください。')
      } else {
        setError('メールアドレスまたはパスワードが正しくありません')
      }
    } finally {
      setIsLoading(false)
    }
  }


  return (
    <div className="space-y-6">
      {error && (
        <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md dark:bg-red-900/20 dark:border-red-800">
          {error}
        </div>
      )}

      <FormField
        label="メールアドレス"
        error={errors.email?.message}
        required
      >
        <div className="relative">
          <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            {...register('email')}
            type="email"
            placeholder="example@email.com"
            className="pl-10"
            error={!!errors.email}
            disabled={isLoading}
          />
        </div>
      </FormField>

      <FormField
        label="パスワード"
        error={errors.password?.message}
        required
      >
        <div className="relative">
          <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            {...register('password')}
            type="password"
            placeholder="••••••••"
            className="pl-10"
            error={!!errors.password}
            disabled={isLoading}
          />
        </div>
      </FormField>

      <Button
        type="button"
        className="w-full"
        disabled={isLoading}
        onClick={handleSubmit(onSubmit)}
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

      <p className="text-center text-sm text-gray-600 dark:text-gray-400">
        アカウントをお持ちでない方は{' '}
        <Link
          href="/register"
          className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
        >
          新規登録
        </Link>
      </p>
    </div>
  )
}