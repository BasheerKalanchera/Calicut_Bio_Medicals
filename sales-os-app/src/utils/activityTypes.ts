import type { ActivityType } from "../types/api-aliases";

// bg/color pairs match the original Tailwind shade names, e.g. VISIT: violet-50 / violet-700.
// Shared by ActivityTimeline, ReminderRow, and DailyActivityReportScreen — previously
// duplicated across the first two, extracted here rather than adding a third copy.
export const ACTIVITY_TYPE_CONFIG: Record<ActivityType, { icon: string; label: string; bg: string; color: string }> = {
  VISIT: { icon: "🏥", label: "Visit", bg: "#f5f3ff", color: "#6d28d9" },
  CALL: { icon: "📞", label: "Call", bg: "#eff6ff", color: "#1d4ed8" },
  EMAIL: { icon: "✉️", label: "Email", bg: "#f0f9ff", color: "#0369a1" },
  MEETING: { icon: "🤝", label: "Meeting", bg: "#ecfdf5", color: "#047857" },
  NOTE: { icon: "📝", label: "Note", bg: "#fffbeb", color: "#b45309" },
  MANAGER_NOTE: { icon: "📋", label: "Manager Note", bg: "#f3f4f6", color: "#4b5563" },
  // BR-ACT-09: Sales Development Activities — no Account required, no
  // mandatory next action. See docs/Business-Rules.md.
  CONFERENCE_EXPO: { icon: "🎪", label: "Conference/Expo", bg: "#fdf4ff", color: "#a21caf" },
  OEM_PRODUCT_TRAINING: { icon: "🎓", label: "OEM/Product Training", bg: "#fff7ed", color: "#c2410c" },
  CERTIFICATION: { icon: "📜", label: "Certification", bg: "#f0fdf4", color: "#15803d" },
  SALES_TRAINING: { icon: "📚", label: "Sales Training", bg: "#eef2ff", color: "#4338ca" },
  SEMINAR_TRADE_SHOW: { icon: "🗣️", label: "Seminar/Trade Show", bg: "#fef2f2", color: "#b91c1c" },
  OTHER_DEVELOPMENT: { icon: "🌱", label: "Other Development", bg: "#f7fee7", color: "#4d7c0f" },
};
