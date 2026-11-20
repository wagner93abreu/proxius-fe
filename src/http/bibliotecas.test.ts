import http from ".";
import {
    createLibraryFolder,
    deleteLibraryFolder,
    getClientProducts,
    getLibraryStorageStatus,
    libraryAuthHeaders,
    listLibraries,
    listLibraryFolders,
    listLibraryItems,
    renameLibraryFolder,
    setClientProducts,
    setLibraryProducts,
    uploadLibraryFile,
} from "./bibliotecas";

jest.mock(".", () => ({
    __esModule: true,
    default: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn() },
}));

test("renames and recursively deletes library folders with the typed contract", async () => {
    localStorage.setItem("authToken", "test-token");
    (http.put as jest.Mock).mockResolvedValueOnce({ data: { id: 45, bibliotecaId: 12, nome: "Nova" } });
    (http.delete as jest.Mock).mockResolvedValueOnce({ data: "" });
    await expect(renameLibraryFolder(12, 45, "Nova")).resolves.toEqual({ id: 45, bibliotecaId: 12, nome: "Nova" });
    await deleteLibraryFolder(12, 45);
    expect(http.put).toHaveBeenCalledWith("bibliotecas/12/pastas/45", { nome: "Nova" }, {
        headers: libraryAuthHeaders(),
    });
    expect(http.delete).toHaveBeenCalledWith("bibliotecas/12/pastas/45", {
        headers: libraryAuthHeaders(),
        data: { confirmacao: "excluir" },
    });
    localStorage.removeItem("authToken");
});

test("uses the current session JWT for library requests", async () => {
    localStorage.setItem("authToken", "test-token");
    (http.get as jest.Mock).mockResolvedValueOnce({ data: [] });

    expect(libraryAuthHeaders()).toEqual({ Authorization: "Bearer test-token" });
    await listLibraries();
    expect(http.get).toHaveBeenCalledWith("bibliotecas", {
        headers: { Authorization: "Bearer test-token" },
    });
    localStorage.removeItem("authToken");
});

test("reads detailed client access records and writes the new access contract", async () => {
    localStorage.setItem("authToken", "test-token");
    const access = {
        produtoId: 4,
        ativo: true,
        inicio: "2026-09-01T10:00:00",
        fim: "2026-10-01T10:00:00",
        status: "ACTIVE",
        origem: "MANUAL",
    };
    (http.get as jest.Mock).mockResolvedValueOnce({ data: { acessos: [access] } });
    (http.put as jest.Mock).mockResolvedValueOnce({ data: { acessos: [access] } });

    await expect(getClientProducts(197)).resolves.toEqual({ acessos: [access] });
    expect(http.get).toHaveBeenCalledWith(
        "bibliotecas/clifor/197/produtos",
        expect.objectContaining({ headers: expect.objectContaining({ Authorization: expect.any(String) }) })
    );

    await setClientProducts(197, [{ produtoId: 4 }], "Acesso renovado");
    expect(http.put).toHaveBeenCalledWith(
        "bibliotecas/clifor/197/produtos",
        { acessos: [{ produtoId: 4 }], motivo: "Acesso renovado" },
        expect.objectContaining({ headers: expect.objectContaining({ Authorization: expect.any(String) }) })
    );
    localStorage.removeItem("authToken");
});

test("uses optional query parameters for folder-scoped content and validates the shared storage status", async () => {
    localStorage.setItem("authToken", "test-token");
    (http.get as jest.Mock)
        .mockResolvedValueOnce({ data: [{ id: 8, bibliotecaId: 3, nome: "Guias" }] })
        .mockResolvedValueOnce({ data: [{ id: 9, titulo: "Manual", tipo: "ARQUIVO", pastaId: 8 }] })
        .mockResolvedValueOnce({ data: { estado: "PRONTO" } });

    await expect(listLibraryFolders(3, 77)).resolves.toEqual([{ id: 8, bibliotecaId: 3, nome: "Guias" }]);
    await expect(listLibraryItems(3, 77, 8)).resolves.toEqual([
        { id: 9, titulo: "Manual", tipo: "ARQUIVO", pastaId: 8 },
    ]);
    await expect(getLibraryStorageStatus()).resolves.toBe("PRONTO");

    expect(http.get).toHaveBeenNthCalledWith(1, "bibliotecas/3/pastas", {
        headers: expect.any(Object),
        params: { cliforId: 77 },
    });
    expect(http.get).toHaveBeenNthCalledWith(2, "bibliotecas/3/itens", {
        headers: expect.any(Object),
        params: { cliforId: 77, pastaId: 8 },
    });
    expect(http.get).toHaveBeenNthCalledWith(3, "bibliotecas/storage/status", {
        headers: expect.any(Object),
    });
});

test("omits reason fields and sends folder IDs only when a caller provides them", async () => {
    localStorage.setItem("authToken", "test-token");
    const file = new File(["pdf"], "manual.pdf", { type: "application/pdf" });
    (http.put as jest.Mock).mockResolvedValueOnce({ data: {} }).mockResolvedValueOnce({ data: { acessos: [] } });
    (http.post as jest.Mock)
        .mockResolvedValueOnce({ data: { id: 8, bibliotecaId: 3, nome: "Guias" } })
        .mockResolvedValueOnce({ data: {} });

    await setLibraryProducts(3, [10]);
    await createLibraryFolder(3, "Guias");
    await uploadLibraryFile(3, file, "Manual", 8);
    await setClientProducts(77, [{ produtoId: 10 }]);

    expect(http.put).toHaveBeenCalledWith("bibliotecas/3/produtos", { produtoIds: [10] }, expect.any(Object));
    expect(http.put).toHaveBeenCalledWith("bibliotecas/clifor/77/produtos", {
        acessos: [{ produtoId: 10 }],
    }, expect.any(Object));
    expect(http.post).toHaveBeenNthCalledWith(1, "bibliotecas/3/pastas", { nome: "Guias" }, expect.any(Object));
    const uploadCall = (http.post as jest.Mock).mock.calls[1];
    expect(uploadCall[0]).toBe("bibliotecas/3/arquivos");
    expect(uploadCall[2]).toEqual(expect.objectContaining({ params: { pastaId: 8 } }));
    expect(uploadCall[1]).toBeInstanceOf(FormData);
});
