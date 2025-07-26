'use client'

import { useState, useEffect } from 'react'
import { Clock, Shield } from 'lucide-react'

interface RateLimitNoticeProps {
  seconds: number
  onComplete?: () => void
}

export function RateLimitNotice({ seconds, onComplete }: RateLimitNoticeProps) {
  const [timeLeft, setTimeLeft] = useState(seconds)

  useEffect(() => {
    if (timeLeft <= 0) {
      onComplete?.()
      return
    }

    const timer = setTimeout(() => {
      setTimeLeft(timeLeft - 1)
    }, 1000)

    return () => clearTimeout(timer)
  }, [timeLeft, onComplete])

  if (timeLeft <= 0) {
    return (
      <div className="p-4 text-sm text-green-600 bg-green-50 border border-green-200 rounded-md dark:bg-green-900/20 dark:border-green-800 flex items-center gap-2">
        <Shield className="h-4 w-4" />
        <span>再度お試しいただけます</span>
      </div>
    )
  }

  return (
    <div className="p-4 text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-md dark:bg-amber-900/20 dark:border-amber-800">
      <div className="flex items-center gap-2 mb-2">
        <Clock className="h-4 w-4" />
        <span className="font-medium">セキュリティ制限中</span>
      </div>
      <p className="mb-2">
        安全のため、一時的にアクセスを制限しています。
      </p>
      <div className="flex items-center gap-2">
        <div className="bg-amber-200 dark:bg-amber-800 rounded-full px-3 py-1 text-xs font-mono">
          {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
        </div>
        <span className="text-xs">後に再度お試しください</span>
      </div>
    </div>
  )
}