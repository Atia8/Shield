import { Check, ChevronDown, Smartphone, X } from "lucide-react-native";
import { useState } from "react";
import { FlatList, Modal, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { COUNTRIES, digitsOnly, phoneError, type Country } from "@/lib/countries";
import { colors } from "@/theme/colors";
import { TextField } from "./TextField";

interface PhoneFieldProps {
  label?: string;
  country: Country;
  onCountryChange: (country: Country) => void;
  phone: string;
  onPhoneChange: (phone: string) => void;
}

/** Country dial-code picker + national number, validated per country. */
export function PhoneField({ label = "Phone Number", country, onCountryChange, phone, onPhoneChange }: PhoneFieldProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <TextField
        label={label}
        placeholder={country.example}
        value={phone}
        onChangeText={(t) => onPhoneChange(digitsOnly(t))}
        keyboardType="phone-pad"
        maxLength={country.max}
        error={phoneError(phone, country)}
        left={
          <Pressable
            onPress={() => setOpen(true)}
            accessibilityRole="button"
            accessibilityLabel={`Country code ${country.dial}, change`}
            className="flex-row items-center pr-3 mr-3 border-r border-white/10"
          >
            <Text className="text-base text-white mr-1">{country.flag}</Text>
            <Text className="text-white font-semibold mr-1">{country.dial}</Text>
            <ChevronDown color={colors.placeholder} size={14} />
          </Pressable>
        }
        right={<Smartphone size={16} color={colors.placeholder} />}
      />

      <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
        <View className="flex-1 bg-black/60 justify-end">
          <SafeAreaView edges={["bottom"]} className="bg-surface rounded-t-3xl max-h-[75%] w-full max-w-md self-center">
            <View className="flex-row items-center justify-between px-5 py-4 border-b border-white/10">
              <Text className="text-white font-bold text-lg">Select country</Text>
              <Pressable onPress={() => setOpen(false)} hitSlop={10} accessibilityLabel="Close">
                <X color="white" size={20} />
              </Pressable>
            </View>
            <FlatList
              data={COUNTRIES}
              keyExtractor={(c) => c.code}
              renderItem={({ item }) => {
                const selected = item.code === country.code;
                return (
                  <Pressable
                    onPress={() => {
                      onCountryChange(item);
                      setOpen(false);
                    }}
                    className={`flex-row items-center px-5 py-3.5 ${selected ? "bg-brand/10" : ""}`}
                  >
                    <Text className="text-xl text-white mr-3">{item.flag}</Text>
                    <Text className="text-white flex-1">{item.name}</Text>
                    <Text className="text-white/60 mr-3">{item.dial}</Text>
                    {selected ? <Check color={colors.brand} size={18} /> : null}
                  </Pressable>
                );
              }}
            />
          </SafeAreaView>
        </View>
      </Modal>
    </>
  );
}
