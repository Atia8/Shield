import React from "react";
import {
    Text,
    TextInput,
    TextInputProps,
    View,
} from "react-native";

type Props = TextInputProps & {
  label: string;
  right?: React.ReactNode;
};

export default function AirbnbInput({
  label,
  right,
  ...props
}: Props) {
  return (
    <View className="border border-borderGray rounded-2xl px-4 pt-2 pb-3">
      <Text className="text-[10px] font-bold uppercase tracking-wider text-midGray mb-1">
        {label}
      </Text>

      <View className="flex-row items-center">
        <TextInput
          {...props}
          className="flex-1 text-[16px] text-nearBlack"
          placeholderTextColor="#BBBBBB"
        />

        {right}
      </View>
    </View>
  );
}