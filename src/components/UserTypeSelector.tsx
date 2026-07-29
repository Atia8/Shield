import { Text, TouchableOpacity, View } from "react-native";

type Props = {
  userType: string;
  onChange: (value: string) => void;
};

const options = [
  {
    label: "User (Need Help)",
    value: "user",
  },
  {
    label: "Helper Only",
    value: "helper",
  },
  {
    label: "Both Roles",
    value: "user_helper",
  },
];

export default function UserTypeSelector({
  userType,
  onChange,
}: Props) {
  return (
    <View className="border border-borderGray rounded-2xl overflow-hidden">
      {options.map((item, index) => (
        <TouchableOpacity
          key={item.value}
          onPress={() => onChange(item.value)}
          className={`p-4 ${
            index !== options.length - 1
              ? "border-b border-borderGray"
              : ""
          }`}
        >
          <Text
            className={`font-semibold ${
              userType === item.value
                ? "text-coral"
                : "text-nearBlack"
            }`}
          >
            {item.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}