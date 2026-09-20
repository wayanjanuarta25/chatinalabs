-- Repair missing personal workspace

INSERT INTO public.workspaces
(
  owner_id,
  name,
  slug
)
SELECT
  u.id,
  COALESCE(
    u.raw_user_meta_data->>'full_name',
    split_part(u.email,'@',1),
    'User'
  ) || '''s Workspace',
  'personal-' || substring(u.id::text,1,8)
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1
  FROM public.workspaces w
  WHERE w.owner_id = u.id
);


-- Create missing membership

INSERT INTO public.workspace_members
(
 workspace_id,
 user_id,
 role
)
SELECT
 w.id,
 w.owner_id,
 'owner'
FROM public.workspaces w
WHERE NOT EXISTS (
 SELECT 1
 FROM public.workspace_members wm
 WHERE wm.workspace_id=w.id
 AND wm.user_id=w.owner_id
);