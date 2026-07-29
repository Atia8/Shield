import { Lock, Mail, Phone, User } from "lucide-react-native";
import { TextInput, View } from "react-native";

interface Props {
  placeholder: string;
  value: string;
  onChangeText: (text:string)=>void;
  secureTextEntry?: boolean;
  type?: "name" | "email" | "phone" | "password";
}

export default function InputField({
  placeholder,
  value,
  onChangeText,
  secureTextEntry,
  type
}: Props){

  const Icon =
    type === "email"
      ? Mail
      : type === "phone"
      ? Phone
      : type === "password"
      ? Lock
      : User;


  return (

    <View className="flex-row items-center bg-gray-100 rounded-xl px-4 py-3 mb-4">

      <Icon 
        size={20}
        color="#666"
      />

      <TextInput

        className="flex-1 ml-3 text-base"

        placeholder={placeholder}

        value={value}

        onChangeText={onChangeText}

        secureTextEntry={secureTextEntry}

        keyboardType={
          type==="email"
          ? "email-address"
          : type==="phone"
          ? "phone-pad"
          : "default"
        }

      />

    </View>

  );
}