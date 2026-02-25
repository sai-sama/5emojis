import { View, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useAuth } from "../../lib/auth-context";

export default function SignIn() {
  const { signIn, devMode } = useAuth();

  const handleSignIn = () => {
    if (devMode) {
      signIn();
      router.replace("/(onboarding)/name");
      return;
    }
    // TODO: Real auth flow
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 items-center justify-center px-8">
        <Text className="text-6xl mb-4">👋🎉🌟💜🤝</Text>
        <Text className="text-4xl font-bold text-text mb-2">5Emojis</Text>
        <Text className="text-lg text-text-secondary text-center mb-12">
          Stop overthinking your first message.{"\n"}Just send 5 emojis.
        </Text>

        <TouchableOpacity
          className="w-full bg-black rounded-xl py-4 px-6 flex-row items-center justify-center mb-4"
          onPress={handleSignIn}
        >
          <Text className="text-white text-lg font-semibold"> Continue with Apple</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="w-full bg-white border border-gray-300 rounded-xl py-4 px-6 flex-row items-center justify-center"
          onPress={handleSignIn}
        >
          <Text className="text-text text-lg font-semibold">Continue with Google</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
