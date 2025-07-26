'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

export default function TestAccessCodesPage() {
  const [codes, setCodes] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCodes = async () => {
      try {
        console.log('Fetching access codes...')
        
        const { data, error } = await supabase
          .from('access_codes')
          .select('*')
          .order('created_at', { ascending: false })

        console.log('Query result:', { data, error })

        if (error) {
          setError(`Error: ${error.message} (${error.code})`)
          console.error('Supabase error:', error)
        } else {
          setCodes(data || [])
        }
      } catch (err: any) {
        setError(`Catch error: ${err.message}`)
        console.error('Catch error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchCodes()
  }, [])

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">アクセスコードテスト</h1>
      
      {loading && <p>読み込み中...</p>}
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {!loading && !error && (
        <div>
          <p className="mb-4">見つかったアクセスコード: {codes.length}件</p>
          
          <div className="space-y-2">
            {codes.map((code) => (
              <div key={code.code} className="bg-gray-100 p-3 rounded">
                <p className="font-mono font-bold">{code.code}</p>
                <p className="text-sm text-gray-600">
                  作成日: {new Date(code.created_at).toLocaleString('ja-JP')}
                </p>
                <p className="text-sm text-gray-600">
                  有効期限: {code.valid_until ? new Date(code.valid_until).toLocaleString('ja-JP') : '無期限'}
                </p>
              </div>
            ))}
          </div>

          {codes.length === 0 && (
            <p className="text-gray-500">アクセスコードが登録されていません</p>
          )}
        </div>
      )}
    </div>
  )
}