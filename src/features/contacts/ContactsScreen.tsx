import { Heart, MessageSquare, Phone, Plus, Trash2, User, UserPlus, Users, X } from "lucide-react-native";
import { useState } from "react";
import { Linking, Pressable, Text, View } from "react-native";
import { Button } from "@/components/ui/Button";
import { Avatar, Card, EmptyState, ErrorBanner, LoadingView, Pill } from "@/components/ui/Card";
import { Header } from "@/components/ui/Header";
import { PhoneField } from "@/components/ui/PhoneField";
import { Screen } from "@/components/ui/Screen";
import { TextField } from "@/components/ui/TextField";
import { useToast } from "@/components/ui/Toast";
import { useCurrentUser } from "@/features/auth/AuthProvider";
import { DEFAULT_COUNTRY, findCountry, isValidPhone } from "@/lib/countries";
import { callNumber, confirm } from "@/lib/dialogs";
import { errorMessage } from "@/lib/format";
import { colors } from "@/theme/colors";
import { addContact, contactNumber, MAX_CONTACTS, removeContact, useContacts } from "./api";
import { AutoTextCard } from "./AutoTextCard";

const RELATIONS = ["Family", "Friend", "Partner", "Colleague", "Neighbour"];

export default function ContactsScreen() {
  const user = useCurrentUser();
  const toast = useToast();
  const { contacts, loading, error } = useContacts(user.id);
  const [showForm, setShowForm] = useState(false);

  const [name, setName] = useState("");
  const [relation, setRelation] = useState("");
  const [country, setCountry] = useState(findCountry(user.countryCode) ?? DEFAULT_COUNTRY);
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const valid = name.trim().length >= 2 && isValidPhone(phone, country);
  const full = contacts.length >= MAX_CONTACTS;

  const resetForm = () => {
    setName("");
    setRelation("");
    setPhone("");
    setFormError(null);
  };

  const save = async () => {
    if (!valid) return;
    setSaving(true);
    setFormError(null);
    try {
      await addContact(user.id, { name, phone, countryCode: country.dial, relation }, contacts);
      toast(`${name.trim()} added as a trusted contact`);
      resetForm();
      setShowForm(false);
    } catch (e) {
      setFormError(errorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string, contactName: string) => {
    const ok = await confirm("Remove contact", `Remove ${contactName} from your trusted contacts?`, "Remove", true);
    if (!ok) return;
    try {
      await removeContact(user.id, id);
      toast(`${contactName} removed`, "info");
    } catch (e) {
      toast(errorMessage(e), "error");
    }
  };

  return (
    <Screen
      keyboard
      header={
        <Header
          title="Trusted Contacts"
          subtitle={`${contacts.length} of ${MAX_CONTACTS} guardians`}
          right={
            <Pressable
              onPress={() => {
                resetForm();
                setShowForm(!showForm);
              }}
              disabled={full && !showForm}
              accessibilityLabel={showForm ? "Close form" : "Add contact"}
              className="w-11 h-11 rounded-full bg-accent items-center justify-center"
              style={{ opacity: full && !showForm ? 0.4 : 1 }}
            >
              {showForm ? <X color="white" size={20} /> : <Plus color="white" size={22} />}
            </Pressable>
          }
        />
      }
    >
      <Card tone={colors.accent} className="mb-5">
        <View className="flex-row">
          <Heart color={colors.accent} size={22} />
          <View className="ml-3 flex-1">
            <Text className="text-white font-bold text-base mb-1">How it works</Text>
            <Text className="text-white/70 text-xs leading-5">
              When you send an SOS, these people get a text from your phone with your location. It works even
              without mobile data.
            </Text>
          </View>
        </View>
      </Card>

      <AutoTextCard />

      {showForm ? (
        <Card className="mb-6">
          <Text className="text-white font-bold text-lg mb-4">New guardian</Text>
          {formError ? <ErrorBanner message={formError} /> : null}
          <TextField label="Full Name" icon={User} placeholder="Contact's name" value={name} onChangeText={setName} autoCapitalize="words" />
          <PhoneField country={country} onCountryChange={setCountry} phone={phone} onPhoneChange={setPhone} />
          <Text className="text-sm font-semibold text-white/90 mb-2">Relationship (optional)</Text>
          <View className="flex-row flex-wrap mb-5">
            {RELATIONS.map((r) => (
              <Pressable
                key={r}
                onPress={() => setRelation(relation === r ? "" : r)}
                className={`px-3.5 py-2 rounded-full border mr-2 mb-2 ${
                  relation === r ? "bg-accent border-accent" : "bg-white/5 border-white/10"
                }`}
              >
                <Text className="text-white text-xs font-bold">{r}</Text>
              </Pressable>
            ))}
          </View>
          <Button label="SAVE CONTACT" variant="accent" onPress={save} loading={saving} disabled={!valid} />
        </Card>
      ) : null}

      {error ? <ErrorBanner message={errorMessage({ code: error.includes("permission") ? "permission-denied" : "" }, error)} /> : null}

      {loading ? (
        <LoadingView label="Syncing contacts…" />
      ) : contacts.length === 0 && !showForm ? (
        <EmptyState
          icon={Users}
          title="No trusted contacts yet"
          message="Add family or friends who should be told when you're in danger."
        >
          <Button label="ADD FIRST CONTACT" icon={UserPlus} variant="accent" onPress={() => setShowForm(true)} />
        </EmptyState>
      ) : (
        contacts.map((c) => (
          <Card key={c.id} className="mb-3">
            <View className="flex-row items-center">
              <Avatar name={c.name} color={colors.accent} />
              <View className="ml-3 flex-1 pr-2">
                <Text className="text-white font-bold text-base" numberOfLines={1}>
                  {c.name}
                </Text>
                <Text className="text-white/60 text-xs mt-0.5">{contactNumber(c)}</Text>
                {c.relation ? (
                  <View className="mt-1.5">
                    <Pill label={c.relation} color={colors.accent} />
                  </View>
                ) : null}
              </View>
              <Pressable
                onPress={() => remove(c.id, c.name)}
                accessibilityLabel={`Remove ${c.name}`}
                className="w-10 h-10 items-center justify-center rounded-full bg-danger/15 border border-danger/20"
              >
                <Trash2 color={colors.danger} size={18} />
              </Pressable>
            </View>
            <View className="flex-row mt-4">
              <Pressable
                onPress={() => callNumber(contactNumber(c))}
                className="flex-1 mr-2 bg-brand/15 border border-brand/30 rounded-xl py-3 flex-row items-center justify-center"
              >
                <Phone color={colors.brand} size={16} />
                <Text className="text-brand font-bold ml-2 text-sm">Call</Text>
              </Pressable>
              <Pressable
                onPress={() => Linking.openURL(`sms:${contactNumber(c)}`).catch(() => {})}
                className="flex-1 ml-2 bg-white/5 border border-white/10 rounded-xl py-3 flex-row items-center justify-center"
              >
                <MessageSquare color="white" size={16} />
                <Text className="text-white font-bold ml-2 text-sm">Message</Text>
              </Pressable>
            </View>
          </Card>
        ))
      )}
    </Screen>
  );
}
