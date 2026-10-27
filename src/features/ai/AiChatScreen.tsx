import { router } from "expo-router";
import { Bot, Lightbulb, Send, Siren } from "lucide-react-native";
import { useRef, useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { Header } from "@/components/ui/Header";
import { Screen } from "@/components/ui/Screen";
import { useAuth } from "@/features/auth/AuthProvider";
import { config } from "@/lib/config";
import { clockTime, firstName } from "@/lib/format";
import { colors } from "@/theme/colors";
import { askAi, QUICK_QUESTIONS, type AiMessage } from "./api";

export default function AiChatScreen() {
  const { user, mode } = useAuth();
  const scrollRef = useRef<ScrollView>(null);
  const [messages, setMessages] = useState<AiMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      text: `Hi${user ? ` ${firstName(user.name)}` : ""}! I'm Shield AI, your safety companion. Ask me what to do in an unsafe situation, or how to stay safe on your way.${
        mode === "helper" ? " I can also guide you while you respond to someone in need." : ""
      }`,
      createdAt: Date.now(),
    },
  ]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);

  const send = async (text?: string) => {
    const body = (text ?? input).trim();
    if (!body || thinking) return;
    const next: AiMessage[] = [...messages, { id: `${Date.now()}`, role: "user", text: body, createdAt: Date.now() }];
    setMessages(next);
    setInput("");
    setThinking(true);
    const reply = await askAi(next.filter((m) => m.id !== "welcome"));
    setMessages((prev) => [...prev, { id: `${Date.now()}-ai`, role: "assistant", text: reply, createdAt: Date.now() }]);
    setThinking(false);
  };

  return (
    <Screen
      scroll={false}
      padded={false}
      header={
        <Header
          title="AI Safety Companion"
          subtitle={config.claudeApiKey ? "Online · powered by Claude" : "Offline guidance mode"}
          left={
            <View className="w-11 h-11 rounded-2xl bg-accent/20 items-center justify-center border border-accent/40 mr-3">
              <Bot color={colors.accent} size={24} />
            </View>
          }
          right={
            mode === "user" ? (
              <Pressable
                onPress={() => router.push({ pathname: "/sos", params: { reason: "manual" } })}
                accessibilityLabel="Send SOS"
                className="bg-danger rounded-full px-3.5 py-2 flex-row items-center"
              >
                <Siren color="white" size={14} />
                <Text className="text-white font-black text-xs ml-1">SOS</Text>
              </Pressable>
            ) : null
          }
        />
      }
    >
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <ScrollView
          ref={scrollRef}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
          className="flex-1 px-5"
          contentContainerStyle={{ paddingVertical: 16 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="bg-warn/10 border border-warn/20 rounded-2xl p-3.5 flex-row items-center mb-3">
            <Lightbulb color={colors.warn} size={18} />
            <Text className="text-white/80 text-xs flex-1 ml-3 leading-4">
              In immediate danger? Press SOS or call {config.emergencyNumber} first. AI advice doesn't replace emergency
              services.
            </Text>
          </View>

          {messages.map((m) => (
            <View key={m.id} className={`my-1.5 flex-row ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              {m.role === "assistant" ? (
                <View className="w-8 h-8 rounded-full bg-accent/20 items-center justify-center border border-accent/30 mr-2 mt-1">
                  <Bot color={colors.accent} size={16} />
                </View>
              ) : null}
              <View
                className={`max-w-[80%] px-4 py-3 rounded-3xl ${
                  m.role === "user" ? "bg-accent rounded-br-md" : "bg-white/10 border border-white/15 rounded-bl-md"
                }`}
              >
                <Text className="text-white text-sm leading-5">{m.text}</Text>
                <Text className={`text-[10px] mt-1.5 text-right ${m.role === "user" ? "text-white/70" : "text-white/40"}`}>
                  {clockTime(m.createdAt)}
                </Text>
              </View>
            </View>
          ))}

          {thinking ? (
            <View className="flex-row items-center my-2">
              <View className="w-8 h-8 rounded-full bg-accent/20 items-center justify-center border border-accent/30 mr-2">
                <Bot color={colors.accent} size={16} />
              </View>
              <View className="bg-white/10 border border-white/15 px-4 py-3 rounded-3xl rounded-bl-md flex-row items-center">
                <ActivityIndicator size="small" color={colors.accent} />
                <Text className="text-white/60 text-xs ml-2">Thinking…</Text>
              </View>
            </View>
          ) : null}
        </ScrollView>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="flex-grow-0"
          contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 8 }}
          keyboardShouldPersistTaps="handled"
        >
          {QUICK_QUESTIONS.map((q) => (
            <Pressable
              key={q}
              onPress={() => send(q)}
              className="bg-white/10 border border-white/15 px-4 py-2.5 rounded-full mr-2"
            >
              <Text className="text-white text-xs font-bold">{q}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <View className="px-5 py-3 border-t border-white/10 flex-row items-center">
          <TextInput
            className="flex-1 bg-white/5 border border-white/15 rounded-2xl px-4 py-3 text-white text-sm mr-3"
            placeholder="Type your message…"
            placeholderTextColor={colors.placeholder}
            value={input}
            onChangeText={setInput}
            onSubmitEditing={() => send()}
            returnKeyType="send"
            maxLength={500}
            style={{ outlineStyle: "none" } as object}
          />
          <Pressable
            onPress={() => send()}
            disabled={!input.trim() || thinking}
            accessibilityLabel="Send message"
            className={`w-12 h-12 rounded-2xl items-center justify-center ${!input.trim() || thinking ? "bg-white/10" : "bg-accent"}`}
          >
            <Send color={!input.trim() || thinking ? colors.placeholder : "white"} size={20} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}
