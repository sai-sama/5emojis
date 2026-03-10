-- Icebreaker questions seed (v2 — redesigned for deeper connection)
-- Total: ~400 questions across 16 categories
-- Each completes: "5 Emojis I would use to describe..."
--
-- Design principles:
--   1. Divergent answers — different people pick meaningfully different emojis
--   2. Values/personality revelation — show who someone IS, not what happens to them
--   3. Reciprocal curiosity — seeing the other person's emojis sparks conversation
--   4. Emoji-expressible — concrete enough for emoji answers
--   5. Friendship-relevant — reveals whether you'd enjoy each other's company

-- Clear old questions (nullify FK references in matches first)
UPDATE public.matches SET icebreaker_question_id = NULL WHERE icebreaker_question_id IS NOT NULL;
DELETE FROM public.icebreaker_questions;

INSERT INTO public.icebreaker_questions (question, category) VALUES

-- ═══════════════════════════════════════════════════════════════
-- 1. WHO I AM — Core Identity
-- Psychology: Self-concept clarity. Highly divergent answers reveal personality.
-- ═══════════════════════════════════════════════════════════════
('my personality in a nutshell', 'who_i_am'),
('what makes me, me', 'who_i_am'),
('how my friends would describe me', 'who_i_am'),
('the animal that best represents my energy', 'who_i_am'),
('my vibe when nobody''s watching', 'who_i_am'),
('the emoji version of my autobiography', 'who_i_am'),
('what my energy feels like to be around', 'who_i_am'),
('my most obvious personality trait', 'who_i_am'),
('the sides of me most people don''t see', 'who_i_am'),
('my vibe at my best versus my worst', 'who_i_am'),
('how I show up in the world', 'who_i_am'),
('my morning personality versus evening personality', 'who_i_am'),
('the first impression I give versus the real me', 'who_i_am'),
('what my laugh says about me', 'who_i_am'),
('my energy levels throughout the day', 'who_i_am'),
('what my resting face hides', 'who_i_am'),
('my signature move in any situation', 'who_i_am'),
('how I''d introduce myself without words', 'who_i_am'),
('the contradiction that defines me', 'who_i_am'),
('the element that matches my personality', 'who_i_am'),
('my default setting when I walk into a room', 'who_i_am'),
('what people notice about me first', 'who_i_am'),
('how I exist in the background versus the spotlight', 'who_i_am'),
('what my handwriting would say about my soul', 'who_i_am'),
('the soundtrack to my inner monologue', 'who_i_am'),

-- ═══════════════════════════════════════════════════════════════
-- 2. SOCIAL ENERGY — How I Connect
-- Psychology: Social orientation is the strongest predictor of friendship compatibility.
-- ═══════════════════════════════════════════════════════════════
('my ideal hangout with friends', 'social_energy'),
('my social battery recharge method', 'social_energy'),
('how I show up for my friends', 'social_energy'),
('my energy in a group of strangers', 'social_energy'),
('my texting style with close friends', 'social_energy'),
('how I feel about making new friends', 'social_energy'),
('my reaction when plans get canceled', 'social_energy'),
('what I''m like as a plus-one', 'social_energy'),
('my energy at parties', 'social_energy'),
('my small group versus large group energy', 'social_energy'),
('my energy after social events', 'social_energy'),
('being the only one who doesn''t know anyone', 'social_energy'),
('meeting new people for the first time', 'social_energy'),
('how I keep in touch with people I care about', 'social_energy'),
('my go-to way of cheering someone up', 'social_energy'),
('how I act when I''m comfortable around you', 'social_energy'),
('my friend group dynamic role', 'social_energy'),
('how I handle meeting internet friends in real life', 'social_energy'),
('what a perfect group chat looks like', 'social_energy'),
('how I am when hosting versus being a guest', 'social_energy'),
('the vibe I bring to a road trip', 'social_energy'),
('what quality time means to me', 'social_energy'),
('my approach to deepening a new friendship', 'social_energy'),
('how I say I care without actually saying it', 'social_energy'),
('what happens when two introverts or two extroverts meet', 'social_energy'),

