import { router } from "expo-router";
import {
  BadgeCheck,
  Droplet,
  HandHeart,
  History,
  IdCard,
  LifeBuoy,
  Lock,
  LogOut,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Shield,
} from "lucide-react-native";
import { useState } from "react";
import { Text, View } from "react-native";
import { Avatar, Card, ListRow, Pill, SectionTitle } from "@/components/ui/Card";
import { Screen } from "@/components/ui/Screen";
import { useToast } from "@/components/ui/Toast";
import { isHelperRole, roleLabel, updateProfile } from "@/features/auth/api";
import { useAuth, useCurrentUser } from "@/features/auth/AuthProvider";
import { ModeSwitch } from "@/features/auth/ModeSwitch";
import { confirm } from "@/lib/dialogs";
import { errorMessage } from "@/lib/format";
import { colors } from "@/theme/colors";

const VERIFICATION_DETAIL = {
  none: "Not submitted. Needed to accept alerts",
  pending: "Under review",
  approved: "Verified helper",
  rejected: "Rejected. Tap to resubmit",
} as const;

export default function ProfileScreen() {
  const user = useCurrentUser();
  const { mode, signOut, setMode } = useAuth();
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  const verified = user.isHelperVerified || user.verificationStatus === "approved";

  const upgrade = async () => {
    const toHelper = user.userType === "user";
    const ok = await confirm(
      toHelper ? "Become a helper?" : "Use Shield protection too?",
      toHelper
        ? "You'll keep all your safety features and can also respond to SOS alerts near you after verifying your ID."
        : "You'll get the SOS button, trusted contacts and safety tools, and can switch modes any time.",
      "Continue",
    );
    if (!ok) return;
    setBusy(true);
    try {
      await updateProfile(user.id, { userType: "user_helper" });
      toast("Your account now has both roles. Switch modes at the top of your profile.");
      if (toHelper) setMode("user");
    } catch (e) {
      toast(errorMessage(e), "error");
    } finally {
      setBusy(false);
    }
  };

  const logOut = async () => {
    const ok = await confirm("Log out?", "You won't be able to send SOS alerts until you log back in.", "Log out", true);
    if (ok) await signOut();
  };

  return (
    <Screen bottomInset={30}>
      <View className="items-center mt-2">
        <Avatar name={user.name} size={88} />
        <Text className="text-white text-2xl font-black mt-3">{user.name}</Text>
        <Text className="text-white/60 text-sm mt-0.5">{user.email}</Text>
        <View className="flex-row mt-3">
          <Pill label={roleLabel(user.userType)} color={colors.accent} />
          {isHelperRole(user.userType) && verified ? (
            <View className="ml-2">
              <Pill label="Verified" icon={BadgeCheck} />
            </View>
          ) : null}
        </View>
      </View>
      <ModeSwitch />

      <SectionTitle title="Personal details" action="Edit" onAction={() => router.push("/edit-profile")} />
      <Card>
        <Detail icon={Phone} label="Phone" value={user.phone ? `${user.countryCode} ${user.phone}` : "Not set"} />
        <Detail icon={Mail} label="Email" value={user.email} />
        <Detail icon={MapPin} label="Address" value={user.address || "Not set"} />
        <Detail icon={Droplet} label="Blood group" value={user.bloodGroup || "Not set"} />
        <Detail icon={LifeBuoy} label="Medical notes" value={user.medicalNotes || "None"} last />
      </Card>
      <Text className="text-white/35 text-[11px] mt-2 ml-1">
        Blood group and medical notes are shared with your helper during an SOS.
      </Text>

      <SectionTitle title="Account" />
      <View className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden">
        <ListRow icon={Pencil} label="Edit profile" onPress={() => router.push("/edit-profile")} />
        {mode === "user" ? (
          <ListRow icon={History} label="My alert history" onPress={() => router.push("/alert-history")} />
        ) : null}
        {isHelperRole(user.userType) ? (
          <ListRow
            icon={IdCard}
            color={verified ? colors.brand : colors.warn}
            label="Helper verification"
            detail={VERIFICATION_DETAIL[user.verificationStatus]}
            onPress={() => router.push("/verification")}
          />
        ) : null}
        {user.userType !== "user_helper" ? (
          <ListRow
            icon={user.userType === "user" ? HandHeart : Shield}
            color={colors.brand}
            label={user.userType === "user" ? "Become a helper" : "Use Shield protection too"}
            detail={user.userType === "user" ? "Help people near you in an emergency" : "Get SOS and safety tools"}
            onPress={busy ? undefined : upgrade}
            last
          />
        ) : null}
      </View>

      <SectionTitle title="Support" />
      <View className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden">
        <ListRow icon={Lock} label="Privacy & permissions" onPress={() => router.push("/privacy")} />
        <ListRow icon={LifeBuoy} label="Help & emergency numbers" onPress={() => router.push("/help")} />
        <ListRow icon={LogOut} label="Log out" destructive onPress={logOut} last />
      </View>

      <Text className="text-white/25 text-xs text-center mt-8">Shield v1.0.0 · Safety for everyone</Text>
    </Screen>
  );
}

function Detail({
  icon: Icon,
  label,
  value,
  last,
}: {
  icon: typeof Phone;
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View className={`flex-row items-start py-2.5 ${last ? "" : "border-b border-white/5"}`}>
      <Icon color={colors.accent} size={17} />
      <Text className="text-white/50 text-sm ml-3 w-28">{label}</Text>
      <Text className="text-white text-sm flex-1 text-right">{value}</Text>
    </View>
  );
}
