// One set of colours per kind of status (Frontend standards §6.5, §6.11
// rule 4): a soft background, the text on it, and a border. Values are
// theme names, so they go straight into `sx`, e.g.
// `sx={{ bgcolor: statusColors.danger.bg, color: statusColors.danger.text }}`.
// A screen picks the tone that fits its status; it never types a colour.

export interface StatusTone {
  bg: string;
  text: string;
  border: string;
}

export const statusColors = {
  neutral: { bg: "gray.100", text: "gray.600", border: "gray.200" },
  info: { bg: "blue.50", text: "blue.700", border: "blue.200" },
  success: { bg: "emerald.50", text: "emerald.600", border: "emerald.200" },
  warning: { bg: "amber.50", text: "amber.700", border: "amber.200" },
  danger: { bg: "red.50", text: "red.600", border: "red.200" },
  // Report screens' overdue and waiting badges (their own shades).
  overdue: { bg: "report.overdueBg", text: "report.overdue", border: "report.overdue" },
  waiting: { bg: "report.waitingBg", text: "report.waiting", border: "report.waiting" },
} satisfies Record<string, StatusTone>;

export type StatusToneName = keyof typeof statusColors;
