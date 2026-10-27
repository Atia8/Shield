import { Phone } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";
import { Card, SectionTitle } from "@/components/ui/Card";
import { Header } from "@/components/ui/Header";
import { Screen } from "@/components/ui/Screen";
import { EMERGENCY_HOTLINES } from "@/lib/config";
import { callNumber } from "@/lib/dialogs";
import { colors } from "@/theme/colors";

const FAQ = [
  {
    q: "What happens when I press SOS?",
    a: "You get a short countdown to cancel. Then Shield creates an alert that verified helpers nearby can see and accept, and opens a text with your location to all your trusted contacts. Your live location keeps updating until you mark yourself safe.",
  },
  {
    q: "Does it work without internet?",
    a: "Texting your contacts uses your phone's SMS, which works without mobile data. Alerts to helpers are queued and sent as soon as you're back online.",
  },
  {
    q: "Who can be a helper?",
    a: "Anyone, of any gender. Helpers verify their identity with an ID card and a live selfie before they can accept alerts.",
  },
  {
    q: "What is a timed check-in?",
    a: "Set a timer before a walk or ride. If you don't tap “I'm safe” before it ends, Shield asks if you're OK and sends an SOS if you don't answer.",
  },
  {
    q: "How do fall and shake detection work?",
    a: "While Shield is open, it watches the motion sensor. A hard fall, or shaking the phone hard four times, opens the SOS countdown, so you can still cancel.",
  },
];

export default function HelpScreen() {
  return (
    <Screen header={<Header title="Help & Support" subtitle="Emergency numbers and FAQ" back />}>
      <Text className="text-white font-extrabold text-lg mb-3">Emergency hotlines (Bangladesh)</Text>
      {EMERGENCY_HOTLINES.map((h) => (
        <Pressable
          key={h.number}
          onPress={() => callNumber(h.number)}
          className="flex-row items-center bg-white/5 border border-white/10 rounded-2xl p-4 mb-2.5"
          style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
        >
          <View className="flex-1">
            <Text className="text-white font-bold">{h.name}</Text>
            <Text className="text-white/50 text-xs mt-0.5">{h.detail}</Text>
          </View>
          <View className="flex-row items-center bg-danger/15 border border-danger/30 rounded-full px-3 py-1.5">
            <Phone color={colors.danger} size={14} />
            <Text className="text-red-300 font-black ml-1.5">{h.number}</Text>
          </View>
        </Pressable>
      ))}

      <SectionTitle title="Frequently asked questions" />
      {FAQ.map((item) => (
        <Card key={item.q} className="mb-3">
          <Text className="text-white font-bold mb-1.5">{item.q}</Text>
          <Text className="text-white/65 text-sm leading-5">{item.a}</Text>
        </Card>
      ))}
    </Screen>
  );
}