-- ═══════════════════════════════════════════════════════════════
-- 3. VALUES COMPASS — What I Care About
-- Psychology: Shared values are the #1 predictor of lasting closeness (Aron).
-- ═══════════════════════════════════════════════════════════════
('what I''d fight for', 'values_compass'),
('what success looks like to me', 'values_compass'),
('the cause closest to my heart', 'values_compass'),
('what I want my life to stand for', 'values_compass'),
('what matters more than money', 'values_compass'),
('the hill I will die on', 'values_compass'),
('what I''d teach every kid in the world', 'values_compass'),
('the value I refuse to compromise on', 'values_compass'),
('what motivates me every morning', 'values_compass'),
('what I think the world needs more of', 'values_compass'),
('what kindness looks like to me', 'values_compass'),
('how I define a life well-lived', 'values_compass'),
('what courage means to me', 'values_compass'),
('the thing I''d change about how people treat each other', 'values_compass'),
('what integrity looks like in action', 'values_compass'),
('the difference I want to make', 'values_compass'),
('what I''d put on a billboard for the world to see', 'values_compass'),
('my non-negotiables in life', 'values_compass'),
('what community means to me', 'values_compass'),
('what I think real strength looks like', 'values_compass'),
('the kind of legacy I want to leave', 'values_compass'),
('what I admire most in other people', 'values_compass'),
('the issue I wish more people cared about', 'values_compass'),
('how I define home beyond four walls', 'values_compass'),
('what generosity looks like in everyday life', 'values_compass'),

-- ═══════════════════════════════════════════════════════════════
-- 4. EMOTIONAL LANDSCAPE — How I Feel
-- Psychology: Emotional granularity predicts relationship quality.
-- ═══════════════════════════════════════════════════════════════
('what makes me emotional', 'emotional_landscape'),
('how I deal with a bad day', 'emotional_landscape'),
('what gives me butterflies that aren''t romantic', 'emotional_landscape'),
('my happy place', 'emotional_landscape'),
('what instantly calms me down', 'emotional_landscape'),
('how I handle disappointment', 'emotional_landscape'),
('what makes me laugh until I cry', 'emotional_landscape'),
('my comfort zone boundaries', 'emotional_landscape'),
('my vibe when someone cancels plans', 'emotional_landscape'),
('my energy when I''m home alone', 'emotional_landscape'),
('my brain at 3am', 'emotional_landscape'),
('my mood when I accomplish something big', 'emotional_landscape'),
('the feeling I chase most', 'emotional_landscape'),
('what nostalgia feels like for me', 'emotional_landscape'),
('the emotion I struggle to express', 'emotional_landscape'),
('what gratitude looks like for me', 'emotional_landscape'),
('the last thing that genuinely moved me', 'emotional_landscape'),
('how I process good news versus bad news', 'emotional_landscape'),
('what my tears are usually about', 'emotional_landscape'),
('the mood I try to create wherever I go', 'emotional_landscape'),
('how I feel right before something exciting happens', 'emotional_landscape'),
('the thing that always grounds me', 'emotional_landscape'),
('my emotional weather forecast today', 'emotional_landscape'),
('what peace feels like to me', 'emotional_landscape'),
('the feeling I wish I could bottle up', 'emotional_landscape'),

