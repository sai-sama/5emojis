// Supabase Edge Function — Content moderation via OpenAI omni-moderation-latest (free)
// Deploy: supabase functions deploy moderate-photo
// Secret: supabase secrets set OPENAI_API_KEY=sk-...

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

// Thresholds — only block truly explicit content, not swimwear/gym photos
const HARD_BLOCK_CATEGORIES = ["sexual/minors", "self-harm", "self-harm/intent"];
const SCORE_THRESHOLDS: Record<string, number> = {
  sexual: 0.8, // Only block explicit nudity/pornography
  "violence/graphic": 0.7,
};

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  if (!OPENAI_API_KEY) {
    return new Response(
      JSON.stringify({ safe: true, reason: "Moderation not configured" }),
      { headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  }

  try {
    const { image } = await req.json();
    if (!image) {
      return new Response(
        JSON.stringify({ error: "Missing image field" }),
        { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    // Call OpenAI moderation (free endpoint)
    const moderationRes = await fetch("https://api.openai.com/v1/moderations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "omni-moderation-latest",
        input: [
          {
            type: "image_url",
            image_url: {
              url: `data:image/jpeg;base64,${image}`,
            },
          },
        ],
      }),
    });

    if (!moderationRes.ok) {
      const errText = await moderationRes.text();
      console.error("OpenAI moderation error:", errText);
      // Fail open — allow upload if moderation service errors
      return new Response(
        JSON.stringify({ safe: true }),
        { headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    const moderationData = await moderationRes.json();
    const result = moderationData.results?.[0];

    if (!result) {
      return new Response(
        JSON.stringify({ safe: true }),
        { headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    // Check hard-block categories (any score triggers rejection)
    for (const cat of HARD_BLOCK_CATEGORIES) {
      if (result.categories?.[cat]) {
        return new Response(
          JSON.stringify({
            safe: false,
            reason:
              "This photo doesn't meet our community guidelines. Please choose a different one.",
          }),
          { headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
        );
      }
    }

    // Check score-threshold categories
    const flaggedCategories: string[] = [];
    for (const [cat, threshold] of Object.entries(SCORE_THRESHOLDS)) {
      const score = result.category_scores?.[cat] ?? 0;
      if (score >= threshold) {
        flaggedCategories.push(cat);
      }
    }

    if (flaggedCategories.length > 0) {
      return new Response(
        JSON.stringify({
          safe: false,
          reason:
            "This photo doesn't meet our community guidelines. Please choose a different one.",
        }),
        { headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ safe: true }),
      { headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Moderation function error:", err);
    // Fail open
    return new Response(
      JSON.stringify({ safe: true }),
      { headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  }
});
