import { useRef, useEffect } from "react";
import { StyleSheet } from "react-native";
import LottieView from "lottie-react-native";

type LottieCelebrationProps = {
  autoPlay?: boolean;
  loop?: boolean;
};

export default function LottieCelebration({
  autoPlay = true,
  loop = false,
}: LottieCelebrationProps) {
  const ref = useRef<LottieView>(null);

  useEffect(() => {
    if (autoPlay) {
      ref.current?.play();
    }
  }, [autoPlay]);

  return (
    <LottieView
      ref={ref}
      source={require("../../assets/animations/confetti-mobile.json")}
      autoPlay={autoPlay}
      loop={loop}
      speed={1}
      style={StyleSheet.absoluteFill}
    />
  );
}
