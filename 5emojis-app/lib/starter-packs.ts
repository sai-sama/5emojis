import AsyncStorage from "@react-native-async-storage/async-storage";

// ═══════════════════════════════════════════════════════════════
// 5Emojis AI Service — ONE Claude call per week powers everything
// ═══════════════════════════════════════════════════════════════
//
// Weekly batch call generates:
//   1. Starter packs (17 themed pools)
//   2. Emoji traits dictionary (emoji → vibe + traits)
//   3. Icebreaker templates (fill-in-the-blank with traits)
//   4. Summary templates (combine traits into personality one-liners)
//
// Runtime: zero API calls — just lookups and string interpolation
//
// TODO: Move API call to Supabase Edge Function when backend is connected
// ═══════════════════════════════════════════════════════════════

// ─── Types ───────────────────────────────────────────────────
export type StarterPackPool = {
  label: string;
  icon: string;
  pool: string[];
};

type EmojiTrait = {
  vibe: string;       // e.g. "social foodie"
  traits: string[];   // e.g. ["loves trying new spots", "always hungry"]
  activity: string;   // e.g. "grab food together"
};

type AIContent = {
  packs: StarterPackPool[];
  emojiTraits: Record<string, EmojiTrait>;
  icebreakerTemplates: string[];
  summaryTemplates: string[];
  fetchedAt: number;
};

// ─── Config ──────────────────────────────────────────────────
const CACHE_KEY = "5emojis_ai_content_v2";
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

// ─── Static fallbacks ────────────────────────────────────────
const STATIC_POOLS: StarterPackPool[] = [
  { label: "Foodie", icon: "🍕", pool: ["🍕", "🍣", "☕", "🧁", "🌮", "🍝", "🍜", "🥘", "🍔", "🧋", "🍰", "🍷", "🥑", "🍦"] },
  { label: "Gym Bro", icon: "💪", pool: ["💪", "🏋️", "🔥", "🥗", "💯", "🏃", "🥊", "🏆", "⚡", "🚴", "🧘", "🥤"] },
  { label: "Creative", icon: "🎨", pool: ["🎨", "🎵", "📚", "✨", "🌸", "🎭", "🎬", "🎹", "💡", "🌈", "📝", "🖌️"] },
  { label: "Main Character", icon: "✨", pool: ["✨", "💅", "🔥", "😎", "👑", "🫶", "💜", "🌟", "🤳", "🍾", "💃", "🦋"] },
  { label: "Chill Vibes", icon: "🌙", pool: ["🌙", "☕", "🎧", "📖", "🕯️", "🌌", "💤", "🎶", "🧘", "🌿", "🫖", "💫"] },
  { label: "Chaos Energy", icon: "🤪", pool: ["🤪", "😂", "🎉", "💀", "🤣", "🙃", "🫠", "👀", "🤡", "😈", "🍕", "🔥"] },
  { label: "Hopeless Romantic", icon: "🥹", pool: ["🥹", "🌸", "☕", "📖", "🌅", "💕", "🎵", "🕯️", "🧸", "🌷", "💌", "✨"] },
  { label: "Wanderlust", icon: "✈️", pool: ["✈️", "🏔️", "🌊", "🏕️", "📸", "🌍", "🏖️", "🌅", "🧭", "🌴", "🗺️", "🎒"] },
  { label: "Dog Parent", icon: "🐶", pool: ["🐶", "🐾", "🏃", "🌳", "❤️", "😊", "☀️", "🎾", "🐕", "🤗", "🏞️", "📸"] },
  { label: "Plant Parent", icon: "🪴", pool: ["🪴", "🌿", "🌱", "☀️", "🌻", "🍄", "🌸", "🧘", "☕", "🐝", "🌺", "🦋"] },
  { label: "Brunch Squad", icon: "🥂", pool: ["🥂", "🍳", "☕", "🥑", "📸", "😂", "🥞", "👯", "🌸", "🧋", "🍹", "💅"] },
  { label: "Gamer", icon: "🎮", pool: ["🎮", "🕹️", "🎧", "💻", "🤖", "🔥", "🏆", "👾", "🎯", "☕", "🌙", "🧠"] },
  { label: "Bookworm", icon: "📚", pool: ["📚", "☕", "🤓", "✨", "📖", "🧠", "🕯️", "🌙", "💡", "🫖", "🏛️", "🌸"] },
  { label: "Music Nerd", icon: "🎵", pool: ["🎵", "🎧", "🎸", "🎤", "🎶", "🎹", "💃", "🕺", "🤘", "🎷", "🌙", "🔥"] },
  { label: "Startup Life", icon: "🚀", pool: ["🚀", "💻", "☕", "💡", "📈", "🧠", "⚡", "🤝", "🔥", "🌟", "📱", "🎯"] },
  { label: "New Here!", icon: "🆕", pool: ["🆕", "👋", "🤝", "🗺️", "☕", "😊", "✨", "🏙️", "📸", "🫶", "🌟", "🎉"] },
  { label: "Looking for My Crew", icon: "👯", pool: ["👯", "🤝", "🎉", "💬", "😂", "🍕", "☕", "✨", "🫶", "🤗", "💜", "🌟"] },
];

