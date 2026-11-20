export const EDITABLE_FILE_ACCEPT = ".docx,.docm,.xlsx,.xlsm,.pptx,.ppsx,.odt,.ods,.odp";
const editableExtensions = new Set(EDITABLE_FILE_ACCEPT.split(",").map((extension) => extension.slice(1)));

export const isOfficeEditable = (name: string) =>
    editableExtensions.has(name.split(".").pop()?.toLowerCase() ?? "");