-- ═══════════════════════════════════════════════════════════════
-- 5. ADVENTURE SPIRIT — How I Explore
-- Psychology: Openness to experience strongly predicts friendship formation.
-- ═══════════════════════════════════════════════════════════════
('my comfort zone versus my adventure zone', 'adventure_spirit'),
('the most spontaneous thing I''ve done', 'adventure_spirit'),
('how I explore a new city', 'adventure_spirit'),
('my reaction to trying something for the first time', 'adventure_spirit'),
('how I feel about getting lost', 'adventure_spirit'),
('my yes-to-everything energy level', 'adventure_spirit'),
('my approach to things that scare me', 'adventure_spirit'),
('my spontaneity levels', 'adventure_spirit'),
('my adventure sport courage', 'adventure_spirit'),
('the craziest thing on my bucket list', 'adventure_spirit'),
('how I prepare for the unknown', 'adventure_spirit'),
('my relationship with risk', 'adventure_spirit'),
('the experience I''d relive a hundred times', 'adventure_spirit'),
('my idea of a perfect road trip', 'adventure_spirit'),
('what exploring means to me', 'adventure_spirit'),
('my travel style in five emojis', 'adventure_spirit'),
('the place that changed my perspective', 'adventure_spirit'),
('how I feel about saying yes before thinking', 'adventure_spirit'),
('the adventure I talk about years later', 'adventure_spirit'),
('my reaction to a surprise trip', 'adventure_spirit'),
('how I balance planning and spontaneity', 'adventure_spirit'),
('the scariest thing I''d try if fear didn''t exist', 'adventure_spirit'),
('my relationship with the great outdoors', 'adventure_spirit'),
('the culture I most want to experience', 'adventure_spirit'),
('my ideal way to spend a free weekend with no plans', 'adventure_spirit'),

-- ═══════════════════════════════════════════════════════════════
-- 6. GROWING PAINS — How I'm Evolving
-- Psychology: Vulnerability about growth creates escalating self-disclosure (Aron).
-- ═══════════════════════════════════════════════════════════════
('the lesson life keeps teaching me', 'growing_pains'),
('the version of me from five years ago', 'growing_pains'),
('what I''m currently working on about myself', 'growing_pains'),
('the habit I''m trying to build', 'growing_pains'),
('the fear I''m slowly getting over', 'growing_pains'),
('the advice I need to take myself', 'growing_pains'),
('how I handle being wrong', 'growing_pains'),
('the goal that scares me most', 'growing_pains'),
('what I''ve unlearned recently', 'growing_pains'),
('the boundary I''m learning to set', 'growing_pains'),
('how I''ve changed in the last year', 'growing_pains'),
('the mistake that taught me the most', 'growing_pains'),
('what patience is teaching me right now', 'growing_pains'),
('the conversation I needed to have with myself', 'growing_pains'),
('how I''m different from who I thought I''d be', 'growing_pains'),
('the thing I wish I''d started sooner', 'growing_pains'),
('what healing looks like for me right now', 'growing_pains'),
('the old version of me I had to let go of', 'growing_pains'),
('what growth feels like from the inside', 'growing_pains'),
('the uncomfortable truth I''ve accepted', 'growing_pains'),
('the part of growing up nobody warned me about', 'growing_pains'),
('how I show myself grace on hard days', 'growing_pains'),
('the chapter I recently closed', 'growing_pains'),
('what my comfort zone looked like before I stretched it', 'growing_pains'),
('the strength I didn''t know I had', 'growing_pains'),

-- ═══════════════════════════════════════════════════════════════
-- 7. SIMPLE JOYS — What Lights Me Up
-- Psychology: Sharing positive experiences bonds more than sharing complaints.
-- ═══════════════════════════════════════════════════════════════
('the little things that make my whole day', 'simple_joys'),
('my idea of a perfect Saturday', 'simple_joys'),
('what I could do for hours without getting bored', 'simple_joys'),
('my guilty pleasures', 'simple_joys'),
('what I geek out about', 'simple_joys'),
('my definition of a treat-yourself moment', 'simple_joys'),
('my vibe in bookstores', 'simple_joys'),
('my energy around animals', 'simple_joys'),
('my vision of a perfect day', 'simple_joys'),
('the free things in life that feel expensive', 'simple_joys'),
('the sound that instantly makes me happy', 'simple_joys'),
('my comfort meal on a rainy day', 'simple_joys'),
('the activity that makes me lose track of time', 'simple_joys'),
('my perfect lazy Sunday', 'simple_joys'),
('what my ideal cozy night in looks like', 'simple_joys'),
('the ritual that makes me feel alive', 'simple_joys'),
('the smell that takes me to my happy place', 'simple_joys'),
('my favorite way to waste an afternoon', 'simple_joys'),
('what fills my cup when I''m running on empty', 'simple_joys'),
('the simple pleasure I will never outgrow', 'simple_joys'),
('the season that matches my soul', 'simple_joys'),
('what my ideal morning off looks like', 'simple_joys'),
('the thing I always make time for no matter what', 'simple_joys'),
('my definition of the good life', 'simple_joys'),
('what contentment looks like for me', 'simple_joys'),

