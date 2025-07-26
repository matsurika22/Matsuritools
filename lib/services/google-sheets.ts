// Google Sheets API連携サービス
// カードデータと買取価格をGoogleスプレッドシートから取得

import { GoogleAuth } from 'google-auth-library'
import { google as googleapis } from 'googleapis'

interface SheetData {
  values: string[][]
}

interface CardData {
  id: string
  name: string
  card_number: string
  rarity: string
  buyback_price: number
  reference_price?: number
  pack_id: string
}

interface PackData {
  id: string
  name: string
  release_date: string
  box_price: number
  packs_per_box: number
  cards_per_pack: number
}

/**
 * Google Sheets APIクライアント
 */
export class GoogleSheetsService {
  private auth: GoogleAuth
  private spreadsheetId: string

  constructor(spreadsheetId: string) {
    this.spreadsheetId = spreadsheetId
    
    // サービスアカウント認証の設定
    this.auth = new GoogleAuth({
      keyFile: process.env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE,
      credentials: process.env.GOOGLE_SERVICE_ACCOUNT_KEY 
        ? JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY)
        : undefined,
      scopes: [
        'https://www.googleapis.com/auth/spreadsheets.readonly'
      ]
    })
  }

  /**
   * スプレッドシートからデータを取得
   */
  private async fetchSheetData(range: string): Promise<string[][]> {
    try {
      const authClient = await this.auth.getClient()
      const sheets = googleapis.sheets({ version: 'v4', auth: authClient as any })

      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range,
      })

      return response.data.values || []
    } catch (error) {
      console.error(`Google Sheets API error for range ${range}:`, error)
      throw new Error(`スプレッドシートの読み込みに失敗しました: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * 弾データを取得
   * シート形式: A列=ID, B列=弾名, C列=発売日, D列=定価, E列=パック数, F列=カード数
   */
  async fetchPackData(): Promise<PackData[]> {
    const data = await this.fetchSheetData('弾マスター!A2:F1000')
    
    return data
      .filter(row => row[0] && row[1]) // IDと弾名が必須
      .map(row => ({
        id: row[0],
        name: row[1],
        release_date: row[2] || '',
        box_price: parseInt(row[3] || '0'),
        packs_per_box: parseInt(row[4] || '24'),
        cards_per_pack: parseInt(row[5] || '11')
      }))
  }

  /**
   * レアリティデータを取得
   * シート形式: A列=レアリティ名_a（略称）, B列=レアリティ名（表示名）, C列=色, D列=ソート順
   */
  async fetchRarityData(): Promise<Array<{name: string, display_name: string, color: string, display_order: number}>> {
    const data = await this.fetchSheetData('レアリティマスター!A2:D100')
    
    return data
      .filter(row => row[0]) // レアリティ名_a（略称）が必須
      .map(row => ({
        name: row[0], // 略称（例: OR）
        display_name: row[1] || row[0], // 表示名（例: オーバーレア）
        color: row[2] || '#6B7280',
        display_order: parseInt(row[3] || '1')
      }))
  }

  /**
   * カードデータを取得
   * シート形式: A列=カード名, B列=型番, C列=弾ID, D列=レアリティ, E列=買取価格, F列=参考販売価格
   */
  async fetchCardData(packId?: string): Promise<CardData[]> {
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
  async fetchPackCards(packId: string): Promise<CardData[]> {
    return this.fetchCardData(packId)
  }

  /**
   * 買取価格の更新を検知（定期実行用）
   */
  async checkForUpdates(): Promise<{
    lastUpdated: string
    hasUpdates: boolean
  }> {
    try {
      // メタデータシートから最終更新日時を取得
      const data = await this.fetchSheetData('メタデータ!A1:B10')
      const lastUpdatedRow = data.find(row => row[0] === '最終更新日時')
      const lastUpdated = lastUpdatedRow?.[1] || new Date().toISOString()

      // キャッシュされた最終更新日時と比較
      const cachedLastUpdated = await this.getCachedLastUpdated()
      const hasUpdates = lastUpdated !== cachedLastUpdated

      if (hasUpdates) {
        await this.setCachedLastUpdated(lastUpdated)
      }

      return { lastUpdated, hasUpdates }
    } catch (error) {
      console.error('Update check failed:', error)
      return { lastUpdated: new Date().toISOString(), hasUpdates: false }
    }
  }

  private async getCachedLastUpdated(): Promise<string | null> {
    // Redis or Supabaseに保存された最終更新日時を取得
    // 簡易実装では環境変数やローカルストレージを使用
    return process.env.SHEETS_LAST_UPDATED || null
  }

  private async setCachedLastUpdated(timestamp: string): Promise<void> {
    // 最終更新日時をキャッシュに保存
    // 本来はRedisやSupabaseに保存
    process.env.SHEETS_LAST_UPDATED = timestamp
  }
}

/**
 * Google Sheets同期サービス
 * データベースとスプレッドシートの同期を管理
 */
export class SheetsSyncService {
  private sheetsService: GoogleSheetsService
  private supabase: any // Supabaseクライアント

  constructor(spreadsheetId: string, supabaseClient: any) {
    this.sheetsService = new GoogleSheetsService(spreadsheetId)
    this.supabase = supabaseClient
  }

  /**
   * 全データを同期
   */
  async syncAll(): Promise<{
    packs: number
    rarities: number
    cards: number
    errors: string[]
  }> {
    const errors: string[] = []
    let syncedPacks = 0
    let syncedRarities = 0
    let syncedCards = 0

    try {
      // 1. レアリティの同期
      console.log('レアリティデータを同期中...')
      const rarities = await this.sheetsService.fetchRarityData()
      
      for (const rarity of rarities) {
        const rarityData = {
          name: rarity.name,
          display_name: rarity.display_name,
          color: rarity.color,
          display_order: rarity.display_order
        }
        
        const { error } = await this.supabase
          .from('rarities')
          .upsert(rarityData, { onConflict: 'name' })
        
        if (error) {
          errors.push(`レアリティ ${rarity.name}: ${error.message}`)
        } else {
          syncedRarities++
        }
      }

      // 2. 弾データの同期
      console.log('弾データを同期中...')
      const packs = await this.sheetsService.fetchPackData()
      
      for (const pack of packs) {
        const { error } = await this.supabase
          .from('packs')
          .upsert(pack, { onConflict: 'id' })
        
        if (error) {
          errors.push(`弾 ${pack.name}: ${error.message}`)
        } else {
          syncedPacks++
        }
      }

      // 3. カードデータの同期
      console.log('カードデータを同期中...')
      const cards = await this.sheetsService.fetchCardData()
      
      // レアリティIDマップを作成
      const { data: rarityData } = await this.supabase
        .from('rarities')
        .select('id, name')
      
      const rarityMap = new Map(rarityData?.map((r: any) => [r.name, r.id]) || [])

      for (const card of cards) {
        const rarityId = rarityMap.get(card.rarity)
        if (!rarityId) {
          errors.push(`カード ${card.name}: レアリティ ${card.rarity} が見つかりません`)
          continue
        }

        const cardData = {
          id: card.card_number || `${card.pack_id}_${card.name.replace(/[^a-zA-Z0-9]/g, '_')}`,
          name: card.name,
          card_number: card.card_number,
          pack_id: card.pack_id,
          rarity_id: rarityId,
          // 一時的にparametersフィールドに価格情報を保存
          parameters: {
            buyback_price: card.buyback_price,
            reference_price: card.reference_price
          }
        }

        const { error } = await this.supabase
          .from('cards')
          .upsert(cardData, { onConflict: 'id' })
        
        if (error) {
          errors.push(`カード ${card.name}: ${error.message}`)
        } else {
          syncedCards++
        }
      }

      console.log(`同期完了: 弾=${syncedPacks}, レアリティ=${syncedRarities}, カード=${syncedCards}`)
      
    } catch (error) {
      errors.push(`同期処理エラー: ${error instanceof Error ? error.message : String(error)}`)
    }

    return {
      packs: syncedPacks,
      rarities: syncedRarities,
      cards: syncedCards,
      errors
    }
  }

  /**
   * 特定の弾のみ同期
   */
  async syncPack(packId: string): Promise<number> {
    const cards = await this.sheetsService.fetchPackCards(packId)
    let syncedCards = 0

    // レアリティIDマップを作成
    const { data: rarityData } = await this.supabase
      .from('rarities')
      .select('id, name')
    
    const rarityMap = new Map(rarityData?.map((r: any) => [r.name, r.id]) || [])

    for (const card of cards) {
      const rarityId = rarityMap.get(card.rarity)
      if (!rarityId) continue

      const cardData = {
        id: card.card_number || `${card.pack_id}_${card.name.replace(/[^a-zA-Z0-9]/g, '_')}`,
        name: card.name,
        card_number: card.card_number,
        pack_id: card.pack_id,
        rarity_id: rarityId,
        // 一時的にparametersフィールドに価格情報を保存
        parameters: {
          buyback_price: card.buyback_price,
          reference_price: card.reference_price
        }
      }

      const { error } = await this.supabase
        .from('cards')
        .upsert(cardData, { onConflict: 'id' })
      
      if (!error) syncedCards++
    }

    return syncedCards
  }
}

// 必要なライブラリのインポート（型定義のみ）
declare const google: any