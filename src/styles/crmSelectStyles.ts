import { CSSObjectWithLabel } from "react-select";

const createCrmSelectStyles = () => ({
    control: (base: CSSObjectWithLabel, state: { isFocused: boolean }) => ({
        ...base,
        backgroundColor: "#fffdfa",
        color: "#35252b",
        borderColor: state.isFocused ? "#55081d" : "rgba(85, 8, 29, 0.2)",
        boxShadow: state.isFocused ? "0 0 0 3px rgba(85, 8, 29, 0.08)" : "none",
        borderRadius: 10,
        minHeight: 40,
        "&:hover": { borderColor: "#55081d" },
    }),
    menuPortal: (base: CSSObjectWithLabel) => ({ ...base, zIndex: 3000 }),
    menu: (base: CSSObjectWithLabel): CSSObjectWithLabel => ({
        ...base,
        backgroundColor: "#fffdfa",
        border: "1px solid rgba(85, 8, 29, 0.12)",
        borderRadius: 12,
        overflow: "hidden",
        boxShadow: "0 12px 32px rgba(85, 8, 29, 0.14)",
    }),
    option: (base: CSSObjectWithLabel, state: { isSelected: boolean; isFocused: boolean }) => ({
        ...base,
        backgroundColor: state.isSelected ? "#55081d" : state.isFocused ? "rgba(85, 8, 29, 0.06)" : "#fffdfa",
        color: state.isSelected ? "#fffdfa" : "#35252b",
        "&:active": { backgroundColor: "rgba(85, 8, 29, 0.12)" },
    }),
    singleValue: (base: CSSObjectWithLabel) => ({ ...base, color: "#35252b" }),
    input: (base: CSSObjectWithLabel) => ({ ...base, color: "#35252b" }),
    placeholder: (base: CSSObjectWithLabel) => ({ ...base, color: "#75656b" }),
});

export default createCrmSelectStyles;