-- ═══════════════════════════════════════════════════════════════
-- 8. MY PEOPLE — Friendship & Community
-- Psychology: Directly probes friendship values — the most app-relevant category.
-- ═══════════════════════════════════════════════════════════════
('what I bring to a friendship', 'my_people'),
('my friendship love language', 'my_people'),
('the kind of friend I need right now', 'my_people'),
('how I celebrate my people', 'my_people'),
('what loyalty looks like to me', 'my_people'),
('my dream friend group activity', 'my_people'),
('how I support a friend going through it', 'my_people'),
('the vibe of my ideal friend group', 'my_people'),
('what makes someone go from acquaintance to real friend', 'my_people'),
('the friendship green flag I look for', 'my_people'),
('how I show love to the people in my life', 'my_people'),
('the kind of energy I want around me', 'my_people'),
('what a perfect catch-up with a close friend looks like', 'my_people'),
('how I handle a friend who''s going through it', 'my_people'),
('the thing that bonds me to someone fast', 'my_people'),
('what I''m like when I deeply trust someone', 'my_people'),
('my ride-or-die energy level', 'my_people'),
('the conversation that turns a stranger into a friend', 'my_people'),
('how I show gratitude to the people who matter', 'my_people'),
('the unspoken rule of my friendships', 'my_people'),
('what I miss about my best friendships', 'my_people'),
('the type of plans I always say yes to', 'my_people'),
('my idea of being there for someone', 'my_people'),
('the friend tradition I''d love to start', 'my_people'),
('what a true friend group feels like', 'my_people'),

-- ═══════════════════════════════════════════════════════════════
-- 9. INNER WORLD — Imagination & Depth
-- Psychology: Sharing inner experiences reveals how someone's mind works.
-- ═══════════════════════════════════════════════════════════════
('what I daydream about', 'inner_world'),
('my alternate life if I could live two lives', 'inner_world'),
('the superpower that would actually change my life', 'inner_world'),
('the era I secretly belong in', 'inner_world'),
('what I''d do with an extra hour every day', 'inner_world'),
('the fictional world I''d live in', 'inner_world'),
('my life as a movie genre', 'inner_world'),
('what my younger self would think of me now', 'inner_world'),
('what I''d do with a million dollars', 'inner_world'),
('what I''d bring to a deserted island', 'inner_world'),
('my dream dinner party guest list', 'inner_world'),
('the parallel universe version of me', 'inner_world'),
('what I''d do if I could pause time', 'inner_world'),
('the question I want the answer to most', 'inner_world'),
('the dream I keep coming back to', 'inner_world'),
('what I''d create if money and skill weren''t barriers', 'inner_world'),
('the world I build in my head when I zone out', 'inner_world'),
('the conversation I''d have with my future self', 'inner_world'),
('what I think about on long drives', 'inner_world'),
('the life I picture when I hear my favorite song', 'inner_world'),
('my ideal version of tomorrow morning', 'inner_world'),
('how I''d spend a day where nobody needed anything from me', 'inner_world'),
('the story I''d write about my life', 'inner_world'),
('what my brain looks like as a landscape', 'inner_world'),
('the wonder that never gets old for me', 'inner_world'),

