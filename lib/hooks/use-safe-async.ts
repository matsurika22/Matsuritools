// 安全な非同期処理のためのカスタムフック

import { useState, useCallback } from 'react'
import { getUserErrorMessage, AppError } from '@/lib/utils/error-handler'

interface AsyncState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

interface UseSafeAsyncReturn<T> {
  data: T | null
  loading: boolean
  error: string | null
  execute: (...args: any[]) => Promise<T | null>
  reset: () => void
}

/**
 * エラーハンドリングとローディング状態を自動で管理する非同期処理Hook
 * @param asyncFunction 実行する非同期関数
 * @param context エラーログ用のコンテキスト
 */
export function useSafeAsync<T>(
  asyncFunction: (...args: any[]) => Promise<T>,
  context?: string
): UseSafeAsyncReturn<T> {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    loading: false,
    error: null,
  })

  const execute = useCallback(
    async (...args: any[]): Promise<T | null> => {
      try {
        setState(prev => ({ ...prev, loading: true, error: null }))
        
        const result = await asyncFunction(...args)
        
        setState(prev => ({
          ...prev,
          data: result,
          loading: false,
        }))
        
        return result
      } catch (err) {
        const errorMessage = getUserErrorMessage(err, context)
        
        setState(prev => ({
          ...prev,
          error: errorMessage,
          loading: false,
        }))
        
        return null
      }
    },
    [asyncFunction, context]
  )

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
    })
  }, [])

  return {
    data: state.data,
    loading: state.loading,
    error: state.error,
    execute,
    reset,
  }
}

/**
 * フォーム送信など、一度だけ実行される処理用のHook
 */
export function useSafeAsyncCallback<T>(
  asyncFunction: (...args: any[]) => Promise<T>,
  context?: string
) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const execute = useCallback(
    async (...args: any[]): Promise<T | null> => {
      if (loading) return null // 重複実行防止

      try {
        setLoading(true)
        setError(null)
        
        const result = await asyncFunction(...args)
        return result
      } catch (err) {
        const errorMessage = getUserErrorMessage(err, context)
        setError(errorMessage)
        return null
      } finally {
        setLoading(false)
      }
    },
    [asyncFunction, context, loading]
  )

  const reset = useCallback(() => {
    setError(null)
    setLoading(false)
  }, [])

  return {
    execute,
    loading,
    error,
    reset,
  }
}

/**
 * リトライ機能付きの非同期処理Hook
 */
export function useSafeAsyncWithRetry<T>(
  asyncFunction: (...args: any[]) => Promise<T>,
  maxRetries: number = 3,
  context?: string
) {
  const [retryCount, setRetryCount] = useState(0)
  
  const {
    data,
    loading,
    error,
    execute: baseExecute,
    reset,
  } = useSafeAsync(asyncFunction, context)

  const execute = useCallback(
    async (...args: any[]): Promise<T | null> => {
      const result = await baseExecute(...args)
      
      if (result === null && retryCount < maxRetries) {
        // リトライ可能なエラーの場合のみリトライ
        setRetryCount(prev => prev + 1)
        setTimeout(() => execute(...args), 1000 * Math.pow(2, retryCount)) // 指数バックオフ
      }
      
      return result
    },
    [baseExecute, retryCount, maxRetries]
  )

  const resetWithRetry = useCallback(() => {
    reset()
    setRetryCount(0)
  }, [reset])

  return {
    data,
    loading,
    error,
    execute,
    reset: resetWithRetry,
    retryCount,
    canRetry: retryCount < maxRetries,
  }
}