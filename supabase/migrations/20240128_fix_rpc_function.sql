-- check_rls_status関数を作成（テストAPI用）
CREATE OR REPLACE FUNCTION public.check_rls_status(table_name text)
RETURNS boolean AS $$
DECLARE
    rls_enabled boolean;
BEGIN
    SELECT relrowsecurity 
    INTO rls_enabled
    FROM pg_class
    WHERE relname = table_name
    AND relnamespace = 'public'::regnamespace;
    
    RETURN COALESCE(rls_enabled, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 権限を付与
GRANT EXECUTE ON FUNCTION public.check_rls_status(text) TO anon;
GRANT EXECUTE ON FUNCTION public.check_rls_status(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_rls_status(text) TO service_role;