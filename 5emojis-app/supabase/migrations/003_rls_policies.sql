-- ╔══════════════════════════════════════════════════════════════╗
-- ║  5Emojis — Row Level Security Policies                     ║
-- ║  Merged from dev migrations 001–017                        ║
-- ╚══════════════════════════════════════════════════════════════╝

-- ─── Enable RLS on all tables ──────────────────────────────────
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_emojis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_languages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_reveals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_pets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_dietary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.icebreaker_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.swipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_swipe_counts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.super_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wellness_tips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;


-- ═══════════════════════════════════════════════════════════════
-- PROFILES
-- ═══════════════════════════════════════════════════════════════
CREATE POLICY "Profiles are viewable by authenticated users"
  ON public.profiles FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Users can create their own profile"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "Users can delete their own profile"
  ON public.profiles FOR DELETE TO authenticated
  USING (id = auth.uid());

-- Admins can update any profile (suspend/unsuspend, premium status)
CREATE POLICY "Admins can update any profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  );


-- ═══════════════════════════════════════════════════════════════
-- PROFILE EMOJIS
-- ═══════════════════════════════════════════════════════════════
CREATE POLICY "Emojis are viewable by authenticated users"
  ON public.profile_emojis FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can manage their own emojis"
  ON public.profile_emojis FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own emojis"
  ON public.profile_emojis FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own emojis"
  ON public.profile_emojis FOR DELETE TO authenticated
  USING (user_id = auth.uid());


-- ═══════════════════════════════════════════════════════════════
-- PROFILE PHOTOS
-- ═══════════════════════════════════════════════════════════════
CREATE POLICY "Photos are viewable by authenticated users"
  ON public.profile_photos FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can manage their own photos"
  ON public.profile_photos FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own photos"
  ON public.profile_photos FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own photos"
  ON public.profile_photos FOR DELETE TO authenticated
  USING (user_id = auth.uid());


-- ═══════════════════════════════════════════════════════════════
-- PROFILE INTERESTS
-- ═══════════════════════════════════════════════════════════════
CREATE POLICY "Interests are viewable by authenticated users"
  ON public.profile_interests FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can manage their own interests"
  ON public.profile_interests FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own interests"
  ON public.profile_interests FOR DELETE TO authenticated
  USING (user_id = auth.uid());


-- ═══════════════════════════════════════════════════════════════
-- PROFILE LANGUAGES
-- ═══════════════════════════════════════════════════════════════
CREATE POLICY "Languages are viewable by authenticated users"
  ON public.profile_languages FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can manage their own languages"
  ON public.profile_languages FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own languages"
  ON public.profile_languages FOR DELETE TO authenticated
  USING (user_id = auth.uid());


-- ═══════════════════════════════════════════════════════════════
-- PROFILE REVEALS
-- ═══════════════════════════════════════════════════════════════
CREATE POLICY "Reveals visible to matched users"
  ON public.profile_reveals FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.matches m
      WHERE (m.user1_id = auth.uid() AND m.user2_id = user_id)
         OR (m.user2_id = auth.uid() AND m.user1_id = user_id)
    )
  );

CREATE POLICY "Users can manage their own reveals"
  ON public.profile_reveals FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own reveals"
  ON public.profile_reveals FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own reveals"
  ON public.profile_reveals FOR DELETE TO authenticated
  USING (user_id = auth.uid());


-- ═══════════════════════════════════════════════════════════════
-- PROFILE AVAILABILITY / PETS / DIETARY
-- ═══════════════════════════════════════════════════════════════
CREATE POLICY "Availability viewable by authenticated"
  ON public.profile_availability FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage own availability"
  ON public.profile_availability FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can delete own availability"
  ON public.profile_availability FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Pets viewable by authenticated"
  ON public.profile_pets FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage own pets"
  ON public.profile_pets FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can delete own pets"
  ON public.profile_pets FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Dietary viewable by authenticated"
  ON public.profile_dietary FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage own dietary"
  ON public.profile_dietary FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can delete own dietary"
  ON public.profile_dietary FOR DELETE TO authenticated USING (user_id = auth.uid());


-- ═══════════════════════════════════════════════════════════════
-- ICEBREAKER QUESTIONS
-- ═══════════════════════════════════════════════════════════════
CREATE POLICY "Icebreakers readable by all authenticated"
  ON public.icebreaker_questions FOR SELECT TO authenticated USING (true);


-- ═══════════════════════════════════════════════════════════════
-- SWIPES
-- ═══════════════════════════════════════════════════════════════
CREATE POLICY "Users can create their own swipes"
  ON public.swipes FOR INSERT TO authenticated
  WITH CHECK (swiper_id = auth.uid());

CREATE POLICY "Users can read their own swipes"
  ON public.swipes FOR SELECT TO authenticated
  USING (swiper_id = auth.uid());

-- Allow reading incoming swipes ("Who Liked You" feature)
CREATE POLICY "Users can read incoming swipes"
  ON public.swipes FOR SELECT TO authenticated
  USING (swiped_id = auth.uid());

-- Allow deleting own swipes (undo swipe)
CREATE POLICY "Users can delete their own swipes"
  ON public.swipes FOR DELETE TO authenticated
  USING (swiper_id = auth.uid());


-- ═══════════════════════════════════════════════════════════════
-- MATCHES
-- ═══════════════════════════════════════════════════════════════
CREATE POLICY "Users can read their own matches"
  ON public.matches FOR SELECT TO authenticated
  USING (user1_id = auth.uid() OR user2_id = auth.uid());

