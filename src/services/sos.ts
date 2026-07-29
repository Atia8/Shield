import * as Location from "expo-location";
import {
    addDoc,
    collection,
    getDocs,
    serverTimestamp,
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { auth, db, functions } from "../firebase/firebase";

export async function triggerEmergencyAlert() {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");

  const userId = user.uid;
  let userName =
    user.displayName || user.email?.split("@")[0] || "SheShield User";

  // 1. Get User Location (Equivalent to getLocation in Kotlin)
  let locationData = {
    latitude: 0,
    longitude: 0,
    address: "Location unavailable",
  };
  const { status } = await Location.requestForegroundPermissionsAsync();

  if (status === "granted") {
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });
    locationData = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      address: `http://googleusercontent.com/maps.google.com/?q=${location.coords.latitude},${location.coords.longitude}`,
    };
  }

  // 2. Fetch Trusted Contacts
  const contactsRef = collection(db, "users", userId, "contacts");
  const contactsSnapshot = await getDocs(contactsRef);
  const contacts = contactsSnapshot.docs.map((doc) => doc.data());

  if (contacts.length === 0) {
    throw new Error("No emergency contacts found. Please add contacts first.");
  }

  const timestamp = new Date().toLocaleString();

  // 3. Save to Firestore (Global Alerts for Helpers + Private History)
  const globalAlertData = {
    userId: userId,
    userName: userName,
    description: `SOS Alert triggered! Location: ${locationData.address}`,
    riskLevel: "high",
    status: "active",
    alertType: "SOS",
    timestamp: Date.now(),
    senderId: userId,
    locationString: locationData.address,
    location: locationData,
  };

  const personalSosData = {
    status: "ACTIVE",
    userName: userName,
    location: locationData.address,
    createdAt: serverTimestamp(),
    contacts: contacts.map((c) => ({
      name: c.name,
      phone: c.phone,
      email: c.email,
    })),
  };

  await addDoc(collection(db, "alerts"), globalAlertData);
  await addDoc(collection(db, "users", userId, "sos_alerts"), personalSosData);

  // 4. Trigger Cloud Functions (Emails & Push Notifications)
  const sendEmails = httpsCallable(functions, "sendSOSEmails");
  const sendPush = httpsCallable(functions, "sendSOSNotification");

  // Fire email function asynchronously
  sendEmails({
    userName,
    location: locationData.address,
    timestamp,
    contacts: contacts.filter((c) => c.email),
  }).catch((err) => console.error("Email failed:", err));

  // Fire push notification function asynchronously
  contacts.forEach((contact) => {
    if (contact.fcmToken) {
      sendPush({
        token: contact.fcmToken,
        title: "🚨 EMERGENCY ALERT",
        body: `${userName} needs immediate help!`,
        senderName: userName,
        location: locationData.address,
      }).catch((err) => console.error("Push failed:", err));
    }
  });

  return { success: true, contactsNotified: contacts.length };
}
