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
    try {
      setIsLoading(true)
      setError(null)
      
      await signIn(data.email, data.password)
      
      // ログイン成功後、ダッシュボードへリダイレクト
      router.push('/dashboard')
      router.refresh()
    } catch (err) {
      console.error('Login error:', err)
      setError('メールアドレスまたはパスワードが正しくありません')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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

      <p className="text-center text-sm text-gray-600 dark:text-gray-400">
        アカウントをお持ちでない方は{' '}
        <Link
          href="/register"
          className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
        >
          新規登録
        </Link>
      </p>
    </form>
  )
}