/**
 * Generate 5Emojis app icon — "5" made of emoji mosaic
 *
 * Downloads Twemoji PNGs and composites them into the shape of "5"
 * on a rich purple gradient background.
 *
 * Outputs:
 *   assets/icon.png                    — 1024x1024 (iOS App Store)
 *   assets/favicon.png                 — 48x48 (web)
 *   assets/splash-icon.png             — 200x200 (splash)
 *   assets/android-icon-foreground.png — 1024x1024 (Android adaptive)
 *   assets/android-icon-background.png — 1024x1024 (solid gradient bg)
 *   assets/android-icon-monochrome.png — 1024x1024 (monochrome silhouette)
 *
 * Run: node scripts/generate-icon.mjs
 */
import sharp from "sharp";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { existsSync, mkdirSync } from "fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ASSETS = join(__dirname, "..", "assets");
const CACHE = join(__dirname, "..", ".emoji-cache");
const SIZE = 1024;

// Social/friendship emoji set — diverse, colorful, fun
const EMOJIS = [
  "1f604", // 😄 smile
  "1f389", // 🎉 party
  "2728",  // ✨ sparkles
  "1f91d", // 🤝 handshake
  "1f49c", // 💜 purple heart
  "1f3b5", // 🎵 music
  "2615",  // ☕ coffee
  "1f3a8", // 🎨 art
  "1f525", // 🔥 fire
  "1f31f", // 🌟 star
  "1f60e", // 😎 cool
  "1f64c", // 🙌 raised hands
  "1f308", // 🌈 rainbow
  "1f680", // 🚀 rocket
  "1f381", // 🎁 gift
  "1f60d", // 😍 heart eyes
  "1f44b", // 👋 wave
  "1f388", // 🎈 balloon
  "1f382", // 🎂 cake
  "1f3b6", // 🎶 notes
  "1f917", // 🤗 hugging
  "1f48e", // 💎 gem
  "1f596", // 🖖 vulcan
  "270c",  // ✌️ peace
  "1f44d", // 👍 thumbs up
  "1f37f", // 🍿 popcorn
  "1f3ae", // 🎮 gaming
  "1f4f8", // 📸 camera
  "1f30e", // 🌎 earth
  "1f9e1", // 🧡 orange heart
];

