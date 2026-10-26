// The app's colour scales, by name (Frontend standards §6.11 rule 4). The
// values are the Tailwind shades every screen used before the MUI move, so a
// screen moved from a typed colour to its name looks exactly the same.
// Screens use them through the theme, e.g. `color: "gray.500"` or
// `bgcolor: "blue.50"` in `sx`; never the hex values below.
//
// Named `gray`, not MUI's own `grey`: MUI draws some of its parts from
// `grey`, and changing those shades would change parts nobody touched.

export type ColorScale = Record<50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900, string>;

export const gray: ColorScale = {
  50: "#f9fafb", 100: "#f3f4f6", 200: "#e5e7eb", 300: "#d1d5db", 400: "#9ca3af",
  500: "#6b7280", 600: "#4b5563", 700: "#374151", 800: "#1f2937", 900: "#111827",
};
export const blue: ColorScale = {
  50: "#eff6ff", 100: "#dbeafe", 200: "#bfdbfe", 300: "#93c5fd", 400: "#60a5fa",
  500: "#3b82f6", 600: "#2563eb", 700: "#1d4ed8", 800: "#1e40af", 900: "#1e3a8a",
};
export const red: ColorScale = {
  50: "#fef2f2", 100: "#fee2e2", 200: "#fecaca", 300: "#fca5a5", 400: "#f87171",
  500: "#ef4444", 600: "#dc2626", 700: "#b91c1c", 800: "#991b1b", 900: "#7f1d1d",
};
export const green: ColorScale = {
  50: "#f0fdf4", 100: "#dcfce7", 200: "#bbf7d0", 300: "#86efac", 400: "#4ade80",
  500: "#22c55e", 600: "#16a34a", 700: "#15803d", 800: "#166534", 900: "#14532d",
};
export const emerald: ColorScale = {
  50: "#ecfdf5", 100: "#d1fae5", 200: "#a7f3d0", 300: "#6ee7b7", 400: "#34d399",
  500: "#10b981", 600: "#059669", 700: "#047857", 800: "#065f46", 900: "#064e3b",
};
export const amber: ColorScale = {
  50: "#fffbeb", 100: "#fef3c7", 200: "#fde68a", 300: "#fcd34d", 400: "#fbbf24",
  500: "#f59e0b", 600: "#d97706", 700: "#b45309", 800: "#92400e", 900: "#78350f",
};
export const orange: ColorScale = {
  50: "#fff7ed", 100: "#ffedd5", 200: "#fed7aa", 300: "#fdba74", 400: "#fb923c",
  500: "#f97316", 600: "#ea580c", 700: "#c2410c", 800: "#9a3412", 900: "#7c2d12",
};
export const violet: ColorScale = {
  50: "#f5f3ff", 100: "#ede9fe", 200: "#ddd6fe", 300: "#c4b5fd", 400: "#a78bfa",
  500: "#8b5cf6", 600: "#7c3aed", 700: "#6d28d9", 800: "#5b21b6", 900: "#4c1d95",
};
export const indigo: ColorScale = {
  50: "#eef2ff", 100: "#e0e7ff", 200: "#c7d2fe", 300: "#a5b4fc", 400: "#818cf8",
  500: "#6366f1", 600: "#4f46e5", 700: "#4338ca", 800: "#3730a3", 900: "#312e81",
};
export const teal: ColorScale = {
  50: "#f0fdfa", 100: "#ccfbf1", 200: "#99f6e4", 300: "#5eead4", 400: "#2dd4bf",
  500: "#14b8a6", 600: "#0d9488", 700: "#0f766e", 800: "#115e59", 900: "#134e4a",
};
export const rose: ColorScale = {
  50: "#fff1f2", 100: "#ffe4e6", 200: "#fecdd3", 300: "#fda4af", 400: "#fb7185",
  500: "#f43f5e", 600: "#e11d48", 700: "#be123c", 800: "#9f1239", 900: "#881337",
};

// Colours the report screens use that sit outside the scales above; kept by
// name so those screens can move without a visible change.
export const report = {
  bar: "#2a78d6",
  figure: "#0b0b0b",
  overdue: "#d03b3b",
  overdueBg: "#fdecea",
  waiting: "#b8790f",
  waitingBg: "#fff8e6",
};
