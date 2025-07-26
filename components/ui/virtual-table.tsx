// 大量データ用の仮想化テーブルコンポーネント

'use client'

import { useMemo } from 'react'
import { useVirtualList } from '@/lib/hooks/use-virtual-list'

interface Column<T> {
  key: keyof T | string
  label: string
  width?: number
  render?: (value: any, item: T, index: number) => React.ReactNode
  sortable?: boolean
}

interface VirtualTableProps<T> {
  data: T[]
  columns: Column<T>[]
  rowHeight?: number
  height?: number
  className?: string
  onRowClick?: (item: T, index: number) => void
  loading?: boolean
  emptyMessage?: string
}

/**
 * 大量データを効率的に表示する仮想化テーブル
 */
export function VirtualTable<T extends Record<string, any>>({
  data,
  columns,
  rowHeight = 60,
  height = 400,
  className = '',
  onRowClick,
  loading = false,
  emptyMessage = 'データがありません'
}: VirtualTableProps<T>) {
  const {
    virtualItems,
    totalHeight,
    handleScroll,
    setScrollElement
  } = useVirtualList(data, {
    itemHeight: rowHeight,
    containerHeight: height,
    overscan: 5
  })

  // カラム幅の計算
  const columnWidths = useMemo(() => {
    const totalSpecifiedWidth = columns.reduce((sum, col) => sum + (col.width || 0), 0)
    const unspecifiedColumns = columns.filter(col => !col.width).length
    const remainingWidth = Math.max(0, 100 - (totalSpecifiedWidth / 8)) // 8px = 1%相当
    const defaultWidth = unspecifiedColumns > 0 ? remainingWidth / unspecifiedColumns : 0

    return columns.map(col => col.width || defaultWidth * 8) // pxに変換
  }, [columns])

  if (loading) {
    return (
      <div className={`border border-gray-200 dark:border-gray-700 rounded-lg ${className}`}>
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">読み込み中...</p>
        </div>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className={`border border-gray-200 dark:border-gray-700 rounded-lg ${className}`}>
        <div className="p-8 text-center">
          <p className="text-gray-600 dark:text-gray-400">{emptyMessage}</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden ${className}`}>
      {/* ヘッダー */}
      <div className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <div className="flex">
          {columns.map((column, index) => (
            <div
              key={String(column.key)}
              className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-r border-gray-200 dark:border-gray-700 last:border-r-0"
              style={{ width: columnWidths[index] }}
            >
              {column.label}
            </div>
          ))}
        </div>
      </div>

      {/* 仮想化されたボディ */}
      <div
        ref={setScrollElement}
        className="relative overflow-auto bg-white dark:bg-gray-800"
        style={{ height }}
        onScroll={handleScroll}
      >
        <div style={{ height: totalHeight }}>
          {virtualItems.map(({ index, data: item, style }) => (
            <div
              key={index}
              style={style}
              className={`
                flex border-b border-gray-200 dark:border-gray-700 last:border-b-0
                ${onRowClick ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700' : ''}
              `}
              onClick={() => onRowClick?.(item, index)}
            >
              {columns.map((column, colIndex) => {
                const value = typeof column.key === 'string' && column.key.includes('.')
                  ? column.key.split('.').reduce((obj, key) => obj?.[key], item)
                  : item[column.key as keyof T]

                return (
                  <div
                    key={String(column.key)}
                    className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-700 last:border-r-0 flex items-center"
                    style={{ width: columnWidths[colIndex] }}
                  >
                    {column.render ? column.render(value, item, index) : String(value || '')}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/**
 * カード管理用の最適化されたテーブル
 */
export function CardVirtualTable({
  cards,
  onCardClick,
  loading = false
}: {
  cards: any[]
  onCardClick?: (card: any) => void
  loading?: boolean
}) {
  const columns: Column<any>[] = [
    {
      key: 'name',
      label: 'カード名',
      width: 200,
    },
    {
      key: 'rarity.name',
      label: 'レアリティ',
      width: 100,
      render: (value, card) => (
        <span className={`
          px-2 py-1 text-xs font-semibold rounded-full
          ${card.rarity?.name === 'C' ? 'bg-gray-100 text-gray-800' :
            card.rarity?.name === 'U' ? 'bg-green-100 text-green-800' :
            card.rarity?.name === 'R' ? 'bg-blue-100 text-blue-800' :
            card.rarity?.name === 'VR' ? 'bg-purple-100 text-purple-800' :
            card.rarity?.name === 'SR' ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'}
        `}>
          {value}
        </span>
      )
    },
    {
      key: 'pack.name',
      label: '弾',
      width: 150,
    },
    {
      key: 'buyback_price',
      label: '買取価格',
      width: 100,
      render: (value) => value ? `${value.toLocaleString()}円` : '-'
    },
    {
      key: 'updated_at',
      label: '更新日',
      width: 120,
      render: (value) => new Date(value).toLocaleDateString('ja-JP')
    }
  ]

  return (
    <VirtualTable
      data={cards}
      columns={columns}
      rowHeight={64}
      height={500}
      onRowClick={onCardClick}
      loading={loading}
      emptyMessage="カードが見つかりません"
      className="shadow-sm"
    />
  )
}

/**
 * ユーザー管理用の最適化されたテーブル
 */
export function UserVirtualTable({
  users,
  onUserClick,
  onRoleChange,
  loading = false
}: {
  users: any[]
  onUserClick?: (user: any) => void
  onRoleChange?: (userId: string, role: string) => void
  loading?: boolean
}) {
  const columns: Column<any>[] = [
    {
      key: 'email',
      label: 'メールアドレス',
      width: 250,
    },
    {
      key: 'role',
      label: 'ロール',
      width: 120,
      render: (value) => (
        <span className={`
          px-2 py-1 text-xs font-semibold rounded-full
          ${value === 'admin' ? 'bg-red-100 text-red-800' :
            value === 'friend' ? 'bg-blue-100 text-blue-800' :
            'bg-gray-100 text-gray-800'}
        `}>
          {value === 'admin' ? '管理者' : value === 'friend' ? '知り合い' : '一般ユーザー'}
        </span>
      )
    },
    {
      key: 'created_at',
      label: '登録日',
      width: 120,
      render: (value) => new Date(value).toLocaleDateString('ja-JP')
    },
    {
      key: 'actions',
      label: 'アクション',
      width: 150,
      render: (_, user) => onRoleChange ? (
        <select
          value={user.role}
          onChange={(e) => onRoleChange(user.id, e.target.value)}
          className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-xs bg-white dark:bg-gray-700"
          onClick={(e) => e.stopPropagation()} // 行クリックを防ぐ
        >
          <option value="user">一般ユーザー</option>
          <option value="friend">知り合い</option>
          <option value="admin">管理者</option>
        </select>
      ) : null
    }
  ]

  return (
    <VirtualTable
      data={users}
      columns={columns}
      rowHeight={56}
      height={450}
      onRowClick={onUserClick}
      loading={loading}
      emptyMessage="ユーザーが見つかりません"
      className="shadow-sm"
    />
  )
}