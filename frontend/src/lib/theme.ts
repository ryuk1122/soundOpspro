// SoundOps Pro — Dark-First Utility design tokens

export const colors = {
  surface: "#0F1115",
  onSurface: "#FFFFFF",
  surfaceSecondary: "#1A1D24",
  onSurfaceSecondary: "#9CA3AF",
  surfaceTertiary: "#252932",
  onSurfaceTertiary: "#6B7280",
  surfaceInverse: "#F3F4F6",
  onSurfaceInverse: "#000000",
  brand: "#FF9F0A",
  onBrand: "#000000",
  brandSecondary: "#CC7F08",
  brandTertiary: "rgba(255, 159, 10, 0.12)",
  accent: "#2DD4BF",
  accentTertiary: "rgba(45, 212, 191, 0.14)",
  info: "#38BDF8",
  success: "#34C759",
  warning: "#FFD60A",
  error: "#FF453A",
  border: "#2A2F3A",
  borderStrong: "#3A4150",
  divider: "#2A2F3A",
};

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48 };

export const radius = { sm: 6, md: 12, lg: 20, pill: 999 };

export const fonts = {
  display: "Inter",
  displayMedium: "Inter-Medium",
  displaySemi: "Inter-SemiBold",
  displayBold: "Inter-Bold",
  text: "Inter",
  textMedium: "Inter-Medium",
  textSemi: "Inter-SemiBold",
};

export const CATEGORIES = [
  "Speakers", "Amplifiers", "Mixers", "Microphones", "Cables", "Lighting", "Accessories",
];

export const CONDITIONS: { key: string; label: string; color: string }[] = [
  { key: "operational", label: "Operational", color: colors.success },
  { key: "maintenance", label: "Maintenance", color: colors.warning },
  { key: "broken", label: "Out of Service", color: colors.error },
];

export const images = {
  dashboardHero: "https://images.pexels.com/photos/6605555/pexels-photo-6605555.jpeg",
  logisticsBg: "https://images.unsplash.com/photo-1597052826387-65a5a9639944",
};