const STATIC_EMOJI_TRAITS: Record<string, EmojiTrait> = {
  // Food & Drink
  "🍕": { vibe: "social foodie", traits: ["loves trying new spots", "always down to eat"], activity: "grab a slice" },
  "🍣": { vibe: "refined foodie", traits: ["appreciates good food", "adventurous eater"], activity: "try that new sushi place" },
  "☕": { vibe: "cozy intellectual", traits: ["coffee-powered", "loves deep convos"], activity: "get coffee" },
  "🧋": { vibe: "trendy and sweet", traits: ["boba obsessed", "knows all the spots"], activity: "boba run" },
  "🍷": { vibe: "sophisticated chill", traits: ["wine lover", "classy hangouts"], activity: "wine night" },
  "🌮": { vibe: "fun-loving foodie", traits: ["taco enthusiast", "casual and warm"], activity: "hit up taco tuesday" },
  "🍔": { vibe: "classic comfort", traits: ["no-frills good time", "burger connoisseur"], activity: "burger crawl" },
  "🍰": { vibe: "sweet tooth", traits: ["dessert first", "celebrates everything"], activity: "bakery hop" },
  "🍦": { vibe: "playful and sweet", traits: ["ice cream fixes everything", "sunny personality"], activity: "ice cream walk" },
  "🍝": { vibe: "homey and warm", traits: ["pasta lover", "cozy dinner vibes"], activity: "pasta night" },
  "🍜": { vibe: "adventurous eater", traits: ["noodle connoisseur", "late night ramen runs"], activity: "ramen crawl" },
  "🥘": { vibe: "worldly foodie", traits: ["loves bold flavors", "home cook"], activity: "cook together" },
  "🥑": { vibe: "health-conscious", traits: ["brunch regular", "avocado everything"], activity: "brunch this weekend" },
  "🥞": { vibe: "breakfast lover", traits: ["morning person energy", "pancake perfectionist"], activity: "breakfast spot hunt" },
  "🍳": { vibe: "brunch enthusiast", traits: ["weekend brunch ritual", "eggs every way"], activity: "brunch date" },
  "🍹": { vibe: "tropical energy", traits: ["cocktail lover", "vacation mode"], activity: "happy hour" },
  "🍾": { vibe: "celebratory", traits: ["always has a reason to toast", "brings the energy"], activity: "celebrate something random" },

  // Sports & Fitness
  "💪": { vibe: "fitness enthusiast", traits: ["gym regular", "discipline is a lifestyle"], activity: "workout together" },
  "🏃": { vibe: "active and driven", traits: ["runner's high chaser", "always moving"], activity: "go for a run" },
  "🏀": { vibe: "competitive and fun", traits: ["pickup game regular", "team player"], activity: "shoot hoops" },
  "⚽": { vibe: "sporty and social", traits: ["loves the beautiful game", "team spirit"], activity: "kick the ball around" },
  "🏋️": { vibe: "gym dedicated", traits: ["gains season year-round", "loves a PR"], activity: "gym session" },
  "🔥": { vibe: "intense energy", traits: ["goes hard at everything", "motivator"], activity: "something intense" },
  "💯": { vibe: "all-in energy", traits: ["no half measures", "authentic"], activity: "something we both go 100% at" },
  "🏆": { vibe: "winner mentality", traits: ["competitive spirit", "celebrates wins big"], activity: "compete at something" },
  "⚡": { vibe: "high energy", traits: ["electric personality", "fast-paced"], activity: "something spontaneous" },
  "🚴": { vibe: "outdoor athlete", traits: ["bike lover", "explores by pedal"], activity: "bike ride" },
  "🏄": { vibe: "ocean soul", traits: ["wave chaser", "laid-back athlete"], activity: "beach day" },
  "🧘": { vibe: "mindful and centered", traits: ["yoga practitioner", "inner peace seeker"], activity: "yoga class" },
  "🥊": { vibe: "fighter spirit", traits: ["boxing enthusiast", "strong and focused"], activity: "boxing class" },

  // Creative & Intellectual
  "🎨": { vibe: "creative soul", traits: ["artsy and expressive", "sees beauty everywhere"], activity: "art gallery visit" },
  "🎵": { vibe: "music lover", traits: ["always has a playlist", "concert goer"], activity: "go to a show" },
  "📚": { vibe: "bookworm", traits: ["always reading something", "thoughtful"], activity: "book swap" },
  "🎮": { vibe: "gamer", traits: ["gaming sessions are sacred", "competitive yet chill"], activity: "gaming session" },
  "💻": { vibe: "tech-minded", traits: ["digital native", "builds things"], activity: "hackathon or coffee shop cowork" },
  "🎧": { vibe: "in their own world", traits: ["audiophile", "curates perfect playlists"], activity: "playlist exchange" },
  "📖": { vibe: "thoughtful reader", traits: ["deep thinker", "always has a book rec"], activity: "book club" },
  "🎬": { vibe: "film buff", traits: ["movie nights are essential", "great taste in cinema"], activity: "movie marathon" },
  "🎭": { vibe: "dramatic creative", traits: ["theater lover", "expressive and bold"], activity: "catch a show" },
  "🎸": { vibe: "rock energy", traits: ["music is life", "concert addict"], activity: "jam session or concert" },
  "🎤": { vibe: "karaoke star", traits: ["loves performing", "life of the party"], activity: "karaoke night" },
  "🎹": { vibe: "melodic soul", traits: ["musical talent", "appreciates harmony"], activity: "open mic night" },
  "💡": { vibe: "big ideas", traits: ["always thinking", "innovative mind"], activity: "brainstorm session" },
  "🧠": { vibe: "intellectual", traits: ["loves learning", "big brain energy"], activity: "museum visit" },
  "📝": { vibe: "writer", traits: ["expressive with words", "journaler"], activity: "writing cafe session" },
  "🕹️": { vibe: "retro gamer", traits: ["arcade lover", "nostalgic gamer"], activity: "arcade bar" },

  // Nature & Outdoors
  "🌿": { vibe: "nature lover", traits: ["plant energy", "grounded and calm"], activity: "nature walk" },
  "🌊": { vibe: "ocean soul", traits: ["water lover", "goes with the flow"], activity: "beach day" },
  "🏔️": { vibe: "mountain spirit", traits: ["hiker", "loves a challenge"], activity: "go hiking" },
  "🌸": { vibe: "soft and blooming", traits: ["appreciates beauty", "spring energy"], activity: "botanical garden" },
  "☀️": { vibe: "sunshine energy", traits: ["positive vibes", "outdoor lover"], activity: "park hangout" },
  "🐶": { vibe: "dog person", traits: ["dog parent energy", "loyal and warm"], activity: "dog park meetup" },
  "🐱": { vibe: "cat person", traits: ["independent spirit", "cozy homebody"], activity: "cat cafe" },
  "🐾": { vibe: "animal lover", traits: ["pet obsessed", "big heart"], activity: "pet store trip" },
  "🌻": { vibe: "bright and cheerful", traits: ["radiates positivity", "sunflower energy"], activity: "farmers market" },
  "🦋": { vibe: "free spirit", traits: ["transformative energy", "beautiful soul"], activity: "outdoor adventure" },
  "🌲": { vibe: "forest soul", traits: ["loves the outdoors", "woodsy vibes"], activity: "forest hike" },
  "🪴": { vibe: "plant parent", traits: ["green thumb", "nurturing"], activity: "plant shopping" },
  "🌱": { vibe: "growing spirit", traits: ["always evolving", "new beginnings"], activity: "try something new together" },
  "🍄": { vibe: "whimsical", traits: ["quirky and fun", "forager energy"], activity: "nature exploration" },

  // Travel & Adventure
  "✈️": { vibe: "wanderlust", traits: ["always planning the next trip", "adventure seeker"], activity: "plan a trip" },
  "📸": { vibe: "visual storyteller", traits: ["captures moments", "eye for aesthetics"], activity: "photo walk" },
  "🌍": { vibe: "world explorer", traits: ["culturally curious", "worldly"], activity: "try a new cuisine" },
  "🏖️": { vibe: "beach lover", traits: ["salt water heals everything", "vacation mode"], activity: "beach day" },
  "🏕️": { vibe: "outdoor adventurer", traits: ["camping enthusiast", "loves the wild"], activity: "camping trip" },
  "🧭": { vibe: "explorer", traits: ["loves discovering new places", "navigator"], activity: "explore a new neighborhood" },
  "🌴": { vibe: "tropical soul", traits: ["island vibes", "relaxed and warm"], activity: "tropical food night" },
  "🗺️": { vibe: "planner adventurer", traits: ["maps out adventures", "thorough explorer"], activity: "road trip" },
  "🎒": { vibe: "backpacker", traits: ["travels light", "spontaneous explorer"], activity: "day trip" },
  "🌅": { vibe: "golden hour chaser", traits: ["sunset lover", "appreciates the moment"], activity: "sunset spot hunt" },

  // Vibes & Energy
  "✨": { vibe: "sparkly energy", traits: ["brings magic everywhere", "optimistic"], activity: "something spontaneous" },
  "😂": { vibe: "humor machine", traits: ["always laughing", "makes everything fun"], activity: "comedy show" },
  "🤪": { vibe: "chaos energy", traits: ["unhinged in the best way", "wild card"], activity: "something completely random" },
  "💀": { vibe: "dark humor", traits: ["dead 💀 at everything", "sarcasm fluent"], activity: "roast each other over coffee" },
  "🙃": { vibe: "sarcastically chill", traits: ["fine, everything's fine", "dry wit"], activity: "people watching" },
  "🫠": { vibe: "melting", traits: ["overwhelmed but make it aesthetic", "relatable"], activity: "decompress together" },
  "👀": { vibe: "nosy in a fun way", traits: ["always in the know", "gossip appreciator"], activity: "spill the tea" },
  "😈": { vibe: "mischievous", traits: ["up to something", "fun troublemaker"], activity: "something slightly chaotic" },
  "😎": { vibe: "effortlessly cool", traits: ["too cool but approachable", "smooth energy"], activity: "something chill" },
  "🥹": { vibe: "soft-hearted", traits: ["cries at everything beautiful", "emotional depth"], activity: "heartwarming movie" },
  "💕": { vibe: "warm and loving", traits: ["big heart", "affectionate friend"], activity: "cozy hangout" },
  "🫶": { vibe: "wholesome", traits: ["heart hands energy", "supportive"], activity: "self-care day" },
  "💜": { vibe: "purple vibes", traits: ["mystical and creative", "loyal"], activity: "chill creative night" },
  "👑": { vibe: "royalty", traits: ["knows their worth", "confident"], activity: "treat ourselves" },
  "💅": { vibe: "unbothered queen", traits: ["self-care advocate", "looks good doing it"], activity: "spa day" },
  "💤": { vibe: "sleepy energy", traits: ["nap advocate", "cozy homebody"], activity: "movie and nap" },
  "💫": { vibe: "dreamy", traits: ["head in the clouds", "imaginative"], activity: "stargazing" },

  // Social & Party
  "🎉": { vibe: "party starter", traits: ["brings the energy", "celebration mode"], activity: "throw a party" },
  "🥳": { vibe: "celebration mode", traits: ["always has a reason to celebrate", "festive"], activity: "celebrate literally anything" },
  "💃": { vibe: "dance floor regular", traits: ["moves like nobody's watching", "free spirit"], activity: "dancing" },
  "🕺": { vibe: "groove master", traits: ["dancing is therapy", "fun energy"], activity: "dance class" },
  "🤝": { vibe: "connector", traits: ["brings people together", "reliable"], activity: "introduce to friends" },
  "🤗": { vibe: "hugger", traits: ["warm and welcoming", "makes everyone feel at home"], activity: "group hangout" },
  "💬": { vibe: "conversationalist", traits: ["can talk about anything", "great listener"], activity: "long walk and talk" },
  "👯": { vibe: "bestie energy", traits: ["ride or die", "always matching energy"], activity: "literally anything together" },

  // Tech & Innovation
  "🚀": { vibe: "ambitious builder", traits: ["always launching something", "startup energy"], activity: "cowork session" },
  "🤖": { vibe: "tech nerd", traits: ["AI enthusiast", "future-focused"], activity: "tech meetup" },
  "📱": { vibe: "connected", traits: ["digital native", "always online"], activity: "try a new app together" },
  "🔬": { vibe: "science nerd", traits: ["curious about everything", "analytical mind"], activity: "science museum" },

  // Symbols & Misc
  "🆕": { vibe: "fresh start", traits: ["new to town", "open to everything"], activity: "explore the city" },
  "👋": { vibe: "friendly greeter", traits: ["approachable", "waves at everyone"], activity: "meet up" },
  "❤️": { vibe: "big heart", traits: ["loves deeply", "caring"], activity: "something meaningful" },
  "🌈": { vibe: "colorful soul", traits: ["celebrates diversity", "joyful"], activity: "pride event or art walk" },
  "🌙": { vibe: "night owl", traits: ["comes alive after dark", "late night philosopher"], activity: "late night hangout" },
  "🌌": { vibe: "cosmic dreamer", traits: ["fascinated by the universe", "deep thinker"], activity: "stargazing" },
  "🕯️": { vibe: "cozy aesthetic", traits: ["candle obsessed", "creates ambiance"], activity: "cozy night in" },
  "🧸": { vibe: "soft and nostalgic", traits: ["inner child energy", "comforting"], activity: "nostalgic movie night" },
  "💌": { vibe: "thoughtful romantic", traits: ["writes letters", "sentimental"], activity: "letter writing café" },
  "🌷": { vibe: "gentle and elegant", traits: ["flower lover", "graceful"], activity: "flower market" },
  "🎊": { vibe: "festive spirit", traits: ["confetti energy", "makes everything a party"], activity: "surprise celebration" },
  "🏙️": { vibe: "city explorer", traits: ["urban adventurer", "knows hidden gems"], activity: "city walk" },
  "🥗": { vibe: "health-conscious", traits: ["clean eater", "wellness focused"], activity: "healthy lunch" },
  "🥤": { vibe: "casual and refreshing", traits: ["smoothie lover", "go-with-the-flow"], activity: "smoothie run" },
  "📈": { vibe: "growth mindset", traits: ["always improving", "goal-oriented"], activity: "accountability partner" },
  "🎯": { vibe: "focused", traits: ["goal-oriented", "laser precision"], activity: "set goals together" },
  "🤓": { vibe: "proud nerd", traits: ["nerdy and proud", "deep dives into topics"], activity: "nerd out about something" },
  "🫖": { vibe: "tea ceremony", traits: ["tea over coffee", "calm and collected"], activity: "tea tasting" },
  "🏛️": { vibe: "cultured", traits: ["history buff", "museum regular"], activity: "museum day" },
  "🌺": { vibe: "tropical bloom", traits: ["vibrant and colorful", "island energy"], activity: "botanical garden" },
  "🐝": { vibe: "busy bee", traits: ["always productive", "sweet results"], activity: "cowork session" },
  "🤘": { vibe: "rock on", traits: ["metal/rock lover", "rebellious spirit"], activity: "concert" },
  "🎷": { vibe: "jazzy soul", traits: ["smooth and soulful", "jazz bar regular"], activity: "jazz night" },
  "🤡": { vibe: "class clown", traits: ["never takes life too seriously", "comedian"], activity: "comedy night" },
  "🖌️": { vibe: "artistic", traits: ["painter/drawer", "creative expression"], activity: "paint and sip" },
  "🌟": { vibe: "star energy", traits: ["shines bright", "natural leader"], activity: "something new and exciting" },
  "🤳": { vibe: "selfie queen", traits: ["aesthetic driven", "social media savvy"], activity: "instagram-worthy spot" },
  "🎶": { vibe: "melodic", traits: ["music is the soundtrack of life", "humming always"], activity: "music festival" },
  "🏞️": { vibe: "scenic lover", traits: ["chases views", "nature photographer"], activity: "scenic hike" },
  "🐕": { vibe: "dog walker", traits: ["daily walks are sacred", "dog community regular"], activity: "walk the dogs" },
  "🎾": { vibe: "racket sport fan", traits: ["tennis/pickleball regular", "competitive fun"], activity: "play tennis" },
  "🌳": { vibe: "tree hugger", traits: ["loves parks", "grounded"], activity: "park picnic" },
  "😊": { vibe: "genuinely happy", traits: ["radiates warmth", "smile is contagious"], activity: "anything — the company matters" },
  "🛸": { vibe: "alien energy", traits: ["out of this world", "wonderfully weird"], activity: "something no one else would do" },
  "👾": { vibe: "retro tech", traits: ["pixel art appreciator", "classic gaming"], activity: "arcade night" },
  "🌠": { vibe: "shooting star", traits: ["wish maker", "believes in magic"], activity: "stargazing spot" },
  "🎀": { vibe: "cute aesthetic", traits: ["bow-core", "curated everything"], activity: "thrift shopping" },
  "🧶": { vibe: "crafty", traits: ["maker energy", "handmade appreciation"], activity: "craft session" },
};

