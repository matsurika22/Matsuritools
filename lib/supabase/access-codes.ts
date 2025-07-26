import { supabase } from './client'

export async function validateAccessCode(code: string, userId: string) {
  // コードの形式を正規化（大文字、ハイフン区切り）
  const normalizedCode = code.toUpperCase().replace(/\s/g, '')
  
  // アクセスコードの存在と有効性を確認
  const { data: accessCodes, error: codeError } = await supabase
    .from('access_codes')
    .select('*')
    .eq('code', normalizedCode)
    .limit(1)

  if (codeError || !accessCodes || accessCodes.length === 0) {
    throw new Error('無効なアクセスコードです')
  }

  const accessCode = accessCodes[0]

  // 有効期限チェック
  const now = new Date()
  const validFrom = new Date(accessCode.valid_from)
  const validUntil = accessCode.valid_until ? new Date(accessCode.valid_until) : null

  if (now < validFrom) {
    throw new Error('このコードはまだ有効ではありません')
  }

  if (validUntil && now > validUntil) {
    throw new Error('このコードの有効期限が切れています')
  }

  // 使用回数チェック
  if (accessCode.max_uses && accessCode.current_uses >= accessCode.max_uses) {
    throw new Error('このコードの使用回数が上限に達しています')
  }

  // 既に登録済みかチェック
  const { data: existingUserCodes } = await supabase
    .from('user_codes')
    .select('*')
    .eq('user_id', userId)
    .eq('code', normalizedCode)
    .limit(1)

  if (existingUserCodes && existingUserCodes.length > 0) {
    throw new Error('このコードは既に登録済みです')
  }

  // ユーザーコードを登録
  const { error: insertError } = await supabase
    .from('user_codes')
    .insert({
      user_id: userId,
      code: normalizedCode,
    })

  if (insertError) {
    throw new Error('コードの登録に失敗しました')
  }

  // 使用回数を増やす
  const { error: updateError } = await supabase
    .from('access_codes')
    .update({ current_uses: accessCode.current_uses + 1 })
    .eq('code', normalizedCode)

  if (updateError) {
    console.error('Failed to update usage count:', updateError)
  }

  return accessCode
}

export async function getUserAccessiblePacks(userId: string) {
  // まずユーザーのroleをチェック
  const { data: userDataArray, error: userError } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .limit(1)
  
  if (userError) {
    console.error('Error fetching user role:', userError)
    // roleカラムがない場合は通常の処理を続行
  }
  
  const userData = userDataArray?.[0]
  
  // friendロールの場合は全ての弾を返す
  if (userData?.role === 'friend') {
    const { data: packs, error: packsError } = await supabase
      .from('packs')
      .select('*')
      .eq('is_active', true)
      .order('release_date', { ascending: false })
    
    if (packsError) {
      console.error('Error fetching packs:', packsError)
      return []
    }
    
    return packs || []
  }
  
  // 通常ユーザーの処理
  // ユーザーが持っているアクセスコードを取得
  const { data: userCodes, error: userCodesError } = await supabase
    .from('user_codes')
    .select(`
      code,
      access_codes (
        code,
        pack_id,
        valid_until
      )
    `)
    .eq('user_id', userId)

  if (userCodesError) {
    console.error('Error fetching user codes:', userCodesError)
    return []
  }

  // 有効な弾IDのリストを作成
  const validPackIds = new Set<string>()
  const now = new Date()

  userCodes?.forEach((userCode: any) => {
    const accessCode = userCode.access_codes
    if (accessCode) {
      // 有効期限チェック
      const validUntil = accessCode.valid_until ? new Date(accessCode.valid_until) : null
      if (!validUntil || now <= validUntil) {
        if (accessCode.pack_id) {
          validPackIds.add(accessCode.pack_id)
        } else {
          // pack_idがnullの場合は全弾アクセス可能
          validPackIds.add('*')
        }
      }
    }
  })

  // アクセス可能な弾を取得
  let query = supabase
    .from('packs')
    .select('*')
    .eq('is_active', true)
    .order('release_date', { ascending: false })

  // 全弾アクセス権がない場合は、特定の弾のみ
  if (!validPackIds.has('*') && validPackIds.size > 0) {
    query = query.in('id', Array.from(validPackIds))
  } else if (!validPackIds.has('*') && validPackIds.size === 0) {
    // アクセス可能な弾がない
    return []
  }

  const { data: packs, error: packsError } = await query

  if (packsError) {
    console.error('Error fetching packs:', packsError)
    return []
  }

  return packs || []
}