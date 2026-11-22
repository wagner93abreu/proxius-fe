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
                    scrollbarColor: "#858585 #f5f5f5",
                    "& ::-webkit-scrollbar": { width: 8, height: 8 },
                    "& ::-webkit-scrollbar-thumb": { backgroundColor: "#858585", borderRadius: 8 },
                    "& ::-webkit-scrollbar-track": { backgroundColor: "#f5f5f5" },
                    boxShadow: "0 4px 20px rgba(20, 20, 20, 0.04)",
                    "& .MuiDataGrid-columnHeaders": {
                        backgroundColor: "#f5f5f5",
                        color: "#141414",
                    },
                    "& .MuiDataGrid-columnHeaderTitle": { fontWeight: 700 },
                    "& .MuiDataGrid-row:hover": { backgroundColor: "rgba(20, 20, 20, 0.03)" },
                    "& .MuiDataGrid-row.Mui-selected": { backgroundColor: "rgba(20, 20, 20, 0.08)" },
                    "& .MuiDataGrid-row.Mui-selected:hover": { backgroundColor: "rgba(20, 20, 20, 0.12)" },
                    "& .MuiDataGrid-cell:focus, & .MuiDataGrid-columnHeader:focus": {
                        outlineColor: "#141414",
                    },
                    "& .MuiDataGrid-footerContainer": { backgroundColor: "#ffffff" },
                },
            },
        },
    },
});

export default managementTheme;
