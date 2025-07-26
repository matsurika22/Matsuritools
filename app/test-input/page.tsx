'use client'

import { useState } from 'react'

export default function TestInputPage() {
  const [value1, setVal

1] = useState('')
  const [value2, setValue2] = useState('')
  const [value3, setValue3] = useState('')

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold mb-4">入力フィールドテスト</h1>
      
      <div>
        <label className="block text-sm font-medium mb-1">通常の入力</label>
        <input
          type="text"
          value={value1}
          onChange={(e) => setValue1(e.target.value)}
          className="flex h-10 w-full rounded-md border bg-white px-3 py-2 text-sm"
          placeholder="大文字小文字を入力してください"
        />
        <p className="text-sm text-gray-600 mt-1">入力値: {value1}</p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">uppercaseクラス付き</label>
        <input
          type="text"
          value={value2}
          onChange={(e) => setValue2(e.target.value)}
          className="flex h-10 w-full rounded-md border bg-white px-3 py-2 text-sm uppercase"
          placeholder="大文字小文字を入力してください"
        />
        <p className="text-sm text-gray-600 mt-1">入力値: {value2}</p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">style属性付き</label>
        <input
          type="text"
          value={value3}
          onChange={(e) => setValue3(e.target.value)}
          className="flex h-10 w-full rounded-md border bg-white px-3 py-2 text-sm"
          style={{ textTransform: 'uppercase' }}
          placeholder="大文字小文字を入力してください"
        />
        <p className="text-sm text-gray-600 mt-1">入力値: {value3}</p>
      </div>
    </div>
  )
}