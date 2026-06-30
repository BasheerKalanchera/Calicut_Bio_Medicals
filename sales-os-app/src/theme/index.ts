import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: { main: '#2563eb' },
    background: { default: '#f8fafc' },
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    fontWeightMedium: 500,
    fontWeightBold: 700,
  },
});

export default theme;
