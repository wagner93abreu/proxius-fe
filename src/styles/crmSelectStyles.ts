import { CSSObjectWithLabel } from "react-select";

const createCrmSelectStyles = () => ({
    control: (base: CSSObjectWithLabel, state: { isFocused: boolean }) => ({
        ...base,
        backgroundColor: "#ffffff",
        color: "#242424",
        borderColor: state.isFocused ? "#141414" : "rgba(20, 20, 20, 0.2)",
        boxShadow: state.isFocused ? "0 0 0 3px rgba(20, 20, 20, 0.08)" : "none",
        borderRadius: 10,
        minHeight: 40,
        "&:hover": { borderColor: "#141414" },
    }),
    menuPortal: (base: CSSObjectWithLabel) => ({ ...base, zIndex: 3000 }),
    menu: (base: CSSObjectWithLabel): CSSObjectWithLabel => ({
        ...base,
        backgroundColor: "#ffffff",
        border: "1px solid rgba(20, 20, 20, 0.12)",
        borderRadius: 12,
        overflow: "hidden",
        boxShadow: "0 12px 32px rgba(20, 20, 20, 0.14)",
    }),
    option: (base: CSSObjectWithLabel, state: { isSelected: boolean; isFocused: boolean }) => ({
        ...base,
        backgroundColor: state.isSelected ? "#141414" : state.isFocused ? "rgba(20, 20, 20, 0.06)" : "#ffffff",
        color: state.isSelected ? "#ffffff" : "#242424",
        "&:active": { backgroundColor: "rgba(20, 20, 20, 0.12)" },
    }),
    singleValue: (base: CSSObjectWithLabel) => ({ ...base, color: "#242424" }),
    input: (base: CSSObjectWithLabel) => ({ ...base, color: "#242424" }),
    placeholder: (base: CSSObjectWithLabel) => ({ ...base, color: "#666666" }),
});

export default createCrmSelectStyles;
