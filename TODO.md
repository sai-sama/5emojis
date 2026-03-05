# 5Emojis — Project TODO

> "Stop overthinking your first message. Just send 5 emojis."

A friendship app that makes connecting with new people fun, low-pressure, and emoji-first.

---

## Tech Stack

- **Frontend**: React Native + Expo SDK 55 (managed workflow) — iOS & Android
- **Backend**: Supabase (Auth, Database, Realtime, Storage)
- **Database**: PostgreSQL + PostGIS (radius-based location search)
- **Auth**: Apple Sign In + Google Sign In + email/password
- **Chat**: Supabase Realtime subscriptions
- **Emoji rendering**: Twemoji (consistent cross-platform) + emoji-mart (picker)
- **Photo moderation**: Supabase Edge Function + OpenAI omni-moderation-latest
- **Push notifications**: Expo Push Notifications (free)
- **Styling**: StyleSheet (migrated from NativeWind) + design system in `lib/constants.ts`
- **Navigation**: Expo Router (file-based)
- **Testing**: Jest 29 + jest-expo + @testing-library/react-native
- **Web (Phase 2)**: Next.js
- **OTA updates**: Expo EAS Update

---

## Phase 1 — MVP

### Project Setup
- [x] Initialize Expo project with TypeScript
- [x] Set up Supabase project (database, auth, storage)
- [x] Configure Expo environment variables for Supabase
- [x] Set up Git repo
- [x] Set up PostGIS extension in Supabase
- [ ] Configure EAS Build for iOS and Android

### Database Schema
- [x] `profiles` — id, name, dob, gender, profession, life_stage, friendship_style, pronouns, is_new_to_city, city, state, latitude, longitude, search_radius_miles, personality_type, communication_style, kids, relationship_status, work_style
- [x] `profile_emojis` — user_id, emoji, position (1-5)
- [x] `profile_photos` — user_id, url, position, is_primary
- [x] `profile_interests` — user_id, interest_tag
- [x] `profile_reveals` — user_id, content, position (1-4)
- [x] `profile_availability` — user_id, slot
- [x] `profile_pets` — user_id, pet
- [x] `profile_dietary` — user_id, preference
- [x] `swipes` — swiper_id, swiped_id, direction
- [x] `matches` — user1_id, user2_id, emoji_match_count, icebreaker_question_id
- [x] `messages` — match_id, sender_id, content, is_emoji_only, read_at, reactions
- [x] `blocks` — blocker_id, blocked_id
- [x] `reports` — reporter_id, reported_id, reason, details, status
- [x] `icebreaker_questions` — question, category
- [x] `error_logs` — user_id, message, stack, context, platform
- [x] RLS policies for all tables
- [x] Trigger: auto-create match with random icebreaker on mutual right-swipe
- [x] Trigger: calculate emoji_match_count on match creation
- [x] Function: `nearby_profiles` — radius search using PostGIS with gender/block filtering
- [x] ON DELETE CASCADE on all profile-related tables

### Auth & Onboarding
- [x] Email/password auth flow (sign up, sign in, session management)
- [x] Apple Sign In integration (code complete, needs Apple Developer config)
- [x] Google Sign In integration (code complete, needs Google Cloud config)
- [x] Route guard in root index (loading → auth → onboarding → home)
- [x] Consolidated 5-screen onboarding: Basics (name+dob+gender) → Photos → Emojis → Details → Location
- [x] 18+ age enforcement (DB CHECK + app validation)
- [x] Photo upload with compression + content moderation (Edge Function)
- [x] Photo guidelines modal explaining photo policy
- [x] Store lat/lng from city for geo queries
- [ ] Phone number collection screen (store for later verification)
- [x] Face detection on primary photo (Google ML Kit)