const STATIC_ICEBREAKER_TEMPLATES = [
  "I see you're into {their_activity} — I'm more of a {my_activity} person, but I feel like we'd have the best time doing both! 😄",
  "Your {their_vibe} energy + my {my_vibe} energy = a friendship that just makes sense. {activity}?",
  "OK so we both clearly have {shared_trait} vibes — when are we {shared_activity}?",
  "A {their_vibe} and a {my_vibe} walk into a bar... actually let's just make that happen? 😂",
  "Not to be dramatic but your emojis just told me we'd be best friends. {activity} soon?",
  "Finally someone else who gives off {shared_trait} energy! We need to {shared_activity} immediately.",
  "Your {their_emoji} is giving main character and I'm here for it. Down to {activity}?",
  "I'm a {my_vibe} person and you're giving {their_vibe} — honestly that's the perfect friend combo. {activity}?",
  "The way your {their_emoji} matches my {my_emoji} energy... the universe is telling us to {shared_activity} 🤝",
  "Two words: {shared_trait}. When are we hanging out?",
];

const STATIC_SUMMARY_TEMPLATES = [
  "{vibe1} meets {vibe2} with a dash of {trait}",
  "{trait1}, {trait2}, and {vibe1} energy all in one",
  "Part {vibe1}, part {vibe2} — fully {trait}",
  "{vibe1} who's secretly also a {vibe2}",
  "The {vibe1} friend who {trait1} and {trait2}",
  "{trait1} with {vibe1} energy and a {vibe2} soul",
];

