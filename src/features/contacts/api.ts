import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import { toInternational } from "@/lib/countries";
import { db } from "@/lib/firebase";
import type { TrustedContact } from "@/types/models";

/** Same limit as the Go backend: SMS fan-out stays manageable. */
export const MAX_CONTACTS = 10;

const contactsCol = (uid: string) => collection(db, "users", uid, "contacts");

function normalize(id: string, data: Partial<TrustedContact>): TrustedContact {
  return {
    id,
    name: data.name ?? "Contact",
    phone: data.phone ?? "",
    countryCode: data.countryCode ?? "",
    relation: data.relation ?? "",
    email: data.email ?? "",
    createdAt: data.createdAt ?? 0,
  };
}

/** Number to dial / text. Legacy SheShield contacts stored a raw string. */
export function contactNumber(c: TrustedContact): string {
  return c.countryCode ? toInternational(c.phone, c.countryCode) : c.phone;
}

export function useContacts(uid: string | undefined) {
  const [contacts, setContacts] = useState<TrustedContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!uid) return;
    setLoading(true);
    return onSnapshot(
      query(contactsCol(uid), orderBy("createdAt", "desc")),
      (snap) => {
        setContacts(snap.docs.map((d) => normalize(d.id, d.data())));
        setError(null);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      },
    );
  }, [uid]);

  return { contacts, loading, error };
}

/** One-shot read used by the SOS path (served from cache when offline). */
export async function fetchContacts(uid: string): Promise<TrustedContact[]> {
  const snap = await getDocs(contactsCol(uid));
  return snap.docs.map((d) => normalize(d.id, d.data()));
}

export interface NewContact {
  name: string;
  phone: string;
  countryCode: string;
  relation?: string;
  email?: string;
}

export async function addContact(uid: string, input: NewContact, existing: TrustedContact[]) {
  if (existing.length >= MAX_CONTACTS) {
    throw new Error(`You can add up to ${MAX_CONTACTS} trusted contacts.`);
  }
  const number = toInternational(input.phone, input.countryCode);
  if (existing.some((c) => contactNumber(c) === number)) {
    throw new Error("This number is already one of your trusted contacts.");
  }
  await addDoc(contactsCol(uid), {
    name: input.name.trim(),
    phone: input.phone,
    countryCode: input.countryCode,
    relation: input.relation?.trim() ?? "",
    email: input.email?.trim().toLowerCase() ?? "",
    createdAt: Date.now(),
  });
}

export function removeContact(uid: string, contactId: string) {
  return deleteDoc(doc(db, "users", uid, "contacts", contactId));
}