### Profile
- [x] Profile creation with: name, age (from DOB), up to 5 photos, 5 emojis, city, gender
- [x] Extended profile fields: profession, life stage, interests, friendship style, pronouns, personality type, communication style, availability, pets, dietary
- [x] 4 reveal/description points (hidden until match)
- [x] Edit profile screen (photos, emojis, personal info, about, more, location)
- [x] Search radius slider
- [x] Change search city from profile
- [x] Profile completion tracking + nudge card
- [x] Zodiac sign auto-detection from DOB
- [x] Emoji edit cooldown (24h) with paid bypass placeholder
- [x] Delete account with photo cleanup + confirmation UI

### Discovery & Swiping
- [x] Location-based card feed via `nearby_profiles` RPC
- [x] Cards show: 5 emojis, 1 main photo, name, age, distance, profession, gender badge
- [x] Swipe right (Vibe) / swipe left (Pass) with Reanimated gestures
- [x] Filter out: already swiped, blocked users, own profile
- [x] Radius-based filtering using PostGIS
- [x] Gender filter (multi-select, persisted via AsyncStorage)
- [x] Swipe animations (smooth gesture + card transitions)
- [x] New user swipe tutorial overlay
- [x] Undo last swipe
- [x] Empty state when no profiles nearby
- [x] No swipe limits
- [x] No match expiry

### Matching
- [x] Detect mutual right-swipe → create match (DB trigger)
- [x] Match modal with icebreaker question preview
- [x] Icebreaker system: random question assigned per match
- [x] 1000+ icebreaker questions seeded across 20 categories
- [x] Match notification (push notification on match)
- [x] On match: reveal profile details + reveals
- [x] Matches list with chat state indicators

### Messaging (Icebreaker-First)
- [x] Chat screen per match with 3 states: icebreaker_pending → icebreaker_waiting → chat_active
- [x] Icebreaker flow: both users answer with 5 emojis, responses blurred until both answer
- [x] After both answer: responses revealed, text chat unlocks
- [x] Real-time message delivery via Supabase Realtime
- [x] Push notifications for new messages
- [x] Message read receipts (blue checkmarks)
- [x] Emoji reactions on messages (long-press)
- [x] Date separators in chat

