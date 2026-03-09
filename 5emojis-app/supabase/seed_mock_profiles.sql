-- ╔══════════════════════════════════════════════════════════════╗
-- ║  5Emojis — Mock Profile Seed (DEV ONLY)                    ║
-- ║  Run in Supabase Dashboard → SQL Editor                    ║
-- ║  Creates 25 mock profiles for testing the full flow        ║
-- ╚══════════════════════════════════════════════════════════════╝

-- Safety: ensure pgcrypto is available
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ═══════════════════════════════════════════════════════════════
-- 1. RPC: reset_mock_data — clears interactions & re-seeds swipes
-- ═══════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.reset_mock_data(requesting_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  mock_ids uuid[] := ARRAY[
    '00000000-0000-4000-a000-000000000001'::uuid,
    '00000000-0000-4000-a000-000000000002'::uuid,
    '00000000-0000-4000-a000-000000000003'::uuid,
    '00000000-0000-4000-a000-000000000004'::uuid,
    '00000000-0000-4000-a000-000000000005'::uuid,
    '00000000-0000-4000-a000-000000000006'::uuid,
    '00000000-0000-4000-a000-000000000007'::uuid,
    '00000000-0000-4000-a000-000000000008'::uuid,
    '00000000-0000-4000-a000-000000000009'::uuid,
    '00000000-0000-4000-a000-000000000010'::uuid,
    '00000000-0000-4000-a000-000000000011'::uuid,
    '00000000-0000-4000-a000-000000000012'::uuid,
    '00000000-0000-4000-a000-000000000013'::uuid,
    '00000000-0000-4000-a000-000000000014'::uuid,
    '00000000-0000-4000-a000-000000000015'::uuid,
    '00000000-0000-4000-a000-000000000016'::uuid,
    '00000000-0000-4000-a000-000000000017'::uuid,
    '00000000-0000-4000-a000-000000000018'::uuid,
    '00000000-0000-4000-a000-000000000019'::uuid,
    '00000000-0000-4000-a000-000000000020'::uuid,
    '00000000-0000-4000-a000-000000000021'::uuid,
    '00000000-0000-4000-a000-000000000022'::uuid,
    '00000000-0000-4000-a000-000000000023'::uuid,
    '00000000-0000-4000-a000-000000000024'::uuid,
    '00000000-0000-4000-a000-000000000025'::uuid
  ];
  -- Icebreaker emoji responses for each pre-made match
  icebreaker_emojis text[] := ARRAY[
    '🎉✨💛🤝🔥',
    '🌈🎵💃🌟🦋',
    '🍕🎮💜🚀☕',
    '🌸🧠🎬💪🌊',
    '📸🎨🌙🎸🧘'
  ];
  user_loc RECORD;
  deleted_messages int;
  deleted_matches int;
  deleted_swipes int;
  inserted_swipes int;
  created_matches int := 0;
  mock_id uuid;
  u1 uuid;
  u2 uuid;
  q_id uuid;
  m_id uuid;
  overlap int;
  i int;
BEGIN
  -- Get requesting user's location
  SELECT latitude, longitude, city, state INTO user_loc
  FROM public.profiles WHERE id = requesting_user_id;

  -- 1. Delete messages in matches involving mock users + current user
  DELETE FROM public.messages
  WHERE match_id IN (
    SELECT id FROM public.matches
    WHERE (user1_id = requesting_user_id AND user2_id = ANY(mock_ids))
       OR (user1_id = ANY(mock_ids) AND user2_id = requesting_user_id)
  );
  GET DIAGNOSTICS deleted_messages = ROW_COUNT;

  -- 2. Delete matches
  DELETE FROM public.matches
  WHERE (user1_id = requesting_user_id AND user2_id = ANY(mock_ids))
     OR (user1_id = ANY(mock_ids) AND user2_id = requesting_user_id);
  GET DIAGNOSTICS deleted_matches = ROW_COUNT;

  -- 3. Delete swipes (both directions)
  DELETE FROM public.swipes
  WHERE (swiper_id = requesting_user_id AND swiped_id = ANY(mock_ids))
     OR (swiper_id = ANY(mock_ids) AND swiped_id = requesting_user_id);
  GET DIAGNOSTICS deleted_swipes = ROW_COUNT;

  -- 3b. Delete blocks involving mock users so they reappear in discovery + vibes
  DELETE FROM public.blocks
  WHERE (blocker_id = requesting_user_id AND blocked_id = ANY(mock_ids))
     OR (blocker_id = ANY(mock_ids) AND blocked_id = requesting_user_id);

  -- 4. Move mock profiles to user's location so they appear in discovery feed
  IF user_loc.latitude IS NOT NULL THEN
    UPDATE public.profiles
    SET latitude = user_loc.latitude + (random() - 0.5) * 0.02,
        longitude = user_loc.longitude + (random() - 0.5) * 0.02,
        city = user_loc.city,
        state = user_loc.state
    WHERE id = ANY(mock_ids);
  END IF;

  -- 5. Pre-seed right swipes from ALL mock users → current user
  --    This means swiping right on any remaining mock profile = instant match!
  INSERT INTO public.swipes (swiper_id, swiped_id, direction)
  SELECT unnest(mock_ids), requesting_user_id, 'right'
  ON CONFLICT (swiper_id, swiped_id) DO NOTHING;
  GET DIAGNOSTICS inserted_swipes = ROW_COUNT;

  -- 6. Create 5 pre-made matches (first 5 mock users) with icebreaker messages
  --    so you can immediately test the Friends tab + messaging flow.
  --    • Matches 1-3: mock user answered icebreaker → you're in "icebreaker_pending"
  --    • Matches 4-5: both answered + text messages → you're in "chat_active"
  FOR i IN 1..5 LOOP
    mock_id := mock_ids[i];

    -- Insert user's right swipe (creates mutual swipe with step 5)
    INSERT INTO public.swipes (swiper_id, swiped_id, direction)
    VALUES (requesting_user_id, mock_id, 'right')
    ON CONFLICT (swiper_id, swiped_id) DO NOTHING;

    -- Canonical UUID ordering for matches constraint (user1_id < user2_id)
    IF mock_id < requesting_user_id THEN
      u1 := mock_id; u2 := requesting_user_id;
    ELSE
      u1 := requesting_user_id; u2 := mock_id;
    END IF;

    -- Pick a random icebreaker question
    SELECT iq.id INTO q_id FROM public.icebreaker_questions iq ORDER BY random() LIMIT 1;

    -- Calculate emoji overlap between mock user and current user
    SELECT count(*) INTO overlap FROM (
      SELECT emoji FROM public.profile_emojis WHERE user_id = mock_id
      INTERSECT
      SELECT emoji FROM public.profile_emojis WHERE user_id = requesting_user_id
    ) t;

    -- Create the match
    INSERT INTO public.matches (user1_id, user2_id, emoji_match_count, is_emoji_perfect, icebreaker_question_id)
    VALUES (u1, u2, COALESCE(overlap, 0), COALESCE(overlap, 0) = 5, q_id)
    ON CONFLICT (user1_id, user2_id) DO NOTHING;

    -- Get the match ID
    SELECT m.id INTO m_id FROM public.matches m WHERE m.user1_id = u1 AND m.user2_id = u2;

    IF m_id IS NOT NULL THEN
      created_matches := created_matches + 1;

      -- Insert icebreaker emoji response from mock user
      INSERT INTO public.messages (match_id, sender_id, content, is_emoji_only, created_at)
      VALUES (m_id, mock_id, icebreaker_emojis[i], true, now() - interval '10 minutes');

      -- For matches 4 & 5: also add user's icebreaker + text messages → "chat_active"
      IF i >= 4 THEN
        INSERT INTO public.messages (match_id, sender_id, content, is_emoji_only, created_at)
        VALUES (m_id, requesting_user_id, '🌟🎨💜🦋🎵', true, now() - interval '8 minutes');

        INSERT INTO public.messages (match_id, sender_id, content, is_emoji_only, created_at)
        VALUES (m_id, mock_id, 'Hey! Love your emoji energy!', false, now() - interval '5 minutes');

        INSERT INTO public.messages (match_id, sender_id, content, is_emoji_only, created_at)
        VALUES (m_id, mock_id, 'Want to grab coffee sometime?', false, now() - interval '2 minutes');
      END IF;
    END IF;
  END LOOP;

  RETURN json_build_object(
    'deleted_messages', deleted_messages,
    'deleted_matches', deleted_matches,
    'deleted_swipes', deleted_swipes,
    'inserted_swipes', inserted_swipes,
    'created_matches', created_matches
  );
END;
$$;

-- ═══════════════════════════════════════════════════════════════
-- 2. AUTH USERS (25 mock users)
-- ═══════════════════════════════════════════════════════════════
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token) VALUES
('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-a000-000000000001', 'authenticated', 'authenticated', 'mock01@5emojis.test', crypt('test123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-a000-000000000002', 'authenticated', 'authenticated', 'mock02@5emojis.test', crypt('test123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-a000-000000000003', 'authenticated', 'authenticated', 'mock03@5emojis.test', crypt('test123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-a000-000000000004', 'authenticated', 'authenticated', 'mock04@5emojis.test', crypt('test123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-a000-000000000005', 'authenticated', 'authenticated', 'mock05@5emojis.test', crypt('test123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-a000-000000000006', 'authenticated', 'authenticated', 'mock06@5emojis.test', crypt('test123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-a000-000000000007', 'authenticated', 'authenticated', 'mock07@5emojis.test', crypt('test123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-a000-000000000008', 'authenticated', 'authenticated', 'mock08@5emojis.test', crypt('test123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-a000-000000000009', 'authenticated', 'authenticated', 'mock09@5emojis.test', crypt('test123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-a000-000000000010', 'authenticated', 'authenticated', 'mock10@5emojis.test', crypt('test123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-a000-000000000011', 'authenticated', 'authenticated', 'mock11@5emojis.test', crypt('test123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-a000-000000000012', 'authenticated', 'authenticated', 'mock12@5emojis.test', crypt('test123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-a000-000000000013', 'authenticated', 'authenticated', 'mock13@5emojis.test', crypt('test123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-a000-000000000014', 'authenticated', 'authenticated', 'mock14@5emojis.test', crypt('test123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-a000-000000000015', 'authenticated', 'authenticated', 'mock15@5emojis.test', crypt('test123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-a000-000000000016', 'authenticated', 'authenticated', 'mock16@5emojis.test', crypt('test123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-a000-000000000017', 'authenticated', 'authenticated', 'mock17@5emojis.test', crypt('test123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-a000-000000000018', 'authenticated', 'authenticated', 'mock18@5emojis.test', crypt('test123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-a000-000000000019', 'authenticated', 'authenticated', 'mock19@5emojis.test', crypt('test123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-a000-000000000020', 'authenticated', 'authenticated', 'mock20@5emojis.test', crypt('test123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-a000-000000000021', 'authenticated', 'authenticated', 'mock21@5emojis.test', crypt('test123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-a000-000000000022', 'authenticated', 'authenticated', 'mock22@5emojis.test', crypt('test123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-a000-000000000023', 'authenticated', 'authenticated', 'mock23@5emojis.test', crypt('test123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-a000-000000000024', 'authenticated', 'authenticated', 'mock24@5emojis.test', crypt('test123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
('00000000-0000-0000-0000-000000000025', '00000000-0000-4000-a000-000000000025', 'authenticated', 'authenticated', 'mock25@5emojis.test', crypt('test123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', '')
ON CONFLICT (id) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════
-- 3. AUTH IDENTITIES
-- ═══════════════════════════════════════════════════════════════
INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at) VALUES
(gen_random_uuid(), '00000000-0000-4000-a000-000000000001', '00000000-0000-4000-a000-000000000001', '{"sub":"00000000-0000-4000-a000-000000000001","email":"mock01@5emojis.test"}', 'email', now(), now(), now()),
(gen_random_uuid(), '00000000-0000-4000-a000-000000000002', '00000000-0000-4000-a000-000000000002', '{"sub":"00000000-0000-4000-a000-000000000002","email":"mock02@5emojis.test"}', 'email', now(), now(), now()),
(gen_random_uuid(), '00000000-0000-4000-a000-000000000003', '00000000-0000-4000-a000-000000000003', '{"sub":"00000000-0000-4000-a000-000000000003","email":"mock03@5emojis.test"}', 'email', now(), now(), now()),
(gen_random_uuid(), '00000000-0000-4000-a000-000000000004', '00000000-0000-4000-a000-000000000004', '{"sub":"00000000-0000-4000-a000-000000000004","email":"mock04@5emojis.test"}', 'email', now(), now(), now()),
(gen_random_uuid(), '00000000-0000-4000-a000-000000000005', '00000000-0000-4000-a000-000000000005', '{"sub":"00000000-0000-4000-a000-000000000005","email":"mock05@5emojis.test"}', 'email', now(), now(), now()),
(gen_random_uuid(), '00000000-0000-4000-a000-000000000006', '00000000-0000-4000-a000-000000000006', '{"sub":"00000000-0000-4000-a000-000000000006","email":"mock06@5emojis.test"}', 'email', now(), now(), now()),
(gen_random_uuid(), '00000000-0000-4000-a000-000000000007', '00000000-0000-4000-a000-000000000007', '{"sub":"00000000-0000-4000-a000-000000000007","email":"mock07@5emojis.test"}', 'email', now(), now(), now()),
(gen_random_uuid(), '00000000-0000-4000-a000-000000000008', '00000000-0000-4000-a000-000000000008', '{"sub":"00000000-0000-4000-a000-000000000008","email":"mock08@5emojis.test"}', 'email', now(), now(), now()),
(gen_random_uuid(), '00000000-0000-4000-a000-000000000009', '00000000-0000-4000-a000-000000000009', '{"sub":"00000000-0000-4000-a000-000000000009","email":"mock09@5emojis.test"}', 'email', now(), now(), now()),
(gen_random_uuid(), '00000000-0000-4000-a000-000000000010', '00000000-0000-4000-a000-000000000010', '{"sub":"00000000-0000-4000-a000-000000000010","email":"mock10@5emojis.test"}', 'email', now(), now(), now()),
(gen_random_uuid(), '00000000-0000-4000-a000-000000000011', '00000000-0000-4000-a000-000000000011', '{"sub":"00000000-0000-4000-a000-000000000011","email":"mock11@5emojis.test"}', 'email', now(), now(), now()),
(gen_random_uuid(), '00000000-0000-4000-a000-000000000012', '00000000-0000-4000-a000-000000000012', '{"sub":"00000000-0000-4000-a000-000000000012","email":"mock12@5emojis.test"}', 'email', now(), now(), now()),
(gen_random_uuid(), '00000000-0000-4000-a000-000000000013', '00000000-0000-4000-a000-000000000013', '{"sub":"00000000-0000-4000-a000-000000000013","email":"mock13@5emojis.test"}', 'email', now(), now(), now()),
(gen_random_uuid(), '00000000-0000-4000-a000-000000000014', '00000000-0000-4000-a000-000000000014', '{"sub":"00000000-0000-4000-a000-000000000014","email":"mock14@5emojis.test"}', 'email', now(), now(), now()),
(gen_random_uuid(), '00000000-0000-4000-a000-000000000015', '00000000-0000-4000-a000-000000000015', '{"sub":"00000000-0000-4000-a000-000000000015","email":"mock15@5emojis.test"}', 'email', now(), now(), now()),
(gen_random_uuid(), '00000000-0000-4000-a000-000000000016', '00000000-0000-4000-a000-000000000016', '{"sub":"00000000-0000-4000-a000-000000000016","email":"mock16@5emojis.test"}', 'email', now(), now(), now()),
(gen_random_uuid(), '00000000-0000-4000-a000-000000000017', '00000000-0000-4000-a000-000000000017', '{"sub":"00000000-0000-4000-a000-000000000017","email":"mock17@5emojis.test"}', 'email', now(), now(), now()),
(gen_random_uuid(), '00000000-0000-4000-a000-000000000018', '00000000-0000-4000-a000-000000000018', '{"sub":"00000000-0000-4000-a000-000000000018","email":"mock18@5emojis.test"}', 'email', now(), now(), now()),
(gen_random_uuid(), '00000000-0000-4000-a000-000000000019', '00000000-0000-4000-a000-000000000019', '{"sub":"00000000-0000-4000-a000-000000000019","email":"mock19@5emojis.test"}', 'email', now(), now(), now()),
(gen_random_uuid(), '00000000-0000-4000-a000-000000000020', '00000000-0000-4000-a000-000000000020', '{"sub":"00000000-0000-4000-a000-000000000020","email":"mock20@5emojis.test"}', 'email', now(), now(), now()),
(gen_random_uuid(), '00000000-0000-4000-a000-000000000021', '00000000-0000-4000-a000-000000000021', '{"sub":"00000000-0000-4000-a000-000000000021","email":"mock21@5emojis.test"}', 'email', now(), now(), now()),
(gen_random_uuid(), '00000000-0000-4000-a000-000000000022', '00000000-0000-4000-a000-000000000022', '{"sub":"00000000-0000-4000-a000-000000000022","email":"mock22@5emojis.test"}', 'email', now(), now(), now()),
(gen_random_uuid(), '00000000-0000-4000-a000-000000000023', '00000000-0000-4000-a000-000000000023', '{"sub":"00000000-0000-4000-a000-000000000023","email":"mock23@5emojis.test"}', 'email', now(), now(), now()),
(gen_random_uuid(), '00000000-0000-4000-a000-000000000024', '00000000-0000-4000-a000-000000000024', '{"sub":"00000000-0000-4000-a000-000000000024","email":"mock24@5emojis.test"}', 'email', now(), now(), now()),
(gen_random_uuid(), '00000000-0000-4000-a000-000000000025', '00000000-0000-4000-a000-000000000025', '{"sub":"00000000-0000-4000-a000-000000000025","email":"mock25@5emojis.test"}', 'email', now(), now(), now())
ON CONFLICT DO NOTHING;

-- ═══════════════════════════════════════════════════════════════
-- 4. PROFILES (25 diverse mock users)
--    Location defaults to SF; reset_mock_data() moves them to you
-- ═══════════════════════════════════════════════════════════════
INSERT INTO public.profiles (id, name, dob, gender, profession, life_stage, friendship_style, pronouns, is_new_to_city, city, state, latitude, longitude, search_radius_miles, personality_type) VALUES
('00000000-0000-4000-a000-000000000001', 'Priya',   '1998-03-15', 'female',    'Product Designer',    'Working',     'Deep Convos',    'she/her',   true,  'San Francisco', 'CA', 37.7749, -122.4194, 25, 'ambivert'),
('00000000-0000-4000-a000-000000000002', 'Marcus',  '1996-08-22', 'male',      'Software Engineer',   'Working',     'Activity Buddy', 'he/him',    false, 'San Francisco', 'CA', 37.7740, -122.4180, 25, 'introvert'),
('00000000-0000-4000-a000-000000000003', 'Sophie',  '1999-11-03', 'female',    'Grad Student',        'Student',     'Group Hangs',    'she/her',   true,  'San Francisco', 'CA', 37.7760, -122.4200, 25, 'extrovert'),
('00000000-0000-4000-a000-000000000004', 'Kai',     '1997-05-28', 'nonbinary', 'Photographer',        'Freelancer',  'Adventure Crew', 'they/them', false, 'Oakland',       'CA', 37.8044, -122.2712, 30, 'introvert'),
('00000000-0000-4000-a000-000000000005', 'Aisha',   '2000-01-12', 'female',    'Marketing Manager',   'Working',     'Deep Convos',    'she/her',   true,  'San Francisco', 'CA', 37.7755, -122.4170, 20, 'extrovert'),
('00000000-0000-4000-a000-000000000006', 'Tyler',   '1995-09-17', 'male',      'Personal Trainer',    'Working',     'Gym Partner',    'he/him',    false, 'San Francisco', 'CA', 37.7730, -122.4210, 15, 'extrovert'),
('00000000-0000-4000-a000-000000000007', 'Luna',    '1998-07-04', 'female',    'Nurse',               'Working',     'Activity Buddy', 'she/her',   false, 'San Francisco', 'CA', 37.7780, -122.4230, 25, 'ambivert'),
('00000000-0000-4000-a000-000000000008', 'Jordan',  '1997-12-20', 'male',      'Music Producer',      'Freelancer',  'Group Hangs',    'he/him',    true,  'San Francisco', 'CA', 37.7745, -122.4160, 25, 'introvert'),
('00000000-0000-4000-a000-000000000009', 'Mei',     '1999-04-09', 'female',    'Data Scientist',      'Working',     'Deep Convos',    'she/her',   false, 'San Francisco', 'CA', 37.7752, -122.4190, 20, 'introvert'),
('00000000-0000-4000-a000-000000000010', 'River',   '1996-02-14', 'nonbinary', 'Yoga Instructor',     'Freelancer',  'Adventure Crew', 'they/them', true,  'Berkeley',      'CA', 37.8716, -122.2727, 30, 'ambivert'),
('00000000-0000-4000-a000-000000000011', 'Sarah',   '2002-03-15', 'female',    'UX Researcher',       'Working',     'Deep Convos',    'she/her',   true,  'San Francisco', 'CA', 37.7770, -122.4185, 25, 'introvert'),
('00000000-0000-4000-a000-000000000012', 'David',   '1999-07-22', 'male',      'Teacher',             'Working',     'Group Hangs',    'he/him',    false, 'San Francisco', 'CA', 37.7735, -122.4175, 25, 'ambivert'),
('00000000-0000-4000-a000-000000000013', 'Maya',    '2004-01-10', 'female',    'Art Student',         'Student',     'Activity Buddy', 'she/her',   false, 'San Francisco', 'CA', 37.7765, -122.4205, 20, 'extrovert'),
('00000000-0000-4000-a000-000000000014', 'Alex',    '2001-09-05', 'male',      'Chef',                'Working',     'Group Hangs',    'he/him',    true,  'San Francisco', 'CA', 37.7742, -122.4165, 25, 'ambivert'),
('00000000-0000-4000-a000-000000000015', 'Emma',    '1998-11-30', 'female',    'Therapist',           'Working',     'Deep Convos',    'she/her',   false, 'San Francisco', 'CA', 37.7758, -122.4195, 25, 'introvert'),
('00000000-0000-4000-a000-000000000016', 'Omar',    '2003-05-18', 'male',      'Filmmaker',           'Freelancer',  'Adventure Crew', 'he/him',    false, 'San Francisco', 'CA', 37.7748, -122.4188, 20, 'extrovert'),
('00000000-0000-4000-a000-000000000017', 'Nina',    '2000-08-12', 'female',    'Dance Instructor',    'Freelancer',  'Activity Buddy', 'she/her',   true,  'San Francisco', 'CA', 37.7775, -122.4215, 25, 'extrovert'),
('00000000-0000-4000-a000-000000000018', 'Leo',     '2002-04-25', 'male',      'Graphic Designer',    'Working',     'Activity Buddy', 'he/him',    false, 'San Francisco', 'CA', 37.7738, -122.4178, 25, 'introvert'),
('00000000-0000-4000-a000-000000000019', 'Zoe',     '1997-12-08', 'female',    'Architect',           'Working',     'Deep Convos',    'she/her',   false, 'San Francisco', 'CA', 37.7762, -122.4198, 25, 'ambivert'),
('00000000-0000-4000-a000-000000000020', 'Chris',   '2001-06-20', 'male',      'Data Analyst',        'Working',     'Gym Partner',    'he/him',    false, 'San Francisco', 'CA', 37.7746, -122.4182, 25, 'introvert'),
('00000000-0000-4000-a000-000000000021', 'Sam',     '2003-08-28', 'nonbinary', 'Social Worker',       'Working',     'Group Hangs',    'they/them', true,  'San Francisco', 'CA', 37.7772, -122.4208, 30, 'ambivert'),
('00000000-0000-4000-a000-000000000022', 'Rachel',  '2000-01-15', 'female',    'Lawyer',              'Working',     'Deep Convos',    'she/her',   false, 'San Francisco', 'CA', 37.7756, -122.4192, 20, 'introvert'),
('00000000-0000-4000-a000-000000000023', 'Ryan',    '2002-07-07', 'male',      'Firefighter',         'Working',     'Gym Partner',    'he/him',    false, 'San Francisco', 'CA', 37.7741, -122.4172, 25, 'extrovert'),
('00000000-0000-4000-a000-000000000024', 'Jade',    '1996-03-22', 'female',    'Freelance Writer',    'Freelancer',  'Deep Convos',    'she/her',   true,  'San Francisco', 'CA', 37.7768, -122.4202, 25, 'introvert'),
('00000000-0000-4000-a000-000000000025', 'James',   '2004-11-11', 'male',      'Student',             'Student',     'Group Hangs',    'he/him',    false, 'San Francisco', 'CA', 37.7744, -122.4168, 25, 'ambivert')
ON CONFLICT (id) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════
-- 5. PROFILE EMOJIS (5 per user = 125 total)
-- ═══════════════════════════════════════════════════════════════
INSERT INTO public.profile_emojis (user_id, emoji, position) VALUES
-- Priya
('00000000-0000-4000-a000-000000000001', '🎨', 1), ('00000000-0000-4000-a000-000000000001', '☕', 2), ('00000000-0000-4000-a000-000000000001', '🎵', 3), ('00000000-0000-4000-a000-000000000001', '🧘', 4), ('00000000-0000-4000-a000-000000000001', '📸', 5),
-- Marcus
('00000000-0000-4000-a000-000000000002', '💻', 1), ('00000000-0000-4000-a000-000000000002', '🏀', 2), ('00000000-0000-4000-a000-000000000002', '🎮', 3), ('00000000-0000-4000-a000-000000000002', '🍕', 4), ('00000000-0000-4000-a000-000000000002', '🎧', 5),
-- Sophie
('00000000-0000-4000-a000-000000000003', '📚', 1), ('00000000-0000-4000-a000-000000000003', '🍷', 2), ('00000000-0000-4000-a000-000000000003', '🎭', 3), ('00000000-0000-4000-a000-000000000003', '🌿', 4), ('00000000-0000-4000-a000-000000000003', '✨', 5),
-- Kai
('00000000-0000-4000-a000-000000000004', '📷', 1), ('00000000-0000-4000-a000-000000000004', '🏔️', 2), ('00000000-0000-4000-a000-000000000004', '🎶', 3), ('00000000-0000-4000-a000-000000000004', '🍜', 4), ('00000000-0000-4000-a000-000000000004', '🌅', 5),
-- Aisha
('00000000-0000-4000-a000-000000000005', '💃', 1), ('00000000-0000-4000-a000-000000000005', '🎬', 2), ('00000000-0000-4000-a000-000000000005', '🧠', 3), ('00000000-0000-4000-a000-000000000005', '🌸', 4), ('00000000-0000-4000-a000-000000000005', '🍵', 5),
-- Tyler (perfect match — shares all 5 emojis with Sai: 🌴🌋🪂🏔️🚂)
('00000000-0000-4000-a000-000000000006', '🌴', 1), ('00000000-0000-4000-a000-000000000006', '🌋', 2), ('00000000-0000-4000-a000-000000000006', '🪂', 3), ('00000000-0000-4000-a000-000000000006', '🏔️', 4), ('00000000-0000-4000-a000-000000000006', '🚂', 5),
-- Luna (perfect match — shares all 5 emojis with Sai: 🌴🌋🪂🏔️🚂)
('00000000-0000-4000-a000-000000000007', '🌴', 1), ('00000000-0000-4000-a000-000000000007', '🌋', 2), ('00000000-0000-4000-a000-000000000007', '🪂', 3), ('00000000-0000-4000-a000-000000000007', '🏔️', 4), ('00000000-0000-4000-a000-000000000007', '🚂', 5),
-- Jordan
('00000000-0000-4000-a000-000000000008', '🎹', 1), ('00000000-0000-4000-a000-000000000008', '🎤', 2), ('00000000-0000-4000-a000-000000000008', '🌃', 3), ('00000000-0000-4000-a000-000000000008', '🔥', 4), ('00000000-0000-4000-a000-000000000008', '🎧', 5),
-- Mei
('00000000-0000-4000-a000-000000000009', '🧪', 1), ('00000000-0000-4000-a000-000000000009', '📊', 2), ('00000000-0000-4000-a000-000000000009', '🍣', 3), ('00000000-0000-4000-a000-000000000009', '🎮', 4), ('00000000-0000-4000-a000-000000000009', '🌺', 5),
-- River
('00000000-0000-4000-a000-000000000010', '🧘', 1), ('00000000-0000-4000-a000-000000000010', '🌊', 2), ('00000000-0000-4000-a000-000000000010', '🌻', 3), ('00000000-0000-4000-a000-000000000010', '🥾', 4), ('00000000-0000-4000-a000-000000000010', '🦋', 5),
-- Sarah
('00000000-0000-4000-a000-000000000011', '🔬', 1), ('00000000-0000-4000-a000-000000000011', '📖', 2), ('00000000-0000-4000-a000-000000000011', '🎨', 3), ('00000000-0000-4000-a000-000000000011', '☕', 4), ('00000000-0000-4000-a000-000000000011', '🌟', 5),
-- David
('00000000-0000-4000-a000-000000000012', '📖', 1), ('00000000-0000-4000-a000-000000000012', '🎸', 2), ('00000000-0000-4000-a000-000000000012', '🏃', 3), ('00000000-0000-4000-a000-000000000012', '🍜', 4), ('00000000-0000-4000-a000-000000000012', '🌍', 5),
-- Maya
('00000000-0000-4000-a000-000000000013', '🎨', 1), ('00000000-0000-4000-a000-000000000013', '🌸', 2), ('00000000-0000-4000-a000-000000000013', '🎵', 3), ('00000000-0000-4000-a000-000000000013', '📷', 4), ('00000000-0000-4000-a000-000000000013', '🦋', 5),
-- Alex
('00000000-0000-4000-a000-000000000014', '👨‍🍳', 1), ('00000000-0000-4000-a000-000000000014', '🔥', 2), ('00000000-0000-4000-a000-000000000014', '🌶️', 3), ('00000000-0000-4000-a000-000000000014', '🎵', 4), ('00000000-0000-4000-a000-000000000014', '🏖️', 5),
-- Emma
('00000000-0000-4000-a000-000000000015', '💭', 1), ('00000000-0000-4000-a000-000000000015', '📚', 2), ('00000000-0000-4000-a000-000000000015', '🧘', 3), ('00000000-0000-4000-a000-000000000015', '🌊', 4), ('00000000-0000-4000-a000-000000000015', '🐕', 5),
-- Omar
('00000000-0000-4000-a000-000000000016', '🎬', 1), ('00000000-0000-4000-a000-000000000016', '📸', 2), ('00000000-0000-4000-a000-000000000016', '🌃', 3), ('00000000-0000-4000-a000-000000000016', '🎵', 4), ('00000000-0000-4000-a000-000000000016', '🍿', 5),
-- Nina
('00000000-0000-4000-a000-000000000017', '💃', 1), ('00000000-0000-4000-a000-000000000017', '🎵', 2), ('00000000-0000-4000-a000-000000000017', '🌟', 3), ('00000000-0000-4000-a000-000000000017', '🧘', 4), ('00000000-0000-4000-a000-000000000017', '🎭', 5),
-- Leo
('00000000-0000-4000-a000-000000000018', '🎨', 1), ('00000000-0000-4000-a000-000000000018', '💻', 2), ('00000000-0000-4000-a000-000000000018', '🧋', 3), ('00000000-0000-4000-a000-000000000018', '🏊', 4), ('00000000-0000-4000-a000-000000000018', '🌸', 5),
-- Zoe
('00000000-0000-4000-a000-000000000019', '🏗️', 1), ('00000000-0000-4000-a000-000000000019', '📐', 2), ('00000000-0000-4000-a000-000000000019', '🎨', 3), ('00000000-0000-4000-a000-000000000019', '🌿', 4), ('00000000-0000-4000-a000-000000000019', '☕', 5),
-- Chris
('00000000-0000-4000-a000-000000000020', '📊', 1), ('00000000-0000-4000-a000-000000000020', '🎮', 2), ('00000000-0000-4000-a000-000000000020', '🏃', 3), ('00000000-0000-4000-a000-000000000020', '🎵', 4), ('00000000-0000-4000-a000-000000000020', '🌄', 5),
-- Sam
('00000000-0000-4000-a000-000000000021', '🤝', 1), ('00000000-0000-4000-a000-000000000021', '💪', 2), ('00000000-0000-4000-a000-000000000021', '🌍', 3), ('00000000-0000-4000-a000-000000000021', '📖', 4), ('00000000-0000-4000-a000-000000000021', '🎵', 5),
-- Rachel
('00000000-0000-4000-a000-000000000022', '⚖️', 1), ('00000000-0000-4000-a000-000000000022', '📚', 2), ('00000000-0000-4000-a000-000000000022', '🏃', 3), ('00000000-0000-4000-a000-000000000022', '🍷', 4), ('00000000-0000-4000-a000-000000000022', '🌃', 5),
-- Ryan
('00000000-0000-4000-a000-000000000023', '🚒', 1), ('00000000-0000-4000-a000-000000000023', '💪', 2), ('00000000-0000-4000-a000-000000000023', '🏈', 3), ('00000000-0000-4000-a000-000000000023', '🍳', 4), ('00000000-0000-4000-a000-000000000023', '🐕', 5),
-- Jade
('00000000-0000-4000-a000-000000000024', '✍️', 1), ('00000000-0000-4000-a000-000000000024', '☕', 2), ('00000000-0000-4000-a000-000000000024', '🌿', 3), ('00000000-0000-4000-a000-000000000024', '📚', 4), ('00000000-0000-4000-a000-000000000024', '🌙', 5),
-- James
('00000000-0000-4000-a000-000000000025', '📚', 1), ('00000000-0000-4000-a000-000000000025', '🎮', 2), ('00000000-0000-4000-a000-000000000025', '🏋️', 3), ('00000000-0000-4000-a000-000000000025', '🍕', 4), ('00000000-0000-4000-a000-000000000025', '🎧', 5)
ON CONFLICT (user_id, position) DO UPDATE SET emoji = EXCLUDED.emoji;

-- ═══════════════════════════════════════════════════════════════
-- 6. PROFILE PHOTOS (1 primary photo each, using pravatar.cc)
-- ═══════════════════════════════════════════════════════════════
INSERT INTO public.profile_photos (user_id, url, position, is_primary) VALUES
('00000000-0000-4000-a000-000000000001', 'https://i.pravatar.cc/800?img=5',  1, true),
('00000000-0000-4000-a000-000000000002', 'https://i.pravatar.cc/800?img=8',  1, true),
('00000000-0000-4000-a000-000000000003', 'https://i.pravatar.cc/800?img=9',  1, true),
('00000000-0000-4000-a000-000000000004', 'https://i.pravatar.cc/800?img=11', 1, true),
('00000000-0000-4000-a000-000000000005', 'https://i.pravatar.cc/800?img=25', 1, true),
('00000000-0000-4000-a000-000000000006', 'https://i.pravatar.cc/800?img=12', 1, true),
('00000000-0000-4000-a000-000000000007', 'https://i.pravatar.cc/800?img=32', 1, true),
('00000000-0000-4000-a000-000000000008', 'https://i.pravatar.cc/800?img=14', 1, true),
('00000000-0000-4000-a000-000000000009', 'https://i.pravatar.cc/800?img=20', 1, true),
('00000000-0000-4000-a000-000000000010', 'https://i.pravatar.cc/800?img=16', 1, true),
('00000000-0000-4000-a000-000000000011', 'https://i.pravatar.cc/800?img=23', 1, true),
('00000000-0000-4000-a000-000000000012', 'https://i.pravatar.cc/800?img=33', 1, true),
('00000000-0000-4000-a000-000000000013', 'https://i.pravatar.cc/800?img=26', 1, true),
('00000000-0000-4000-a000-000000000014', 'https://i.pravatar.cc/800?img=51', 1, true),
('00000000-0000-4000-a000-000000000015', 'https://i.pravatar.cc/800?img=44', 1, true),
('00000000-0000-4000-a000-000000000016', 'https://i.pravatar.cc/800?img=52', 1, true),
('00000000-0000-4000-a000-000000000017', 'https://i.pravatar.cc/800?img=27', 1, true),
('00000000-0000-4000-a000-000000000018', 'https://i.pravatar.cc/800?img=53', 1, true),
('00000000-0000-4000-a000-000000000019', 'https://i.pravatar.cc/800?img=28', 1, true),
('00000000-0000-4000-a000-000000000020', 'https://i.pravatar.cc/800?img=54', 1, true),
('00000000-0000-4000-a000-000000000021', 'https://i.pravatar.cc/800?img=55', 1, true),
('00000000-0000-4000-a000-000000000022', 'https://i.pravatar.cc/800?img=29', 1, true),
('00000000-0000-4000-a000-000000000023', 'https://i.pravatar.cc/800?img=56', 1, true),
('00000000-0000-4000-a000-000000000024', 'https://i.pravatar.cc/800?img=30', 1, true),
('00000000-0000-4000-a000-000000000025', 'https://i.pravatar.cc/800?img=57', 1, true)
ON CONFLICT DO NOTHING;

-- ═══════════════════════════════════════════════════════════════
-- Done! Next steps:
--   1. Also run seed_icebreakers.sql if you haven't already
--   2. In the app, go to Profile → Dev Tools → "Reset Mock Data"
--      This moves profiles to your location and pre-seeds swipes
--   3. Check Friends tab — 5 pre-made matches are waiting:
--      • 3 in "icebreaker_pending" (mock user answered, you haven't)
--      • 2 in "chat_active" (both answered + text messages)
--   4. Go to Discover tab and swipe right on remaining 20 → instant matches!
-- ═══════════════════════════════════════════════════════════════
