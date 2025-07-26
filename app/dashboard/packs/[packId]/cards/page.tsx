'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2, ArrowLeft, Save, Calculator, RotateCcw, Search, Plus, ChevronDown, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { supabase } from '@/lib/supabase/client'
import { getPackCards, getUserPrices, saveUserPrices, calculateExpectedValue } from '@/lib/supabase/cards'
import { CardPriceList } from '@/components/features/cards/card-price-list'
import type { Card, Pack } from '@/types/cards'

interface PageProps {
  params: { packId: string }
}

export default function CardsPage({ params }: PageProps) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [cards, setCards] = useState<Card[]>([])
  const [pack, setPack] = useState<Pack | null>(null)
  const [prices, setPrices] = useState<Map<string, number>>(new Map())
  const [boxPrice, setBoxPrice] = useState<number>(0)
  const [user, setUser] = useState<any>(null)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [selectedCards, setSelectedCards] = useState<Set<string>>(new Set())
  const [customCardIds, setCustomCardIds] = useState<string[]>([]) // 管理者が設定したカスタムカード
  const [displayRarityIds, setDisplayRarityIds] = useState<string[]>([]) // 管理者が設定した表示レアリティ
  const [rarities, setRarities] = useState<any[]>([]) // レアリティマスター
  const [tenYenExpanded, setTenYenExpanded] = useState(false) // 10円のカード達の開閉状態
  const router = useRouter()

  useEffect(() => {
    const loadData = async () => {
      try {
        // ユーザー認証チェック
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/login')
          return
        }
        setUser(user)

        // パック情報を取得
        const { data: packData } = await supabase
          .from('packs')
          .select('*')
          .eq('id', params.packId)
          .single()
        
        if (packData) {
          console.log('Pack data loaded:', {
            id: packData.id,
            name: packData.name,
            custom_card_ids: packData.custom_card_ids,
            display_rarity_ids: packData.display_rarity_ids
          })
          setPack(packData)
          setBoxPrice(packData.box_price || 0)
          // カスタムカードIDと表示レアリティIDを設定（カラムが存在する場合のみ）
          try {
            if (packData.custom_card_ids && Array.isArray(packData.custom_card_ids) && packData.custom_card_ids.length > 0) {
              console.log('Setting custom card IDs:', packData.custom_card_ids)
              setCustomCardIds(packData.custom_card_ids)
            }
            if (packData.display_rarity_ids && Array.isArray(packData.display_rarity_ids) && packData.display_rarity_ids.length > 0) {
              console.log('Setting display rarity IDs:', packData.display_rarity_ids)
              setDisplayRarityIds(packData.display_rarity_ids)
            }
          } catch (e) {
            console.log('custom settings not available yet')
          }
        }

        // カード一覧を取得
        const cardList = await getPackCards(params.packId)
        console.log('Cards loaded:', cardList.length, 'cards')
        setCards(cardList)

        // レアリティマスターを取得し、数値順でソート
        const { data: raritiesData } = await supabase
          .from('rarities')
          .select('*')
        
        // JavaScriptで確実に数値ソート
        const sortedRarities = (raritiesData || []).sort((a, b) => {
          const orderA = Number(a.display_order) || 999
          const orderB = Number(b.display_order) || 999
          return orderA - orderB
        })
        
        console.log('Rarities after manual sort:')
        sortedRarities.forEach(r => {
          console.log(`${r.name}: display_name='${r.display_name}', display_order=${r.display_order} (${typeof r.display_order}), numeric=${Number(r.display_order)}`)
        })
        
        setRarities(sortedRarities)

        // ユーザーの保存済み価格を取得
        const userPrices = await getUserPrices(user.id, params.packId)
        
        // ユーザー価格がない場合はデータベースの買取価格を初期値とする（なければ0円）
        if (userPrices.size === 0) {
          const initialPrices = new Map<string, number>()
          cardList.forEach(card => {
            // parametersフィールドから買取価格を取得、なければ0
            const buybackPrice = card.parameters?.buyback_price || 0
            initialPrices.set(card.id, buybackPrice)
          })
          setPrices(initialPrices)
        } else {
          setPrices(userPrices)
        }
        
        // カードの最終更新日時を取得（カードデータの最新の更新日時）
        const { data: latestCard } = await supabase
          .from('cards')
          .select('updated_at')
          .eq('pack_id', params.packId)
          .order('updated_at', { ascending: false })
          .limit(1)
          .single()
        
        if (latestCard) {
          setLastUpdated(latestCard.updated_at)
        }
      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [params.packId, router])

  const handlePriceChange = (cardId: string, value: string) => {
    const price = parseInt(value) || 0
    const newPrices = new Map(prices)
    newPrices.set(cardId, price)
    setPrices(newPrices)
  }

  const handleResetPrices = () => {
    if (confirm('すべての価格を0円にリセットしますか？')) {
      const resetPrices = new Map<string, number>()
      cards.forEach(card => {
        resetPrices.set(card.id, 0)
      })
      setPrices(resetPrices)
    }
  }

  const handleSave = async () => {
    if (!user) return

    try {
      setSaving(true)
      
      // 表示されているカードとユーザーが追加したカードのみを収集
      const visibleCardIds = new Set<string>()
      
      // 表示レアリティのカードを追加
      displayRarities.forEach(rarityName => {
        const rarityCards = cardsByRarity[rarityName] || []
        rarityCards.forEach(card => visibleCardIds.add(card.id))
      })
      
      // カスタムカード（管理者設定）を追加
      customCardIds.forEach(cardId => visibleCardIds.add(cardId))
      
      // ユーザーが追加したカードを追加
      selectedCards.forEach(cardId => visibleCardIds.add(cardId))
      
      // 表示されているカードの価格のみを抽出
      const priceData = Array.from(prices.entries())
        .filter(([cardId]) => visibleCardIds.has(cardId))
        .map(([cardId, price]) => ({
          cardId,
          price
        }))
      
      // 価格を保存
      await saveUserPrices(user.id, priceData)
      
      // 保存が確実に完了したことを確認
      console.log(`Saved ${priceData.length} prices for user ${user.id} (out of ${prices.size} total)`)
      
      // 少し待機してから期待値計算画面へ遷移
      setTimeout(() => {
        router.push(`/dashboard/packs/${params.packId}/result?boxPrice=${boxPrice}&displayedCards=${visibleCardIds.size}`)
      }, 100)
    } catch (error) {
      console.error('Error saving prices:', error)
      alert('保存に失敗しました')
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    )
  }

  if (!pack) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>パック情報が見つかりません</p>
      </div>
    )
  }

  // 表示するレアリティIDからレアリティ名のセットを作成
  const displayRarityNames = new Set<string>()
  if (displayRarityIds.length > 0) {
    console.log('Checking display rarity matching:', {
      displayRarityIds,
      cardRarityIds: cards.slice(0, 5).map(c => ({ id: c.rarity?.id, name: c.rarity?.name, type: typeof c.rarity?.id }))
    })
    cards.forEach(card => {
      if (card.rarity?.id && displayRarityIds.includes(String(card.rarity.id))) {
        displayRarityNames.add(card.rarity.name)
      }
    })
  }
  
  // レアリティの表示名マッピング（手動で設定）
  const rarityDisplayNames: Record<string, string> = {
    'C': 'コモン',
    'U': 'アンコモン',
    'R': 'レア',
    'VR': 'ベリーレア',
    'SR': 'スーパーレア',
    'MR': 'マスターレア',
    'T': '黒トレジャー',
    'DM': 'ドリームレア',
    'OR': 'オーバーレア',
    'UC': 'アンコモン',
    'DM㉿': 'シークレットドリームレア',
    '㉿': 'シークレットレア',
    'TD': 'キャラプレミアムトレジャー',
    'SP': '金トレジャー',
    'TR': '銀トレジャー',
    'S': 'シークレットレア'
  }
  
  console.log('rarities debug:', rarities.map(r => ({ 
    name: r.name, 
    display_name: r.display_name, 
    display_order: r.display_order,
    display_order_type: typeof r.display_order,
    parsed_order: parseInt(r.display_order || '0')
  })))
  console.log('rarityDisplayNames mapping:', rarityDisplayNames)
  
  // 特別セクションの表示名を追加
  rarityDisplayNames['10円のカード達'] = '10円のカード達'
  
  // カードを買取価格とレアリティでグループ化し、各グループ内でカード番号順にソート
  const cardsByRarity = cards.reduce((acc, card) => {
    const rarityName = card.rarity?.name || '不明'
    const buybackPrice = card.parameters?.buyback_price || 0
    
    // 10円のカードは専用グループに分ける
    if (buybackPrice === 10) {
      if (!acc['10円のカード達']) {
        acc['10円のカード達'] = []
      }
      acc['10円のカード達'].push(card)
    } else {
      // 通常のレアリティグループ
      if (!acc[rarityName]) {
        acc[rarityName] = []
      }
      acc[rarityName].push(card)
    }
    return acc
  }, {} as Record<string, Card[]>)
  
  // 各レアリティ内でカード番号を数値ソート
  Object.keys(cardsByRarity).forEach(rarityName => {
    cardsByRarity[rarityName].sort((a, b) => {
      // カード番号から数値部分を抽出して数値ソート
      const numA = parseInt(a.cardNumber.split('/')[0]) || 0
      const numB = parseInt(b.cardNumber.split('/')[0]) || 0
      return numA - numB
    })
  })
  
  // 表示するレアリティを決定（レアリティマスターの順序に基づく）
  const displayRarities = [
    // 通常のレアリティ（レアリティマスターの順序）
    ...rarities
      .filter(rarity => {
        // このレアリティのカードが存在するかチェック
        if (!cardsByRarity[rarity.name]) return false
        
        // 表示レアリティが設定されている場合は、その中に含まれるかチェック
        if (displayRarityIds.length > 0) {
          return displayRarityNames.has(rarity.name)
        }
        
        // 表示レアリティが設定されていない場合は全て表示
        return true
      })
      // raritiesは既にソート済みなので順序は正しい
      .map(rarity => rarity.name),
    
    // 10円のカード達を最後に追加
    ...(cardsByRarity['10円のカード達'] ? ['10円のカード達'] : [])
  ]
  
  // 10円のカード達をレアリティ別にグループ化し、各レアリティ内でカード番号順にソート
  const tenYenCardsByRarity: Record<string, Card[]> = {}
  if (cardsByRarity['10円のカード達']) {
    cardsByRarity['10円のカード達'].forEach(card => {
      const rarityName = card.rarity?.name || '不明'
      if (!tenYenCardsByRarity[rarityName]) {
        tenYenCardsByRarity[rarityName] = []
      }
      tenYenCardsByRarity[rarityName].push(card)
    })
    
    // 各レアリティ内でカード番号を数値ソート
    Object.keys(tenYenCardsByRarity).forEach(rarityName => {
      tenYenCardsByRarity[rarityName].sort((a, b) => {
        // カード番号から数値部分を抽出して数値ソート
        const numA = parseInt(a.cardNumber.split('/')[0]) || 0
        const numB = parseInt(b.cardNumber.split('/')[0]) || 0
        return numA - numB
      })
    })
  }
  
  // 10円のカード達のレアリティを表示順にソート（raritiesは既にソート済み）
  const tenYenDisplayRarities = rarities
    .filter(rarity => tenYenCardsByRarity[rarity.name])
    .map(rarity => rarity.name)
  
  console.log('Filtered rarities for 10yen:', rarities.filter(rarity => tenYenCardsByRarity[rarity.name]).map(r => `${r.name}(order:${r.display_order})`))
  console.log('10yen cards sorting check:', Object.keys(tenYenCardsByRarity).map(rarity => ({
    rarity,
    cards: tenYenCardsByRarity[rarity].slice(0, 5).map(c => c.cardNumber)
  })))
  
  console.log('tenYenDisplayRarities:', tenYenDisplayRarities)
  console.log('tenYenCardsByRarity keys:', Object.keys(tenYenCardsByRarity))
  
  // デバッグ情報
  console.log('Debug info:', {
    totalCards: cards.length,
    displayRarityIds: displayRarityIds,
    displayRarityNames: Array.from(displayRarityNames),
    cardsByRarity: Object.keys(cardsByRarity),
    displayRarities: displayRarities,
    customCardIds: customCardIds,
    raritiesOrder: rarities.map(r => ({ name: r.name, display_order: r.display_order }))
  })
  
  // 既に表示されているカードのIDセット
  const displayedCardIds = new Set<string>()
  
  // 表示レアリティのカードを収集
  displayRarities.forEach(rarityName => {
    const rarityCards = cardsByRarity[rarityName] || []
    rarityCards.forEach(card => displayedCardIds.add(card.id))
  })
  
  // 選択されたカードを収集
  selectedCards.forEach(cardId => displayedCardIds.add(cardId))
  
  // カスタムカードIDも表示済みに追加
  customCardIds.forEach(cardId => displayedCardIds.add(cardId))
  
  // カスタムカード（管理者が設定したカード）
  const customCards = customCardIds.length > 0 
    ? cards.filter(card => customCardIds.includes(card.id))
    : []
  
  // 検索対象のカード（まだ表示されていないカード）
  const hiddenCards = cards.filter(card => {
    // 既に表示されているカードは除外
    if (displayedCardIds.has(card.id)) return false
    
    // 既に選択されているカードは除外
    if (selectedCards.has(card.id)) return false
    
    return true
  })
  
  // 検索結果
  const searchResults = searchTerm 
    ? hiddenCards.filter(card => 
        card.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        card.cardNumber.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : []

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8">
        <div className="mb-4 sm:mb-6">
          <Link href="/dashboard/packs">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">弾選択へ戻る</span>
              <span className="sm:hidden">戻る</span>
            </Button>
          </Link>
        </div>

        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4 sm:p-6 mb-6">
          <h1 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white mb-4">
            {pack.name}
            <span className="block sm:inline text-sm sm:text-base font-normal text-gray-600 dark:text-gray-400 mt-1 sm:mt-0 sm:ml-2">
              価格入力
            </span>
          </h1>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              ボックス購入価格（円）
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <Input
                type="number"
                value={boxPrice}
                onChange={(e) => setBoxPrice(parseInt(e.target.value) || 0)}
                className="w-full sm:max-w-xs"
                placeholder="例: 5500"
                inputMode="numeric"
                pattern="[0-9]*"
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleResetPrices}
                className="w-full sm:w-auto"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                すべての価格を0円にリセット
              </Button>
            </div>
            {lastUpdated && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                買取価格データ最終更新: {new Date(lastUpdated).toLocaleString('ja-JP')}
              </p>
            )}
          </div>

          <div className="mb-4 p-3 sm:p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
            <p className="text-xs sm:text-sm text-blue-800 dark:text-blue-200">
              各カードの買取価格を入力してください。初回はデータベースの買取価格が表示されます。<br />
              買取価格が10円のカードはページ下部に表示されます。<br />
              値段のつくカードはすべて表示しているつもりですが、もし急な高騰などで表示されていない値段がつくカードがあればページ下部の<b>《特定のカードを検索して追加》</b>から追加してください。
            </p>
          </div>

          {/* スマホ用：カードリスト表示 */}
          <div className="sm:hidden">
            {displayRarities.map((rarityName) => {
              if (rarityName === '10円のカード達') {
                return (
                  <div key={rarityName} className="mb-6">
                    <h2 
                      className="text-base font-semibold text-gray-900 dark:text-white mb-3 flex items-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 p-2 rounded-lg transition-colors"
                      onClick={() => setTenYenExpanded(!tenYenExpanded)}
                    >
                      <span className="w-3 h-3 rounded-full mr-2 bg-gray-500" />
                      10円のカード達
                      {tenYenExpanded ? (
                        <ChevronDown className="ml-2 h-4 w-4" />
                      ) : (
                        <ChevronRight className="ml-2 h-4 w-4" />
                      )}
                    </h2>
                    {tenYenExpanded && tenYenDisplayRarities.map((tenYenRarityName) => (
                      <div key={`10yen-${tenYenRarityName}`} className="mb-4 ml-4">
                        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                          <span 
                            className="w-2 h-2 rounded-full mr-2"
                            style={{ backgroundColor: tenYenCardsByRarity[tenYenRarityName]?.[0]?.rarity?.color || '#808080' }}
                          />
                          {tenYenRarityName} -{rarityDisplayNames[tenYenRarityName] || tenYenRarityName}-
                        </h3>
                        <CardPriceList
                          cards={tenYenCardsByRarity[tenYenRarityName] || []}
                          prices={prices}
                          onPriceChange={handlePriceChange}
                        />
                      </div>
                    ))}
                  </div>
                )
              } else {
                return (
                  <div key={rarityName} className="mb-6">
                    <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                      <span 
                        className="w-3 h-3 rounded-full mr-2"
                        style={{ backgroundColor: cardsByRarity[rarityName]?.[0]?.rarity?.color || '#808080' }}
                      />
                      {rarityName} -{rarityDisplayNames[rarityName] || rarityName}-
                    </h2>
                    <CardPriceList
                      cards={cardsByRarity[rarityName] || []}
                      prices={prices}
                      onPriceChange={handlePriceChange}
                    />
                  </div>
                )
              }
            })}
            
            {/* その他のカード（R以下） */}
            {customCards.length > 0 && (
              <div className="mb-6">
                <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                  <span className="w-3 h-3 rounded-full mr-2 bg-gray-500" />
                  その他（R以下）
                </h2>
                <CardPriceList
                  cards={customCards}
                  prices={prices}
                  onPriceChange={handlePriceChange}
                />
              </div>
            )}
            
            {/* カスタムカード追加 */}
            {selectedCards.size > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  追加したカード
                </h3>
                {Array.from(selectedCards).map(cardId => {
                  const card = cards.find(c => c.id === cardId)
                  if (!card) return null
                  return (
                    <div key={card.id} className="mb-3">
                      <CardPriceList
                        cards={[card]}
                        prices={prices}
                        onPriceChange={handlePriceChange}
                      />
                    </div>
                  )
                })}
              </div>
            )}
            
            {/* 検索可能なカードがある場合は検索ボックスを表示 */}
            {hiddenCards.length > 0 && (
              <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  特定のカードを検索して追加
                </h3>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="カード名または番号で検索"
                    className="pl-10"
                  />
                </div>
                {searchTerm && searchResults.length === 0 && (
                  <p className="mt-2 text-sm text-gray-500">該当するカードが見つかりません</p>
                )}
                {searchResults.length > 0 && (
                  <div className="mt-3 space-y-2 max-h-40 overflow-y-auto">
                    {searchResults.map((card) => (
                      <div key={card.id} className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded">
                        <span className="text-sm">
                          <span className="text-gray-500">{card.cardNumber}</span> {card.name}
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setSelectedCards(prev => {
                              const newSet = new Set(prev)
                              newSet.add(card.id)
                              return newSet
                            })
                            setSearchTerm('')
                          }}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* PC用：テーブル表示 */}
          <div className="hidden sm:block">
            {displayRarities.map((rarityName) => {
              if (rarityName === '10円のカード達') {
                return (
                  <div key={rarityName} className="mb-8">
                    <h2 
                      className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 p-3 rounded-lg transition-colors"
                      onClick={() => setTenYenExpanded(!tenYenExpanded)}
                    >
                      <span className="w-4 h-4 rounded-full mr-2 bg-gray-500" />
                      10円のカード達
                      {tenYenExpanded ? (
                        <ChevronDown className="ml-2 h-5 w-5" />
                      ) : (
                        <ChevronRight className="ml-2 h-5 w-5" />
                      )}
                    </h2>
                    {tenYenExpanded && tenYenDisplayRarities.map((tenYenRarityName) => {
                      const tenYenRarityCards = tenYenCardsByRarity[tenYenRarityName]
                      if (!tenYenRarityCards || tenYenRarityCards.length === 0) return null
                      
                      return (
                        <div key={`10yen-${tenYenRarityName}`} className="mb-6 ml-6">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                            <span 
                              className="w-4 h-4 rounded-full mr-2"
                              style={{ backgroundColor: tenYenRarityCards[0]?.rarity?.color || '#808080' }}
                            />
                            {tenYenRarityName} -{rarityDisplayNames[tenYenRarityName] || tenYenRarityName}-
                          </h3>
                          
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                              <thead className="bg-gray-50 dark:bg-gray-900">
                                <tr>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    番号
                                  </th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    カード名
                                  </th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    買取価格（円）
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {tenYenRarityCards.map((card) => (
                                  <tr key={card.id}>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                                      {card.cardNumber}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                                      {card.name}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                      <Input
                                        type="number"
                                        value={prices.get(card.id) || ''}
                                        onChange={(e) => handlePriceChange(card.id, e.target.value)}
                                        className="w-24"
                                        placeholder="0"
                                        min="0"
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                      />
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )
              } else {
                const rarityCards = cardsByRarity[rarityName]
                if (!rarityCards || rarityCards.length === 0) return null
                
                return (
                  <div key={rarityName} className="mb-8">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                      <span 
                        className="w-4 h-4 rounded-full mr-2"
                        style={{ backgroundColor: rarityCards[0]?.rarity?.color || '#808080' }}
                      />
                      {rarityName} -{rarityDisplayNames[rarityName] || rarityName}-
                    </h2>
                  
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-900">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            番号
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            カード名
                          </th>
                          {rarityName === '10円のカード達' && (
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              レアリティ
                            </th>
                          )}
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            買取価格（円）
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {rarityCards.map((card) => (
                          <tr key={card.id}>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                              {card.cardNumber}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                              {card.name}
                            </td>
                            {rarityName === '10円のカード達' && (
                              <td className="px-4 py-3 whitespace-nowrap">
                                <span 
                                  className="inline-flex px-2 py-1 text-xs font-semibold rounded-full text-white"
                                  style={{ backgroundColor: card.rarity?.color || '#808080' }}
                                >
                                  {card.rarity?.name}
                                </span>
                              </td>
                            )}
                            <td className="px-4 py-3 whitespace-nowrap">
                              <Input
                                type="number"
                                value={prices.get(card.id) || ''}
                                onChange={(e) => handlePriceChange(card.id, e.target.value)}
                                className="w-24"
                                placeholder="0"
                                min="0"
                                inputMode="numeric"
                                pattern="[0-9]*"
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )
              }
            })}
            
            {/* その他のカード（R以下） - PC用 */}
            {customCards.length > 0 && (
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <span className="w-4 h-4 rounded-full mr-2 bg-gray-500" />
                  その他（R以下）
                </h2>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-900">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          番号
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          カード名
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          レアリティ
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          買取価格（円）
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {customCards.map((card) => (
                        <tr key={card.id}>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                            {card.cardNumber}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                            {card.name}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span 
                              className="inline-flex px-2 py-1 text-xs font-semibold rounded-full text-white"
                              style={{ backgroundColor: card.rarity?.color || '#808080' }}
                            >
                              {card.rarity?.name}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <Input
                              type="number"
                              value={prices.get(card.id) || ''}
                              onChange={(e) => handlePriceChange(card.id, e.target.value)}
                              className="w-24"
                              placeholder="0"
                              min="0"
                              inputMode="numeric"
                              pattern="[0-9]*"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
            {/* 追加されたカード - PC用 */}
            {Array.from(selectedCards).length > 0 && (
              <div className="mb-8">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">追加したカード</h4>
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        番号
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        カード名
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        レアリティ
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        買取価格（円）
                      </th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {Array.from(selectedCards).map(cardId => {
                      const card = cards.find(c => c.id === cardId)
                      if (!card) return null
                      return (
                        <tr key={card.id}>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                            {card.cardNumber}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                            {card.name}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span 
                              className="inline-flex px-2 py-1 text-xs font-semibold rounded-full text-white"
                              style={{ backgroundColor: card.rarity?.color || '#808080' }}
                            >
                              {card.rarity?.name}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <Input
                              type="number"
                              value={prices.get(card.id) || ''}
                              onChange={(e) => handlePriceChange(card.id, e.target.value)}
                              className="w-24"
                              placeholder="0"
                              min="0"
                              inputMode="numeric"
                              pattern="[0-9]*"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setSelectedCards(prev => {
                                  const newSet = new Set(prev)
                                  newSet.delete(cardId)
                                  return newSet
                                })
                              }}
                              className="text-red-600 hover:text-red-800"
                            >
                              削除
                            </Button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
            
            {/* 検索可能なカードがある場合は検索ボックスを表示 */}
            {hiddenCards.length > 0 && (
              <div className="mt-8 p-6 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-4">
                  特定のカードを検索して追加
                </h3>
                <div className="relative max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="カード名または番号で検索"
                    className="pl-10"
                  />
                </div>
                {searchTerm && searchResults.length === 0 && (
                  <p className="mt-3 text-sm text-gray-500">該当するカードが見つかりません</p>
                )}
                {searchResults.length > 0 && (
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto">
                    {searchResults.map((card) => (
                      <div key={card.id} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg">
                        <div className="flex-1">
                          <span className="text-sm">
                            <span className="text-gray-500">{card.cardNumber}</span> {card.name}
                          </span>
                          <span 
                            className="ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full text-white"
                            style={{ backgroundColor: card.rarity?.color || '#808080' }}
                          >
                            {card.rarity?.name}
                          </span>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setSelectedCards(prev => {
                              const newSet = new Set(prev)
                              newSet.add(card.id)
                              return newSet
                            })
                            setSearchTerm('')
                          }}
                          className="ml-2"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-4 mt-8">
            <Button
              onClick={handleSave}
              disabled={saving || boxPrice === 0}
              size="lg"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  保存中...
                </>
              ) : (
                <>
                  <Calculator className="mr-2 h-4 w-4" />
                  期待値を計算
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}