// ─── Batch LLM prompt ────────────────────────────────────────
const BATCH_PROMPT = `You power a friendship app called 5Emojis. Generate ALL of the following as a single JSON object:

1. "packs" — 17 starter packs, each: {"label": "1-3 word name", "icon": "emoji", "pool": ["12-14 emojis"]}
   Cover: food, fitness, creative, main character, chill, chaos, romantic, travel, dog/cat parent, plant parent, brunch, gamer, bookworm, music, startup, new in town, looking for crew

2. "emojiTraits" — Dictionary of 100+ common emojis. Key = emoji, value = {"vibe": "2-3 word vibe", "traits": ["2 personality traits"], "activity": "friend activity suggestion"}

3. "icebreakerTemplates" — 10 fill-in-the-blank icebreaker messages using placeholders: {my_vibe}, {their_vibe}, {my_emoji}, {their_emoji}, {shared_trait}, {my_activity}, {their_activity}, {shared_activity}, {activity}

4. "summaryTemplates" — 6 personality summary templates using: {vibe1}, {vibe2}, {trait}, {trait1}, {trait2}

Make everything trendy, Gen Z friendly, warm (friendship not dating), and fun. Return ONLY valid JSON, no markdown.`;

// ─── LLM fetch ───────────────────────────────────────────────
async function fetchBatchContent(): Promise<Omit<AIContent, "fetchedAt"> | null> {
  const apiKey = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY;
  if (!apiKey || apiKey.includes("your-") || apiKey.length < 10) {
    return null;
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 8000,
        messages: [{ role: "user", content: BATCH_PROMPT }],
      }),
    });

    if (!response.ok) {
      console.warn(`AI batch call failed: ${response.status}`);
      return null;
    }

    const data = await response.json();
    let text = data.content?.[0]?.text;
    if (!text) return null;

    // Strip markdown code fences if present (Claude sometimes wraps in ```json)
    text = text.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim();

    const parsed = JSON.parse(text);

    // Validate minimal structure
    if (
      !parsed.packs?.length ||
      !parsed.emojiTraits ||
      !parsed.icebreakerTemplates?.length ||
      !parsed.summaryTemplates?.length
    ) {
      console.warn("AI batch returned incomplete data");
      return null;
    }

    return parsed;
  } catch (e) {
    console.warn("AI batch fetch error:", e);
    return null;
  }
}

