import { StyleSheet, Dimensions } from "react-native";
import { Canvas, RoundedRect, Shader, Skia, useClock } from "@shopify/react-native-skia";
import { useDerivedValue } from "react-native-reanimated";

const glassSource = Skia.RuntimeEffect.Make(`
  uniform float2 iResolution;
  uniform float iTime;

  half4 main(float2 fragCoord) {
    float2 uv = fragCoord / iResolution;

    // Frosted glass base — semi-transparent white
    half4 base = half4(1.0, 1.0, 1.0, 0.65);

    // Subtle iridescent color shift
    float shift = sin(uv.x * 3.0 + uv.y * 2.0 + iTime * 0.3) * 0.5 + 0.5;
    float shift2 = cos(uv.y * 4.0 - iTime * 0.2) * 0.5 + 0.5;

    half3 tint1 = half3(0.92, 0.88, 1.0); // Lavender
    half3 tint2 = half3(1.0, 0.95, 0.92); // Warm cream

    half3 tint = mix(tint1, tint2, shift);
    tint = mix(tint, half3(0.95, 0.92, 1.0), shift2 * 0.3);

    // Edge highlight — brighter at top
    float edgeHighlight = smoothstep(0.0, 0.15, uv.y) * 0.08;
    tint += edgeHighlight;

    return half4(tint, base.a);
  }
`)!;

type GlassCardProps = {
  width: number;
  height: number;
  borderRadius?: number;
};

export default function GlassCard({
  width,
  height,
  borderRadius = 20,
}: GlassCardProps) {
  const clock = useClock();

  const uniforms = useDerivedValue(() => ({
    iResolution: [width, height],
    iTime: clock.value / 1000,
  }));

  return (
    <Canvas
      style={[StyleSheet.absoluteFill, { borderRadius }]}
      pointerEvents="none"
    >
      <RoundedRect x={0} y={0} width={width} height={height} r={borderRadius}>
        <Shader source={glassSource} uniforms={uniforms} />
      </RoundedRect>
    </Canvas>
  );
}
