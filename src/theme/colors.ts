// Midnight theme. Keep in sync with tailwind.config.js.
export const colors = {
  ink: "#0B0F1A",
  night: "#1E1B4B",
  plum: "#2E1065",
  surface: "#161B2E",
  brand: "#10B981",
  brandDark: "#0D9488",
  accent: "#8B5CF6",
  danger: "#EF4444",
  warn: "#F59E0B",
  info: "#6366F1",
  text: "#FFFFFF",
  muted: "rgba(255,255,255,0.6)",
  faint: "rgba(255,255,255,0.4)",
  placeholder: "#717171",
  border: "rgba(255,255,255,0.1)",
} as const;

export const gradients = {
  screen: [colors.ink, colors.night] as const,
  welcome: [colors.ink, colors.night, colors.plum] as const,
  header: [colors.night, "rgba(11, 15, 26, 0.85)"] as const,
  brand: [colors.brandDark, colors.brand] as const,
  danger: ["#B91C1C", colors.danger] as const,
  disabled: ["#334155", "#334155"] as const,
};

/** "#10B981", 0.15 -> "rgba(16,185,129,0.15)" */
export function withAlpha(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}
