import { addDoc, collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import type { AppUser, ChatMessage } from "@/types/models";

const messagesCol = (alertId: string) => collection(db, "alerts", alertId, "messages");

export const MAX_MESSAGE_LENGTH = 500;

/** Live chat between the person in trouble and the helper who accepted. */
export function useMessages(alertId: string | undefined) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!alertId) return;
    return onSnapshot(
      query(messagesCol(alertId), orderBy("createdAt", "asc")),
      (snap) => {
        setMessages(
          snap.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              senderId: data.senderId,
              senderName: data.senderName ?? "",
              text: data.text ?? "",
              createdAt: data.createdAt ?? 0,
            };
          }),
        );
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      },
    );
  }, [alertId]);

  return { messages, loading, error };
}

export function sendMessage(alertId: string, sender: AppUser, text: string) {
  const body = text.trim().slice(0, MAX_MESSAGE_LENGTH);
  if (!body) return Promise.resolve();
  return addDoc(messagesCol(alertId), {
    senderId: sender.id,
    senderName: sender.name,
    text: body,
    createdAt: Date.now(),
  });
}

/** Canned replies so nobody has to type during an emergency. */
export const QUICK_REPLIES = {
  user: ["Please hurry", "I'm hiding", "I can't talk", "I'm safe now"],
  helper: ["I'm on my way", "I'm close", "Stay where you are", "Call 999 if you can"],
};
