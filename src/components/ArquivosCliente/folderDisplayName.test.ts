import { folderDisplayName } from "./folderDisplayName";

test.each([
    ["Modelo inicial - cd1f8ae1", "Modelo inicial"],
    ["Modelo inicial - 48de43a2-85f1-485a-92d5-d6edd9850752", "Modelo inicial"],
    ["Documentos - contratos", "Documentos - contratos"],
    ["Pasta comum", "Pasta comum"],
])("formats folder label %s without its technical copy suffix", (name, expected) => {
    expect(folderDisplayName(name)).toBe(expected);
});
