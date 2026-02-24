# 5Emojis — Project TODO

> "Stop overthinking your first message. Just send 5 emojis."

---

## Tech Stack

- **Frontend**: React Native + Expo (managed workflow) — iOS & Android
- **Backend**: Supabase (Auth, Database, Realtime, Storage)
- **Database**: PostgreSQL + PostGIS (radius-based location search)
- **Auth**: Apple Sign In + Google Sign In (required) + phone number collected (OTP verified on demand)
- **Chat**: Supabase Realtime subscriptions
- **Emoji rendering**: Twemoji (consistent cross-platform) + emoji-mart (picker)
- **Face detection**: Google ML Kit (on-device, free)
- **Push notifications**: Expo Push Notifications (free)
- **Web (Phase 2)**: Next.js
- **OTA updates**: Expo EAS Update

---

## Phase 1 — MVP

### Project Setup
- [ ] Initialize Expo project with TypeScript
- [ ] Set up Supabase project (database, auth, storage)
- [ ] Configure Expo environment variables for Supabase
- [ ] Set up Git repo + branch strategy (main/dev)
- [ ] Configure EAS Build for iOS and Android
- [ ] Set up PostGIS extension in Supabase

### Database Schema
- [ ] `profiles` — id, name, dob, city, state, zip, latitude, longitude, search_radius_miles, created_at
- [ ] `profile_emojis` — user_id, emoji, position (1-5), unique per user+position
- [ ] `profile_photos` — user_id, url, position (1-5), is_primary (position 1 = visible pre-match)
- [ ] `swipes` — swiper_id, swiped_id, direction (right/left), created_at
- [ ] `matches` — user1_id, user2_id, emoji_match_count, created_at, is_emoji_perfect (5/5)
- [ ] `messages` — match_id, sender_id, content, is_emoji_only, created_at
- [ ] `blocks` — blocker_id, blocked_id, created_at
- [ ] `reports` — reporter_id, reported_id, reason, details, created_at, status
- [ ] RLS policies for all tables
- [ ] Trigger: auto-create match row when both users swipe right
- [ ] Trigger: calculate emoji_match_count on match creation
- [ ] Function: radius search using PostGIS `ST_DWithin`

### Auth & Onboarding
- [ ] Apple Sign In integration
- [ ] Google Sign In integration
- [ ] Phone number collection screen (store for later verification)
- [ ] Onboarding flow: Name > DOB > Photo upload > 5 Emoji selection > City/location
- [ ] Face detection on primary photo upload (Google ML Kit — reject group shots, landscapes, sunglasses)
- [ ] Photo guidelines screen explaining the main photo policy
- [ ] Store lat/lng from city for geo queries

### Profile
- [ ] Profile creation with: name, age (from DOB), 1 primary photo, 5 emojis, city
- [ ] 4 additional "reveal" description points (hidden until match)
- [ ] 4 additional photos (hidden until match)
- [ ] Edit profile screen (change emojis, photos, location, descriptions)
- [ ] Search radius slider (miles from specified city/zip)
- [ ] Change search city/zip from profile

### Discovery & Swiping
- [ ] Location-based card feed — default to profile city
- [ ] Cards show: 5 emojis, 1 photo, age, city (pre-match)
- [ ] Swipe right (interested) / swipe left (pass)
- [ ] Filter out: already swiped, blocked users, own profile
- [ ] Radius-based filtering using PostGIS
- [ ] Swipe animations (smooth, satisfying)

### Matching
- [ ] Detect mutual right-swipe → create match
- [ ] Match notification (push notification)
- [ ] Match screen animation — both emoji sets collide/merge with haptics
- [ ] On match: reveal 4 additional photos + 4 description points
- [ ] Matches list screen

### Messaging (Emoji-First)
- [ ] Chat screen per match
- [ ] First message restricted to exactly 5 emojis (emoji keyboard only)
- [ ] After first emoji exchange from both sides → unlock full text messaging
- [ ] Real-time message delivery via Supabase Realtime
- [ ] Push notifications for new messages
- [ ] Message read receipts

### Blocking & Reporting
- [ ] Block user from profile or chat — hides them everywhere
- [ ] Report user with reason selection + optional details
- [ ] Blocked users excluded from all discovery queries
- [ ] Report review system (admin side — can be simple at first)

### Core UX Polish
- [ ] Haptic feedback on emoji selection, swiping, matching
- [ ] Loading states and error handling throughout
- [ ] Empty states (no more profiles nearby, no matches yet)
- [ ] App icon and splash screen

---

## Phase 2 — Hard Mode, Badge, Web

### Hard Mode
- [ ] Toggle between Normal and Hard mode in settings
- [ ] Hard mode: only 5 emojis visible on card (no photo, no age, no city)
- [ ] Progressive reveal: match → reveal photo → chat → reveal details

### Emoji Match Badge
- [ ] Calculate overlapping emojis between matched users (0-5 score)
- [ ] 5/5 perfect match: special badge on chat, full-screen fireworks animation
- [ ] Perfect match: instantly view all 5 photos + full profile details
- [ ] Badge visible in matches list

### Engagement Features
- [ ] **Emoji Icebreaker Round**: After matching, both users simultaneously send 5-emoji opener, then "translate" each other's meaning — instant inside joke
- [ ] **Daily Emoji Vibe**: Daily prompt "Pick the emoji that matches your vibe today" — shows as badge on card, daily open reason
- [ ] **Emoji Personality Insights**: After onboarding, generate shareable personality card from emoji picks ("3 food emojis = Foodie Soul")
- [ ] **Emoji Compatibility Animation**: On match, animate 10 emojis colliding, overlapping ones explode with confetti + sound
- [ ] **"Guess My Emojis" Social Game**: Share blurred profile to friends, they tap to guess your 5 emojis → reveal

### Viral & Sharing
- [ ] Shareable emoji profile card (Instagram Stories, TikTok)
- [ ] "Guess My Emojis" link sharing
- [ ] Referral system — invite friends, both get a perk

### Web Interface (Next.js)
- [ ] Landing page / marketing site
- [ ] Web app with same core features (profile, swiping, chat)
- [ ] Shared Supabase backend

---

## Phase 3 — Monetization & Scale

### Premium Features
- [ ] See who swiped right on you
- [ ] Unlimited daily swipes (free tier gets X per day)
- [ ] Boost profile visibility
- [ ] Change emojis more than once per week (or whatever limit)
- [ ] Undo last swipe

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