// ─── Cache management ────────────────────────────────────────
let _cachedContent: AIContent | null = null;

async function getAIContent(): Promise<AIContent> {
  // In-memory cache first
  if (_cachedContent && Date.now() - _cachedContent.fetchedAt < CACHE_TTL) {
    return _cachedContent;
  }

  // AsyncStorage cache
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (raw) {
      const cached: AIContent = JSON.parse(raw);
      if (Date.now() - cached.fetchedAt < CACHE_TTL) {
        _cachedContent = cached;
        return cached;
      }
    }
  } catch {}

  // Fetch fresh from LLM
  const fresh = await fetchBatchContent();
  if (fresh) {
    const content: AIContent = { ...fresh, fetchedAt: Date.now() };
    _cachedContent = content;
    try {
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(content));
    } catch {}
    return content;
  }

  // Fallback to static
  const fallback: AIContent = {
    packs: STATIC_POOLS,
    emojiTraits: STATIC_EMOJI_TRAITS,
    icebreakerTemplates: STATIC_ICEBREAKER_TEMPLATES,
    summaryTemplates: STATIC_SUMMARY_TEMPLATES,
    fetchedAt: 0, // marked as "not from LLM"
  };
  _cachedContent = fallback;
  return fallback;
}

// ═══════════════════════════════════════════════════════════════
// Public API
// ═══════════════════════════════════════════════════════════════

