import { StyleSheet, Dimensions } from "react-native";
import { Canvas, Fill, Shader, Skia, useClock } from "@shopify/react-native-skia";
import { useDerivedValue } from "react-native-reanimated";

const { width: W, height: H } = Dimensions.get("window");

const warmSource = Skia.RuntimeEffect.Make(`
  uniform float2 iResolution;
  uniform float iTime;

  half4 main(float2 fragCoord) {
    float2 uv = fragCoord / iResolution;

    // Warm cream base
    half3 base = half3(1.0, 0.97, 0.94);

    // Flowing organic waves — visible movement
    float w1 = sin(uv.x * 3.0 + iTime * 0.5 + uv.y * 2.0) * 0.5 + 0.5;
    float w2 = sin(uv.y * 2.5 - iTime * 0.35 + uv.x * 1.5) * 0.5 + 0.5;
    float w3 = sin((uv.x + uv.y) * 2.0 + iTime * 0.6) * 0.5 + 0.5;
    float w4 = sin(uv.x * 1.5 - uv.y * 2.0 + iTime * 0.3) * 0.5 + 0.5;
    float w5 = sin(length(uv - 0.5) * 5.0 - iTime * 0.4) * 0.5 + 0.5;

    // Large flowing blobs
    float blob1 = smoothstep(0.3, 0.7, sin(uv.x * 2.0 + iTime * 0.3) * sin(uv.y * 1.5 - iTime * 0.2) * 0.5 + 0.5);
    float blob2 = smoothstep(0.35, 0.65, cos(uv.y * 2.5 + iTime * 0.25) * sin(uv.x * 1.8 + iTime * 0.35) * 0.5 + 0.5);

    // Brand palette
    half3 purple = half3(0.55, 0.35, 0.95);
    half3 peach = half3(1.0, 0.6, 0.4);
    half3 lavender = half3(0.82, 0.75, 1.0);
    half3 rose = half3(1.0, 0.8, 0.85);
    half3 gold = half3(1.0, 0.88, 0.6);

    // Visible color blending — 3-5x stronger than before
    half3 col = base;
    col = mix(col, lavender, w1 * 0.4);
    col = mix(col, rose, w2 * 0.25);
    col = mix(col, purple, blob1 * 0.18);
    col = mix(col, peach, w4 * 0.2);
    col = mix(col, gold, blob2 * 0.15);

    // Radial vignette — subtle purple tint at edges
    float vignette = length(uv - 0.5) * 0.8;
    col = mix(col, lavender, vignette * 0.2);

    return half4(col, 1.0);
  }
`)!;

const coolSource = Skia.RuntimeEffect.Make(`
  uniform float2 iResolution;
  uniform float iTime;

  half4 main(float2 fragCoord) {
    float2 uv = fragCoord / iResolution;

    // Deep dark base
    half3 base = half3(0.08, 0.02, 0.18);

    float w1 = sin(uv.x * 3.0 + iTime * 0.5 + uv.y * 2.5) * 0.5 + 0.5;
    float w2 = sin(uv.y * 2.5 - iTime * 0.4 + uv.x * 1.5) * 0.5 + 0.5;
    float w3 = sin((uv.x * 2.0 - uv.y) * 1.8 + iTime * 0.3) * 0.5 + 0.5;

    // Flowing nebula blobs
    float blob = smoothstep(0.2, 0.8, sin(uv.x * 1.5 + iTime * 0.2) * cos(uv.y * 2.0 - iTime * 0.15) * 0.5 + 0.5);

    half3 purple = half3(0.4, 0.15, 0.8);
    half3 indigo = half3(0.2, 0.1, 0.6);
    half3 violet = half3(0.6, 0.25, 0.9);
    half3 magenta = half3(0.7, 0.15, 0.6);

    half3 col = base;
    col = mix(col, indigo, w1 * 0.5);
    col = mix(col, purple, w2 * 0.4);
    col = mix(col, violet, blob * 0.35);
    col = mix(col, magenta, w3 * 0.15);

    return half4(col, 1.0);
  }
`)!;

const auroraSource = Skia.RuntimeEffect.Make(`
  uniform float2 iResolution;
  uniform float iTime;

  half4 main(float2 fragCoord) {
    float2 uv = fragCoord / iResolution;

    half3 base = half3(0.98, 0.96, 0.93);

    // Flowing aurora bands with nested sine waves
    float band1 = sin(uv.x * 4.0 + iTime * 0.5 + sin(uv.y * 3.0 + iTime * 0.25) * 1.2);
    float band2 = sin(uv.y * 3.5 - iTime * 0.4 + cos(uv.x * 2.0 + iTime * 0.35) * 0.8);
    float band3 = cos(uv.x * 2.5 + uv.y * 1.5 + iTime * 0.45);

    // Smooth into soft gradients
    band1 = smoothstep(0.1, 0.9, band1 * 0.5 + 0.5);
    band2 = smoothstep(0.15, 0.85, band2 * 0.5 + 0.5);
    band3 = smoothstep(0.2, 0.8, band3 * 0.5 + 0.5);

    half3 teal = half3(0.3, 0.85, 0.8);
    half3 purple = half3(0.55, 0.3, 0.95);
    half3 pink = half3(1.0, 0.5, 0.65);
    half3 blue = half3(0.4, 0.6, 1.0);

    // Much stronger color presence
    half3 col = base;
    col = mix(col, teal, band1 * 0.3);
    col = mix(col, purple, band2 * 0.25);
    col = mix(col, pink, band3 * 0.2);
    col = mix(col, blue, band1 * band2 * 0.15);

    return half4(col, 1.0);
  }
`)!;

type AuroraBackgroundProps = {
  variant?: "warm" | "cool" | "aurora";
};

const SOURCES = {
  warm: warmSource,
  cool: coolSource,
  aurora: auroraSource,
};

export default function AuroraBackground({
  variant = "warm",
}: AuroraBackgroundProps) {
  const clock = useClock();
  const source = SOURCES[variant];

  const uniforms = useDerivedValue(() => ({
    iResolution: [W, H],
    iTime: clock.value / 1000,
  }));

  return (
    <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
      <Fill>
        <Shader source={source} uniforms={uniforms} />
      </Fill>
    </Canvas>
  );
}
