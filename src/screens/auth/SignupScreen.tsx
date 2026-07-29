import React, { useState } from "react";
import {
  Alert,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, Check, Eye, EyeOff, Smartphone } from "lucide-react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../../firebase/firebase";

// Custom Dark Mode Input Component
function DarkInput({
  label,
  placeholder,
  value,
  onChange,
  secure,
  right,
  keyboardType = "default",
  autoCapitalize = "none",
  errorMessage,
  maxLength,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (text: string) => void;
  secure?: boolean;
  right?: React.ReactNode;
  keyboardType?: "default" | "email-address" | "phone-pad";
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  errorMessage?: string;
  maxLength?: number;
}) {
  return (
    <View className="mb-4">
      <Text className="text-sm font-semibold text-white/90 mb-2">{label}</Text>
      <View
        className={`flex-row items-center border rounded-xl px-4 py-3 ${
          errorMessage 
            ? "border-red-500 bg-red-500/10" 
            : "border-white/10 bg-[#161B2E]" // Solid dark hex guarantees no white-box web bugs
        }`}
      >
        <TextInput
          className="flex-1 text-[15px] text-white"
          placeholder={placeholder}
          placeholderTextColor="#717171"
          value={value}
          onChangeText={onChange}
          secureTextEntry={secure}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          maxLength={maxLength}
          style={{ outlineStyle: 'none' } as any} // Removes the blue web focus ring
        />
        {right}
      </View>
      {errorMessage ? (
        <Text className="text-red-400 text-xs mt-1 ml-1 font-medium">
          {errorMessage}
        </Text>
      ) : null}
    </View>
  );
}

