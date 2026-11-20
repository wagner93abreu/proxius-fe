import { createTheme } from "@mui/material/styles";

const lightTheme = createTheme({
    palette: {
        mode: "light",
        primary: { main: "#55081d", dark: "#6f102a" },
        background: { default: "#efe5d8", paper: "#fffdfa" },
        text: { primary: "#35252b", secondary: "#75656b" },
        divider: "rgba(85, 8, 29, 0.12)",
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
                    "&.Mui-focusVisible": { outline: "3px solid #b78c9a", outlineOffset: 3 },
                },
                outlined: { borderColor: "rgba(85, 8, 29, 0.22)" },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: { boxShadow: "0 4px 16px rgba(85, 8, 29, 0.03)" },
            },
        },
        MuiCardActionArea: {
            styleOverrides: {
                root: {
                    "&.Mui-focusVisible": { outline: "3px solid #b78c9a", outlineOffset: -3 },
                },
            },
        },
        MuiDialog: {
            styleOverrides: {
                paper: {
                    border: "1px solid rgba(85, 8, 29, 0.12)",
                    borderRadius: 20,
                    boxShadow: "0 24px 60px rgba(85, 8, 29, 0.18)",
                },
            },
        },
        MuiDialogTitle: {
            styleOverrides: { root: { color: "#55081d", fontWeight: 700, padding: 24 } },
        },
        MuiDialogActions: {
            styleOverrides: { root: { padding: "16px 24px", borderTop: "1px solid rgba(85, 8, 29, 0.12)", gap: 8 } },
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
