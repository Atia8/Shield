import { useLocalSearchParams } from "expo-router";
import { Send, ShieldAlert } from "lucide-react-native";
import { useRef, useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { EmptyState, ErrorBanner } from "@/components/ui/Card";
import { Header } from "@/components/ui/Header";
import { Screen } from "@/components/ui/Screen";
import { useToast } from "@/components/ui/Toast";
import { useCurrentUser } from "@/features/auth/AuthProvider";
import { isOpen, useAlert } from "@/features/sos/api";
import { clockTime, errorMessage } from "@/lib/format";
import { colors } from "@/theme/colors";
import { MAX_MESSAGE_LENGTH, QUICK_REPLIES, sendMessage, useMessages } from "./api";

/** Chat between the person who raised an SOS and the helper who accepted it. */
export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const user = useCurrentUser();
  const toast = useToast();
  const { alert } = useAlert(id);
  const { messages, loading, error } = useMessages(id);
  const [text, setText] = useState("");
  const scrollRef = useRef<ScrollView>(null);

  const isRequester = alert?.userId === user.id;
  const otherName = isRequester ? (alert?.acceptedByName ?? "Helper") : (alert?.userName ?? "Person in need");
  const closed = alert ? !isOpen(alert) : false;

  const send = async (body?: string) => {
    const value = (body ?? text).trim();
    if (!value || !id) return;
    if (!body) setText("");
    try {
      await sendMessage(id, user, value);
    } catch (e) {
      toast(errorMessage(e), "error");
    }
  };

  return (
    <Screen
      scroll={false}
      padded={false}
      header={<Header title={otherName} subtitle={closed ? "Alert ended" : "SOS chat · live"} subtitleColor={closed ? colors.faint : colors.brand} back />}
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
          contentContainerStyle={{ paddingVertical: 16, flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="flex-row items-center bg-warn/10 border border-warn/20 rounded-2xl p-3 mb-3">
            <ShieldAlert color={colors.warn} size={16} />
            <Text className="text-white/75 text-xs ml-2 flex-1 leading-4">
              Never share passwords or money. If anyone is in danger, call 999.
            </Text>
          </View>
          {error ? <ErrorBanner message={errorMessage({ code: "permission-denied" }, error)} /> : null}
          {loading ? (
            <ActivityIndicator color={colors.brand} style={{ marginTop: 30 }} />
          ) : messages.length === 0 ? (
            <EmptyState icon={Send} title="No messages yet" message="Use a quick reply below or type a message." />
          ) : (
            messages.map((m) => {
              const mine = m.senderId === user.id;
              return (
                <View key={m.id} className={`my-1 flex-row ${mine ? "justify-end" : "justify-start"}`}>
                  <View
                    className={`max-w-[80%] px-4 py-2.5 rounded-3xl ${
                      mine ? "bg-brand rounded-br-md" : "bg-white/10 border border-white/15 rounded-bl-md"
                    }`}
                  >
                    {!mine ? <Text className="text-white/50 text-[11px] font-bold mb-0.5">{m.senderName}</Text> : null}
                    <Text style={{ color: mine ? colors.ink : colors.text }} className="text-sm leading-5">
                      {m.text}
                    </Text>
                    <Text style={{ color: mine ? "rgba(11,15,26,0.6)" : colors.faint }} className="text-[10px] mt-1 text-right">
                      {clockTime(m.createdAt)}
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>

        {!closed ? (
          <>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="flex-grow-0"
              contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 8 }}
              keyboardShouldPersistTaps="handled"
            >
              {(isRequester ? QUICK_REPLIES.user : QUICK_REPLIES.helper).map((q) => (
                <Pressable key={q} onPress={() => send(q)} className="bg-white/10 border border-white/15 px-4 py-2.5 rounded-full mr-2">
                  <Text className="text-white text-xs font-bold">{q}</Text>
                </Pressable>
              ))}
            </ScrollView>
            <View className="px-5 py-3 border-t border-white/10 flex-row items-center">
              <TextInput
                className="flex-1 bg-white/5 border border-white/15 rounded-2xl px-4 py-3 text-white text-sm mr-3"
                placeholder="Message…"
                placeholderTextColor={colors.placeholder}
                value={text}
                onChangeText={setText}
                onSubmitEditing={() => send()}
                returnKeyType="send"
                maxLength={MAX_MESSAGE_LENGTH}
                style={{ outlineStyle: "none" } as object}
              />
              <Pressable
                onPress={() => send()}
                disabled={!text.trim()}
                accessibilityLabel="Send message"
                className={`w-12 h-12 rounded-2xl items-center justify-center ${text.trim() ? "bg-brand" : "bg-white/10"}`}
              >
                <Send color={text.trim() ? colors.ink : colors.placeholder} size={20} />
              </Pressable>
            </View>
          </>
        ) : (
          <Text className="text-white/40 text-center text-xs py-4">This alert has ended. The chat is read-only.</Text>
        )}
      </KeyboardAvoidingView>
    </Screen>
  );
}
