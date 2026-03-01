/**
 * One-time script to generate 1000+ icebreaker questions for 5Emojis.
 *
 * Usage:
 *   ANTHROPIC_API_KEY=sk-... npx tsx scripts/generate-icebreakers.ts
 *
 * Output:
 *   supabase/seed_icebreakers.sql
 *
 * The script calls Claude with a detailed prompt to generate fun, friendship-
 * oriented completions for "5 Emojis I would use to describe..."
 */

import Anthropic from "@anthropic-ai/sdk";
import * as fs from "fs";
import * as path from "path";

const CATEGORIES = [
  "daily_life",
  "food_cooking",
  "travel_adventure",
  "music",
  "movies_tv",
  "personality_traits",
  "hypotheticals",
  "childhood_nostalgia",
  "social_situations",
  "hobbies_interests",
  "pop_culture",
  "emotions_vibes",
  "work_productivity",
  "seasons_weather",
  "animals_nature",
  "sports_fitness",
  "technology",
  "fashion_style",
  "city_life",
  "dreams_goals",
];

const SYSTEM_PROMPT = `You are a creative writer helping build a friendship app called 5Emojis.

5Emojis is a friendship-only app (NOT dating) for people 18+. When two users match, they're shown a fun icebreaker question and each responds with exactly 5 emojis — no words allowed for the first exchange. This starts their friendship conversation.

The question format is always:
"5 Emojis I would use to describe... [YOUR COMPLETION HERE]?"

Your job is to generate completions — the part after "describe...". Each completion should:
- Be 2-8 words long (concise!)
- Be fun, playful, and easy to answer with 5 emojis
- Appeal to a diverse audience (ages 18-40, all backgrounds, genders, cultures)
- NOT reference dating, romance, or relationships
- NOT be cringe, try-hard, or overly quirky
- Be universally relatable — avoid niche references most people won't get
- Spark genuine conversation — make people curious about each other's answers
- Cover a wide range of topics to keep things fresh

Examples of GREAT completions:
- "my perfect weekend" (easy to visualize with emojis, sparks conversation)
- "my relationship with sleep" (relatable, funny, universal)
- "my cooking skills" (self-deprecating humor works well)
- "my Uber rating in real life" (creative, makes people think)
- "how I feel about mornings" (universal, lots of emoji options)
- "my ideal road trip playlist" (fun, reveals personality)
- "my brain at 3am" (relatable, funny)

Examples of BAD completions:
- "the integral of a polynomial function" (too niche, hard to emoji)
- "my love life" (dating-focused, not friendship)
- "vibes" (too vague, no conversation starter)
- "how I feel about the geopolitical situation" (too heavy)`;

async function generateBatch(
  client: Anthropic,
  category: string,
  batchNum: number
): Promise<string[]> {
  const categoryLabel = category.replace(/_/g, " ");

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Generate exactly 55 unique icebreaker completions for the category "${categoryLabel}".

These complete the sentence: "5 Emojis I would use to describe..."

Output ONLY the completions, one per line. No numbering, no quotes, no explanations. Just the raw text completions.

Example format:
my perfect lazy Sunday
how I feel about grocery shopping
my kitchen at midnight

Remember: 2-8 words each, fun, relatable, easy to answer with emojis. Category: ${categoryLabel}. Batch ${batchNum + 1}.`,
      },
    ],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && line.length < 100);
}

function escapeSQL(str: string): string {
  return str.replace(/'/g, "''");
}

async function main() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("Error: ANTHROPIC_API_KEY environment variable is required");
    console.error(
      "Usage: ANTHROPIC_API_KEY=sk-... npx tsx scripts/generate-icebreakers.ts"
    );
    process.exit(1);
  }

  const client = new Anthropic({ apiKey });

  console.log(
    `Generating icebreaker questions across ${CATEGORIES.length} categories...`
  );

  const allQuestions: { question: string; category: string }[] = [];
  const seen = new Set<string>();

  for (const category of CATEGORIES) {
    console.log(`  Category: ${category.replace(/_/g, " ")}...`);

    // Generate 1 batch per category (55 questions each → ~1100 total)
    const questions = await generateBatch(client, category, 0);

    for (const q of questions) {
      const normalized = q.toLowerCase().trim();
      if (!seen.has(normalized)) {
        seen.add(normalized);
        allQuestions.push({ question: q, category });
      }
    }

    console.log(
      `    Got ${questions.length} questions (${allQuestions.length} total unique)`
    );
  }

  console.log(`\nTotal unique questions: ${allQuestions.length}`);

  // Generate SQL
  const lines = [
    "-- Icebreaker questions seed (auto-generated)",
    `-- Generated: ${new Date().toISOString()}`,
    `-- Total: ${allQuestions.length} questions across ${CATEGORIES.length} categories`,
    "",
    "INSERT INTO public.icebreaker_questions (question, category) VALUES",
  ];

  const values = allQuestions.map(
    (q, i) =>
      `  ('${escapeSQL(q.question)}', '${escapeSQL(q.category)}')${i < allQuestions.length - 1 ? "," : ";"}`
  );

  lines.push(...values);

  const outputPath = path.join(
    __dirname,
    "..",
    "supabase",
    "seed_icebreakers.sql"
  );
  fs.writeFileSync(outputPath, lines.join("\n") + "\n");

  console.log(`\nSeed file written to: ${outputPath}`);
}

main().catch((err) => {
  console.error("Failed to generate icebreakers:", err);
  process.exit(1);
});
