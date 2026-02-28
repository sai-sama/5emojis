import { useEffect, useMemo } from "react";
import { Dimensions, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
  runOnJS,
} from "react-native-reanimated";

const { width: W, height: H } = Dimensions.get("window");

import { COLORS } from "../../lib/constants";

const PARTICLE_COUNT = 40;
const CONFETTI_PALETTE = [
  COLORS.primary,
  COLORS.secondary,
  COLORS.highlight,
  COLORS.success,
  COLORS.accent,
  COLORS.vibe,
  "#F472B6", // pink
  "#818CF8", // indigo
];

const SHAPES = ["circle", "square", "rect"] as const;

type Particle = {
  id: number;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  rotation: number;
  color: string;
  shape: (typeof SHAPES)[number];
  size: number;
  delay: number;
};

function generateParticles(): Particle[] {
  return Array.from({ length: PARTICLE_COUNT }, (_, i) => {
    const angle = (Math.random() * Math.PI * 2);
    const distance = 100 + Math.random() * 300;
    const centerX = W / 2;
    const centerY = H * 0.35;

    return {
      id: i,
      x: centerX,
      y: centerY,
      targetX: centerX + Math.cos(angle) * distance,
      targetY: centerY + Math.sin(angle) * distance * 0.6 + Math.random() * 200,
      rotation: Math.random() * 720 - 360,
      color: CONFETTI_PALETTE[Math.floor(Math.random() * CONFETTI_PALETTE.length)],
      shape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
      size: 6 + Math.random() * 8,
      delay: Math.random() * 300,
    };
  });
}

function ConfettiPiece({ particle }: { particle: Particle }) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const rotate = useSharedValue(0);
  const scale = useSharedValue(0);
  const opacity = useSharedValue(1);

  useEffect(() => {
    // Burst out
    scale.value = withDelay(
      particle.delay,
      withTiming(1, { duration: 200, easing: Easing.out(Easing.back(2)) })
    );
    translateX.value = withDelay(
      particle.delay,
      withTiming(particle.targetX - particle.x, {
        duration: 1200,
        easing: Easing.out(Easing.cubic),
      })
    );
    translateY.value = withDelay(
      particle.delay,
      withTiming(particle.targetY - particle.y, {
        duration: 1400,
        easing: Easing.out(Easing.quad),
      })
    );
    rotate.value = withDelay(
      particle.delay,
      withTiming(particle.rotation, {
        duration: 1400,
        easing: Easing.out(Easing.cubic),
      })
    );
    // Fade out at the end
    opacity.value = withDelay(
      particle.delay + 800,
      withTiming(0, { duration: 600, easing: Easing.in(Easing.quad) })
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${rotate.value}deg` },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  const shapeStyle =
    particle.shape === "circle"
      ? { borderRadius: particle.size / 2, width: particle.size, height: particle.size }
      : particle.shape === "rect"
        ? { borderRadius: 2, width: particle.size * 1.8, height: particle.size * 0.5 }
        : { borderRadius: 2, width: particle.size, height: particle.size };

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          left: particle.x,
          top: particle.y,
          backgroundColor: particle.color,
          ...shapeStyle,
        },
        style,
      ]}
    />
  );
}

type ConfettiProps = {
  onComplete?: () => void;
};

export default function Confetti({ onComplete }: ConfettiProps) {
  const particles = useMemo(() => generateParticles(), []);

  useEffect(() => {
    if (onComplete) {
      const timer = setTimeout(onComplete, 2000);
      return () => clearTimeout(timer);
    }
  }, [onComplete]);

  return (
    <>
      {particles.map((p) => (
        <ConfettiPiece key={p.id} particle={p} />
      ))}
    </>
  );
}