/** Get starter pack pools (async, checks 7-day cache). */
export async function getStarterPacks(): Promise<StarterPackPool[]> {
  const content = await getAIContent();
  return content.packs;
}

/** Force refresh all AI content from LLM. */
export async function refreshAllContent(): Promise<void> {
  _cachedContent = null;
  try { await AsyncStorage.removeItem(CACHE_KEY); } catch {}
  await getAIContent();
}

/**
 * Generate icebreaker messages for a match. Zero API calls at runtime.
 * Uses cached emoji traits + templates with string interpolation.
 */
export async function generateIcebreaker(
  myEmojis: string[],
  theirEmojis: string[],
  myName: string,
  theirName: string
): Promise<string[]> {
  const content = await getAIContent();
  const { emojiTraits, icebreakerTemplates } = content;

  // Look up traits for each user's emojis
  const myTraits = myEmojis.map((e) => emojiTraits[e]).filter(Boolean);
  const theirTraits = theirEmojis.map((e) => emojiTraits[e]).filter(Boolean);

  // Fallback if no traits found
  if (myTraits.length === 0 || theirTraits.length === 0) {
    return [`Hey ${theirName}! Love your emoji vibe — we should hang! 🤝`];
  }

  // Find shared vibes
  const myVibeWords = new Set(myTraits.flatMap((t) => t.vibe.split(" ")));
  const sharedTraitPhrases = theirTraits
    .filter((t) => t.vibe.split(" ").some((w) => myVibeWords.has(w)))
    .map((t) => t.vibe);
  const sharedTrait = sharedTraitPhrases[0] || myTraits[0].vibe;

  // Pick random activities
  const sharedActivities = [...myTraits, ...theirTraits].map((t) => t.activity);
  const sharedActivity = sharedActivities[Math.floor(Math.random() * sharedActivities.length)];

  // Fill 3 random templates
  const shuffled = [...icebreakerTemplates].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 3).map((template) =>
    template
      .replace(/\{my_vibe\}/g, myTraits[0]?.vibe || "fun")
      .replace(/\{their_vibe\}/g, theirTraits[0]?.vibe || "cool")
      .replace(/\{my_emoji\}/g, myEmojis[0])
      .replace(/\{their_emoji\}/g, theirEmojis[0])
      .replace(/\{shared_trait\}/g, sharedTrait)
      .replace(/\{my_activity\}/g, myTraits[0]?.activity || "hang out")
      .replace(/\{their_activity\}/g, theirTraits[0]?.activity || "chill")
      .replace(/\{shared_activity\}/g, sharedActivity)
      .replace(/\{activity\}/g, sharedActivity)
  );
}

