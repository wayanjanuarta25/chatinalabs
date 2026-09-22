-- Test Security & Analytics in PostgreSQL
DO $$
DECLARE
  v_is_admin BOOLEAN;
  v_analytics JSONB;
  v_audit_id UUID;
  v_test_user_id UUID := gen_random_uuid();
BEGIN
  -- Test 1: is_platform_admin with NULL uid -> FALSE
  PERFORM set_config('request.jwt.claim.sub', '', true);
  v_is_admin := public.is_platform_admin();
  IF v_is_admin THEN
    RAISE EXCEPTION 'Test 1 Failed: is_platform_admin returned true for empty sub!';
  END IF;
  RAISE NOTICE 'Test 1 Passed: Anonymous is_platform_admin() is FALSE';

  -- Test 2: is_platform_admin with super_admin user -> TRUE
  PERFORM set_config('request.jwt.claim.sub', '3d9be6f5-7c68-411f-bf47-026b949d54b4', true);
  v_is_admin := public.is_platform_admin();
  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Test 2 Failed: is_platform_admin returned false for super_admin!';
  END IF;
  RAISE NOTICE 'Test 2 Passed: Super admin is_platform_admin() is TRUE';

  -- Test 3: get_platform_analytics returns valid JSON
  v_analytics := public.get_platform_analytics();
  IF v_analytics IS NULL OR NOT (v_analytics ? 'overview') THEN
    RAISE EXCEPTION 'Test 3 Failed: get_platform_analytics returned invalid structure: %', v_analytics;
  END IF;
  RAISE NOTICE 'Test 3 Passed: get_platform_analytics() returned valid metrics! Overview: %', v_analytics->'overview';

  -- Test 4: log_audit_event works for platform admin
  v_audit_id := public.log_audit_event('PLATFORM_TEST_EVENT', 'system', NULL, '{"test": true}'::jsonb);
  IF v_audit_id IS NULL THEN
    RAISE EXCEPTION 'Test 4 Failed: log_audit_event returned null ID';
  END IF;
  RAISE NOTICE 'Test 4 Passed: log_audit_event recorded ID: %', v_audit_id;

  -- Test 5: Role escalation protection with a real temporary auth user
  INSERT INTO auth.users (id, email, aud, role)
  VALUES (v_test_user_id, 'test-non-admin@chatinalabs.local', 'authenticated', 'authenticated');

  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (v_test_user_id, 'test-non-admin@chatinalabs.local', 'Test Non Admin', 'user');

  -- Simulate being the non-admin user
  PERFORM set_config('request.jwt.claim.sub', v_test_user_id::text, true);

  -- Attempt role escalation: user tries to update their own profile to super_admin
  BEGIN
    UPDATE public.profiles SET role = 'super_admin' WHERE id = v_test_user_id;
    RAISE EXCEPTION 'Test 5 Failed: Normal user was able to escalate role to super_admin!';
  EXCEPTION WHEN SQLSTATE '42501' THEN
    RAISE NOTICE 'Test 5 Passed: Role escalation properly blocked by trigger with code 42501!';
  END;

  -- Attempt calling get_platform_analytics as non-admin -> must fail with 42501
  BEGIN
    PERFORM public.get_platform_analytics();
    RAISE EXCEPTION 'Test 6 Failed: Normal user was able to call get_platform_analytics!';
  EXCEPTION WHEN SQLSTATE '42501' THEN
    RAISE NOTICE 'Test 6 Passed: get_platform_analytics properly blocked for non-admin!';
  END;

  -- Attempt calling log_audit_event as non-admin -> must fail with 42501
  BEGIN
    PERFORM public.log_audit_event('UNAUTHORIZED_ACTION', 'system', NULL);
    RAISE EXCEPTION 'Test 7 Failed: Normal user was able to call log_audit_event!';
  EXCEPTION WHEN SQLSTATE '42501' THEN
    RAISE NOTICE 'Test 7 Passed: log_audit_event properly blocked for non-admin!';
  END;

  -- Clean up test user
  PERFORM set_config('request.jwt.claim.sub', '3d9be6f5-7c68-411f-bf47-026b949d54b4', true);
  DELETE FROM public.profiles WHERE id = v_test_user_id;
  DELETE FROM auth.users WHERE id = v_test_user_id;
  
  RAISE NOTICE 'ALL PHASE 5.6 DATABASE SECURITY TESTS PASSED SUCCESSFULLY!';
END $$;
