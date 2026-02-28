import { View } from "react-native";
import SwipeCardStack from "../../components/swipe/SwipeCardStack";
import AuroraBackground from "../../components/skia/AuroraBackground";
import TabHeader from "../../components/navigation/TabHeader";

export default function DiscoverScreen() {
  return (
    <View style={{ flex: 1 }}>
      <AuroraBackground variant="warm" />
      <TabHeader title="Discover" />
      <SwipeCardStack />
    </View>
  );
}
