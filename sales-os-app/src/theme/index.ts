import { createTheme } from '@mui/material/styles';
import type { CSSProperties } from 'react';
import { amber, blue, emerald, gray, green, indigo, orange, red, report, rose, teal, violet, type ColorScale } from './colors';

// The named colour scales (./colors) and text styles below, typed so `sx`
// and Typography accept them (Frontend standards §6.11 rules 4 and 5).
declare module '@mui/material/styles' {
  interface Palette {
    gray: ColorScale; blue: ColorScale; red: ColorScale; green: ColorScale; emerald: ColorScale;
    amber: ColorScale; orange: ColorScale; violet: ColorScale; indigo: ColorScale; teal: ColorScale;
    rose: ColorScale; report: typeof report;
  }
  interface PaletteOptions {
    gray?: ColorScale; blue?: ColorScale; red?: ColorScale; green?: ColorScale; emerald?: ColorScale;
    amber?: ColorScale; orange?: ColorScale; violet?: ColorScale; indigo?: ColorScale; teal?: ColorScale;
    rose?: ColorScale; report?: typeof report;
  }
  interface TypographyVariants {
    body3: CSSProperties; caption2: CSSProperties; tiny: CSSProperties; micro: CSSProperties; lead: CSSProperties;
  }
  interface TypographyVariantsOptions {
    body3?: CSSProperties; caption2?: CSSProperties; tiny?: CSSProperties; micro?: CSSProperties; lead?: CSSProperties;
  }
}
declare module '@mui/material/Typography' {
  interface TypographyPropsVariantOverrides {
    body3: true; caption2: true; tiny: true; micro: true; lead: true;
  }
}

const theme = createTheme({
  palette: {
    primary: { main: '#2563eb' },
    // Matches the app-wide Tailwind bg-gray-50 convention exactly (was #f8fafc,
    // a close-but-not-exact drift — see Frontend-Implementation-Standards §6.7).
    background: { default: '#f9fafb' },
    gray, blue, red, green, emerald, amber, orange, violet, indigo, teal, rose, report,
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    fontWeightMedium: 500,
    fontWeightBold: 700,
    // Sizes the app used 10 or more times that MUI has no style for (MUI's
    // own: h5 1.5rem, h6 1.25rem, body2 0.875rem, caption 0.75rem). Size
    // only, so a moved screen keeps its line spacing (Part 2 plan D8).
    lead: { fontSize: '1.125rem' },
    body3: { fontSize: '0.8125rem' },
    caption2: { fontSize: '0.6875rem' },
    tiny: { fontSize: '0.625rem' },
    micro: { fontSize: '0.5625rem' },
  },
  components: {
    MuiTypography: {
      defaultProps: {
        variantMapping: { lead: 'p', body3: 'p', caption2: 'span', tiny: 'span', micro: 'span' },
      },
    },
    // Restores the app-wide light-gray input fill (Tailwind bg-gray-50 / #f9fafb)
    // used on every input field pre-migration — see Frontend-Implementation-Standards §6.6.
    MuiOutlinedInput: {
      styleOverrides: {
        root: { backgroundColor: '#f9fafb' },
      },
    },
    // Matches the pre-migration disabled:bg-blue-400 treatment so a disabled/loading
    // primary button still reads as blue ("working"), not MUI's default gray ("broken").
    MuiButton: {
      styleOverrides: {
        root: ({ ownerState }) => ({
          ...(ownerState.variant === 'contained' &&
            ownerState.color === 'primary' && {
              '&.Mui-disabled': {
                backgroundColor: '#60a5fa',
                color: '#fff',
              },
            }),
        }),
      },
    },
    // Matches the pre-migration bg-black/40 backdrop-blur-sm overlay treatment.
    MuiBackdrop: {
      styleOverrides: {
        root: { backgroundColor: 'rgba(0, 0, 0, 0.4)', backdropFilter: 'blur(4px)' },
      },
    },
    // Restores the pre-migration border-t border-gray-100 px-6 py-4 modal footer treatment.
    MuiDialogActions: {
      styleOverrides: {
        root: { borderTop: '1px solid #f3f4f6', padding: '16px 24px' },
      },
    },
  },
});

export default theme;
