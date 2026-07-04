import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: { main: '#2563eb' },
    // Matches the app-wide Tailwind bg-gray-50 convention exactly (was #f8fafc,
    // a close-but-not-exact drift — see Frontend-Implementation-Standards §6.7).
    background: { default: '#f9fafb' },
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    fontWeightMedium: 500,
    fontWeightBold: 700,
  },
  components: {
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
