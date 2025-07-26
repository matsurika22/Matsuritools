// 遅延読み込み画像コンポーネント

'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'

interface LazyImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  placeholder?: string
  quality?: number
  priority?: boolean
  onLoad?: () => void
  onError?: () => void
}

/**
 * 遅延読み込みとプレースホルダーを持つ画像コンポーネント
 */
export function LazyImage({
  src,
  alt,
  width,
  height,
  className = '',
  placeholder = '/images/placeholder.svg',
  quality = 75,
  priority = false,
  onLoad,
  onError
}: LazyImageProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [isInView, setIsInView] = useState(false)
  const imgRef = useRef<HTMLDivElement>(null)

  // Intersection Observer で画像が表示領域に入ったかを監視
  useEffect(() => {
    if (priority) {
      setIsInView(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
          observer.disconnect()
        }
      },
      {
        rootMargin: '50px' // 50px手前から読み込み開始
      }
    )

    if (imgRef.current) {
      observer.observe(imgRef.current)
    }

    return () => observer.disconnect()
  }, [priority])

  const handleLoad = () => {
    setIsLoading(false)
    onLoad?.()
  }

  const handleError = () => {
    setIsLoading(false)
    setHasError(true)
    onError?.()
  }

  return (
    <div ref={imgRef} className={`relative overflow-hidden ${className}`}>
      {/* プレースホルダー / エラー表示 */}
      {(isLoading || hasError) && (
        <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
          {hasError ? (
            <div className="text-center text-gray-500 dark:text-gray-400">
              <svg 
                className="h-8 w-8 mx-auto mb-2" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
                />
              </svg>
              <p className="text-xs">画像を読み込めません</p>
            </div>
          ) : isLoading && isInView ? (
            <div className="text-center text-gray-500 dark:text-gray-400">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-current mx-auto mb-2"></div>
              <p className="text-xs">読み込み中...</p>
            </div>
          ) : (
            <div className="text-center text-gray-500 dark:text-gray-400">
              <div className="h-8 w-8 rounded bg-gray-300 dark:bg-gray-600 mx-auto mb-2"></div>
              <p className="text-xs">画像</p>
            </div>
          )}
        </div>
      )}

      {/* 実際の画像 */}
      {isInView && !hasError && (
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          quality={quality}
          priority={priority}
          className={`transition-opacity duration-300 ${
            isLoading ? 'opacity-0' : 'opacity-100'
          }`}
          onLoad={handleLoad}
          onError={handleError}
        />
      )}
    </div>
  )
}

/**
 * カード画像専用の最適化コンポーネント
 */
export function CardImage({
  src,
  name,
  rarity,
  className = ''
}: {
  src: string
  name: string
  rarity?: string
  className?: string
}) {
  const rarityColors = {
    'C': 'border-gray-400',
    'U': 'border-green-400', 
    'R': 'border-blue-400',
    'VR': 'border-purple-400',
    'SR': 'border-yellow-400',
    'MR': 'border-red-400'
  }

  const borderColor = rarity ? rarityColors[rarity as keyof typeof rarityColors] : 'border-gray-300'

  return (
    <div className={`relative ${className}`}>
      <LazyImage
        src={src}
        alt={`${name}のカード画像`}
        width={200}
        height={280}
        className={`rounded-lg border-2 ${borderColor} shadow-md hover:shadow-lg transition-shadow duration-200`}
        placeholder="/images/card-placeholder.svg"
        quality={85}
      />
      
      {/* レアリティバッジ */}
      {rarity && (
        <div className={`absolute top-2 right-2 px-2 py-1 rounded text-xs font-bold text-white ${
          rarity === 'C' ? 'bg-gray-500' :
          rarity === 'U' ? 'bg-green-500' :
          rarity === 'R' ? 'bg-blue-500' :
          rarity === 'VR' ? 'bg-purple-500' :
          rarity === 'SR' ? 'bg-yellow-500' :
          rarity === 'MR' ? 'bg-red-500' : 'bg-gray-500'
        }`}>
          {rarity}
        </div>
      )}
    </div>
  )
}

/**
 * アバター画像（ユーザーアイコン等）
 */
export function AvatarImage({
  src,
  name,
  size = 40,
  className = ''
}: {
  src?: string
  name: string
  size?: number
  className?: string
}) {
  const [hasError, setHasError] = useState(false)

  if (!src || hasError) {
    // フォールバック: イニシャル表示
    const initials = name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)

    return (
      <div 
        className={`
          flex items-center justify-center rounded-full 
          bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 
          font-medium ${className}
        `}
        style={{ width: size, height: size, fontSize: size * 0.4 }}
      >
        {initials}
      </div>
    )
  }

  return (
    <LazyImage
      src={src}
      alt={`${name}のアバター`}
      width={size}
      height={size}
      className={`rounded-full ${className}`}
      onError={() => setHasError(true)}
      quality={90}
    />
  )
}