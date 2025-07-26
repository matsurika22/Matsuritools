'use client'

// エラーバウンダリーコンポーネント
// React アプリケーション全体のエラーをキャッチして適切に表示

import React from 'react'
import { AppError, logError } from '@/lib/utils/error-handler'

interface ErrorBoundaryState {
  hasError: boolean
  error: AppError | null
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error: AppError; resetError: () => void }>
}

// デフォルトのエラー表示コンポーネント
function DefaultErrorFallback({ 
  error, 
  resetError 
}: { 
  error: AppError
  resetError: () => void 
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6 border border-red-200 dark:border-red-800">
          <div className="flex items-center space-x-3 mb-4">
            <div className="flex-shrink-0">
              <svg 
                className="h-8 w-8 text-red-500" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" 
                />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              エラーが発生しました
            </h2>
          </div>
          
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {error.message}
          </p>
          
          <div className="flex space-x-3">
            <button
              onClick={resetError}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
            >
              もう一度試す
            </button>
            
            <button
              onClick={() => window.location.href = '/'}
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
            >
              ホームに戻る
            </button>
          </div>
          
          {error.type === 'network' && (
            <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                💡 ネットワーク接続を確認して、再度お試しください
              </p>
            </div>
          )}
          
          {error.type === 'permission' && (
            <div className="mt-4 p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-md">
              <p className="text-sm text-orange-800 dark:text-orange-200">
                🔒 管理者にお問い合わせください
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // エラーをAppError形式に変換
    const appError: AppError = {
      type: 'unknown',
      message: 'アプリケーションでエラーが発生しました',
      originalError: error
    }

    return {
      hasError: true,
      error: appError
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // エラーをログに記録
    const appError: AppError = {
      type: 'unknown',
      message: error.message || 'React Error Boundary caught an error',
      originalError: { error, errorInfo }
    }
    
    logError(appError, 'ErrorBoundary')
  }

  resetError = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError && this.state.error) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback
      
      return (
        <FallbackComponent 
          error={this.state.error} 
          resetError={this.resetError}
        />
      )
    }

    return this.props.children
  }
}

// Hook として使用できる関数版エラーバウンダリー
export function useErrorHandler() {
  return (error: any, context?: string) => {
    // エラーをログに記録し、Error Boundary で捕捉できるようにスロー
    const appError: AppError = {
      type: error.type || 'unknown',
      message: error.message || 'An error occurred',
      originalError: error
    }
    
    logError(appError, context)
    throw error
  }
}