-- ═══════════════════════════════════════════════════════════════
-- 10. ROOTS & NOSTALGIA — Where I Come From
-- Psychology: Shared nostalgia creates immediate closeness (Wildschut et al.).
-- ═══════════════════════════════════════════════════════════════
('the meal that tastes like home', 'roots_nostalgia'),
('childhood fears that seem silly now', 'roots_nostalgia'),
('the tradition I''ll never let go of', 'roots_nostalgia'),
('what summer felt like as a kid', 'roots_nostalgia'),
('what family gatherings feel like', 'roots_nostalgia'),
('what home means to me now', 'roots_nostalgia'),
('the thing I got in trouble for most as a kid', 'roots_nostalgia'),
('the show or movie that defined my childhood', 'roots_nostalgia'),
('sleepovers at friends'' houses', 'roots_nostalgia'),
('my childhood pet situation', 'roots_nostalgia'),
('my dream job when I was a kid', 'roots_nostalgia'),
('the game that ruled my childhood', 'roots_nostalgia'),
('the lesson my family taught me without trying', 'roots_nostalgia'),
('what my neighborhood felt like growing up', 'roots_nostalgia'),
('the song that takes me back instantly', 'roots_nostalgia'),
('the holiday that means the most to me and why', 'roots_nostalgia'),
('the food I could never make as well as my family does', 'roots_nostalgia'),
('the childhood memory that still makes me smile', 'roots_nostalgia'),
('what weekends felt like before responsibilities', 'roots_nostalgia'),
('the tradition I want to pass down', 'roots_nostalgia'),
('the place that shaped who I am', 'roots_nostalgia'),
('the friend from childhood who changed me', 'roots_nostalgia'),
('what bedtime felt like as a kid', 'roots_nostalgia'),
('the simple thing from childhood I miss the most', 'roots_nostalgia'),
('my family''s love language', 'roots_nostalgia'),

-- ═══════════════════════════════════════════════════════════════
-- 11. DAILY RHYTHMS — How I Live
-- Psychology: Lifestyle compatibility matters for friendship maintenance.
-- ═══════════════════════════════════════════════════════════════
('my perfect morning routine', 'daily_rhythms'),
('how I spend my alone time', 'daily_rhythms'),
('my relationship with sleep', 'daily_rhythms'),
('what my weeknight looks like', 'daily_rhythms'),
('how I recharge after a long week', 'daily_rhythms'),
('my Sunday evening ritual', 'daily_rhythms'),
('my weekend energy versus weekday energy', 'daily_rhythms'),
('my procrastination style', 'daily_rhythms'),
('my social battery level on a typical day', 'daily_rhythms'),
('what my morning commute reveals about me', 'daily_rhythms'),
('my relationship with my phone first thing in the morning', 'daily_rhythms'),
('how I wind down at the end of the day', 'daily_rhythms'),
('what my ideal work-from-home day looks like', 'daily_rhythms'),
('my energy at different times of day', 'daily_rhythms'),
('the thing I always do before bed', 'daily_rhythms'),
('my relationship with plans versus spontaneity', 'daily_rhythms'),
('how I organize my chaos', 'daily_rhythms'),
('my approach to a completely free day', 'daily_rhythms'),
('the routine that keeps me sane', 'daily_rhythms'),
('how I handle the transition from work brain to home brain', 'daily_rhythms'),
('my relationship with alarms and mornings', 'daily_rhythms'),
('what self-care actually looks like for me', 'daily_rhythms'),
('my afternoon slump coping strategy', 'daily_rhythms'),
('how I make a house feel like home', 'daily_rhythms'),
('what my kitchen table would say about my life', 'daily_rhythms'),

