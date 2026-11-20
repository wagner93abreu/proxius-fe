import http from ".";
import { libraryAuthHeaders } from "./bibliotecas";
import { createFolder, deleteFolder, listFiles, renameFolder, sharePointErrorMessage, uploadFile } from "./sharepoint";

jest.mock(".", () => ({
    __esModule: true,
    default: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn() },
}));

test("renames and recursively deletes client folders with the typed contract", async () => {
    (http.put as jest.Mock).mockResolvedValue({ data: { id: "f/1", name: "Nova", folder: {} } });
    (http.delete as jest.Mock).mockResolvedValue({ data: "" });
    await expect(renameFolder(197, "f/1", "Nova")).resolves.toEqual({ id: "f/1", name: "Nova", folder: {} });
    await deleteFolder(197, "f/1");
    expect(http.put).toHaveBeenCalledWith("sharepoint/clifor/197/pastas/f%2F1", { nome: "Nova" }, {
        headers: libraryAuthHeaders(),
    });
    expect(http.delete).toHaveBeenCalledWith("sharepoint/clifor/197/pastas/f%2F1", {
        headers: libraryAuthHeaders(),
        data: { confirmacao: "excluir" },
    });
    (http.put as jest.Mock).mockResolvedValue({ data: "" });
    await expect(renameFolder(197, "f/1", "Nova")).resolves.toBeNull();
});

beforeEach(() => {
    jest.resetAllMocks();
    localStorage.setItem("authToken", "sharepoint-test-token");
});

test("creates a folder in the authorized client container at root or under a parent", async () => {
    (http.post as jest.Mock).mockResolvedValue({ data: { id: "folder-2", name: "Nova", folder: {} } });
    await createFolder(197, "Nova");
    await createFolder(197, "Filha", "folder-2");
    expect(http.post).toHaveBeenNthCalledWith(1, "sharepoint/clifor/197/files/folders", { name: "Nova" }, {
        headers: expect.any(Object),
    });
    expect(http.post).toHaveBeenNthCalledWith(2, "sharepoint/clifor/197/files/folders", { name: "Filha" }, {
        headers: expect.any(Object), params: { parentId: "folder-2" },
    });
});

afterEach(() => localStorage.removeItem("authToken"));

test("sends the current Bearer token when listing the root folder", async () => {
    (http.get as jest.Mock).mockResolvedValue({ data: [] });

    await listFiles(197);

    expect(http.get).toHaveBeenCalledWith("sharepoint/clifor/197/files", {
        headers: { Authorization: "Bearer sharepoint-test-token" },
    });
});

test("lists nested folders and uploads to the currently selected parent", async () => {
    const folderItems = [{ id: "folder-1", name: "Contratos", folder: { childCount: 0 } }];
    (http.get as jest.Mock).mockResolvedValue({ data: folderItems });
    (http.post as jest.Mock).mockResolvedValue({ data: { id: "file-1" } });
    const file = new File(["conteúdo"], "contrato.docx");

    await expect(listFiles(197, "folder-1")).resolves.toEqual(folderItems);
    await uploadFile(197, file, undefined, "folder-1");

    expect(http.get).toHaveBeenCalledWith("sharepoint/clifor/197/files", {
        headers: { Authorization: "Bearer sharepoint-test-token" },
        params: { parentId: "folder-1" },
    });

    expect(http.post).toHaveBeenCalledWith(
        "sharepoint/clifor/197/files",
        expect.any(FormData),
        expect.objectContaining({
            headers: { Authorization: "Bearer sharepoint-test-token" },
            params: { parentId: "folder-1" },
        })
    );
});

test("shows safe Graph diagnostic details returned by the API", () => {
    expect(sharePointErrorMessage({
        isAxiosError: true,
        response: { status: 400, data: { details: "The selected parent is not a folder." } },
    })).toBe("The selected parent is not a folder.");
});
