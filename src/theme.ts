import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#FFB300', // Amber/Ember
      contrastText: '#0A0908',
    },
    background: {
      default: '#0A0908', // Pitch black
      paper: '#161412', // Deep ash
    },
    text: {
      primary: '#F5F2ED',
      secondary: '#A09B93',
    },
    divider: '#1C1A18', // Inset ash
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 800, tracking: -0.02 },
    h2: { fontWeight: 700, tracking: -0.01 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#0A0908',
          color: '#F5F2ED',
          scrollbarWidth: 'thin',
          '&::-webkit-scrollbar': {
            width: '6px',
            height: '6px',
          },
          '&::-webkit-scrollbar-track': {
            background: '#0A0908',
          },
          '&::-webkit-scrollbar-thumb': {
            background: '#1C1A18',
            borderRadius: '10px',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: '#161412',
          border: '1px solid #1C1A18',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: ({ ownerState, theme }) => ({
          borderRadius: '99px',
          padding: '8px 24px',
          ...(ownerState.variant === 'contained' && ownerState.color === 'primary' && {
            boxShadow: '0 4px 14px 0 rgba(255, 179, 0, 0.39)',
          }),
        }),
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#161412',
          backgroundImage: 'none',
          border: 'none',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#0A0908',
          backgroundImage: 'none',
          borderBottom: '1px solid #1C1A18',
          boxShadow: 'none',
        },
      },
    },
  },
});
