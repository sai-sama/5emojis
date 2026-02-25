import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function DiscoverScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="px-6 pt-4 pb-2">
        <Text className="text-2xl font-bold text-text">Discover</Text>
      </View>

      <View className="flex-1 items-center justify-center px-8">
        {/* TODO: Swipe card stack */}
        <Text className="text-6xl mb-4">🃏</Text>
        <Text className="text-xl font-semibold text-text mb-2">
          Swipe cards coming soon
        </Text>
        <Text className="text-text-secondary text-center">
          This is where you'll discover new friends based on their 5 emojis,
          photo, and vibe.
        </Text>
      </View>
    </SafeAreaView>
  );
}