CREATE POLICY "Users can delete their own matches"
  ON public.matches FOR DELETE TO authenticated
  USING (user1_id = auth.uid() OR user2_id = auth.uid());


-- ═══════════════════════════════════════════════════════════════
-- MESSAGES
-- ═══════════════════════════════════════════════════════════════
CREATE POLICY "Users can read messages in their matches"
  ON public.messages FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.matches m
      WHERE m.id = match_id
        AND (m.user1_id = auth.uid() OR m.user2_id = auth.uid())
    )
  );

CREATE POLICY "Users can send messages in their matches"
  ON public.messages FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.matches m
      WHERE m.id = match_id
        AND (m.user1_id = auth.uid() OR m.user2_id = auth.uid())
    )
  );

-- Mark other people's messages as read
CREATE POLICY "Users can update read_at on messages sent to them"
  ON public.messages FOR UPDATE TO authenticated
  USING (
    sender_id != auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.matches m
      WHERE m.id = match_id
        AND (m.user1_id = auth.uid() OR m.user2_id = auth.uid())
    )
  );

-- Allow users to edit their own messages (e.g. update icebreaker response)
CREATE POLICY "Users can update their own messages"
  ON public.messages FOR UPDATE TO authenticated
  USING (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.matches m
      WHERE m.id = match_id
        AND (m.user1_id = auth.uid() OR m.user2_id = auth.uid())
    )
  );


-- ═══════════════════════════════════════════════════════════════
-- MESSAGE REACTIONS
-- ═══════════════════════════════════════════════════════════════
CREATE POLICY "Users can read reactions on their match messages"
  ON public.message_reactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.messages m
      JOIN public.matches mt ON m.match_id = mt.id
      WHERE m.id = message_reactions.message_id
        AND (mt.user1_id = auth.uid() OR mt.user2_id = auth.uid())
    )
  );

CREATE POLICY "Users can add reactions"
  ON public.message_reactions FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can remove their own reactions"
  ON public.message_reactions FOR DELETE
  USING (user_id = auth.uid());


-- ═══════════════════════════════════════════════════════════════
-- BLOCKS
-- ═══════════════════════════════════════════════════════════════
CREATE POLICY "Users can create blocks"
  ON public.blocks FOR INSERT TO authenticated
  WITH CHECK (blocker_id = auth.uid());

CREATE POLICY "Users can read their own blocks"
  ON public.blocks FOR SELECT TO authenticated
  USING (blocker_id = auth.uid());

CREATE POLICY "Users can remove their own blocks"
  ON public.blocks FOR DELETE TO authenticated
  USING (blocker_id = auth.uid());


-- ═══════════════════════════════════════════════════════════════
-- REPORTS
-- ═══════════════════════════════════════════════════════════════
CREATE POLICY "Users can create reports"
  ON public.reports FOR INSERT TO authenticated
  WITH CHECK (reporter_id = auth.uid());

CREATE POLICY "Users can read their own reports"
  ON public.reports FOR SELECT TO authenticated
  USING (reporter_id = auth.uid());

-- Admins can read and update all reports
CREATE POLICY "Admins can read all reports"
  ON public.reports FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true)
  );

CREATE POLICY "Admins can update report status"
  ON public.reports FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true)
  );


-- ═══════════════════════════════════════════════════════════════
-- DAILY SWIPE COUNTS
-- ═══════════════════════════════════════════════════════════════
CREATE POLICY "Users can view own swipe counts"
  ON public.daily_swipe_counts FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own swipe counts"
  ON public.daily_swipe_counts FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own swipe counts"
  ON public.daily_swipe_counts FOR UPDATE USING (auth.uid() = user_id);


-- ═══════════════════════════════════════════════════════════════
-- SUPER LIKES
-- ═══════════════════════════════════════════════════════════════
CREATE POLICY "Users can view super likes involving them"
  ON public.super_likes FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can insert own super likes"
  ON public.super_likes FOR INSERT
  WITH CHECK (auth.uid() = sender_id);


-- ═══════════════════════════════════════════════════════════════
-- AI CONTENT / WELLNESS TIPS
-- ═══════════════════════════════════════════════════════════════
CREATE POLICY "AI content is readable by all"
  ON public.ai_content FOR SELECT TO authenticated USING (true);

CREATE POLICY "Anyone can read tips"
  ON public.wellness_tips FOR SELECT USING (true);


-- ═══════════════════════════════════════════════════════════════
-- ERROR LOGS
-- ═══════════════════════════════════════════════════════════════
CREATE POLICY "Users can insert error logs"
  ON public.error_logs FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can read own error logs"
  ON public.error_logs FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can read all error logs"
  ON public.error_logs FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true)
  );


-- ═══════════════════════════════════════════════════════════════
-- APP SETTINGS
-- ═══════════════════════════════════════════════════════════════
CREATE POLICY "Anyone can read app settings"
  ON public.app_settings FOR SELECT USING (true);

CREATE POLICY "Admins can update app settings"
  ON public.app_settings FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

CREATE POLICY "Admins can insert app settings"
  ON public.app_settings FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));


-- ═══════════════════════════════════════════════════════════════
-- STORAGE POLICIES (profile photos bucket)
-- ═══════════════════════════════════════════════════════════════
CREATE POLICY "Profile photos are publicly viewable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'profile-photos');

CREATE POLICY "Users can upload their own photos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'profile-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can update their own photos"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'profile-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete their own photos"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'profile-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
