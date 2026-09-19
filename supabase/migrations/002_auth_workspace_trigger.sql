-- ==============================================================================
-- chatINALabs AI — Phase 3.2: Automated Profile & Personal Workspace Provisioning
-- Version: 002_auth_workspace_trigger.sql
-- ==============================================================================

-- Enhanced function to handle new user setup on auth.users insert:
-- 1. Provisions public.profiles
-- 2. Creates a default personal workspace in public.workspaces
-- 3. Workspace member entry ('owner') is automatically created via on_workspace_created trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  _full_name TEXT;
  _workspace_slug TEXT;
  _workspace_id UUID;
BEGIN
  -- Determine display name fallback
  _full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email, '@', 1),
    'User'
  );

  -- 1. Automatic Profile Creation
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    _full_name,
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    email = EXCLUDED.email,
    full_name = COALESCE(NULLIF(EXCLUDED.full_name, ''), public.profiles.full_name);

  -- 2. Automatic Personal Workspace Creation
  _workspace_slug := 'personal-' || substr(NEW.id::text, 1, 8);

  INSERT INTO public.workspaces (owner_id, name, slug)
  VALUES (
    NEW.id,
    _full_name || '''s Workspace',
    _workspace_slug
  )
  ON CONFLICT (slug) DO NOTHING
  RETURNING id INTO _workspace_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-bind trigger to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
