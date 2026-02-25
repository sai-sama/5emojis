import { View, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../lib/auth-context";

export default function ProfileScreen() {
  const { signOut } = useAuth();

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="px-6 pt-4 pb-2">
        <Text className="text-2xl font-bold text-text">Profile</Text>
      </View>

      <View className="flex-1 items-center justify-center px-8">
        <Text className="text-6xl mb-4">👤</Text>
        <Text className="text-xl font-semibold text-text mb-2">
          Your profile
        </Text>
        <Text className="text-text-secondary text-center mb-8">
          Edit your emojis, photos, and details here.
        </Text>

        <TouchableOpacity
          className="bg-red-100 rounded-xl px-6 py-3"
          onPress={signOut}
        >
          <Text className="text-red-600 font-semibold">Sign Out</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
