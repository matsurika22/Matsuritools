// シンプルなGoogle Sheets API実装（API Key使用）

export class GoogleSheetsService {
  private spreadsheetId: string
  private baseUrl = 'https://sheets.googleapis.com/v4/spreadsheets'
  
  constructor(spreadsheetId?: string) {
    this.spreadsheetId = spreadsheetId || process.env.GOOGLE_SHEETS_ID || ''
    
    if (!this.spreadsheetId) {
      console.error('⚠️  GOOGLE_SHEETS_IDが設定されていません')
    }
    if (!process.env.GOOGLE_SHEETS_API_KEY) {
      console.error('⚠️  GOOGLE_SHEETS_API_KEYが設定されていません')
    }
  }

  /**
   * スプレッドシートからデータを取得
   */
  private async fetchSheetData(range: string): Promise<string[][]> {
    const apiKey = process.env.GOOGLE_SHEETS_API_KEY
    if (!apiKey) {
      throw new Error('GOOGLE_SHEETS_API_KEY is not set')
    }

    if (!this.spreadsheetId) {
      throw new Error('Missing required parameters: spreadsheetId')
    }

    const url = `${this.baseUrl}/${this.spreadsheetId}/values/${encodeURIComponent(range)}?key=${apiKey}`
    
    try {
      console.log(`📊 Fetching data from sheet: ${range}`)
      const response = await fetch(url)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error(`Google Sheets API error: ${response.status} ${errorText}`)
        throw new Error(`Failed to fetch sheet data: ${response.statusText}`)
      }
      
      const data = await response.json()
      return data.values || []
    } catch (error) {
      console.error(`Error fetching sheet data for range ${range}:`, error)
      throw new Error(`スプレッドシートの読み込みに失敗しました: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * カードデータを取得
   * シート形式: A列=カード名, B列=型番, C列=弾ID, D列=レアリティ, E列=買取価格, F列=参考販売価格
   */
  async fetchCardData(packId?: string): Promise<any[]> {
    const sheetName = packId ? `${packId}_カード` : 'カードマスター'
    const data = await this.fetchSheetData(`${sheetName}!A2:F5000`)
    
    return data
      .filter(row => row[0] && row[1] && row[2] && row[3]) // 名前、型番、弾ID、レアリティが必須
      .map((row, index) => ({
        id: row[1] || `${row[2]}_${String(index + 1).padStart(3, '0')}`, // 型番、または弾ID_001 形式
        name: row[0],
        card_number: row[1],
        pack_id: row[2],
        rarity: row[3],
        buyback_price: parseInt(row[4] || '0'),
        reference_price: row[5] ? parseInt(row[5]) : undefined
      }))
      .filter(card => !packId || card.pack_id === packId)
  }

  /**
   * 特定の弾のカードデータのみを取得
   */
  async fetchPackCards(packId: string): Promise<any[]> {
    console.log(`📄 fetchPackCards: ${packId}のデータを取得中...`)
    const cards = await this.fetchCardData(packId)
    console.log(`✅ fetchPackCards: ${cards.length}件のカードを取得しました`)
    
    // サンプルを表示
    if (cards.length > 0) {
      console.log('サンプルデータ:')
      cards.slice(0, 3).forEach(card => {
        console.log(`  ${card.card_number}: ${card.name} - 買取: ${card.buyback_price}円`)
      })
    }
    
    return cards
  }

  /**
   * 特定のパックのデータをSupabaseに同期
   */
  async syncPackData(pack: any): Promise<number> {
    // Supabaseクライアントをインポート
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    console.log(`\n🔄 ${pack.name} (${pack.id}) のデータを同期中...`)
    
    const cards = await this.fetchPackCards(pack.id)
    console.log(`📄 スプレッドシートから${cards.length}件のカードを取得`)
    
    // サンプルを表示
    if (cards.length > 0) {
      console.log('サンプルデータ:')
      cards.slice(0, 3).forEach(card => {
        console.log(`  ${card.card_number}: ${card.name} - 買取: ${card.buyback_price}円`)
      })
    }
    
    let syncedCards = 0
    let updatedCards = 0

    // レアリティマスターを取得
    const { data: rarities } = await supabase
      .from('rarities')
      .select('id, name')
    
    const rarityMap = new Map(rarities?.map((r: any) => [r.name, r.id]) || [])

    // カード情報をデータベースに保存
    for (const card of cards) {
      const rarityId = rarityMap.get(card.rarity)
      if (!rarityId) {
        console.warn(`⚠️  レアリティ "${card.rarity}" が見つかりません: ${card.name}`)
        continue
      }

      // 新しいカードID形式: pack_id + "__" + card_number
      const cardId = `${card.pack_id}__${card.card_number}`

      // 既存のカードを確認
      const { data: existingCard } = await supabase
        .from('cards')
        .select('parameters')
        .eq('id', cardId)
        .single()
      
      const isUpdate = existingCard && 
        existingCard.parameters?.buyback_price !== card.buyback_price

      const cardData = {
        id: cardId,
        name: card.name,
        card_number: card.card_number,
        pack_id: card.pack_id,
        rarity_id: rarityId,
        // 一時的にparametersフィールドに価格情報を保存
        parameters: {
          buyback_price: card.buyback_price,
          reference_price: card.reference_price
        },
        updated_at: new Date().toISOString()
      }

      const { error } = await supabase
        .from('cards')
        .upsert(cardData, { onConflict: 'id' })
      
      if (error) {
        console.error(`❌ エラー: ${card.name} - ${error.message}`)
      } else {
        syncedCards++
        if (isUpdate) {
          updatedCards++
          // 特定のカードをデバッグ
          if (card.card_number === '6/77') {
            console.log(`✅ ${card.name} (${card.card_number}) を更新: ${existingCard.parameters?.buyback_price}円 → ${card.buyback_price}円`)
          }
        }
      }
    }

    console.log(`✅ ${pack.name}: ${syncedCards}件同期完了 (うち${updatedCards}件更新)`)
    return syncedCards
  }
}