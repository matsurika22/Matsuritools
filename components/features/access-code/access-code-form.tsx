'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { Key, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FormField } from '@/components/ui/form-field'
import { validateAccessCode } from '@/lib/supabase/access-codes'
import { supabase } from '@/lib/supabase/client'

interface AccessCodeFormData {
  code: string
}

export function AccessCodeForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [user, setUser] = useState<any>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AccessCodeFormData>()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()
  }, [])

  const onSubmit = async (data: AccessCodeFormData) => {
    if (!user) {
      setError('ログインが必要です')
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      
      console.log('Submitting access code:', data.code)
      console.log('User ID:', user.id)
      
      await validateAccessCode(data.code, user.id)
      
      setSuccess(true)
      setTimeout(() => {
        router.push('/dashboard/packs')
        router.refresh()
      }, 1500)
    } catch (err: any) {
      console.error('Access code validation error:', err)
      console.error('Error details:', {
        message: err.message,
        code: data.code,
        userId: user.id
      })
      setError(err.message || 'アクセスコードの検証に失敗しました')
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

      {success && (
        <div className="p-3 text-sm text-green-600 bg-green-50 border border-green-200 rounded-md dark:bg-green-900/20 dark:border-green-800">
          アクセスコードが正常に登録されました！弾選択画面へ移動します...
        </div>
      )}

      <FormField
        label="アクセスコード"
        error={errors.code?.message}
        required
      >
        <div className="relative">
          <Key className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            {...register('code', {
              required: 'アクセスコードを入力してください',
              pattern: {
                value: /^[A-Za-z0-9-]+$/,
                message: '英数字とハイフンのみ使用できます',
              },
            })}
            type="text"
            placeholder="例: TEST-CODE-2024"
            className="pl-10"
            disabled={isLoading || success}
          />
        </div>
      </FormField>


      <Button
        type="submit"
        className="w-full"
        disabled={isLoading || success}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            検証中...
          </>
        ) : success ? (
          '登録完了！'
        ) : (
          'コードを登録'
        )}
      </Button>
    </form>
  )
}