// デバウンスとスロットリングのためのHook

import { useState, useEffect, useCallback, useRef } from 'react'

/**
 * 値の変更をデバウンス（遅延）するHook
 * @param value デバウンスする値
 * @param delay 遅延時間（ミリ秒）
 * @returns デバウンスされた値
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

/**
 * 関数の実行をデバウンスするHook
 * @param callback 実行する関数
 * @param delay 遅延時間（ミリ秒）
 * @returns デバウンスされた関数
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<NodeJS.Timeout>()
  const callbackRef = useRef(callback)

  // 最新のコールバックを保持
  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  const debouncedCallback = useCallback((...args: Parameters<T>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(() => {
      callbackRef.current(...args)
    }, delay)
  }, [delay]) as T

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return debouncedCallback
}

/**
 * 関数の実行をスロットリング（制限）するHook
 * @param callback 実行する関数
 * @param delay 最小実行間隔（ミリ秒）
 * @returns スロットリングされた関数
 */
export function useThrottledCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const lastExecutedRef = useRef<number>(0)
  const timeoutRef = useRef<NodeJS.Timeout>()
  const callbackRef = useRef(callback)

  // 最新のコールバックを保持
  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  const throttledCallback = useCallback((...args: Parameters<T>) => {
    const now = Date.now()
    const timeSinceLastExecution = now - lastExecutedRef.current

    if (timeSinceLastExecution >= delay) {
      // 即座に実行
      lastExecutedRef.current = now
      callbackRef.current(...args)
    } else {
      // 残り時間後に実行
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      timeoutRef.current = setTimeout(() => {
        lastExecutedRef.current = Date.now()
        callbackRef.current(...args)
      }, delay - timeSinceLastExecution)
    }
  }, [delay]) as T

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return throttledCallback
}

/**
 * 検索用のデバウンスHook（より高レベル）
 * @param searchFunction 検索実行関数
 * @param delay デバウンス遅延時間
 * @returns 検索状態と検索実行関数
 */
export function useDebouncedSearch<T>(
  searchFunction: (query: string) => Promise<T[]>,
  delay: number = 300
) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<T[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const debouncedQuery = useDebounce(query, delay)

  // 検索実行
  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults([])
      setLoading(false)
      setError(null)
      return
    }

    let isCancelled = false

    const performSearch = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const searchResults = await searchFunction(debouncedQuery)
        
        if (!isCancelled) {
          setResults(searchResults)
        }
      } catch (err) {
        if (!isCancelled) {
          setError(err instanceof Error ? err.message : '検索エラーが発生しました')
          setResults([])
        }
      } finally {
        if (!isCancelled) {
          setLoading(false)
        }
      }
    }

    performSearch()

    return () => {
      isCancelled = true
    }
  }, [debouncedQuery, searchFunction])

  return {
    query,
    setQuery,
    results,
    loading,
    error,
    clearResults: () => {
      setQuery('')
      setResults([])
      setError(null)
    }
  }
}

/**
 * APIリクエストの頻度制限Hook
 * @param requestFunction APIリクエスト関数
 * @param minInterval 最小リクエスト間隔（ミリ秒）
 * @returns 制限付きリクエスト関数
 */
export function useRateLimitedRequest<T extends (...args: any[]) => Promise<any>>(
  requestFunction: T,
  minInterval: number = 1000
) {
  const lastRequestTimeRef = useRef<number>(0)
  const pendingRequestRef = useRef<Promise<any> | null>(null)

  const rateLimitedRequest = useCallback(async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    const now = Date.now()
    const timeSinceLastRequest = now - lastRequestTimeRef.current

    // 進行中のリクエストがある場合はそれを返す
    if (pendingRequestRef.current) {
      return pendingRequestRef.current
    }

    // 最小間隔を満たしていない場合は待機
    if (timeSinceLastRequest < minInterval) {
      await new Promise(resolve => 
        setTimeout(resolve, minInterval - timeSinceLastRequest)
      )
    }

    // リクエスト実行
    lastRequestTimeRef.current = Date.now()
    pendingRequestRef.current = requestFunction(...args)

    try {
      const result = await pendingRequestRef.current
      return result
    } finally {
      pendingRequestRef.current = null
    }
  }, [requestFunction, minInterval]) as T

  return rateLimitedRequest
}

/**
 * スクロールイベントのデバウンス/スロットリング
 */
export function useScrollHandler(
  onScroll: (scrollInfo: { scrollTop: number; scrollLeft: number }) => void,
  mode: 'debounce' | 'throttle' = 'throttle',
  delay: number = 16 // 60fps
) {
  // Hookを条件分岐の外で呼び出す
  const debouncedHandler = useDebouncedCallback(onScroll, delay)
  const throttledHandler = useThrottledCallback(onScroll, delay)
  
  // mode に応じて適切なハンドラーを選択
  const handler = mode === 'debounce' ? debouncedHandler : throttledHandler

  const scrollHandler = useCallback((e: React.UIEvent<HTMLElement>) => {
    handler({
      scrollTop: e.currentTarget.scrollTop,
      scrollLeft: e.currentTarget.scrollLeft
    })
  }, [handler])

  return scrollHandler
}