### Blocking & Reporting
- [x] Block user from chat header
- [x] Block + report via ReportModal with reason selection + optional details
- [x] Blocked users excluded from discovery (bidirectional in `nearby_profiles` RPC)
- [x] Block removes existing match
- [x] Silent block (blocked user can't tell via RLS)
- [x] Block filtering in incoming vibes
- [x] Admin report review system (in-app admin panel with error logs, reports, analytics)

### Safety & Legal
- [x] Terms of Service — in-app screen
- [x] Privacy Policy — in-app screen
- [x] Legal links on sign-up screen
- [x] Legal section in profile settings
- [x] Photo content moderation via Edge Function
- [ ] Swap placeholder emails for real addresses
- [ ] Lawyer review of ToS/Privacy before App Store

### Core UX Polish
- [x] Haptic feedback (emoji selection, swiping, matching, reactions)
- [x] Sound effects (match, swipe) with mute toggle
- [x] Loading states throughout
- [x] Error logging to Supabase `error_logs` table (35+ catch blocks wired)
- [x] Error boundary + global error handler
- [x] Empty states (no profiles, no matches, no messages)
- [x] App icon
- [x] Swipe tutorial overlay
- [x] Design system (COLORS, fonts centralized)

### Testing & Quality
- [x] Jest 29 + jest-expo test framework configured
- [x] 61 unit tests across 5 suites (zodiac, constants, profile-completion, message-service, onboarding-progress)
- [x] TypeScript strict mode — zero errors
- [ ] Integration tests for Supabase services
- [ ] E2E tests (Detox or Maestro)

---

## NEXT UP — External Service Config

### Apple Sign In (code ready, needs console setup)
- [ ] Apple Developer Console → Create App ID + "Sign in with Apple" capability
- [ ] Create Services ID + Sign in with Apple private key (`.p8`)
- [ ] Supabase Dashboard → Auth → Providers → Apple: paste credentials

### Google Sign In (code ready, needs console setup)
- [ ] Google Cloud Console → Create OAuth 2.0 Client IDs (iOS + Android + Web)
- [ ] Supabase Dashboard → Auth → Providers → Google: paste Web Client ID + Secret

### Supabase Auth Settings
- [ ] Set Site URL to Expo deep link scheme
- [ ] Re-enable email confirmation for production

---

## Phase 2 — Hard Mode, Badge, Groups, Web

### Hard Mode
- [ ] Toggle between Normal and Hard mode in settings
- [ ] Hard mode: only 5 emojis visible on card (no photo, no age, no city)
- [ ] Progressive reveal: match → reveal photo → chat → reveal details

### Emoji Match Badge
- [ ] Calculate overlapping emojis between matched users (0-5 score)
- [ ] 5/5 perfect match: special badge on chat, full-screen fireworks animation
- [ ] Perfect match: instantly view all 5 photos + full profile details
- [ ] Badge visible in matches list

### Group Mode
- [ ] Merge 2+ matched friends into a group chat
- [ ] Group discovery (find groups of friends with similar vibes)
- [ ] Group emoji identity (group picks 5 emojis together)

### Vibe Check Prompts
- [ ] Daily/weekly rotating prompt on cards
- [ ] User answers visible on their card
- [ ] Optional participation

### Engagement Features
- [ ] Daily Emoji Vibe badge
- [ ] Emoji Personality Insights (shareable card from emoji picks)
- [ ] Emoji Compatibility Animation on match

### Viral & Sharing
- [ ] Shareable emoji profile card (Instagram Stories, TikTok)
- [ ] "Guess My Emojis" link sharing
- [ ] Referral system

### Web Interface (Next.js)
- [ ] Landing page / marketing site
- [ ] Web app with same core features
- [ ] Shared Supabase backend

---

## Phase 3 — Monetization & Scale

### Premium Features (Cosmetic & Convenience — never gate core features)
- [ ] See who swiped right on you
- [ ] Boost profile visibility
- [ ] Extra emoji themes / custom emoji packs
- [ ] Profile customization (colors, backgrounds)
- [ ] Undo last swipe (currently free — gate behind premium later)
- [ ] Unlimited emoji changes (bypass 24h cooldown)

### Analytics & Admin
- [ ] Admin dashboard (user counts, match rates, report queue)
- [ ] User engagement metrics
- [ ] A/B testing infrastructure

### Infrastructure
- [ ] Migrate chat to dedicated WebSocket service if Supabase Realtime hits limits
- [ ] CDN optimization for photo delivery
- [ ] Rate limiting on swipes and messages
- [ ] Automated moderation (flag inappropriate photos/messages)

---

## Cost Tracking

| Service | Free Tier Limit | Current Plan | Monthly Cost |
|---------|----------------|-------------|-------------|
| Supabase | 500MB DB, 1GB storage, 50K MAU | Free | $0 |
| Expo / EAS | 30 builds/mo | Free | $0 |
| Apple Developer | — | Required | $8.25/mo ($99/yr) |
| Google Play | — | One-time $25 | $0 |
| Push Notifications | Unlimited (Expo) | Free | $0 |
| Google ML Kit | On-device, unlimited | Free | $0 |
| SMS (Twilio) | — | Pay-per-use | ~$0 until phone verify enabled |
| **Total** | | | **~$8/mo at launch** |

Upgrade triggers:
- 500+ users with photos → Supabase Pro ($25/mo)
- Phone OTP verification enabled → Twilio costs ($0.05/verify)
- Heavy build pipeline → EAS Production ($99/mo)

---

## Design Principles

1. **The constraint is the feature** — 5 emojis isn't a limitation, it's what makes the first interaction fun
2. **Every interaction should spark joy** — haptics, animations, sound on match/emoji pick/reveal
3. **Less anxiety, more play** — this is a game, not a job interview
4. **Safety first** — blocking, reporting, face photo requirements from day 1
5. **Shareability built in** — emoji cards, personality insights, guess games are inherently viral
6. **Friendships don't expire** — no artificial timers, no pressure, no pay-to-play on core features
7. **Beat Bumble BFF by being generous** — no swipe limits, no match expiry, monetize cosmetics not access
