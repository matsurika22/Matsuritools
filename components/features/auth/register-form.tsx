'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { Mail, Lock, Loader2, User } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FormField } from '@/components/ui/form-field'
import { registerSchema, type RegisterFormData } from '@/lib/validations/auth'
import { signUp } from '@/lib/supabase/auth'

export function RegisterForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  })

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setIsLoading(true)
      setError(null)
      
      await signUp(data.email, data.password, data.handleName)
      
      // 登録成功
      setSuccess(true)
    } catch (err: any) {
      console.error('Registration error details:', {
        error: err,
        message: err.message,
        details: err.details,
        hint: err.hint,
        code: err.code
      })
      
      if (err.message?.includes('already registered')) {
        setError('このメールアドレスは既に登録されています')
      } else if (err.message?.includes('users')) {
        setError('データベースの設定が完了していません。管理者にお問い合わせください。')
      } else if (err.code === 'over_email_send_rate_limit' || err.message?.includes('security purposes')) {
        const waitTime = err.message?.match(/after (\d+) seconds/) ? err.message.match(/after (\d+) seconds/)[1] : '30'
        setError(`🔒 セキュリティのため、${waitTime}秒お待ちください。その後再度お試しください。`)
      } else if (err.message?.includes('Too Many Requests') || err.message?.includes('429')) {
        setError('⏱️ リクエストが多すぎます。30秒ほど待ってから再度お試しください。')
      } else {
        setError(`登録中にエラーが発生しました: ${err.message || 'もう一度お試しください'}`)
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="space-y-4 text-center">
        <div className="p-4 bg-green-50 border border-green-200 rounded-md dark:bg-green-900/20 dark:border-green-800">
          <h3 className="text-lg font-medium text-green-800 dark:text-green-200">
            登録が完了しました！
          </h3>
          <p className="mt-2 text-sm text-green-600 dark:text-green-300">
            確認メールを送信しました。メールのリンクをクリックして、アカウントを有効化してください。
          </p>
        </div>
        <Link href="/login">
          <Button variant="outline" className="w-full">
            ログイン画面へ
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && (
        <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md dark:bg-red-900/20 dark:border-red-800">
          {error}
        </div>
      )}

      <FormField
        label="ハンドルネーム (HN)"
        error={errors.handleName?.message}
        required
      >
        <div className="relative">
          <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            {...register('handleName')}
            type="text"
            placeholder="例: ゲーマー太郎"
            className="pl-10"
            error={!!errors.handleName}
            disabled={isLoading}
          />
        </div>
      </FormField>

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
            placeholder="6文字以上"
            className="pl-10"
            error={!!errors.password}
            disabled={isLoading}
          />
        </div>
      </FormField>

      <FormField
        label="パスワード（確認）"
        error={errors.confirmPassword?.message}
        required
      >
        <div className="relative">
          <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            {...register('confirmPassword')}
            type="password"
            placeholder="パスワードを再入力"
            className="pl-10"
            error={!!errors.confirmPassword}
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
            登録中...
          </>
        ) : (
          '新規登録'
        )}
      </Button>

      <p className="text-center text-sm text-gray-600 dark:text-gray-400">
        既にアカウントをお持ちの方は{' '}
        <Link
          href="/login"
          className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
        >
          ログイン
        </Link>
      </p>
    </form>
  )
}