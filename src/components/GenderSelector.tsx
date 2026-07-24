import { Text, TouchableOpacity, View } from "react-native";

type Props = {
  gender: string;
  onChange: (value: string) => void;
};

export default function GenderSelector({
  gender,
  onChange,
}: Props) {
  const Item = ({ value }: { value: string }) => (
    <TouchableOpacity
      onPress={() => onChange(value)}
      className={`flex-1 h-12 rounded-2xl items-center justify-center border ${
        gender === value
          ? "border-coral bg-red-50"
          : "border-borderGray"
      }`}
    >
      <Text
        className={`font-semibold ${
          gender === value ? "text-coral" : "text-nearBlack"
        }`}
      >
        {value.charAt(0).toUpperCase() + value.slice(1)}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View className="flex-row gap-3">
      <Item value="female" />
      <Item value="male" />
    </View>
  );
}