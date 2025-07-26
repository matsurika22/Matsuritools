// 大量データの仮想化表示のためのHook

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'

interface UseVirtualListOptions {
  /** アイテムの高さ（px） */
  itemHeight: number
  /** 表示領域の高さ（px） */
  containerHeight: number
  /** オーバースキャン（表示外でもレンダリングするアイテム数） */
  overscan?: number
}

interface VirtualListItem<T> {
  index: number
  data: T
  style: React.CSSProperties
}

/**
 * 大量のリストデータを効率的に表示するためのHook
 * 表示されている部分のみレンダリングして、パフォーマンスを向上させる
 */
export function useVirtualList<T>(
  items: T[],
  options: UseVirtualListOptions
) {
  const { itemHeight, containerHeight, overscan = 5 } = options
  
  const [scrollTop, setScrollTop] = useState(0)
  const scrollElementRef = useRef<HTMLElement>()

  // 表示可能なアイテム数を計算
  const visibleCount = Math.ceil(containerHeight / itemHeight)
  
  // スクロール位置から表示開始インデックスを計算
  const startIndex = Math.floor(scrollTop / itemHeight)
  
  // 実際にレンダリングする範囲を計算（オーバースキャン考慮）
  const renderStartIndex = Math.max(0, startIndex - overscan)
  const renderEndIndex = Math.min(
    items.length - 1,
    startIndex + visibleCount + overscan - 1
  )

  // 仮想化されたアイテムのリストを生成
  const virtualItems = useMemo((): VirtualListItem<T>[] => {
    const result: VirtualListItem<T>[] = []
    
    for (let i = renderStartIndex; i <= renderEndIndex; i++) {
      if (i >= 0 && i < items.length) {
        result.push({
          index: i,
          data: items[i],
          style: {
            position: 'absolute',
            top: i * itemHeight,
            left: 0,
            right: 0,
            height: itemHeight,
          }
        })
      }
    }
    
    return result
  }, [items, renderStartIndex, renderEndIndex, itemHeight])

  // 全体の高さを計算
  const totalHeight = items.length * itemHeight

  // スクロールハンドラー
  const handleScroll = useCallback((e: React.UIEvent<HTMLElement>) => {
    setScrollTop(e.currentTarget.scrollTop)
  }, [])

  // スクロール要素の参照を設定
  const setScrollElement = useCallback((element: HTMLElement | null) => {
    if (element) {
      scrollElementRef.current = element
    }
  }, [])

  // 特定のインデックスにスクロール
  const scrollToIndex = useCallback((index: number, align: 'start' | 'center' | 'end' = 'start') => {
    if (!scrollElementRef.current) return

    let scrollTop: number
    
    switch (align) {
      case 'start':
        scrollTop = index * itemHeight
        break
      case 'center':
        scrollTop = index * itemHeight - containerHeight / 2 + itemHeight / 2
        break
      case 'end':
        scrollTop = index * itemHeight - containerHeight + itemHeight
        break
    }

    scrollTop = Math.max(0, Math.min(scrollTop, totalHeight - containerHeight))
    scrollElementRef.current.scrollTop = scrollTop
  }, [itemHeight, containerHeight, totalHeight])

  return {
    virtualItems,
    totalHeight,
    handleScroll,
    setScrollElement,
    scrollToIndex,
    // デバッグ情報
    debug: {
      scrollTop,
      startIndex,
      renderStartIndex,
      renderEndIndex,
      visibleCount,
      totalItems: items.length
    }
  }
}

/**
 * 動的な高さを持つアイテムの仮想化（より複雑だが柔軟）
 */
export function useDynamicVirtualList<T>(
  items: T[],
  estimatedItemHeight: number,
  containerHeight: number,
  getItemHeight?: (index: number, item: T) => number
) {
  const [scrollTop, setScrollTop] = useState(0)
  const [itemHeights, setItemHeights] = useState<Map<number, number>>(new Map())
  const scrollElementRef = useRef<HTMLElement>()

  // アイテムの高さを取得（キャッシュから、または推定値）
  const getItemHeightCached = useCallback((index: number, item: T) => {
    const cached = itemHeights.get(index)
    if (cached !== undefined) return cached
    
    if (getItemHeight) {
      return getItemHeight(index, item)
    }
    
    return estimatedItemHeight
  }, [itemHeights, getItemHeight, estimatedItemHeight])

  // アイテムの位置を計算
  const itemPositions = useMemo(() => {
    const positions: number[] = []
    let totalHeight = 0
    
    for (let i = 0; i < items.length; i++) {
      positions[i] = totalHeight
      totalHeight += getItemHeightCached(i, items[i])
    }
    
    return { positions, totalHeight }
  }, [items, getItemHeightCached])

  // 表示範囲を計算
  const { startIndex, endIndex } = useMemo(() => {
    let start = 0
    let end = items.length - 1

    // 開始インデックスを二分探索で見つける
    let left = 0
    let right = items.length - 1
    
    while (left <= right) {
      const mid = Math.floor((left + right) / 2)
      const position = itemPositions.positions[mid]
      
      if (position < scrollTop) {
        left = mid + 1
      } else {
        right = mid - 1
      }
    }
    start = Math.max(0, right)

    // 終了インデックスを見つける
    const viewportBottom = scrollTop + containerHeight
    for (let i = start; i < items.length; i++) {
      if (itemPositions.positions[i] >= viewportBottom) {
        end = i
        break
      }
    }

    return { startIndex: start, endIndex: end }
  }, [scrollTop, containerHeight, items.length, itemPositions])

  // 仮想アイテムを生成
  const virtualItems = useMemo((): VirtualListItem<T>[] => {
    const result: VirtualListItem<T>[] = []
    
    for (let i = startIndex; i <= endIndex; i++) {
      if (i >= 0 && i < items.length) {
        const height = getItemHeightCached(i, items[i])
        
        result.push({
          index: i,
          data: items[i],
          style: {
            position: 'absolute',
            top: itemPositions.positions[i],
            left: 0,
            right: 0,
            height,
          }
        })
      }
    }
    
    return result
  }, [startIndex, endIndex, items, getItemHeightCached, itemPositions])

  // アイテムの高さを測定して更新
  const measureItem = useCallback((index: number, height: number) => {
    setItemHeights(prev => {
      const newMap = new Map(prev)
      newMap.set(index, height)
      return newMap
    })
  }, [])

  const handleScroll = useCallback((e: React.UIEvent<HTMLElement>) => {
    setScrollTop(e.currentTarget.scrollTop)
  }, [])

  const setScrollElement = useCallback((element: HTMLElement | null) => {
    if (element) {
      scrollElementRef.current = element
    }
  }, [])

  return {
    virtualItems,
    totalHeight: itemPositions.totalHeight,
    handleScroll,
    setScrollElement,
    measureItem,
    debug: {
      scrollTop,
      startIndex,
      endIndex,
      totalItems: items.length,
      measuredItems: itemHeights.size
    }
  }
}