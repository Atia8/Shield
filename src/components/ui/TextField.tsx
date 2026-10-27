import type { LucideIcon } from "lucide-react-native";
import type { ReactNode } from "react";
import { Text, TextInput, View, type TextInputProps } from "react-native";
import { colors } from "@/theme/colors";

interface TextFieldProps extends Omit<TextInputProps, "onChange"> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: LucideIcon;
  left?: ReactNode;
  right?: ReactNode;
}

export function TextField({ label, error, hint, icon: Icon, left, right, multiline, ...input }: TextFieldProps) {
  return (
    <View className="mb-4">
      {label ? <Text className="text-sm font-semibold text-white/90 mb-2">{label}</Text> : null}
      <View
        className={`flex-row ${multiline ? "items-start" : "items-center"} border rounded-xl px-4 ${
          error ? "border-danger bg-danger/10" : "border-white/10 bg-surface"
        }`}
        style={{ minHeight: 50 }}
      >
        {Icon ? (
          <View style={{ marginRight: 10, marginTop: multiline ? 14 : 0 }}>
            <Icon color={colors.accent} size={18} />
          </View>
        ) : null}
        {left}
        <TextInput
          className="flex-1 text-[15px] text-white"
          placeholderTextColor={colors.placeholder}
          multiline={multiline}
          style={[
            { paddingVertical: 12, outlineStyle: "none" } as object,
            multiline ? { minHeight: 90, textAlignVertical: "top" } : null,
          ]}
          {...input}
        />
        {right}
      </View>
      {error ? (
        <Text className="text-red-400 text-xs mt-1 ml-1 font-medium">{error}</Text>
      ) : hint ? (
        <Text className="text-white/40 text-xs mt-1 ml-1">{hint}</Text>
      ) : null}
    </View>
  );
}
