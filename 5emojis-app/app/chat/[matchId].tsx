import { View, Text } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ChatScreen() {
  const { matchId } = useLocalSearchParams();

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 items-center justify-center px-8">
        <Text className="text-6xl mb-4">💬</Text>
        <Text className="text-xl font-semibold text-text mb-2">
          Chat coming soon
        </Text>
        <Text className="text-text-secondary text-center">
          Send your first 5 emojis to start the conversation!
        </Text>
      </View>
    </SafeAreaView>
  );
}
