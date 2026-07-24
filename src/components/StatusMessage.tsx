import { Text, View } from "react-native";

type Props = {
  message: string;
};

export default function StatusMessage({ message }: Props) {
  if (!message) return null;

  const success = message.startsWith("✅");

  return (
    <View
      className={`rounded-2xl p-4 border ${
        success
          ? "bg-green-50 border-green-400"
          : "bg-red-50 border-red-400"
      }`}
    >
      <Text
        className={`text-sm font-medium ${
          success ? "text-green-700" : "text-red-700"
        }`}
      >
        {message}
      </Text>
    </View>
  );
}