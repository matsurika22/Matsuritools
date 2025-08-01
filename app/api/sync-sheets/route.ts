import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { GoogleSheetsService } from '@/lib/services/google-sheets'

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // 管理者権限チェック
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // 管理者ロールチェック
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    
    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }
    
    const { action } = await request.json()
    
    if (action !== 'sync') {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
    
    // Google Sheetsサービスを初期化
    const sheetsService = new GoogleSheetsService()
    
    // すべてのパックを取得
    const { data: packs } = await supabase
      .from('packs')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (!packs || packs.length === 0) {
      return NextResponse.json({ error: 'No packs found' }, { status: 404 })
    }
    
    let totalSyncedCards = 0
    const results = []
    
    // 各パックのデータを同期
    for (const pack of packs) {
      try {
        console.log(`Syncing pack: ${pack.name}`)
        const syncedCards = await sheetsService.syncPackData(pack)
        totalSyncedCards += syncedCards
        results.push({
          packId: pack.id,
          packName: pack.name,
          syncedCards,
          status: 'success'
        })
      } catch (error) {
        console.error(`Error syncing pack ${pack.name}:`, error)
        results.push({
          packId: pack.id,
          packName: pack.name,
          syncedCards: 0,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }
    
    return NextResponse.json({
      success: true,
      syncedCards: totalSyncedCards,
      results
    })
  } catch (error) {
    console.error('Sync error:', error)
    return NextResponse.json({
      error: 'Failed to sync data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}