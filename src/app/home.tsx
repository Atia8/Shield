import { useRouter } from "expo-router";
import HomeScreen from "../screens/HomePage/HomeScreen";

export default function Home() {
  const router = useRouter();

  return (
    <HomeScreen
      // We will wire these up to actual routes as we build them
      onNavigateToTrackRoute={() => router.push("/track-route")}
      onNavigateToTimedCheckIn={() => router.push("/timed-check-in")}
      onNavigateToResponders={() => router.push("/responders")}
      onNavigateToMovement={() => router.push("/movement")}
    />
  );
}