// ─── Define the "5" shape as grid points ───────────────────
// On a 16x20 grid, which cells form the number "5"
function getFiveShape() {
  const points = [];

  // Top horizontal bar (rows 1-2, cols 3-13)
  for (let r = 1; r <= 2; r++)
    for (let c = 3; c <= 13; c++) points.push([r, c]);

  // Left vertical stem (rows 3-8, cols 3-5)
  for (let r = 3; r <= 8; r++)
    for (let c = 3; c <= 5; c++) points.push([r, c]);

  // Middle bar + right curve top (rows 8-10)
  for (let r = 8; r <= 10; r++)
    for (let c = 3; c <= 13; c++) points.push([r, c]);

  // Right side descender (rows 11-14, cols 11-13)
  for (let r = 11; r <= 14; r++)
    for (let c = 11; c <= 13; c++) points.push([r, c]);

  // Bottom curve right (row 15, cols 9-13)
  for (let c = 9; c <= 13; c++) points.push([15, c]);

  // Bottom horizontal bar (rows 16-17, cols 4-11)
  for (let r = 16; r <= 17; r++)
    for (let c = 4; c <= 11; c++) points.push([r, c]);

  // Bottom curve left (row 15, cols 3-5)
  for (let c = 3; c <= 5; c++) points.push([15, c]);

  // Left bottom hook (rows 13-14, cols 3-5)
  for (let r = 13; r <= 14; r++)
    for (let c = 3; c <= 5; c++) points.push([r, c]);

  // Deduplicate
  const seen = new Set();
  return points.filter(([r, c]) => {
    const key = `${r},${c}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ─── Download & cache Twemoji PNGs ─────────────────────────
async function fetchEmoji(code) {
  if (!existsSync(CACHE)) mkdirSync(CACHE, { recursive: true });

  const cached = join(CACHE, `${code}.png`);
  if (existsSync(cached)) {
    return sharp(cached).toBuffer();
  }

  const url = `https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/72x72/${code}.png`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch emoji ${code}: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());

  // Cache it
  await sharp(buf).toFile(cached);
  return buf;
}

// ─── Background SVG ────────────────────────────────────────
function createBackgroundSVG(size = SIZE) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="bgGrad" x1="0" y1="0" x2="0.7" y2="1">
      <stop offset="0%" stop-color="#8B5CF6" />
      <stop offset="35%" stop-color="#7C3AED" />
      <stop offset="100%" stop-color="#4338CA" />
    </linearGradient>
    <radialGradient id="ambient" cx="25%" cy="20%" r="65%">
      <stop offset="0%" stop-color="#A78BFA" stop-opacity="0.2" />
      <stop offset="100%" stop-color="#7C3AED" stop-opacity="0" />
    </radialGradient>
  </defs>
  <rect width="${size}" height="${size}" fill="url(#bgGrad)" />
  <rect width="${size}" height="${size}" fill="url(#ambient)" />
</svg>`;
}

// ─── Monochrome "5" for Android ────────────────────────────
function createMonochromeSVG() {
  // Simple thick "5" shape
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <text
    x="512" y="640"
    text-anchor="middle"
    font-family="-apple-system, 'SF Pro Display', 'Helvetica Neue', sans-serif"
    font-weight="800" font-size="420"
    fill="white"
  >5</text>
</svg>`;
}

// ─── Main generation ───────────────────────────────────────
async function generate() {
  console.log("Generating 5Emojis emoji-mosaic icon...\n");

  // 1. Get the "5" shape grid points
  const shape = getFiveShape();
  console.log(`  Shape has ${shape.length} emoji positions`);

  // 2. Download all emoji PNGs we'll need (cycle through the set)
  console.log("  Downloading Twemoji PNGs...");
  const emojiBuffers = [];
  for (let i = 0; i < EMOJIS.length; i++) {
    const buf = await fetchEmoji(EMOJIS[i]);
    emojiBuffers.push(buf);
  }
  console.log(`  Downloaded ${emojiBuffers.length} emojis`);

  // 3. Calculate positioning
  const gridRows = 20;
  const gridCols = 17;
  const padding = 100; // padding around the "5"
  const cellW = (SIZE - padding * 2) / gridCols;
  const cellH = (SIZE - padding * 2) / gridRows;
  const emojiSize = Math.floor(Math.min(cellW, cellH) * 0.92);

  // 4. Create background
  const bgBuf = Buffer.from(createBackgroundSVG());
  const background = await sharp(bgBuf).resize(SIZE, SIZE).png().toBuffer();

  // 5. Resize all emoji to target size
  const resizedEmojis = await Promise.all(
    emojiBuffers.map((buf) =>
      sharp(buf).resize(emojiSize, emojiSize, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer()
    )
  );

  // 6. Build composite operations — place emojis at each grid position
  const composites = shape.map(([row, col], i) => {
    const emojiIdx = i % resizedEmojis.length;
    const x = Math.round(padding + col * cellW + (cellW - emojiSize) / 2);
    const y = Math.round(padding + row * cellH + (cellH - emojiSize) / 2);
    return {
      input: resizedEmojis[emojiIdx],
      left: x,
      top: y,
    };
  });

  // 7. Composite onto background
  const iconBuf = await sharp(background)
    .composite(composites)
    .png()
    .toBuffer();

  // 8. Write all outputs
  await sharp(iconBuf).resize(1024, 1024).png().toFile(join(ASSETS, "icon.png"));
  console.log("  icon.png (1024x1024)");

  await sharp(iconBuf).resize(200, 200).png().toFile(join(ASSETS, "splash-icon.png"));
  console.log("  splash-icon.png (200x200)");

  await sharp(iconBuf).resize(48, 48).png().toFile(join(ASSETS, "favicon.png"));
  console.log("  favicon.png (48x48)");

  // Android foreground — same emoji mosaic but no background (transparent)
  const transparentBg = await sharp({
    create: { width: SIZE, height: SIZE, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  }).png().toBuffer();

  // Shift inward for Android safe zone (icon content should be within ~66% center)
  const androidPad = 170;
  const aCellW = (SIZE - androidPad * 2) / gridCols;
  const aCellH = (SIZE - androidPad * 2) / gridRows;
  const aEmojiSize = Math.floor(Math.min(aCellW, aCellH) * 0.9);

  const aResizedEmojis = await Promise.all(
    emojiBuffers.map((buf) =>
      sharp(buf).resize(aEmojiSize, aEmojiSize, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer()
    )
  );

  const aComposites = shape.map(([row, col], i) => {
    const emojiIdx = i % aResizedEmojis.length;
    const x = Math.round(androidPad + col * aCellW + (aCellW - aEmojiSize) / 2);
    const y = Math.round(androidPad + row * aCellH + (aCellH - aEmojiSize) / 2);
    return { input: aResizedEmojis[emojiIdx], left: x, top: y };
  });

  await sharp(transparentBg)
    .composite(aComposites)
    .png()
    .toFile(join(ASSETS, "android-icon-foreground.png"));
  console.log("  android-icon-foreground.png (1024x1024)");

  // Android background — just the gradient
  const androidBgBuf = Buffer.from(createBackgroundSVG());
  await sharp(androidBgBuf).resize(1024, 1024).png().toFile(join(ASSETS, "android-icon-background.png"));
  console.log("  android-icon-background.png (1024x1024)");

  // Monochrome
  const monoBuf = Buffer.from(createMonochromeSVG());
  await sharp(monoBuf).resize(1024, 1024).png().toFile(join(ASSETS, "android-icon-monochrome.png"));
  console.log("  android-icon-monochrome.png (1024x1024)");

  console.log("\nAll icons generated!");
}

generate().catch(console.error);
