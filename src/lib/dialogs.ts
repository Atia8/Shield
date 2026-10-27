import { Alert, Linking, Platform } from "react-native";

/**
 * Cross-platform confirm. react-native-web's Alert.alert ignores buttons,
 * so the web build falls back to window.confirm.
 */
export function confirm(
  title: string,
  message: string,
  confirmLabel = "OK",
  destructive = false,
): Promise<boolean> {
  if (Platform.OS === "web") {
    return Promise.resolve(window.confirm(`${title}\n\n${message}`));
  }
  return new Promise((resolve) => {
    Alert.alert(
      title,
      message,
      [
        { text: "Cancel", style: "cancel", onPress: () => resolve(false) },
        {
          text: confirmLabel,
          style: destructive ? "destructive" : "default",
          onPress: () => resolve(true),
        },
      ],
      { cancelable: true, onDismiss: () => resolve(false) },
    );
  });
}

export function notify(title: string, message: string) {
  if (Platform.OS === "web") {
    window.alert(`${title}\n\n${message}`);
    return;
  }
  Alert.alert(title, message);
}

export function callNumber(number: string) {
  Linking.openURL(`tel:${number}`).catch(() =>
    notify("Can't place call", `Please dial ${number} manually.`),
  );
}
