import {
    ActivityIndicator,
    Text,
    TouchableOpacity,
} from "react-native";

type Props = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
};

export default function PrimaryButton({
  title,
  onPress,
  disabled = false,
  loading = false,
}: Props) {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      disabled={isDisabled}
      onPress={onPress}
      className={`rounded-2xl py-4 items-center ${
        isDisabled ? "bg-lightGray" : "bg-coral"
      }`}
    >
      {loading ? (
        <ActivityIndicator color="white" />
      ) : (
        <Text
          className={`font-bold text-[16px] ${
            isDisabled ? "text-[#BBBBBB]" : "text-white"
          }`}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}