// Supabase Edge Function — Generate 7 weekly wellness tips via Claude Haiku
// Deploy: supabase functions deploy generate-wellness-tips
// Run weekly: invoke manually or via cron
// Secret: ANTHROPIC_API_KEY (already set from moderation setup)

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.97.0";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const PROMPT = `Generate 7 short mental health and wellness tips for young adults (ages 18-30) using a friendship-focused app.

Rules:
- Each tip is 1-2 sentences max
- Positive, actionable, and encouraging
- Gen Z friendly tone (warm, not preachy)
- Cover diverse topics: mindfulness, movement, social connection, sleep, gratitude, boundaries, self-compassion
- Include one relevant emoji per tip

Return ONLY a JSON array of 7 objects: [{"tip": "...", "emoji": "..."}]
No markdown, no explanation, just the JSON array.`;

function getWeekStart(): string {
  const now = new Date();
  const day = now.getDay(); // 0=Sun
  const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday
  const monday = new Date(now.setDate(diff));
  return monday.toISOString().split("T")[0];
}

serve(async (req: Request) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (!ANTHROPIC_API_KEY) {
      return new Response(
        JSON.stringify({ error: "ANTHROPIC_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 1. Call Claude Haiku
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1024,
        messages: [{ role: "user", content: PROMPT }],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return new Response(
        JSON.stringify({ error: `Claude API error: ${response.status}`, details: err }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    let text = data.content?.[0]?.text ?? "";
    text = text.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim();

    const tips: { tip: string; emoji: string }[] = JSON.parse(text);

    if (!Array.isArray(tips) || tips.length !== 7) {
      return new Response(
        JSON.stringify({ error: "Expected 7 tips", got: tips?.length }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Upsert into Supabase
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const weekStart = getWeekStart();

    // Delete existing tips for this week (idempotent re-run)
    await supabase.from("wellness_tips").delete().eq("week_start", weekStart);

    // Insert fresh tips
    const rows = tips.map((t, i) => ({
      day_of_week: i, // 0=Sun...6=Sat
      week_start: weekStart,
      tip: t.tip,
      emoji: t.emoji,
    }));

    const { error: insertError } = await supabase.from("wellness_tips").insert(rows);

    if (insertError) {
      return new Response(
        JSON.stringify({ error: "DB insert failed", details: insertError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, week_start: weekStart, tips_count: 7 }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
