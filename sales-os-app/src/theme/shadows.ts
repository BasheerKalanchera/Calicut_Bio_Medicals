// The app's box shadows, by name (Frontend standards §6.11 rule 4). The
// values are the Tailwind shadows screens typed before the MUI move, so a
// screen moved to a name looks exactly the same. Not MUI's own `shadows`
// list: changing that would change parts nobody touched.
export const shadows = {
  sm: "0 1px 2px rgba(0,0,0,0.05)",
  lg: "0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)",
  xxl: "0 25px 50px -12px rgba(0,0,0,0.25)",
};
