import { CircleAlert, CircleCheck, Info } from "lucide-react-native";
import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "@/theme/colors";

type ToastType = "success" | "error" | "info";
interface ToastState {
  message: string;
  type: ToastType;
}

const ToastContext = createContext<(message: string, type?: ToastType) => void>(() => {});

export function useToast() {
  return useContext(ToastContext);
}

const toneFor: Record<ToastType, { bg: string; border: string; Icon: typeof Info }> = {
  success: { bg: colors.brand, border: "#047857", Icon: CircleCheck },
  error: { bg: colors.danger, border: "#B91C1C", Icon: CircleAlert },
  info: { bg: colors.info, border: "#4338CA", Icon: Info },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const insets = useSafeAreaInsets();

  const show = useCallback((message: string, type: ToastType = "success") => {
    if (timer.current) clearTimeout(timer.current);
    setToast({ message, type });
    timer.current = setTimeout(() => setToast(null), 3500);
  }, []);

  const tone = toast ? toneFor[toast.type] : null;

  return (
    <ToastContext.Provider value={show}>
      {children}
      {toast && tone ? (
        <View
          accessibilityLiveRegion="polite"
          style={{
            pointerEvents: "none",
            position: "absolute",
            top: insets.top + 10,
            left: 16,
            right: 16,
            alignItems: "center",
          }}
        >
          <View
            className="flex-row items-center px-5 py-4 rounded-2xl border max-w-md"
            style={{ backgroundColor: tone.bg, borderColor: tone.border, elevation: 6 }}
          >
            <tone.Icon color="white" size={20} />
            <Text className="text-white font-bold ml-3 text-sm flex-shrink">{toast.message}</Text>
          </View>
        </View>
      ) : null}
    </ToastContext.Provider>
  );
}
