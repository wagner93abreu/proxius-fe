import { createTheme } from "@mui/material/styles";
import type {} from "@mui/x-data-grid/themeAugmentation";
import lightTheme from "./lightTheme";

const managementTheme = createTheme(lightTheme, {
    components: {
        MuiDataGrid: {
            styleOverrides: {
                root: {
                    borderRadius: 16,
                    minHeight: 420,
                    scrollbarColor: "#b78c9a #f7f1e9",
                    "& ::-webkit-scrollbar": { width: 8, height: 8 },
                    "& ::-webkit-scrollbar-thumb": { backgroundColor: "#b78c9a", borderRadius: 8 },
                    "& ::-webkit-scrollbar-track": { backgroundColor: "#f7f1e9" },
                    boxShadow: "0 4px 20px rgba(85, 8, 29, 0.04)",
                    "& .MuiDataGrid-columnHeaders": {
                        backgroundColor: "#f7f1e9",
                        color: "#55081d",
                    },
                    "& .MuiDataGrid-columnHeaderTitle": { fontWeight: 700 },
                    "& .MuiDataGrid-row:hover": { backgroundColor: "rgba(85, 8, 29, 0.03)" },
                    "& .MuiDataGrid-row.Mui-selected": { backgroundColor: "rgba(85, 8, 29, 0.08)" },
                    "& .MuiDataGrid-row.Mui-selected:hover": { backgroundColor: "rgba(85, 8, 29, 0.12)" },
                    "& .MuiDataGrid-cell:focus, & .MuiDataGrid-columnHeader:focus": {
                        outlineColor: "#55081d",
                    },
                    "& .MuiDataGrid-footerContainer": { backgroundColor: "#fffdfa" },
                },
            },
        },
    },
});

export default managementTheme;
