import { StyleSheet, Dimensions } from "react-native";
import { Canvas, RoundedRect, Shader, Skia, useClock } from "@shopify/react-native-skia";
import { useDerivedValue } from "react-native-reanimated";

const { width: W } = Dimensions.get("window");

const shimmerSource = Skia.RuntimeEffect.Make(`
  uniform float2 iResolution;
  uniform float iTime;

  half4 main(float2 fragCoord) {
    float2 uv = fragCoord / iResolution;

    // Diagonal shimmer band moving across the surface
    float diag = (uv.x + uv.y) * 0.7;
    float shimmer = sin((diag - iTime * 0.8) * 8.0) * 0.5 + 0.5;
    shimmer = pow(shimmer, 12.0); // Make it a sharp highlight

    // Second subtle shimmer at different speed
    float shimmer2 = sin((diag - iTime * 0.5) * 5.0) * 0.5 + 0.5;
    shimmer2 = pow(shimmer2, 8.0) * 0.3;

    float combined = shimmer + shimmer2;

    // White highlight
    return half4(1.0, 1.0, 1.0, combined * 0.35);
  }
`)!;

type ShimmerOverlayProps = {
  width: number;
  height: number;
  borderRadius?: number;
};

export default function ShimmerOverlay({
  width,
  height,
  borderRadius = 24,
}: ShimmerOverlayProps) {
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
        <Shader source={shimmerSource} uniforms={uniforms} />
      </RoundedRect>
    </Canvas>
  );
}
