# 5Emojis — Project TODO

> "Stop overthinking your first message. Just send 5 emojis."

A friendship app that makes connecting with new people fun, low-pressure, and emoji-first.

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
- **Styling**: NativeWind (Tailwind CSS for React Native)
- **Navigation**: Expo Router (file-based)
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
- [ ] `profiles` — id, name, dob, race, religion, profession, life_stage, friendship_style, pronouns, is_new_to_city, city, state, zip, latitude, longitude, search_radius_miles, created_at
- [ ] `profile_emojis` — user_id, emoji, position (1-5), unique per user+position
- [ ] `profile_photos` — user_id, url, position (1-5), is_primary (position 1 = main photo on swipe card)
- [ ] `profile_interests` — user_id, interest_tag (3-5 tags like "hiking", "gaming", "food", "live music")
- [ ] `profile_languages` — user_id, language
- [ ] `profile_reveals` — user_id, content, position (1-4), hidden until match
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
- [ ] Onboarding flow: Name > DOB > Photo upload > 5 Emoji selection > Details (race, religion, profession, life stage, languages, interests, friendship style, pronouns) > City/location
- [ ] Face detection on primary photo upload (Google ML Kit — reject group shots, landscapes, sunglasses)
- [ ] Photo guidelines screen explaining the main photo policy
- [ ] Store lat/lng from city for geo queries

### Profile
- [ ] Profile creation with: name, age (from DOB), up to 5 photos, 5 emojis, city
- [ ] Extended profile fields: race, religion, profession, life stage, languages, interests (3-5 tags), friendship style, pronouns
- [ ] 4 reveal/description points (hidden until match)
- [ ] "New to City" badge (toggleable by user)
- [ ] Edit profile screen (change emojis, photos, location, details, reveals)
- [ ] Search radius slider (miles from specified city/zip)
- [ ] Change search city/zip from profile

### Discovery & Swiping
- [ ] Location-based card feed — default to profile city
- [ ] Cards show: 5 emojis, 1 main photo, name, age, distance ("3 miles away"), profession
- [ ] "New to City" badge visible on card when applicable
- [ ] Swipe right (interested) / swipe left (pass)
- [ ] Filter out: already swiped, blocked users, own profile
- [ ] Radius-based filtering using PostGIS
- [ ] Swipe animations (smooth, satisfying)
- [ ] **No swipe limits** — generous free usage, no artificial caps
- [ ] **No match expiry** — matches never expire, friendships don't have a countdown

### Matching
- [ ] Detect mutual right-swipe → create match
- [ ] Match notification (push notification)
- [ ] Match screen animation — both emoji sets collide/merge with haptics
- [ ] On match: reveal remaining photos + 4 reveal/description points + full profile details (interests, languages, life stage, friendship style, etc.)
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
- [ ] Daily/weekly rotating prompt on cards ("Last thing you binged?", "Go-to comfort food?")
- [ ] User answers visible on their card — gives conversation starters
- [ ] Optional participation (skip if not interested)

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

### Premium Features (Cosmetic & Convenience — never gate core features)
- [ ] See who swiped right on you
- [ ] Boost profile visibility
- [ ] Extra emoji themes / custom emoji packs
- [ ] Profile customization (colors, backgrounds)
- [ ] Undo last swipe
- [ ] Change emojis more than once per week

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