export default function SignupScreen() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  const [gender, setGender] = useState("female");
  const [userType, setUserType] = useState("user");

  const [showPass, setShowPass] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);

  const progress = step === 1 ? 50 : 100;

  const handleNext = () => {
    if (!name.trim() || !email.trim() || phone.trim().length !== 11) {
      Alert.alert("Invalid Input", "Please ensure your name, email, and 11-digit phone number are correct.");
      return;
    }
    setStep(2);
  };

  const handleSignup = async () => {
    if (password.length < 8 || !agreed) return;

    try {
      setLoading(true);
      // Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );
      const uid = userCredential.user.uid;

      // Firestore user profile
      await setDoc(doc(db, "users", uid), {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        address: "",
        gender: gender,
        helperLevel: 0,
        isHelperVerified: false,
        userType: userType,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      // Route immediately on success
      router.replace("/home");
      
    } catch (error: any) {
      Alert.alert("Signup Failed", error.message);
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-[#0B0F1A]">
      {/* Absolute Background Gradient ensures it fills the entire web browser */}
      <LinearGradient
        colors={["#0B0F1A", "#1E1B4B"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView className="flex-1">
        {/* CENTER CONSTRAINT: Prevents the UI from stretching aggressively on Web */}
        <View className="flex-1 w-full max-w-md self-center">
          
          {/* HEADER */}
          <View className="px-6 pt-6 pb-4">
            <TouchableOpacity
              onPress={() => {
                if (step === 2) {
                  setStep(1);
                } else {
                  router.back();
                }
              }}
              className="w-10 h-10 rounded-full bg-white/5 border border-white/10 items-center justify-center mb-6"
            >
              <ArrowLeft size={18} color="white" />
            </TouchableOpacity>

            <View className="mb-4">
              <View className="flex-row justify-between mb-2">
                <Text className="text-xs font-bold text-[#10B981]">
                  STEP {step} OF 2
                </Text>
                <Text className="text-xs font-bold text-[#10B981]">
                  {progress}%
                </Text>
              </View>
              <View className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <LinearGradient
                  colors={["#0D9488", "#10B981"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  className="h-full rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </View>
            </View>

            {step === 1 ? (
              <View>
                <Text className="text-3xl font-black text-white">
                  Create Account
                </Text>
                <Text className="text-white/60 text-base mt-1">
                  Join SheShield — personal safety for everyone
                </Text>
              </View>
            ) : (
              <View>
                <Text className="text-3xl font-black text-white">
                  Security & Role
                </Text>
                <Text className="text-white/60 text-base mt-1">
                  Configure how you want to use SheShield
                </Text>
              </View>
            )}
          </View>

          {/* flexGrow: 1 ensures the ScrollView fills the space so the button doesn't vanish */}
          <ScrollView 
            className="flex-1 px-6" 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}
          >
            {step === 1 && (
              <View className="pt-2 flex-1 justify-between">
                <View>
                  <DarkInput
                    label="Full Name"
                    placeholder="Emma Johnson"
                    value={name}
                    onChange={setName}
                    autoCapitalize="words"
                  />
                  <DarkInput
                    label="Email Address"
                    placeholder="you@example.com"
                    value={email}
                    onChange={setEmail}
                    keyboardType="email-address"
                  />
                  <DarkInput
                    label="Phone Number"
                    placeholder="01XXXXXXXXX"
                    value={phone}
                    maxLength={11}
                    onChange={(text) => setPhone(text.replace(/[^0-9]/g, ''))} // Forces numbers only
                    keyboardType="phone-pad"
                    errorMessage={
                      phone.length > 0 && phone.length !== 11
                        ? "Phone number must be exactly 11 digits"
                        : undefined
                    }
                    right={<Smartphone size={16} color="#717171" />}
                  />
                </View>

                <View className="mt-8">
                  <TouchableOpacity
                    onPress={handleNext}
                    disabled={!name || !email || phone.length !== 11}
                    className="w-full rounded-2xl shadow-lg"
                  >
                    <LinearGradient
                      colors={
                        !name || !email || phone.length !== 11
                          ? ["#334155", "#334155"]
                          : ["#0D9488", "#10B981"]
                      }
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      className="w-full py-4 items-center rounded-2xl"
                    >
                      <Text
                        className={`font-bold text-lg ${
                          !name || !email || phone.length !== 11
                            ? "text-white/40"
                            : "text-white"
                        }`}
                      >
                        Continue
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>

                  <View className="flex-row justify-center mt-6 mb-2">
                    <Text className="text-white/60">Already have an account? </Text>
                    <TouchableOpacity onPress={() => router.push("/login")}>
                      <Text className="font-bold underline ml-1 text-white">
                        Log in
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}

            {step === 2 && (
              <View className="pt-2 flex-1 justify-between">
                <View>
                  {/* User Info Preview Card */}
                  <View className="flex-row items-center bg-[#161B2E] border border-white/10 rounded-2xl px-4 py-3 mb-6 shadow-sm">
                    <View className="w-11 h-11 rounded-full bg-[#10B981]/20 border border-[#10B981]/30 items-center justify-center">
                      <Text className="text-[#10B981] font-black text-lg">
                        {name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View className="ml-3 flex-1">
                      <Text className="font-bold text-white text-base">{name}</Text>
                      <Text className="text-xs text-white/60">{email}</Text>
                    </View>
                    <TouchableOpacity className="ml-auto" onPress={() => setStep(1)}>
                      <Text className="text-xs font-bold text-[#10B981]">EDIT</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Select Gender */}
                  <View className="mb-6">
                    <Text className="text-sm font-semibold text-white/90 mb-3">
                      Gender Identity
                    </Text>
                    <View className="flex-row gap-3">
                      {["female", "male", "other"].map((g) => (
                        <TouchableOpacity
                          key={g}
                          onPress={() => setGender(g)}
                          className={`flex-1 h-12 rounded-xl items-center justify-center border ${
                            gender === g
                              ? "border-[#10B981] bg-[#10B981]/15"
                              : "border-white/10 bg-[#161B2E]"
                          }`}
                        >
                          <Text
                            className={`font-semibold capitalize ${
                              gender === g ? "text-[#10B981]" : "text-white/60"
                            }`}
                          >
                            {g}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {/* Select User Role */}
                  <View className="mb-6">
                    <Text className="text-sm font-semibold text-white/90 mb-3">
                      How will you use Shield?
                    </Text>
                    <View className="border border-white/10 rounded-2xl overflow-hidden bg-[#161B2E]">
                      {[
                        { id: "user", label: "User (Need Help)" },
                        { id: "helper", label: "Responder (Helper Only)" },
                        { id: "user_helper", label: "Both Roles" },
                      ].map((r, i) => (
                        <TouchableOpacity
                          key={r.id}
                          onPress={() => setUserType(r.id)}
                          className={`p-4 border-b border-white/5 flex-row items-center justify-between ${
                            userType === r.id ? "bg-[#10B981]/15" : ""
                          }`}
                        >
                          <Text
                            className={`font-semibold ${
                              userType === r.id ? "text-[#10B981]" : "text-white/80"
                            }`}
                          >
                            {r.label}
                          </Text>
                          {userType === r.id && (
                            <Check size={18} color="#10B981" />
                          )}
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  <DarkInput
                    label="Create Password"
                    placeholder="Min. 8 characters"
                    value={password}
                    onChange={setPassword}
                    secure={!showPass}
                    errorMessage={
                      password.length > 0 && password.length < 8
                        ? "Password must be at least 8 characters"
                        : undefined
                    }
                    right={
                      <TouchableOpacity onPress={() => setShowPass(!showPass)}>
                        {showPass ? (
                          <EyeOff size={18} color="#717171" />
                        ) : (
                          <Eye size={18} color="#717171" />
                        )}
                      </TouchableOpacity>
                    }
                  />

                  <TouchableOpacity
                    className="flex-row items-start mt-2 mb-8"
                    onPress={() => setAgreed(!agreed)}
                  >
                    <View
                      className={`w-5 h-5 rounded-md border mr-3 items-center justify-center ${
                        agreed
                          ? "bg-[#10B981] border-[#10B981]"
                          : "border-white/30 bg-transparent"
                      }`}
                    >
                      {agreed && <Check size={14} color="#0B0F1A" strokeWidth={3} />}
                    </View>
                    <Text className="flex-1 text-sm text-white/60">
                      I agree to Shield's Terms of Service and Privacy Policy
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Submit Button anchored to the bottom */}
                <TouchableOpacity
                  onPress={handleSignup}
                  disabled={loading || password.length < 8 || !agreed}
                  className="w-full rounded-2xl shadow-lg mt-4"
                >
                  <LinearGradient
                    colors={
                      password.length < 8 || !agreed
                        ? ["#334155", "#334155"]
                        : ["#0D9488", "#10B981"]
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    className="w-full py-4 items-center rounded-2xl"
                  >
                    {loading ? (
                      <ActivityIndicator color="white" />
                    ) : (
                      <Text
                        className={`font-bold text-lg ${
                          password.length < 8 || !agreed
                            ? "text-white/40"
                            : "text-white"
                        }`}
                      >
                        Create Account
                      </Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </View>
      </SafeAreaView>
    </View>
  );
}