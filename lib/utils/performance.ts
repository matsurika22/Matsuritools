// パフォーマンス計測とメモリ管理のユーティリティ

import React from 'react'

/**
 * 処理時間を計測するデコレータ関数
 */
export function measurePerformance<T extends (...args: any[]) => any>(
  fn: T,
  label?: string
): T {
  return ((...args: any[]) => {
    const startTime = performance.now()
    const result = fn(...args)
    
    if (result instanceof Promise) {
      return result.finally(() => {
        const endTime = performance.now()
        const duration = endTime - startTime
        console.log(`⏱️ ${label || fn.name}: ${duration.toFixed(2)}ms`)
      })
    } else {
      const endTime = performance.now()
      const duration = endTime - startTime
      console.log(`⏱️ ${label || fn.name}: ${duration.toFixed(2)}ms`)
      return result
    }
  }) as T
}

/**
 * パフォーマンス計測クラス
 */
export class PerformanceMonitor {
  private marks: Map<string, number> = new Map()
  private measurements: Map<string, number[]> = new Map()

  /**
   * 計測開始
   */
  start(label: string): void {
    this.marks.set(label, performance.now())
  }

  /**
   * 計測終了
   */
  end(label: string): number {
    const startTime = this.marks.get(label)
    if (!startTime) {
      console.warn(`Performance mark "${label}" not found`)
      return 0
    }

    const duration = performance.now() - startTime
    this.marks.delete(label)

    // 履歴を保存
    const history = this.measurements.get(label) || []
    history.push(duration)
    
    // 最新の100件のみ保持
    if (history.length > 100) {
      history.shift()
    }
    
    this.measurements.set(label, history)

    console.log(`⏱️ ${label}: ${duration.toFixed(2)}ms`)
    return duration
  }

  /**
   * 統計情報を取得
   */
  getStats(label: string) {
    const measurements = this.measurements.get(label)
    if (!measurements || measurements.length === 0) {
      return null
    }

    const sorted = [...measurements].sort((a, b) => a - b)
    const sum = measurements.reduce((a, b) => a + b, 0)

    return {
      count: measurements.length,
      average: sum / measurements.length,
      min: Math.min(...measurements),
      max: Math.max(...measurements),
      median: sorted[Math.floor(sorted.length / 2)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      recent: measurements.slice(-10) // 直近10回
    }
  }

  /**
   * 全統計をコンソールに出力
   */
  logAllStats(): void {
    console.group('📊 Performance Statistics')
    
    this.measurements.forEach((measurements, label) => {
      if (measurements.length > 0) {
        const stats = this.getStats(label)!
        console.log(`${label}:`, {
          average: `${stats.average.toFixed(2)}ms`,
          min: `${stats.min.toFixed(2)}ms`,
          max: `${stats.max.toFixed(2)}ms`,
          p95: `${stats.p95.toFixed(2)}ms`,
          count: stats.count
        })
      }
    })
    
    console.groupEnd()
  }

  /**
   * 計測データをクリア
   */
  clear(): void {
    this.marks.clear()
    this.measurements.clear()
  }
}

// グローバルインスタンス
export const performanceMonitor = new PerformanceMonitor()

/**
 * メモリ使用量を監視
 */
export class MemoryMonitor {
  private interval: NodeJS.Timeout | null = null
  private callbacks: Array<(info: any) => void> = []

  /**
   * 監視開始
   */
  start(intervalMs: number = 5000): void {
    if (typeof window === 'undefined' || !('memory' in performance)) {
      console.warn('Memory monitoring not supported in this environment')
      return
    }

    this.interval = setInterval(() => {
      const memory = (performance as any).memory
      const info = {
        used: Math.round(memory.usedJSHeapSize / 1024 / 1024), // MB
        total: Math.round(memory.totalJSHeapSize / 1024 / 1024), // MB
        limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024), // MB
        timestamp: Date.now()
      }

      this.callbacks.forEach(callback => {
        try {
          callback(info)
        } catch (error) {
          console.error('Memory monitor callback error:', error)
        }
      })

      // 警告レベルのメモリ使用量をチェック
      const usageRatio = info.used / info.limit
      if (usageRatio > 0.8) {
        console.warn(`🚨 High memory usage: ${info.used}MB (${(usageRatio * 100).toFixed(1)}%)`)
      }
    }, intervalMs)
  }

  /**
   * 監視停止
   */
  stop(): void {
    if (this.interval) {
      clearInterval(this.interval)
      this.interval = null
    }
  }

  /**
   * コールバック追加
   */
  onUpdate(callback: (info: any) => void): () => void {
    this.callbacks.push(callback)
    
    // アンサブスクライブ関数を返す
    return () => {
      const index = this.callbacks.indexOf(callback)
      if (index > -1) {
        this.callbacks.splice(index, 1)
      }
    }
  }

  /**
   * 現在のメモリ使用量を取得
   */
  getCurrentUsage() {
    if (typeof window === 'undefined' || !('memory' in performance)) {
      return null
    }

    const memory = (performance as any).memory
    return {
      used: Math.round(memory.usedJSHeapSize / 1024 / 1024), // MB
      total: Math.round(memory.totalJSHeapSize / 1024 / 1024), // MB
      limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024), // MB
    }
  }
}

// グローバルインスタンス
export const memoryMonitor = new MemoryMonitor()

/**
 * 重い処理を分割して実行するユーティリティ
 */
export async function processInChunks<T, R>(
  items: T[],
  processor: (item: T, index: number) => R | Promise<R>,
  chunkSize: number = 100,
  delayMs: number = 0
): Promise<R[]> {
  const results: R[] = []
  
  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize)
    
    const chunkResults = await Promise.all(
      chunk.map((item, chunkIndex) => processor(item, i + chunkIndex))
    )
    
    results.push(...chunkResults)
    
    // 次のチャンクの前に少し待機（UIをブロックしないため）
    if (delayMs > 0 && i + chunkSize < items.length) {
      await new Promise(resolve => setTimeout(resolve, delayMs))
    }
  }
  
  return results
}

/**
 * レンダリングパフォーマンスの計測
 */
export function measureRenderTime(componentName: string) {
  return function<T extends React.ComponentType<any>>(Component: T): T {
    return function MeasuredComponent(props: any) {
      const startTime = performance.now()
      
      React.useEffect(() => {
        const endTime = performance.now()
        const renderTime = endTime - startTime
        
        if (renderTime > 16) { // 16ms = 60fps
          console.warn(`🐌 Slow render: ${componentName} took ${renderTime.toFixed(2)}ms`)
        }
      })
      
      return React.createElement(Component, props)
    } as T
  }
}

/**
 * ダブクリックと大量イベント発生の防止
 */
export function createEventThrottle() {
  const lastEvents = new Map<string, number>()
  
  return function throttle(eventId: string, minInterval: number = 1000): boolean {
    const now = Date.now()
    const lastTime = lastEvents.get(eventId) || 0
    
    if (now - lastTime < minInterval) {
      return false // イベントを無視
    }
    
    lastEvents.set(eventId, now)
    return true // イベントを実行
  }
}

/**
 * 開発環境でのパフォーマンス監視自動開始
 */
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  // メモリ監視開始
  memoryMonitor.start(10000) // 10秒間隔

  // 5分ごとにパフォーマンス統計を出力
  setInterval(() => {
    performanceMonitor.logAllStats()
  }, 5 * 60 * 1000)
  
  // ページ離脱時に統計を出力
  window.addEventListener('beforeunload', () => {
    performanceMonitor.logAllStats()
  })
}