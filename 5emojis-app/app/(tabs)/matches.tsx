import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function MatchesScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="px-6 pt-4 pb-2">
        <Text className="text-2xl font-bold text-text">Matches</Text>
      </View>

      <View className="flex-1 items-center justify-center px-8">
        <Text className="text-6xl mb-4">🤝</Text>
        <Text className="text-xl font-semibold text-text mb-2">
          No matches yet
        </Text>
        <Text className="text-text-secondary text-center">
          Start swiping to find friends who share your emoji vibe!
        </Text>
      </View>
    </SafeAreaView>
  );
}