-- ═══════════════════════════════════════════════════════════════
-- 12. CREATIVE SPARK — How I Express Myself
-- Psychology: Creative self-expression is vulnerable self-disclosure.
-- ═══════════════════════════════════════════════════════════════
('how I express myself without words', 'creative_spark'),
('the art form that speaks to my soul', 'creative_spark'),
('my hidden creative talent', 'creative_spark'),
('the playlist that is basically my personality', 'creative_spark'),
('how I process big feelings', 'creative_spark'),
('the thing I make that I''m proud of', 'creative_spark'),
('my creative process in action', 'creative_spark'),
('my secret creative ambition', 'creative_spark'),
('the medium I wish I was better at', 'creative_spark'),
('how I handle creative blocks', 'creative_spark'),
('what art means to me', 'creative_spark'),
('the song that makes me feel understood', 'creative_spark'),
('how creativity shows up in my everyday life', 'creative_spark'),
('the museum or gallery of my mind', 'creative_spark'),
('what inspires me most right now', 'creative_spark'),
('my relationship with journaling or writing', 'creative_spark'),
('the creative risk I''m glad I took', 'creative_spark'),
('how I capture moments I don''t want to forget', 'creative_spark'),
('the beauty I find in unexpected places', 'creative_spark'),
('what my hands would create if they had no limits', 'creative_spark'),
('the aesthetic that feels most like me', 'creative_spark'),
('how music affects my mood', 'creative_spark'),
('the project I keep meaning to start', 'creative_spark'),
('what I notice that most people walk right past', 'creative_spark'),
('how I make ordinary things feel special', 'creative_spark'),

-- ═══════════════════════════════════════════════════════════════
-- 13. UNDER PRESSURE — How I Handle Hard Stuff
-- Psychology: Stress response compatibility predicts friendship durability.
-- ═══════════════════════════════════════════════════════════════
('my stress response in action', 'under_pressure'),
('how I handle awkward situations', 'under_pressure'),
('what I do when everything goes wrong', 'under_pressure'),
('how I handle being overwhelmed', 'under_pressure'),
('my reaction to unexpected change', 'under_pressure'),
('my energy when I''m running on empty', 'under_pressure'),
('how I act when I''m hangry', 'under_pressure'),
('my reaction to unexpected plans', 'under_pressure'),
('how I cope when life gets messy', 'under_pressure'),
('my approach to conflict with someone I care about', 'under_pressure'),
('what I do when I need a reset', 'under_pressure'),
('how I handle waiting for something important', 'under_pressure'),
('my energy during a crisis', 'under_pressure'),
('how I ask for help', 'under_pressure'),
('what my coping mechanisms look like', 'under_pressure'),
('how I handle criticism', 'under_pressure'),
('what happens when I hit my limit', 'under_pressure'),
('my recovery mode after a hard week', 'under_pressure'),
('how I process anger', 'under_pressure'),
('the way I comfort myself when nobody''s around', 'under_pressure'),
('how I sit with uncertainty', 'under_pressure'),
('what I need from people when I''m struggling', 'under_pressure'),
('my default mode when plans fall apart', 'under_pressure'),
('how I bounce back after a setback', 'under_pressure'),
('what I''m like in the eye of the storm', 'under_pressure'),

-- ═══════════════════════════════════════════════════════════════
-- 14. CURIOSITY & GROWTH — What I'm Into Right Now
-- Psychology: Shared intellectual curiosity is a strong friendship signal.
-- ═══════════════════════════════════════════════════════════════
('the rabbit hole I recently fell down', 'curiosity_growth'),
('what I''m obsessed with right now', 'curiosity_growth'),
('the skill I''m currently trying to learn', 'curiosity_growth'),
('the topic I could give a TED talk about', 'curiosity_growth'),
('the niche thing I know way too much about', 'curiosity_growth'),
('my current hyperfixation', 'curiosity_growth'),
('the skill I most want to master', 'curiosity_growth'),
('how I collect random hobbies', 'curiosity_growth'),
('what my YouTube recommendations say about me', 'curiosity_growth'),
('the book or podcast that changed how I think', 'curiosity_growth'),
('the subject I''d go back to school for', 'curiosity_growth'),
('the random fact I bring up at every party', 'curiosity_growth'),
('what I researched at 2am for no reason', 'curiosity_growth'),
('the thing I know way too much about and way too little about', 'curiosity_growth'),
('how I learn new things', 'curiosity_growth'),
('the documentary that blew my mind', 'curiosity_growth'),
('the skill that surprised me when I picked it up', 'curiosity_growth'),
('the question I can''t stop thinking about', 'curiosity_growth'),
('what I''d study if I had unlimited time', 'curiosity_growth'),
('the trend I got weirdly into', 'curiosity_growth'),
('the podcast episode I tell everyone about', 'curiosity_growth'),
('what I nerd out about when no one stops me', 'curiosity_growth'),
('the interest I developed completely by accident', 'curiosity_growth'),
('how curiosity shows up in my daily life', 'curiosity_growth'),
('the corner of the internet that is home to me', 'curiosity_growth'),

