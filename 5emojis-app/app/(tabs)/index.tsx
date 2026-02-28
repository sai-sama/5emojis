import { useState, useEffect, useCallback } from "react";
import { View } from "react-native";
import SwipeCardStack from "../../components/swipe/SwipeCardStack";
import AuroraBackground from "../../components/skia/AuroraBackground";
import TabHeader from "../../components/navigation/TabHeader";
import WellnessTipModal from "../../components/WellnessTipModal";
import { getTodaysTip, dismissTodaysTip, type WellnessTip } from "../../lib/wellness-tips";

export default function DiscoverScreen() {
  const [tip, setTip] = useState<WellnessTip | null>(null);

  useEffect(() => {
    getTodaysTip()
      .then(setTip)
      .catch(() => {});
  }, []);

  const handleDismiss = useCallback(() => {
    setTip(null);
    dismissTodaysTip();
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <AuroraBackground variant="warm" />
      <TabHeader />
      <SwipeCardStack />
      <WellnessTipModal visible={!!tip} tip={tip} onDismiss={handleDismiss} />
    </View>
  );
}