/**
 * Generate a personality summary from 5 emojis. Zero API calls at runtime.
 * Uses cached emoji traits + templates.
 */
export async function generateProfileSummary(
  emojis: string[],
  name: string
): Promise<string> {
  const content = await getAIContent();
  const { emojiTraits, summaryTemplates } = content;

  const traits = emojis.map((e) => emojiTraits[e]).filter(Boolean);

  if (traits.length === 0) {
    return `${emojis.join(" ")} energy`;
  }

  // Pick a random template and fill it
  const template = summaryTemplates[Math.floor(Math.random() * summaryTemplates.length)];
  const allVibes = traits.map((t) => t.vibe);
  const allTraitStrings = traits.flatMap((t) => t.traits);

  return template
    .replace(/\{vibe1\}/g, allVibes[0] || "cool")
    .replace(/\{vibe2\}/g, allVibes[1] || allVibes[0] || "chill")
    .replace(/\{trait\}/g, allTraitStrings[0] || "good vibes")
    .replace(/\{trait1\}/g, allTraitStrings[0] || "fun")
    .replace(/\{trait2\}/g, allTraitStrings[1] || allTraitStrings[0] || "cool");
}

/** Static fallback pools (exported for immediate sync use in EmojiPicker). */
export { STATIC_POOLS };
