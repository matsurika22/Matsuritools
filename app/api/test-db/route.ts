import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// サービスロールキーを使用（環境変数から）
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

export async function GET() {
  try {
    // 1. usersテーブルの存在確認
    const { data: tables, error: tablesError } = await supabaseAdmin
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'users')

    if (tablesError) {
      return NextResponse.json({ 
        error: 'Failed to check tables', 
        details: tablesError 
      }, { status: 500 })
    }

    // 2. usersテーブルのカラム情報
    const { data: columns, error: columnsError } = await supabaseAdmin
      .from('information_schema.columns')
      .select('column_name, data_type')
      .eq('table_schema', 'public')
      .eq('table_name', 'users')

    if (columnsError) {
      return NextResponse.json({ 
        error: 'Failed to check columns', 
        details: columnsError 
      }, { status: 500 })
    }

    // 3. 現在のユーザー数
    const { count, error: countError } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true })

    if (countError) {
      return NextResponse.json({ 
        error: 'Failed to count users', 
        details: countError 
      }, { status: 500 })
    }

    // 4. RLSの状態確認
    const { data: rlsStatus, error: rlsError } = await supabaseAdmin
      .rpc('check_rls_status', { table_name: 'users' })
      .single()

    return NextResponse.json({
      success: true,
      data: {
        tableExists: tables && tables.length > 0,
        columns: columns,
        userCount: count,
        rlsEnabled: rlsStatus,
        timestamp: new Date().toISOString()
      }
    })
  } catch (error: any) {
    return NextResponse.json({ 
      error: 'Unexpected error', 
      message: error.message 
    }, { status: 500 })
  }
}