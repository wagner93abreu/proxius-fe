import http from ".";
import { libraryAuthHeaders } from "./bibliotecas";
import {
    createModelo, createModeloFolder, deactivateModelo, deleteModeloFile, deleteModeloFolder, getModeloCopy, renameModeloFolder,
    getModeloFileContent, listModeloContents, listModelos, startModeloCopy, updateModelo,
    uploadModeloFile, withdrawModeloFile,
} from "./modelosArquivo";

jest.mock(".", () => ({
    __esModule: true,
    default: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn() },
}));

beforeEach(() => {
    jest.resetAllMocks();
    localStorage.setItem("authToken", "model-test-token");
});

afterEach(() => localStorage.removeItem("authToken"));

test("renames and recursively deletes model folders with the typed contract", async () => {
    (http.put as jest.Mock).mockResolvedValue({ data: { id: "pasta-1", name: "Nova" } });
    (http.delete as jest.Mock).mockResolvedValue({ data: "" });
    await expect(renameModeloFolder(3, "pasta-1", "Nova")).resolves.toEqual({ id: "pasta-1", name: "Nova" });
    await deleteModeloFolder(3, "pasta-1");
    expect(http.put).toHaveBeenCalledWith("sharepoint/modelos/3/pastas/pasta-1", { nome: "Nova" }, {
        headers: libraryAuthHeaders(),
    });
    expect(http.delete).toHaveBeenCalledWith("sharepoint/modelos/3/pastas/pasta-1", {
        headers: libraryAuthHeaders(),
        data: { confirmacao: "excluir" },
    });
});

test("loads the separate model catalog with the authenticated Bearer token", async () => {
    const models = [{ id: 3, nome: "Admissão", ativo: true }];
    (http.get as jest.Mock).mockResolvedValue({ data: models });

    await expect(listModelos()).resolves.toEqual(models);
    expect(http.get).toHaveBeenCalledWith("sharepoint/modelos", {
        headers: { Authorization: "Bearer model-test-token" },
    });
});

test("starts one idempotent copy and only accepts the asynchronous 202 response", async () => {
    (http.post as jest.Mock).mockResolvedValue({ data: { id: "op-20", estado: "PENDENTE" }, status: 202 });

    await expect(startModeloCopy(197, 3, "operation-key")).resolves.toMatchObject({
        id: "op-20",
        estado: "PENDENTE",
    });
});

test("polls only the application operation endpoint and strips upstream metadata", async () => {
    (http.get as jest.Mock).mockResolvedValue({ data: {
        id: "op/1", estado: "CONCLUIDA", progresso: 100, pastaDestinoId: "destino",
        nomePastaDestino: "Admissão", monitorUrl: "https://example.test/private-monitor", token: "never-store",
    } });
    const operation = await getModeloCopy("op/1");
    expect(http.get).toHaveBeenCalledWith("sharepoint/copias-modelo/op%2F1", {
        headers: expect.any(Object),
    });
    expect(operation).toMatchObject({ estado: "CONCLUIDA", pastaDestinoId: "destino" });
    expect(operation).not.toHaveProperty("monitorUrl");
    expect(operation).not.toHaveProperty("token");
    (http.get as jest.Mock).mockResolvedValue({ data: { id: "other", estado: "PENDENTE" } });
    await expect(getModeloCopy("op/1")).rejects.toThrow("outra operação");
    (http.get as jest.Mock).mockResolvedValue({ data: { id: "op/1", estado: "UNKNOWN" } });
    await expect(getModeloCopy("op/1")).rejects.toThrow("inválido");
});

test("uses the catalog CRUD and real folder/upload contracts with shared authentication", async () => {
    (http.get as jest.Mock).mockResolvedValue({ data: [] });
    (http.post as jest.Mock).mockResolvedValue({ data: { id: 3 } });
    (http.put as jest.Mock).mockResolvedValue({ data: { id: 3 } });
    await createModelo("Contrato", "Original");
    await updateModelo(3, "Contrato novo", "Descrição");
    await deactivateModelo(3);
    await listModeloContents(3, "parent/1");
    await createModeloFolder(3, "Documentos", "parent/1");
    const file = new File(["original"], "contrato.docx");
    await uploadModeloFile(3, file, "parent/1");
    expect(http.post).toHaveBeenCalledWith("sharepoint/modelos", { nome: "Contrato", descricao: "Original" }, expect.any(Object));
    expect(http.put).toHaveBeenCalledWith("sharepoint/modelos/3", { nome: "Contrato novo", descricao: "Descrição" }, expect.any(Object));
    expect(http.post).toHaveBeenCalledWith("sharepoint/modelos/3/desativar", null, expect.any(Object));
    expect(http.get).toHaveBeenCalledWith("sharepoint/modelos/3/arquivos", {
        headers: expect.any(Object), params: { parentId: "parent/1" },
    });
    expect(http.post).toHaveBeenCalledWith("sharepoint/modelos/3/pastas", { nome: "Documentos" }, {
        headers: expect.any(Object), params: { parentId: "parent/1" },
    });
    const [, form, config] = (http.post as jest.Mock).mock.calls[3];
    expect(form.get("file")).toEqual(file);
    expect(config.params).toEqual({ parentId: "parent/1" });
    expect(config.headers).not.toHaveProperty("Content-Type");
});

test("uses distinct authenticated endpoints for preview, withdrawal and permanent deletion", async () => {
    const blob = new Blob(["original"], { type: "application/pdf" });
    (http.get as jest.Mock).mockResolvedValue({ data: blob });
    await expect(getModeloFileContent(3, "item/1")).resolves.toBe(blob);
    await withdrawModeloFile(3, "item/1");
    await deleteModeloFile(3, "item/1");

    expect(http.get).toHaveBeenCalledWith("sharepoint/modelos/3/arquivos/item%2F1/conteudo", {
        headers: expect.any(Object), responseType: "blob",
    });
    expect(http.post).toHaveBeenCalledWith(
        "sharepoint/modelos/3/arquivos/item%2F1/retirar", null, { headers: expect.any(Object) }
    );
    expect(http.delete).toHaveBeenCalledWith("sharepoint/modelos/3/arquivos/item%2F1", {
        headers: expect.any(Object),
    });
});

test("sends the copy key and rejects a non-202 response", async () => {
    (http.post as jest.Mock).mockResolvedValue({ data: { id: "op-20", estado: "PENDENTE" }, status: 202 });
    await startModeloCopy(197, 3, "operation-key");
    expect(http.post).toHaveBeenCalledWith(
        "sharepoint/clifor/197/copias-modelo",
        { modeloId: 3 },
        {
            headers: {
                Authorization: "Bearer model-test-token",
                "Idempotency-Key": "operation-key",
            },
        }
    );

    (http.post as jest.Mock).mockResolvedValue({ data: { id: "op-21" }, status: 200 });
    await expect(startModeloCopy(197, 3, "another-key")).rejects.toThrow(
        "A API não confirmou o início da cópia no formato esperado."
    );
});
