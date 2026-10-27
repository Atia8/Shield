import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { doc, setDoc, updateDoc } from "firebase/firestore";
import { userDoc } from "@/features/auth/api";
import { config } from "@/lib/config";
import { db } from "@/lib/firebase";

export type PhotoSlot = "nidFront" | "nidBack" | "selfie";

export const PHOTO_SLOTS: { slot: PhotoSlot; title: string; hint: string; camera: boolean }[] = [
  { slot: "nidFront", title: "ID card — front", hint: "National ID, passport or driving licence", camera: false },
  { slot: "nidBack", title: "ID card — back", hint: "Make sure all text is readable", camera: false },
  { slot: "selfie", title: "Live selfie", hint: "Face the camera in good light", camera: true },
];

/**
 * Picks (or captures) a photo and shrinks it to a small JPEG data URI.
 * Photos are kept small enough to live in one Firestore document, so no
 * Cloud Storage bucket is needed.
 */
export async function pickPhoto(fromCamera: boolean): Promise<string | null> {
  const permission = fromCamera
    ? await ImagePicker.requestCameraPermissionsAsync()
    : await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    throw new Error(fromCamera ? "Camera permission is needed for the selfie." : "Photo access is needed to pick your ID.");
  }

  const options: ImagePicker.ImagePickerOptions = {
    mediaTypes: ["images"],
    quality: 0.8,
    allowsEditing: !fromCamera,
    cameraType: ImagePicker.CameraType.front,
  };
  const result = fromCamera
    ? await ImagePicker.launchCameraAsync(options)
    : await ImagePicker.launchImageLibraryAsync(options);
  if (result.canceled || !result.assets[0]) return null;

  const rendered = await ImageManipulator.manipulate(result.assets[0].uri).resize({ width: 640 }).renderAsync();
  const saved = await rendered.saveAsync({ format: SaveFormat.JPEG, compress: 0.5, base64: true });
  if (!saved.base64) throw new Error("Couldn't process that photo. Try another one.");
  return `data:image/jpeg;base64,${saved.base64}`;
}

export async function submitVerification(uid: string, photos: Record<PhotoSlot, string>) {
  const now = Date.now();
  await setDoc(doc(db, "verifications", uid), {
    userId: uid,
    ...photos,
    status: "pending",
    note: "",
    submittedAt: now,
  });
  await updateDoc(userDoc(uid), { verificationStatus: "pending", verificationNote: "", updatedAt: now });

  if (config.demoAutoVerify) {
    // Demo mode only: stands in for the admin review step.
    await updateDoc(doc(db, "verifications", uid), { status: "approved", decidedAt: Date.now() });
    await updateDoc(userDoc(uid), { verificationStatus: "approved", isHelperVerified: true });
  }
}
