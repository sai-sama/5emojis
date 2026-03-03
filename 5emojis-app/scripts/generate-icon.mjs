/**
 * Generate 5Emojis app icons from SVG → PNG
 *
 * Outputs:
 *   assets/icon.png                    — 1024x1024 (iOS App Store)
 *   assets/favicon.png                 — 48x48 (web)
 *   assets/splash-icon.png             — 200x200 (splash)
 *   assets/android-icon-foreground.png — 432x432 (Android adaptive, with padding)
 *   assets/android-icon-background.png — 432x432 (solid color bg)
 *
 * Run: node scripts/generate-icon.mjs
 */
import sharp from "sharp";
import { writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ASSETS = join(__dirname, "..", "assets");

// ─── Design tokens ────────────────────────────────────────
const PRIMARY = "#7C3AED";
const PRIMARY_LIGHT = "#A78BFA";
const PRIMARY_DARK = "#5B21B6";
const BG_WARM = "#F7EFE3";
const GOLD = "#FBBF24";

// ─── Main icon SVG (1024x1024) ────────────────────────────
function createIconSVG(size = 1024) {
  const s = size;
  const cx = s / 2;
  const cy = s / 2;

  // 5 emoji circles arranged in a friendly pentagon/arc pattern
  // Positioned above and around the "5"
  const emojis = ["👋", "🎉", "🌟", "💜", "🤝"];
  const emojiSize = s * 0.09;
  const emojiRadius = s * 0.32;
  const emojiY = cy - s * 0.05;

  // Arc arrangement — 5 emojis in a gentle smile curve above center
  const emojiPositions = emojis.map((emoji, i) => {
    const angle = Math.PI + (Math.PI * (i + 0.5)) / 5; // spread across top arc
    const x = cx + emojiRadius * Math.cos(angle);
    const y = emojiY + emojiRadius * Math.sin(angle) * 0.6;
    return { emoji, x, y };
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">
  <defs>
    <!-- Background gradient -->
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${PRIMARY}"/>
      <stop offset="100%" stop-color="${PRIMARY_DARK}"/>
    </linearGradient>

    <!-- Subtle radial glow -->
    <radialGradient id="glow" cx="50%" cy="45%" r="50%">
      <stop offset="0%" stop-color="${PRIMARY_LIGHT}" stop-opacity="0.3"/>
      <stop offset="100%" stop-color="${PRIMARY_DARK}" stop-opacity="0"/>
    </radialGradient>

    <!-- Gold accent for the 5 -->
    <linearGradient id="gold" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#FDE68A"/>
      <stop offset="100%" stop-color="${GOLD}"/>
    </linearGradient>

    <!-- Shadow filter -->
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="130%">
      <feDropShadow dx="0" dy="4" stdDeviation="12" flood-color="#000" flood-opacity="0.2"/>
    </filter>

    <filter id="emoji-shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="2" stdDeviation="4" flood-color="#000" flood-opacity="0.15"/>
    </filter>
  </defs>

  <!-- Background with rounded corners -->
  <rect width="${s}" height="${s}" rx="${s * 0.22}" fill="url(#bg)"/>

  <!-- Radial glow -->
  <rect width="${s}" height="${s}" rx="${s * 0.22}" fill="url(#glow)"/>

  <!-- Subtle pattern — tiny dots -->
  ${Array.from({ length: 30 }, (_, i) => {
    const x = 80 + (i % 6) * (s * 0.16);
    const y = 80 + Math.floor(i / 6) * (s * 0.18);
    return `<circle cx="${x}" cy="${y}" r="${s * 0.008}" fill="white" opacity="0.06"/>`;
  }).join("\n  ")}

  <!-- The big "5" — centered, bold, white -->
  <text
    x="${cx}"
    y="${cy + s * 0.12}"
    text-anchor="middle"
    font-family="system-ui, -apple-system, 'Helvetica Neue', Arial, sans-serif"
    font-weight="900"
    font-size="${s * 0.52}"
    fill="white"
    filter="url(#shadow)"
    opacity="0.95"
  >5</text>

  <!-- Gold underline accent -->
  <rect
    x="${cx - s * 0.14}"
    y="${cy + s * 0.2}"
    width="${s * 0.28}"
    height="${s * 0.035}"
    rx="${s * 0.018}"
    fill="url(#gold)"
    filter="url(#shadow)"
  />

  <!-- Emoji circles -->
  ${emojiPositions
    .map(
      ({ emoji, x, y }) => `
  <g filter="url(#emoji-shadow)">
    <circle cx="${x}" cy="${y}" r="${emojiSize}" fill="white" opacity="0.15"/>
    <text x="${x}" y="${y + emojiSize * 0.35}" text-anchor="middle" font-size="${emojiSize * 1.2}">${emoji}</text>
  </g>`
    )
    .join("")}
</svg>`;
}

// ─── Android foreground SVG (centered with adaptive icon padding) ─
function createAndroidForegroundSVG() {
  // Android adaptive icons: 108dp with 72dp safe zone (inner 66.7%)
  // We render at 432px (108dp × 4) with content in the center 288px
  const s = 432;
  const cx = s / 2;
  const cy = s / 2;
  const content = s * 0.55; // content area

  const emojis = ["👋", "🎉", "🌟", "💜", "🤝"];
  const emojiSize = content * 0.09;
  const emojiRadius = content * 0.35;
  const emojiY = cy - content * 0.02;

  const emojiPositions = emojis.map((emoji, i) => {
    const angle = Math.PI + (Math.PI * (i + 0.5)) / 5;
    const x = cx + emojiRadius * Math.cos(angle);
    const y = emojiY + emojiRadius * Math.sin(angle) * 0.6;
    return { emoji, x, y };
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">
  <defs>
    <filter id="shadow">
      <feDropShadow dx="0" dy="2" stdDeviation="6" flood-color="#000" flood-opacity="0.2"/>
    </filter>
    <filter id="emoji-shadow">
      <feDropShadow dx="0" dy="1" stdDeviation="2" flood-color="#000" flood-opacity="0.15"/>
    </filter>
    <linearGradient id="gold" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#FDE68A"/>
      <stop offset="100%" stop-color="${GOLD}"/>
    </linearGradient>
  </defs>

  <!-- The big "5" -->
  <text
    x="${cx}"
    y="${cy + content * 0.12}"
    text-anchor="middle"
    font-family="system-ui, -apple-system, 'Helvetica Neue', Arial, sans-serif"
    font-weight="900"
    font-size="${content * 0.52}"
    fill="white"
    filter="url(#shadow)"
  >5</text>

  <!-- Gold underline -->
  <rect
    x="${cx - content * 0.14}"
    y="${cy + content * 0.2}"
    width="${content * 0.28}"
    height="${content * 0.035}"
    rx="${content * 0.018}"
    fill="url(#gold)"
    filter="url(#shadow)"
  />

  <!-- Emojis -->
  ${emojiPositions
    .map(
      ({ emoji, x, y }) => `
  <g filter="url(#emoji-shadow)">
    <circle cx="${x}" cy="${y}" r="${emojiSize}" fill="white" opacity="0.15"/>
    <text x="${x}" y="${y + emojiSize * 0.35}" text-anchor="middle" font-size="${emojiSize * 1.2}">${emoji}</text>
  </g>`
    )
    .join("")}
</svg>`;
}

// ─── Android background SVG ──────────────────────────────
function createAndroidBackgroundSVG() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="432" height="432" viewBox="0 0 432 432">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${PRIMARY}"/>
      <stop offset="100%" stop-color="${PRIMARY_DARK}"/>
    </linearGradient>
  </defs>
  <rect width="432" height="432" fill="url(#bg)"/>
</svg>`;
}

// ─── Monochrome icon (just the "5" silhouette) ────────────
function createMonochromeSVG() {
  const s = 432;
  const cx = s / 2;
  const cy = s / 2;
  const content = s * 0.55;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">
  <text
    x="${cx}"
    y="${cy + content * 0.12}"
    text-anchor="middle"
    font-family="system-ui, -apple-system, 'Helvetica Neue', Arial, sans-serif"
    font-weight="900"
    font-size="${content * 0.52}"
    fill="white"
  >5</text>
  <rect
    x="${cx - content * 0.14}"
    y="${cy + content * 0.2}"
    width="${content * 0.28}"
    height="${content * 0.035}"
    rx="${content * 0.018}"
    fill="white"
  />
</svg>`;
}

// ─── Generate all icons ──────────────────────────────────
async function generate() {
  console.log("Generating 5Emojis app icons...\n");

  const iconSVG = Buffer.from(createIconSVG(1024));
  const fgSVG = Buffer.from(createAndroidForegroundSVG());
  const bgSVG = Buffer.from(createAndroidBackgroundSVG());
  const monoSVG = Buffer.from(createMonochromeSVG());

  // iOS icon (1024x1024)
  await sharp(iconSVG).resize(1024, 1024).png().toFile(join(ASSETS, "icon.png"));
  console.log("  icon.png (1024x1024)");

  // Favicon (48x48)
  await sharp(iconSVG).resize(48, 48).png().toFile(join(ASSETS, "favicon.png"));
  console.log("  favicon.png (48x48)");

  // Splash icon (200x200)
  await sharp(iconSVG).resize(200, 200).png().toFile(join(ASSETS, "splash-icon.png"));
  console.log("  splash-icon.png (200x200)");

  // Android adaptive foreground (432x432)
  await sharp(fgSVG).resize(432, 432).png().toFile(join(ASSETS, "android-icon-foreground.png"));
  console.log("  android-icon-foreground.png (432x432)");

  // Android adaptive background (432x432)
  await sharp(bgSVG).resize(432, 432).png().toFile(join(ASSETS, "android-icon-background.png"));
  console.log("  android-icon-background.png (432x432)");

  // Android monochrome (432x432)
  await sharp(monoSVG).resize(432, 432).png().toFile(join(ASSETS, "android-icon-monochrome.png"));
  console.log("  android-icon-monochrome.png (432x432)");

  console.log("\nAll icons generated!");
}

generate().catch(console.error);
