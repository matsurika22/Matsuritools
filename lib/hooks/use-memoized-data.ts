// データの効率的なキャッシュとメモ化のためのHook

import { useState, useEffect, useMemo, useCallback } from 'react'
import { getUserErrorMessage } from '@/lib/utils/error-handler'

interface CacheEntry<T> {
  data: T
  timestamp: number
  expiresAt: number
}

interface UseMemoizedDataOptions {
  /** キャッシュの有効期限（ミリ秒）デフォルト: 5分 */
  cacheTime?: number
  /** データが古くても表示するかどうか */
  staleWhileRevalidate?: boolean
  /** 依存関係の配列 */
  dependencies?: any[]
}

// インメモリキャッシュ（アプリ全体で共有）
const globalCache = new Map<string, CacheEntry<any>>()

/**
 * データのメモ化とキャッシュを管理するHook
 */
export function useMemoizedData<T>(
  key: string,
  fetchFunction: () => Promise<T>,
  options: UseMemoizedDataOptions = {}
) {
  const {
    cacheTime = 5 * 60 * 1000, // 5分
    staleWhileRevalidate = true,
    dependencies = []
  } = options

  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // キャッシュキーを依存関係を含めて生成
  const cacheKey = useMemo(() => {
    const depsHash = dependencies.length > 0 
      ? JSON.stringify(dependencies) 
      : ''
    return `${key}:${depsHash}`
  }, [key, dependencies])

  // キャッシュからデータを取得
  const getCachedData = useCallback(() => {
    const cached = globalCache.get(cacheKey)
    if (!cached) return null

    const now = Date.now()
    
    // 期限切れの場合
    if (now > cached.expiresAt) {
      if (!staleWhileRevalidate) {
        globalCache.delete(cacheKey)
        return null
      }
      // staleWhileRevalidateの場合は古いデータを返す
      return cached.data
    }

    return cached.data
  }, [cacheKey, staleWhileRevalidate])

  // データをキャッシュに保存
  const setCachedData = useCallback((newData: T) => {
    const now = Date.now()
    globalCache.set(cacheKey, {
      data: newData,
      timestamp: now,
      expiresAt: now + cacheTime
    })
  }, [cacheKey, cacheTime])

  // データを取得
  const fetchData = useCallback(async (force = false) => {
    try {
      // 強制リフレッシュでない場合、キャッシュをチェック
      if (!force) {
        const cachedData = getCachedData()
        if (cachedData !== null) {
          setData(cachedData)
          setError(null)
          return cachedData
        }
      }

      setLoading(true)
      setError(null)

      const result = await fetchFunction()
      
      setData(result)
      setCachedData(result)
      
      return result
    } catch (err) {
      const errorMessage = getUserErrorMessage(err, `データ取得: ${key}`)
      setError(errorMessage)
      
      // エラー時でもキャッシュデータがあれば使用
      if (staleWhileRevalidate) {
        const cachedData = getCachedData()
        if (cachedData !== null) {
          setData(cachedData)
        }
      }
      
      throw err
    } finally {
      setLoading(false)
    }
  }, [fetchFunction, getCachedData, setCachedData, key, staleWhileRevalidate])

  // 初回データ取得
  useEffect(() => {
    fetchData()
  }, [fetchData])

  // キャッシュをクリア
  const clearCache = useCallback(() => {
    globalCache.delete(cacheKey)
    setData(null)
    setError(null)
  }, [cacheKey])

  // 手動リフレッシュ
  const refresh = useCallback(() => {
    return fetchData(true)
  }, [fetchData])

  return {
    data,
    loading,
    error,
    refresh,
    clearCache,
    isStale: useMemo(() => {
      const cached = globalCache.get(cacheKey)
      return cached ? Date.now() > cached.expiresAt : false
    }, [cacheKey])
  }
}

// 注意: useMultipleMemoizedData は React Hooks のルールに違反するため削除
// 複数のデータが必要な場合は、個別に useMemoizedData を呼び出してください

/**
 * グローバルキャッシュの管理
 */
export const cacheManager = {
  // 全キャッシュをクリア
  clearAll: () => {
    globalCache.clear()
  },
  
  // 特定のパターンにマッチするキャッシュをクリア
  clearPattern: (pattern: string) => {
    const keysToDelete = Array.from(globalCache.keys())
      .filter(key => key.includes(pattern))
    
    keysToDelete.forEach(key => globalCache.delete(key))
  },
  
  // キャッシュサイズを取得
  getSize: () => globalCache.size,
  
  // 期限切れのキャッシュを削除
  cleanup: () => {
    const now = Date.now()
    const keysToDelete: string[] = []
    globalCache.forEach((entry, key) => {
      if (now > entry.expiresAt) {
        keysToDelete.push(key)
      }
    })
    keysToDelete.forEach(key => globalCache.delete(key))
  }
}

// 定期的なキャッシュクリーンアップ（10分ごと）
if (typeof window !== 'undefined') {
  setInterval(() => {
    cacheManager.cleanup()
  }, 10 * 60 * 1000)
}