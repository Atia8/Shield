import { router } from "expo-router";
import { LifeBuoy, MapPin, User } from "lucide-react-native";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Button } from "@/components/ui/Button";
import { ErrorBanner } from "@/components/ui/Card";
import { Header } from "@/components/ui/Header";
import { PhoneField } from "@/components/ui/PhoneField";
import { Screen } from "@/components/ui/Screen";
import { TextField } from "@/components/ui/TextField";
import { useToast } from "@/components/ui/Toast";
import { GENDER_OPTIONS, updateProfile } from "@/features/auth/api";
import { useCurrentUser } from "@/features/auth/AuthProvider";
import { findCountry, isValidPhone } from "@/lib/countries";
import { errorMessage } from "@/lib/format";
import type { Gender } from "@/types/models";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export default function EditProfileScreen() {
  const user = useCurrentUser();
  const toast = useToast();
  const [name, setName] = useState(user.name);
  const [country, setCountry] = useState(findCountry(user.countryCode));
  const [phone, setPhone] = useState(user.phone);
  const [gender, setGender] = useState<Gender>(user.gender);
  const [address, setAddress] = useState(user.address ?? "");
  const [bloodGroup, setBloodGroup] = useState(user.bloodGroup ?? "");
  const [medicalNotes, setMedicalNotes] = useState(user.medicalNotes ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const valid = name.trim().length >= 2 && (phone === "" || isValidPhone(phone, country));

  const save = async () => {
    if (!valid) return;
    setSaving(true);
    setError(null);
    try {
      await updateProfile(user.id, {
        name: name.trim(),
        phone,
        countryCode: country.dial,
        gender,
        address: address.trim(),
        bloodGroup,
        medicalNotes: medicalNotes.trim(),
      });
      toast("Profile updated");
      router.back();
    } catch (e) {
      setError(errorMessage(e));
      setSaving(false);
    }
  };

  return (
    <Screen keyboard header={<Header title="Edit Profile" subtitle="Keep your emergency details current" back />}>
      {error ? <ErrorBanner message={error} /> : null}
      <TextField label="Full Name" icon={User} value={name} onChangeText={setName} autoCapitalize="words" />
      <PhoneField country={country} onCountryChange={setCountry} phone={phone} onPhoneChange={setPhone} />

      <Text className="text-sm font-semibold text-white/90 mb-2">Gender</Text>
      <View className="flex-row flex-wrap mb-4">
        {GENDER_OPTIONS.map((g) => (
          <Pressable
            key={g.value}
            onPress={() => setGender(g.value)}
            className={`px-3.5 py-2 rounded-full border mr-2 mb-2 ${
              gender === g.value ? "bg-brand/20 border-brand" : "bg-white/5 border-white/10"
            }`}
          >
            <Text className={`text-xs font-bold ${gender === g.value ? "text-brand" : "text-white/70"}`}>{g.label}</Text>
          </Pressable>
        ))}
      </View>

      <TextField
        label="Home Address"
        icon={MapPin}
        placeholder="House, road, area, city"
        value={address}
        onChangeText={setAddress}
      />

      <Text className="text-sm font-semibold text-white/90 mb-2">Blood Group</Text>
      <View className="flex-row flex-wrap mb-4">
        {BLOOD_GROUPS.map((b) => (
          <Pressable
            key={b}
            onPress={() => setBloodGroup(bloodGroup === b ? "" : b)}
            className={`w-16 py-2 rounded-xl border mr-2 mb-2 items-center ${
              bloodGroup === b ? "bg-danger/20 border-danger" : "bg-white/5 border-white/10"
            }`}
          >
            <Text className={`font-bold ${bloodGroup === b ? "text-red-300" : "text-white/70"}`}>{b}</Text>
          </Pressable>
        ))}
      </View>

      <TextField
        label="Medical Notes"
        icon={LifeBuoy}
        placeholder="Allergies, conditions, medication…"
        value={medicalNotes}
        onChangeText={setMedicalNotes}
        multiline
        maxLength={300}
        hint="Shared with the helper who responds to your SOS."
      />

      <Button label="SAVE CHANGES" onPress={save} loading={saving} disabled={!valid} className="mt-2" />
    </Screen>
  );
}
