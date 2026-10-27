import { Image } from "expo-image";
import { router } from "expo-router";
import { BadgeCheck, Camera, Clock, IdCard, Image as ImageIcon, Lock, ScanFace, TriangleAlert } from "lucide-react-native";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Button } from "@/components/ui/Button";
import { Card, ErrorBanner } from "@/components/ui/Card";
import { Header } from "@/components/ui/Header";
import { Screen } from "@/components/ui/Screen";
import { useToast } from "@/components/ui/Toast";
import { useCurrentUser } from "@/features/auth/AuthProvider";
import { config } from "@/lib/config";
import { errorMessage } from "@/lib/format";
import { colors } from "@/theme/colors";
import { PHOTO_SLOTS, pickPhoto, submitVerification, type PhotoSlot } from "./api";

export default function VerificationScreen() {
  const user = useCurrentUser();
  const toast = useToast();
  const [photos, setPhotos] = useState<Partial<Record<PhotoSlot, string>>>({});
  const [busySlot, setBusySlot] = useState<PhotoSlot | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resubmit, setResubmit] = useState(false);

  const status = user.isHelperVerified ? "approved" : user.verificationStatus;
  const complete = PHOTO_SLOTS.every((s) => photos[s.slot]);

  const pick = async (slot: PhotoSlot, camera: boolean) => {
    setBusySlot(slot);
    setError(null);
    try {
      const uri = await pickPhoto(camera);
      if (uri) setPhotos((p) => ({ ...p, [slot]: uri }));
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusySlot(null);
    }
  };

  const submit = async () => {
    if (!complete) return;
    setSubmitting(true);
    setError(null);
    try {
      await submitVerification(user.id, photos as Record<PhotoSlot, string>);
      toast(config.demoAutoVerify ? "You're verified! You can now accept alerts." : "Submitted. We'll review it soon.");
      router.back();
    } catch (e) {
      setError(errorMessage(e));
      setSubmitting(false);
    }
  };

  if ((status === "approved" || status === "pending") && !resubmit) {
    const approved = status === "approved";
    return (
      <Screen header={<Header title="Helper Verification" back />}>
        <View className="items-center py-8">
          <View
            className="w-24 h-24 rounded-full items-center justify-center mb-5 border"
            style={{
              backgroundColor: approved ? "rgba(16,185,129,0.15)" : "rgba(245,158,11,0.15)",
              borderColor: approved ? colors.brand : colors.warn,
            }}
          >
            {approved ? <BadgeCheck color={colors.brand} size={48} /> : <Clock color={colors.warn} size={48} />}
          </View>
          <Text className="text-white text-2xl font-black text-center">
            {approved ? "You're a verified helper" : "Verification under review"}
          </Text>
          <Text className="text-white/60 text-center mt-2 leading-5 px-4">
            {approved
              ? "You can accept SOS alerts near you. Thank you for keeping your community safe."
              : "An admin is checking your ID and selfie. You'll be able to accept alerts as soon as it's approved."}
          </Text>
        </View>
        {!approved ? (
          <Button label="Resubmit photos" variant="secondary" onPress={() => setResubmit(true)} />
        ) : null}
      </Screen>
    );
  }

  return (
    <Screen header={<Header title="Helper Verification" subtitle="ID + live selfie" back />}>
      {status === "rejected" ? (
        <Card tone={colors.danger} className="mb-4">
          <View className="flex-row items-start">
            <TriangleAlert color={colors.danger} size={18} />
            <Text className="text-white/85 text-sm ml-3 flex-1 leading-5">
              Your last submission was rejected{user.verificationNote ? `: ${user.verificationNote}` : "."} Please
              upload clearer photos.
            </Text>
          </View>
        </Card>
      ) : null}

      <Text className="text-white/70 text-sm leading-5 mb-5">
        People in danger need to trust who's coming. Upload both sides of your national ID (or passport / licence) and
        take a live selfie. An admin compares them before you can accept alerts.
      </Text>

      {error ? <ErrorBanner message={error} /> : null}

      {PHOTO_SLOTS.map(({ slot, title, hint, camera }) => {
        const uri = photos[slot];
        const Icon = slot === "selfie" ? ScanFace : IdCard;
        return (
          <Card key={slot} className="mb-3">
            <View className="flex-row items-center">
              {uri ? (
                <Image source={{ uri }} style={{ width: 64, height: 64, borderRadius: 14 }} contentFit="cover" />
              ) : (
                <View className="w-16 h-16 rounded-2xl bg-white/5 border border-dashed border-white/20 items-center justify-center">
                  <Icon color={colors.faint} size={26} />
                </View>
              )}
              <View className="flex-1 ml-3">
                <Text className="text-white font-bold">{title}</Text>
                <Text className="text-white/50 text-xs mt-0.5">{uri ? "Ready ✓" : hint}</Text>
              </View>
            </View>
            <View className="flex-row mt-3">
              <Pressable
                onPress={() => pick(slot, true)}
                disabled={busySlot !== null}
                className="flex-1 mr-2 bg-brand/15 border border-brand/30 rounded-xl py-2.5 flex-row items-center justify-center"
              >
                <Camera color={colors.brand} size={16} />
                <Text className="text-brand font-bold ml-2 text-sm">{busySlot === slot ? "Processing…" : "Camera"}</Text>
              </Pressable>
              {!camera ? (
                <Pressable
                  onPress={() => pick(slot, false)}
                  disabled={busySlot !== null}
                  className="flex-1 ml-2 bg-white/5 border border-white/10 rounded-xl py-2.5 flex-row items-center justify-center"
                >
                  <ImageIcon color="white" size={16} />
                  <Text className="text-white font-bold ml-2 text-sm">Gallery</Text>
                </Pressable>
              ) : null}
            </View>
          </Card>
        );
      })}

      <View className="flex-row items-start mt-2 mb-5">
        <Lock color={colors.faint} size={14} style={{ marginTop: 2 }} />
        <Text className="text-white/45 text-xs ml-2 flex-1 leading-4">
          Photos are compressed and visible only to you and Shield admins. They're used for verification only.
        </Text>
      </View>

      <Button label="SUBMIT FOR REVIEW" onPress={submit} loading={submitting} disabled={!complete} />
    </Screen>
  );
}