-- ═══════════════════════════════════════════════════════════════
-- 15. LIFE SEASON — Where I Am Right Now
-- Psychology: Life stage alignment matters — especially relevant for 20s-30s.
-- ═══════════════════════════════════════════════════════════════
('the chapter of life I''m in right now', 'life_season'),
('what I''m figuring out these days', 'life_season'),
('what adulting looks like for me', 'life_season'),
('what keeps me up at night besides my phone', 'life_season'),
('what stability looks like for me', 'life_season'),
('my relationship with my career right now', 'life_season'),
('what work-life balance actually means for me', 'life_season'),
('the phase I just came out of', 'life_season'),
('my retirement fantasy', 'life_season'),
('my ideal living situation', 'life_season'),
('the thing I''m most excited about right now', 'life_season'),
('what my twenties or thirties have taught me so far', 'life_season'),
('the season of life I''m looking forward to', 'life_season'),
('what independence feels like at this stage', 'life_season'),
('the priority I''ve shifted recently', 'life_season'),
('what being new to a city feels like', 'life_season'),
('the thing I thought I''d have figured out by now', 'life_season'),
('how my definition of success has evolved', 'life_season'),
('what I''m building right now', 'life_season'),
('the transition I''m navigating', 'life_season'),
('what I wish someone had told me about this age', 'life_season'),
('the next big move I''m planning or dreaming about', 'life_season'),
('how I feel about where I am versus where I want to be', 'life_season'),
('the area of my life getting the most attention right now', 'life_season'),
('what this time in my life will look like in hindsight', 'life_season'),

-- ═══════════════════════════════════════════════════════════════
-- 16. UNFILTERED ME — The Real Stuff
-- Psychology: Deeper vulnerability (Aron's escalating disclosure model).
-- ═══════════════════════════════════════════════════════════════
('what I wish people knew about me', 'unfiltered_me'),
('my biggest green flag as a friend', 'unfiltered_me'),
('the thing I''m most proud of', 'unfiltered_me'),
('what I need more of in my life', 'unfiltered_me'),
('the compliment I remember years later', 'unfiltered_me'),
('what I wish I could tell my younger self', 'unfiltered_me'),
('the moment that changed everything', 'unfiltered_me'),
('what I''m secretly really good at', 'unfiltered_me'),
('how I handle compliments', 'unfiltered_me'),
('the tradition I want to start', 'unfiltered_me'),
('what I''d want someone to know before becoming my friend', 'unfiltered_me'),
('the part of my story I rarely share', 'unfiltered_me'),
('what makes me feel seen', 'unfiltered_me'),
('the truth about me that surprises people', 'unfiltered_me'),
('what I carry that nobody can see', 'unfiltered_me'),
('the words I needed to hear at the right time', 'unfiltered_me'),
('what vulnerability looks like for me', 'unfiltered_me'),
('the thing I''m learning to forgive myself for', 'unfiltered_me'),
('what I''m most grateful for that I used to take for granted', 'unfiltered_me'),
('the way I love the people in my life', 'unfiltered_me'),
('the quiet achievement nobody clapped for', 'unfiltered_me'),
('what I''m still holding onto that I should probably let go', 'unfiltered_me'),
('the conversation that shaped who I am today', 'unfiltered_me'),
('what trust looks like once I fully give it', 'unfiltered_me'),
('the version of me I''m most proud of becoming', 'unfiltered_me')

ON CONFLICT DO NOTHING;
