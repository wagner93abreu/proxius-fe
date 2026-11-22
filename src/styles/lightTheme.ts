import { createTheme } from "@mui/material/styles";

const lightTheme = createTheme({
    palette: {
        mode: "light",
        primary: { main: "#141414", dark: "#383838", contrastText: "#ffffff" },
        secondary: { main: "#555555", contrastText: "#ffffff" },
        error: { main: "#303030", contrastText: "#ffffff" },
        warning: { main: "#555555", contrastText: "#ffffff" },
        info: { main: "#555555", contrastText: "#ffffff" },
        success: { main: "#444444", contrastText: "#ffffff" },
        background: { default: "#f6f6f6", paper: "#ffffff" },
        text: { primary: "#242424", secondary: "#666666" },
        divider: "rgba(20, 20, 20, 0.12)",
    },
    shape: { borderRadius: 12 },
    typography: {
        fontFamily: "var(--fonte-principal)",
        h5: { fontWeight: 700 },
        h6: { fontWeight: 700 },
        subtitle1: { fontWeight: 600 },
        button: { textTransform: "none", fontWeight: 600 },
    },
    components: {
        MuiButton: {
            defaultProps: { disableElevation: true },
            styleOverrides: {
                root: {
                    minHeight: 40,
                    paddingLeft: 16,
                    paddingRight: 16,
                    "&.Mui-focusVisible": { outline: "3px solid #858585", outlineOffset: 3 },
                },
                outlined: { borderColor: "rgba(20, 20, 20, 0.22)" },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: { boxShadow: "0 4px 16px rgba(20, 20, 20, 0.03)" },
            },
        },
        MuiCardActionArea: {
            styleOverrides: {
                root: {
                    "&.Mui-focusVisible": { outline: "3px solid #858585", outlineOffset: -3 },
                },
            },
        },
        MuiDialog: {
            styleOverrides: {
                paper: {
                    border: "1px solid rgba(20, 20, 20, 0.12)",
                    borderRadius: 20,
                    boxShadow: "0 24px 60px rgba(20, 20, 20, 0.18)",
                },
            },
        },
        MuiDialogTitle: {
            styleOverrides: { root: { color: "#141414", fontWeight: 700, padding: 24 } },
        },
        MuiDialogActions: {
            styleOverrides: { root: { padding: "16px 24px", borderTop: "1px solid rgba(20, 20, 20, 0.12)", gap: 8 } },
        },
        MuiOutlinedInput: {
            styleOverrides: { root: { backgroundColor: "#fff", borderRadius: 10 } },
        },
        MuiAlert: {
            styleOverrides: { root: { borderRadius: 12 } },
        },
    },
});

export default lightTheme;
