-- SupabaseのSQL Editorで実行してください

-- usersテーブルにroleカラムを追加
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('user', 'admin', 'friend'));

-- 既存のユーザーのroleをuserに設定
UPDATE users SET role = 'user' WHERE role IS NULL;

-- friendロールのユーザーは全ての弾にアクセス可能にする関数を更新
CREATE OR REPLACE FUNCTION get_user_accessible_packs(user_id UUID)
RETURNS TABLE (
  id TEXT,
  name TEXT,
  release_date DATE,
  box_price INTEGER,
  packs_per_box INTEGER,
  cards_per_pack INTEGER,
  is_active BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  -- ユーザーのroleをチェック
  IF EXISTS (SELECT 1 FROM users WHERE id = user_id AND role = 'friend') THEN
    -- friendロールの場合は全ての弾を返す
    RETURN QUERY
    SELECT 
      p.id,
      p.name,
      p.release_date,
      p.box_price,
      p.packs_per_box,
      p.cards_per_pack,
      p.is_active,
      p.created_at,
      p.updated_at
    FROM packs p
    WHERE p.is_active = true
    ORDER BY p.release_date DESC;
  ELSE
    -- 通常ユーザーの場合はアクセスコードでアクセス可能な弾のみ
    RETURN QUERY
    SELECT DISTINCT
      p.id,
      p.name,
      p.release_date,
      p.box_price,
      p.packs_per_box,
      p.cards_per_pack,
      p.is_active,
      p.created_at,
      p.updated_at
    FROM packs p
    INNER JOIN access_codes ac ON (ac.pack_id = p.id OR ac.pack_id IS NULL)
    INNER JOIN user_codes uc ON uc.code = ac.code
    WHERE uc.user_id = get_user_accessible_packs.user_id
      AND p.is_active = true
      AND (ac.valid_until IS NULL OR ac.valid_until > NOW())
    ORDER BY p.release_date DESC;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 管理者用：特定ユーザーをfriendロールに設定する例
-- UPDATE users SET role = 'friend' WHERE email = 'friend@example.com';