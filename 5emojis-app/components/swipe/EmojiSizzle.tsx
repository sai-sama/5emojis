import { memo, useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  withSpring,
  Easing,
  runOnJS,
} from "react-native-reanimated";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// ─── Particle config ────────────────────────────────────────
const PARTICLE_COUNT = 14;

// Vibe (right) = celebratory explosion
const VIBE_POOL = ["🎉", "✨", "💛", "🤝", "🔥", "⭐", "💫", "🌟", "💖", "🥳"];
// Pass (left) = breezy dismissal
const PASS_POOL = ["💨", "👋", "😅", "🫠", "💭", "🍃", "☁️", "💤"];

type Particle = {
  emoji: string;
  id: number;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  rotation: number;
  delay: number;
  scale: number;
  fontSize: number;
  arcHeight: number;
  duration: number;
};

function EmojiParticle({
  particle,
  onDone,
}: {
  particle: Particle;
  onDone: () => void;
}) {
  const progress = useSharedValue(0);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.1);

  useEffect(() => {
    // Opacity: pop in → hold → fade out
    const holdTime = particle.duration - 80 - 300;
    opacity.value = withDelay(
      particle.delay,
      withSequence(
        withTiming(1, { duration: 80 }),
        withDelay(
          Math.max(holdTime, 100),
          withTiming(0, { duration: 300 }, () => {
            runOnJS(onDone)();
          })
        )
      )
    );
    // Scale: elastic pop in then settle
    scale.value = withDelay(
      particle.delay,
      withSequence(
        withSpring(particle.scale * 1.4, { damping: 5, stiffness: 350 }),
        withSpring(particle.scale, { damping: 8, stiffness: 180 })
      )
    );
    // Fly out
    progress.value = withDelay(
      particle.delay,
      withTiming(1, {
        duration: particle.duration,
        easing: Easing.out(Easing.cubic),
      })
    );
  }, []);

  const style = useAnimatedStyle(() => {
    const x =
      particle.startX +
      (particle.targetX - particle.startX) * progress.value;
    const y =
      particle.startY +
      (particle.targetY - particle.startY) * progress.value -
      // Parabolic arc — height varies per particle for organic feel
      particle.arcHeight *
        Math.sin(progress.value * Math.PI) *
        particle.scale;

    return {
      position: "absolute",
      left: x,
      top: y,
      opacity: opacity.value,
      transform: [
        { scale: scale.value },
        { rotate: `${particle.rotation * progress.value}deg` },
      ],
    };
  });

  return (
    <Animated.View style={style}>
      <Text style={{ fontSize: particle.fontSize }}>{particle.emoji}</Text>
    </Animated.View>
  );
}

// ─── Helpers ───────────────────────────────────────────────
function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min);
}

// ─── Main component ────────────────────────────────────────
type EmojiSizzleProps = {
  emojis: string[];
  direction: "left" | "right";
  onComplete: () => void;
};

function EmojiSizzleInner({
  emojis,
  direction,
  onComplete,
}: EmojiSizzleProps) {
  const [doneCount, setDoneCount] = useState(0);
  const totalParticles = useRef(0);

  const centerX = SCREEN_WIDTH / 2 - 18;
  const centerY = SCREEN_HEIGHT * 0.35;

  const isVibe = direction === "right";
  const pool = isVibe ? VIBE_POOL : PASS_POOL;

  const particles: Particle[] = [];

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const emoji = i < emojis.length ? emojis[i] : pickRandom(pool);

    if (isVibe) {
      // ── VIBE: full radial explosion ──
      // Spread particles in a full 360° burst, biased slightly right
      const baseAngle = (i / PARTICLE_COUNT) * 360 + randomBetween(-25, 25);
      const angleRad = (baseAngle * Math.PI) / 180;
      const distance = randomBetween(140, 320);
      const isBig = i < 3; // first 3 particles are hero-sized

      particles.push({
        emoji,
        id: i,
        startX: centerX + randomBetween(-20, 20),
        startY: centerY + randomBetween(-20, 20),
        targetX: centerX + Math.cos(angleRad) * distance,
        targetY: centerY + Math.sin(angleRad) * distance - 60,
        rotation: randomBetween(-180, 180),
        delay: i < 5 ? i * 30 : 80 + i * 25, // first wave fast, second wave staggered
        scale: isBig ? randomBetween(1.0, 1.3) : randomBetween(0.6, 1.0),
        fontSize: isBig ? randomBetween(44, 52) : randomBetween(28, 40),
        arcHeight: randomBetween(60, 140),
        duration: randomBetween(700, 1000),
      });
    } else {
      // ── PASS: gentle drift to the left ──
      // Softer, more scattered, drifting leftward
      const baseAngle = randomBetween(140, 250); // left-ish hemisphere
      const angleRad = (baseAngle * Math.PI) / 180;
      const distance = randomBetween(100, 260);

      particles.push({
        emoji,
        id: i,
        startX: centerX + randomBetween(-30, 30),
        startY: centerY + randomBetween(-30, 30),
        targetX: centerX + Math.cos(angleRad) * distance,
        targetY: centerY + Math.sin(angleRad) * distance + 20, // drift down slightly
        rotation: randomBetween(-90, 90),
        delay: i * 40,
        scale: randomBetween(0.5, 0.9),
        fontSize: randomBetween(26, 38),
        arcHeight: randomBetween(30, 80),
        duration: randomBetween(600, 900),
      });
    }
  }

  totalParticles.current = particles.length;

  useEffect(() => {
    if (doneCount >= totalParticles.current) {
      onComplete();
    }
  }, [doneCount]);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {particles.map((p) => (
        <EmojiParticle
          key={p.id}
          particle={p}
          onDone={() => setDoneCount((c) => c + 1)}
        />
      ))}
    </View>
  );
}

export const EmojiSizzle = memo(EmojiSizzleInner);
