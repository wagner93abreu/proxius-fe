import React from "react";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import BibliotecaCliente from ".";
import http from "../../http";
import * as bibliotecaApi from "../../http/bibliotecas";

jest.mock("../../http", () => ({
    __esModule: true,
    default: { get: jest.fn() },
}));

jest.mock("../../http/bibliotecas", () => ({
    ...jest.requireActual("../../http/bibliotecas"),
    addLibraryLink: jest.fn(),
    createLibrary: jest.fn(),
    createLibraryFolder: jest.fn(),
    deactivateLibrary: jest.fn(),
    getClientProducts: jest.fn(),
    getLibraryItemContent: jest.fn(),
    getLibraryStorageStatus: jest.fn(),
    listLibraries: jest.fn(),
    listLibraryFolders: jest.fn(),
    listLibraryItems: jest.fn(),
    provisionLibraryStorage: jest.fn(),
    reconcileClientSales: jest.fn(),
    replaceLibraryFile: jest.fn(),
    setClientProducts: jest.fn(),
    setLibraryProducts: jest.fn(),
    uploadLibraryFile: jest.fn(),
    updateLibraryLink: jest.fn(),
    withdrawLibraryItem: jest.fn(),
    renameLibraryFolder: jest.fn(),
    deleteLibraryFolder: jest.fn(),
}));

const mockedHttp = http as jest.Mocked<typeof http>;
const mockedApi = bibliotecaApi as jest.Mocked<typeof bibliotecaApi>;

const library = { id: 12, nome: "Admissão", descricao: "Materiais de RH", produtoIds: [4] };
const items: bibliotecaApi.IItemBiblioteca[] = [
    { id: 23, titulo: "Guia.pdf", tipo: "ARQUIVO", contentType: "application/pdf" },
    {
        id: 24,
        titulo: "Modelo Canva",
        tipo: "LINK_EXTERNO",
        linkExterno: "https://www.canva.com/design/abc/def/view",
    },
];

async function openLibrary() {
    fireEvent.click(await screen.findByRole("button", { name: "Abrir biblioteca Admissão" }));
    await screen.findByRole("button", { name: "Guia.pdf" });
}

async function openClientConcessions() {
    fireEvent.click(await screen.findByRole("button", { name: "Concessões de clientes" }));
    await screen.findByRole("heading", { name: "Concessões de clientes" });
}

beforeEach(() => {
    jest.clearAllMocks();
    localStorage.setItem("userID", "9");
    localStorage.setItem("authToken", "test-token");
    mockedHttp.get.mockImplementation((url) => {
        if (url === "usuarios/9") return Promise.resolve({ data: { papel: "CLIENTE" } });
        if (url === "produtos?size=500") return Promise.resolve({ data: { content: [] } });
        if (url === "clifor/197") return Promise.resolve({ data: { nomesocial: "Cliente Alfa", clifor: "CLIENTE" } });
        if (url === "clifor/198") return Promise.resolve({ data: { nomesocial: "Cliente Beta", clifor: "CLIENTE" } });
        return Promise.reject(new Error(`Unexpected request: ${url}`));
    });
    mockedApi.listLibraries.mockResolvedValue([library]);
    mockedApi.listLibraryFolders.mockResolvedValue([]);
    mockedApi.listLibraryItems.mockResolvedValue(items);
    mockedApi.getLibraryStorageStatus.mockResolvedValue("PRONTO");
    mockedApi.getClientProducts.mockResolvedValue({
        acessos: [{
            produtoId: 4,
            ativo: true,
            inicio: "2026-09-01T10:00:00",
            fim: "2026-10-01T10:00:00",
            status: "ATIVO",
            origem: "MANUAL",
        }],
    });
    mockedApi.provisionLibraryStorage.mockResolvedValue();
    mockedApi.reconcileClientSales.mockResolvedValue();
    mockedApi.replaceLibraryFile.mockResolvedValue();
    mockedApi.uploadLibraryFile.mockResolvedValue();
    mockedApi.addLibraryLink.mockResolvedValue();
    mockedApi.createLibraryFolder.mockResolvedValue({ id: 45, bibliotecaId: 12, nome: "Nova pasta" });
    mockedApi.setLibraryProducts.mockResolvedValue();
    mockedApi.setClientProducts.mockResolvedValue({ acessos: [] });
    mockedApi.deactivateLibrary.mockResolvedValue();
    mockedApi.updateLibraryLink.mockResolvedValue();
});

afterEach(() => localStorage.clear());

describe("library folder rename and recursive delete", () => {
    const pasta = { id: 45, bibliotecaId: 12, nome: "Contratos" };
    const axiosError = (status: number) => Object.assign(new Error(`HTTP ${status}`), { isAxiosError: true, response: { status } });
    function deferred<T>() {
        let resolve!: (value: T) => void;
        let reject!: (reason: unknown) => void;
        const promise = new Promise<T>((res, rej) => { resolve = res; reject = rej; });
        return { promise, resolve, reject };
    }
    function asAdmin() {
        mockedHttp.get.mockImplementation((url) => url === "usuarios/9"
            ? Promise.resolve({ data: { papel: "ADMIN" } })
            : Promise.resolve({ data: { content: [] } }));
    }

    beforeEach(() => {
        mockedApi.listLibraryFolders.mockResolvedValue([pasta]);
    });

    test("does not offer folder management to library consumers", async () => {
        render(<BibliotecaCliente cliforId={197} />);
        await openLibrary();
        expect(screen.getByRole("button", { name: "Abrir pasta Contratos" })).toBeInTheDocument();
        expect(screen.queryByLabelText("Renomear pasta Contratos")).not.toBeInTheDocument();
        expect(screen.queryByLabelText("Excluir pasta Contratos")).not.toBeInTheDocument();
    });

    test("admin renames a folder and the list is refreshed", async () => {
        asAdmin();
        mockedApi.renameLibraryFolder.mockResolvedValue({ ...pasta, nome: "Contratos 2026" });
        render(<BibliotecaCliente mode="admin" />);
        await openLibrary();
        const foldersBefore = mockedApi.listLibraryFolders.mock.calls.length;
        fireEvent.click(screen.getByLabelText("Renomear pasta Contratos"));
        expect(screen.getByLabelText("Novo nome da pasta")).toHaveValue("Contratos");
        expect(screen.getByRole("button", { name: "Salvar" })).toBeDisabled();
        fireEvent.change(screen.getByLabelText("Novo nome da pasta"), { target: { value: "Contratos 2026" } });
        fireEvent.click(screen.getByRole("button", { name: "Salvar" }));
        await waitFor(() => expect(mockedApi.renameLibraryFolder).toHaveBeenCalledWith(12, 45, "Contratos 2026"));
        expect(await screen.findByText("Pasta renomeada.")).toBeInTheDocument();
        await waitFor(() => expect(mockedApi.listLibraryFolders.mock.calls.length).toBeGreaterThan(foldersBefore));
    });

    test("logical folders preserve legitimate hexadecimal suffixes in the rename form", async () => {
        asAdmin();
        mockedApi.listLibraryFolders.mockResolvedValue([{ ...pasta, nome: "Contratos - deadbeef" }]);
        render(<BibliotecaCliente mode="admin" />);
        await openLibrary();
        fireEvent.click(await screen.findByLabelText("Renomear pasta Contratos - deadbeef"));
        expect(screen.getByLabelText("Novo nome da pasta")).toHaveValue("Contratos - deadbeef");
        fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
        expect(mockedApi.renameLibraryFolder).not.toHaveBeenCalled();
    });

    test("rename stays locked while busy and keeps errors with the typed name; cancel closes", async () => {
        asAdmin();
        const pending = deferred<null>();
        mockedApi.renameLibraryFolder.mockReturnValue(pending.promise);
        render(<BibliotecaCliente mode="admin" />);
        await openLibrary();
        fireEvent.click(screen.getByLabelText("Renomear pasta Contratos"));
        fireEvent.change(screen.getByLabelText("Novo nome da pasta"), { target: { value: "Duplicada" } });
        fireEvent.click(screen.getByRole("button", { name: "Salvar" }));
        expect(await screen.findByRole("button", { name: "Salvando..." })).toBeDisabled();
        expect(within(screen.getByRole("dialog")).getByRole("button", { name: "Cancelar" })).toBeDisabled();
        fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
        expect(screen.getByRole("dialog")).toBeInTheDocument();
        pending.reject(axiosError(409));
        expect(await screen.findByText("Já existe uma biblioteca ou pasta com esse nome.")).toBeInTheDocument();
        expect(screen.getByLabelText("Novo nome da pasta")).toHaveValue("Duplicada");
        fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Cancelar" }));
        await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    });

    test("delete requires exact typed confirmation, can be cancelled and keeps errors while retrying", async () => {
        asAdmin();
        const pending = deferred<void>();
        mockedApi.deleteLibraryFolder.mockReturnValueOnce(pending.promise).mockResolvedValue();
        render(<BibliotecaCliente mode="admin" />);
        await openLibrary();
        fireEvent.click(screen.getByLabelText("Excluir pasta Contratos"));
        expect(screen.getByRole("dialog")).toHaveTextContent("todas as subpastas e arquivos dentro dela também serão removidos");
        const confirm = screen.getByRole("button", { name: "Excluir pasta" });
        expect(confirm).toBeDisabled();
        fireEvent.change(screen.getByLabelText('Digite "excluir" para confirmar'), { target: { value: " excluir" } });
        expect(confirm).toBeDisabled();
        fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Cancelar" }));
        await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
        expect(mockedApi.deleteLibraryFolder).not.toHaveBeenCalled();

        fireEvent.click(screen.getByLabelText("Excluir pasta Contratos"));
        fireEvent.change(screen.getByLabelText('Digite "excluir" para confirmar'), { target: { value: "excluir" } });
        fireEvent.click(screen.getByRole("button", { name: "Excluir pasta" }));
        expect(await screen.findByRole("button", { name: "Excluindo..." })).toBeDisabled();
        expect(within(screen.getByRole("dialog")).getByRole("button", { name: "Cancelar" })).toBeDisabled();
        pending.reject(axiosError(503));
        expect(await within(screen.getByRole("dialog")).findByText(/Armazenamento temporariamente indisponível/)).toBeInTheDocument();
        expect(screen.getByLabelText('Digite "excluir" para confirmar')).toHaveValue("excluir");
        mockedApi.listLibraryFolders.mockResolvedValue([]);
        fireEvent.click(screen.getByRole("button", { name: "Excluir pasta" }));
        await waitFor(() => expect(mockedApi.deleteLibraryFolder).toHaveBeenLastCalledWith(12, 45));
        expect(await screen.findByText("Pasta excluída.")).toBeInTheDocument();
        await waitFor(() => expect(screen.queryByRole("button", { name: "Abrir pasta Contratos" })).not.toBeInTheDocument());
    });

    test("deleting the open folder returns to the library root", async () => {
        asAdmin();
        mockedApi.deleteLibraryFolder.mockResolvedValue();
        render(<BibliotecaCliente mode="admin" />);
        await openLibrary();
        fireEvent.click(screen.getByRole("button", { name: "Abrir pasta Contratos" }));
        await waitFor(() => expect(mockedApi.listLibraryItems).toHaveBeenLastCalledWith(12, undefined, 45));
        expect(await screen.findByRole("button", { name: "Raiz" })).toBeInTheDocument();
        await waitFor(() => expect(screen.getByLabelText("Excluir pasta Contratos")).toBeEnabled());
        mockedApi.listLibraryFolders.mockResolvedValue([]);
        fireEvent.click(screen.getByLabelText("Excluir pasta Contratos"));
        fireEvent.change(screen.getByLabelText('Digite "excluir" para confirmar'), { target: { value: "excluir" } });
        fireEvent.click(screen.getByRole("button", { name: "Excluir pasta" }));
        await waitFor(() => expect(mockedApi.deleteLibraryFolder).toHaveBeenCalledWith(12, 45));
        await waitFor(() => expect(mockedApi.listLibraryItems).toHaveBeenLastCalledWith(12, undefined, undefined));
        await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
        expect(screen.queryByRole("button", { name: "Raiz" })).not.toBeInTheDocument();
    });
});

test("shows a library grid first and only opens its contents when selected", async () => {
    render(<BibliotecaCliente cliforId={197} />);

    expect(await screen.findByRole("button", { name: "Abrir biblioteca Admissão" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Guia.pdf" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Abrir biblioteca Admissão" }));

    expect(await screen.findByRole("button", { name: "Guia.pdf" })).toBeInTheDocument();
    expect(mockedApi.listLibraryFolders).toHaveBeenCalledWith(12, 197);
    expect(mockedApi.listLibraryItems).toHaveBeenCalledWith(12, 197, undefined);
    expect(screen.queryByText("Explorar biblioteca")).not.toBeInTheDocument();
    expect(screen.queryByText("PDF")).not.toBeInTheDocument();
});

test("adds document-management presentation for admins without changing navigation or dialogs", async () => {
    mockedHttp.get.mockImplementation((url) => url === "usuarios/9"
        ? Promise.resolve({ data: { papel: "ADMIN" } })
        : Promise.resolve({ data: { content: [] } }));
    render(<BibliotecaCliente mode="admin" />);

    expect(await screen.findByText("1 biblioteca")).toBeInTheDocument();
    expect(screen.getByText("Explorar biblioteca")).toBeInTheDocument();
    await openLibrary();
    expect(screen.getByRole("navigation", { name: "Navegação da biblioteca" })).toBeInTheDocument();
    expect(screen.getByText("PDF")).toBeInTheDocument();
    expect(screen.getByText("Link externo")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Publicar arquivo" }));
    expect(await screen.findByRole("dialog")).toHaveTextContent("Publicar arquivo · Admissão");
    expect(screen.queryByLabelText("Título")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(mockedApi.uploadLibraryFile).not.toHaveBeenCalled();
});

test("uses the current session token for profile, product and client requests", async () => {
    mockedHttp.get.mockImplementation((url, config) => {
        expect(config?.headers?.Authorization).toBe("Bearer test-token");
        if (url === "usuarios/9") return Promise.resolve({ data: { papel: "ADMIN" } });
        if (url === "produtos?size=500") return Promise.resolve({ data: { content: [] } });
        if (url === "clifor/197") return Promise.resolve({
            data: { nomesocial: "Cliente Alfa", clifor: "CLIENTE" },
        });
        return Promise.reject(new Error(`Unexpected request: ${url}`));
    });
    render(<BibliotecaCliente mode="admin" cliforId={197} />);

    await openClientConcessions();
    localStorage.setItem("authToken", "renewed-token");
    mockedHttp.get.mockResolvedValueOnce({
        data: { nomesocial: "Cliente Alfa", clifor: "CLIENTE" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Buscar" }));

    await waitFor(() => expect(mockedHttp.get).toHaveBeenCalledWith("clifor/197", {
        headers: { Authorization: "Bearer renewed-token" },
    }));
    expect(mockedHttp.get).toHaveBeenCalledWith("usuarios/9", {
        headers: { Authorization: "Bearer test-token" },
    });
    expect(mockedHttp.get).toHaveBeenCalledWith("produtos?size=500", {
        headers: { Authorization: "Bearer test-token" },
    });
});

test("does not mistake a failed profile request for a confirmed non-admin role", async () => {
    mockedHttp.get.mockRejectedValueOnce({
        isAxiosError: true,
        response: { status: 401 },
    });
    render(<BibliotecaCliente mode="admin" />);

    expect(await screen.findByText("Sua sessão expirou. Faça login novamente.")).toBeInTheDocument();
    expect(screen.queryByText("A gestão de bibliotecas requer perfil ADMIN.")).not.toBeInTheDocument();
    expect(mockedApi.listLibraries).not.toHaveBeenCalled();
});

test("shows folders and their materials in the client view without write actions", async () => {
    mockedApi.listLibraryFolders.mockResolvedValue([{ id: 31, bibliotecaId: 12, nome: "Admissão" }]);
    render(<BibliotecaCliente cliforId={197} />);

    await openLibrary();
    fireEvent.click(screen.getByRole("button", { name: "Abrir pasta Admissão" }));

    await waitFor(() => expect(mockedApi.listLibraryItems).toHaveBeenLastCalledWith(12, 197, 31));
    expect(screen.getByRole("button", { name: "Raiz" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Criar pasta" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Publicar arquivo" })).not.toBeInTheDocument();
});

test("creates only root-level folders and opens them for contextual publication", async () => {
    mockedHttp.get.mockImplementation((url) => url === "usuarios/9"
        ? Promise.resolve({ data: { papel: "ADMIN" } })
        : url === "produtos?size=500"
            ? Promise.resolve({ data: { content: [] } })
            : Promise.reject(new Error(`Unexpected request: ${url}`)));
    mockedApi.listLibraryFolders.mockResolvedValue([{ id: 45, bibliotecaId: 12, nome: "Nova pasta" }]);
    render(<BibliotecaCliente mode="admin" />);

    fireEvent.click(await screen.findByRole("button", { name: "Abrir biblioteca Admissão" }));
    fireEvent.click(await screen.findByRole("button", { name: "Criar pasta" }));
    fireEvent.change(screen.getByLabelText("Nome da pasta"), { target: { value: "Nova pasta" } });
    fireEvent.click(screen.getByRole("button", { name: "Criar" }));
    await waitFor(() => expect(mockedApi.createLibraryFolder).toHaveBeenCalledWith(12, "Nova pasta"));
    fireEvent.click(await screen.findByRole("button", { name: "Abrir pasta Nova pasta" }));
    expect(await screen.findByRole("button", { name: "Publicar arquivo" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Criar pasta" })).not.toBeInTheDocument();
});

test("loads PDF through the authenticated API and releases the preview URL on close", async () => {
    const createObjectUrl = jest.fn().mockReturnValue("blob:preview");
    const revokeObjectUrl = jest.fn();
    Object.defineProperty(URL, "createObjectURL", { configurable: true, value: createObjectUrl });
    Object.defineProperty(URL, "revokeObjectURL", { configurable: true, value: revokeObjectUrl });
    mockedApi.getLibraryItemContent.mockResolvedValue(new Blob(["pdf"], { type: "application/pdf" }));
    render(<BibliotecaCliente cliforId={197} />);

    await openLibrary();
    fireEvent.click(screen.getByRole("button", { name: "Guia.pdf" }));

    expect(await screen.findByTitle("Pré-visualização de Guia.pdf")).toHaveAttribute("src", "blob:preview");
    expect(mockedApi.getLibraryItemContent).toHaveBeenCalledWith(12, 23, 197);
    fireEvent.click(screen.getByRole("button", { name: "Fechar visualização" }));
    await waitFor(() => expect(revokeObjectUrl).toHaveBeenCalledWith("blob:preview"));
});

test("opens Office files in the read-only preview modal", async () => {
    const createObjectUrl = jest.fn().mockReturnValue("blob:office-preview");
    Object.defineProperty(URL, "createObjectURL", { configurable: true, value: createObjectUrl });
    mockedApi.listLibraryItems.mockResolvedValue([
        ...items,
        {
            id: 25,
            titulo: "Manual.docx",
            tipo: "ARQUIVO",
            contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        },
    ]);
    mockedApi.getLibraryItemContent.mockResolvedValue(new Blob(["docx"], {
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    }));
    render(<BibliotecaCliente cliforId={197} />);

    await openLibrary();
    fireEvent.click(screen.getByRole("button", { name: "Manual.docx" }));

    expect(await screen.findByTitle("Pré-visualização de Manual.docx"))
        .toHaveAttribute("src", "blob:office-preview");
    expect(screen.getByText(/Visualização somente leitura/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Baixar arquivo" })).toHaveAttribute("download", "Manual.docx");
    expect(mockedApi.getLibraryItemContent).toHaveBeenCalledWith(12, 25, 197);
});

test("keeps the library consultation read-only for staff roles", async () => {
    mockedHttp.get.mockImplementation((url) => url === "usuarios/9"
        ? Promise.resolve({ data: { papel: "ATENDIMENTO" } })
        : Promise.reject(new Error(`Unexpected request: ${url}`)));
    render(<BibliotecaCliente cliforId={197} />);

    await openLibrary();
    expect(screen.queryByRole("button", { name: "Publicar arquivo" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Criar pasta" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Retirar Modelo Canva" })).not.toBeInTheDocument();
});

test("canceling product selection discards the draft without a request", async () => {
    mockedHttp.get.mockImplementation((url) => {
        if (url === "usuarios/9") return Promise.resolve({ data: { papel: "ADMIN" } });
        if (url === "produtos?size=500") {
            return Promise.resolve({ data: { content: [{ id: 4, nome: "Admissão" }] } });
        }
        return Promise.reject(new Error(`Unexpected request: ${url}`));
    });
    render(<BibliotecaCliente mode="admin" />);

    fireEvent.click(await screen.findByRole("button", { name: "Abrir biblioteca Admissão" }));
    fireEvent.click(await screen.findByRole("button", { name: "Produtos que liberam esta biblioteca" }));
    const checkbox = await screen.findByLabelText("Admissão (4)");
    expect(checkbox).toBeChecked();
    fireEvent.click(checkbox);
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(mockedApi.setLibraryProducts).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.queryByRole("heading", {
        name: "Produtos que liberam Admissão",
    })).not.toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: "Produtos que liberam esta biblioteca" }));
    expect(await screen.findByLabelText("Admissão (4)")).toBeChecked();
});

test("saves an expired client product without requiring a reason", async () => {
    mockedHttp.get.mockImplementation((url) => {
        if (url === "usuarios/9") return Promise.resolve({ data: { papel: "ADMIN" } });
        if (url === "produtos?size=500") return Promise.resolve({ data: { content: [{
            id: 4, nome: "Admissão", duracaoAcessoQuantidade: 30, duracaoAcessoUnidade: "DIA",
        }] } });
        if (url === "clifor/197") return Promise.resolve({
            data: { nomesocial: "Cliente Alfa", clifor: "CLIENTE" },
        });
        return Promise.reject(new Error(`Unexpected request: ${url}`));
    });
    mockedApi.getClientProducts.mockResolvedValue({
        acessos: [{
            produtoId: 4, ativo: true, inicio: "2026-08-01T10:00:00",
            fim: "2026-09-01T10:00:00", status: "EXPIRADO", origem: "MANUAL",
        }],
    });
    mockedApi.setClientProducts.mockResolvedValue({
        acessos: [{
            produtoId: 4, ativo: true, inicio: "2026-09-26T10:00:00",
            fim: "2026-10-26T10:00:00", status: "ATIVO", origem: "MANUAL",
        }],
    });
    render(<BibliotecaCliente mode="admin" cliforId={197} />);

    await openClientConcessions();
    fireEvent.click(screen.getByRole("button", { name: "Buscar" }));
    expect(await screen.findByText(/Status: EXPIRED · Início:/)).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText(/Admissão \(4\).*prazo padrão/));
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));

    await waitFor(() => expect(mockedApi.setClientProducts).toHaveBeenCalledWith(197, [{ produtoId: 4 }]));
});

test("changing a client ID clears the previous selection and rights", async () => {
    mockedHttp.get.mockImplementation((url) => {
        if (url === "usuarios/9") return Promise.resolve({ data: { papel: "ADMIN" } });
        if (url === "produtos?size=500") return Promise.resolve({ data: { content: [{ id: 4, nome: "Admissão" }] } });
        if (url === "clifor/197") return Promise.resolve({ data: { nomesocial: "Cliente Alfa", clifor: "CLIENTE" } });
        if (url === "clifor/198") return Promise.resolve({ data: { nomesocial: "Cliente Beta", clifor: "CLIENTE" } });
        return Promise.reject(new Error(`Unexpected request: ${url}`));
    });
    render(<BibliotecaCliente mode="admin" />);
    await openClientConcessions();
    fireEvent.change(screen.getByLabelText("ID do cliente"), { target: { value: "197" } });
    fireEvent.click(screen.getByRole("button", { name: "Buscar" }));
    expect(await screen.findByText("Cliente Alfa (ID 197)")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("ID do cliente"), { target: { value: "198" } });
    expect(screen.queryByText("Cliente Alfa (ID 197)")).not.toBeInTheDocument();
    expect(screen.queryByText(/Status:/)).not.toBeInTheDocument();
    expect(mockedApi.getClientProducts).toHaveBeenCalledTimes(1);
});

test("canceling concessions does not write the edited product selection", async () => {
    mockedHttp.get.mockImplementation((url) => {
        if (url === "usuarios/9") return Promise.resolve({ data: { papel: "ADMIN" } });
        if (url === "produtos?size=500") return Promise.resolve({ data: { content: [{ id: 4, nome: "Admissão" }] } });
        if (url === "clifor/197") return Promise.resolve({ data: { nomesocial: "Cliente Alfa", clifor: "CLIENTE" } });
        return Promise.reject(new Error(`Unexpected request: ${url}`));
    });
    render(<BibliotecaCliente mode="admin" />);
    await openClientConcessions();
    fireEvent.change(screen.getByLabelText("ID do cliente"), { target: { value: "197" } });
    fireEvent.click(screen.getByRole("button", { name: "Buscar" }));
    const checkbox = await screen.findByLabelText("Admissão (4)");
    fireEvent.click(checkbox);
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(mockedApi.setClientProducts).not.toHaveBeenCalled();
});

test("keeps sales reconciliation inside the selected client's concessions modal", async () => {
    mockedHttp.get.mockImplementation((url) => {
        if (url === "usuarios/9") return Promise.resolve({ data: { papel: "ADMIN" } });
        if (url === "produtos?size=500") return Promise.resolve({ data: { content: [{ id: 4, nome: "Admissão" }] } });
        if (url === "clifor/197") return Promise.resolve({
            data: { nomesocial: "Cliente Alfa", clifor: "CLIENTE" },
        });
        return Promise.reject(new Error(`Unexpected request: ${url}`));
    });
    mockedApi.getClientProducts
        .mockResolvedValueOnce({ acessos: [] })
        .mockResolvedValueOnce({ acessos: [{
            produtoId: 4, ativo: true, inicio: "2026-09-26T10:00:00",
            fim: "2026-10-26T10:00:00", status: "ATIVO", origem: "VENDA",
        }] });
    render(<BibliotecaCliente mode="admin" cliforId={197} />);

    await openClientConcessions();
    fireEvent.click(screen.getByRole("button", { name: "Buscar" }));
    fireEvent.click(await screen.findByRole("button", { name: "Conciliar vendas do cliente" }));

    expect(await screen.findByText("Conciliação de vendas concluída.")).toBeInTheDocument();
    expect(await screen.findByText(/Status: ACTIVE · Início:/)).toBeInTheDocument();
    expect(mockedApi.reconcileClientSales).toHaveBeenCalledWith(197);
    expect(mockedApi.getClientProducts).toHaveBeenCalledTimes(2);
});

test("publishes multiple files by their original names into the selected folder", async () => {
    mockedHttp.get.mockImplementation((url) => url === "usuarios/9"
        ? Promise.resolve({ data: { papel: "ADMIN" } })
        : url === "produtos?size=500"
            ? Promise.resolve({ data: { content: [] } })
            : Promise.reject(new Error(`Unexpected request: ${url}`)));
    mockedApi.listLibraryFolders.mockResolvedValue([{ id: 31, bibliotecaId: 12, nome: "Admissão" }]);
    render(<BibliotecaCliente mode="admin" />);

    fireEvent.click(await screen.findByRole("button", { name: "Abrir biblioteca Admissão" }));
    fireEvent.click(await screen.findByRole("button", { name: "Abrir pasta Admissão" }));
    await screen.findByRole("button", { name: "Publicar arquivo" });
    fireEvent.click(screen.getByRole("button", { name: "Publicar arquivo" }));
    expect(await screen.findByText("Publicar arquivo · Admissão")).toBeInTheDocument();
    expect(screen.queryByLabelText("Título")).not.toBeInTheDocument();
    const files = [
        new File(["%PDF-test"], "guia.pdf", { type: "application/pdf" }),
        new File(["image"], "capa.png", { type: "image/png" }),
        new File(["office"], "manual.docx", {
            type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        }),
        new File(["office"], "planilha.xlsx", {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        }),
    ];
    fireEvent.change(document.querySelector('input[type="file"]') as HTMLInputElement, {
        target: { files },
    });
    mockedApi.uploadLibraryFile.mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 10)));
    fireEvent.click(screen.getByRole("button", { name: "Publicar 4 arquivos" }));

    const backButton = Array.from(document.querySelectorAll<HTMLButtonElement>("button"))
        .find((button) => button.textContent?.trim() === "Bibliotecas");
    expect(backButton?.disabled).toBe(true);
    await waitFor(() => {
        expect(mockedApi.uploadLibraryFile).toHaveBeenCalledTimes(4);
        expect(mockedApi.uploadLibraryFile).toHaveBeenNthCalledWith(1, 12, files[0], files[0].name, 31);
        expect(mockedApi.uploadLibraryFile).toHaveBeenNthCalledWith(2, 12, files[1], files[1].name, 31);
        expect(mockedApi.uploadLibraryFile).toHaveBeenNthCalledWith(3, 12, files[2], files[2].name, 31);
        expect(mockedApi.uploadLibraryFile).toHaveBeenNthCalledWith(4, 12, files[3], files[3].name, 31);
    });
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
});

test("retries only failed library files and keeps the original folder context", async () => {
    mockedHttp.get.mockImplementation((url) => url === "usuarios/9"
        ? Promise.resolve({ data: { papel: "ADMIN" } })
        : url === "produtos?size=500"
            ? Promise.resolve({ data: { content: [] } })
            : Promise.reject(new Error(`Unexpected request: ${url}`)));
    mockedApi.listLibraryFolders.mockResolvedValue([{ id: 31, bibliotecaId: 12, nome: "Admissão" }]);
    const goodFile = new File(["%PDF-good"], "good.pdf", { type: "application/pdf" });
    const retryFile = new File(["%PDF-retry"], "retry.pdf", { type: "application/pdf" });
    let retryAttempts = 0;
    mockedApi.uploadLibraryFile.mockImplementation(async (_libraryId, file) => {
        if (file === retryFile && retryAttempts++ === 0) throw new Error("Temporary upload failure");
    });
    render(<BibliotecaCliente mode="admin" />);
    fireEvent.click(await screen.findByRole("button", { name: "Abrir biblioteca Admissão" }));
    fireEvent.click(await screen.findByRole("button", { name: "Abrir pasta Admissão" }));
    fireEvent.click(await screen.findByRole("button", { name: "Publicar arquivo" }));
    fireEvent.change(document.querySelector('input[type="file"]') as HTMLInputElement, {
        target: { files: [goodFile, retryFile] },
    });
    fireEvent.click(screen.getByRole("button", { name: "Publicar 2 arquivos" }));

    expect(await screen.findByText("retry.pdf — Falha")).toBeInTheDocument();
    expect(screen.getByText("good.pdf — Enviado")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
    await waitFor(() => {
        expect(mockedApi.uploadLibraryFile).toHaveBeenCalledTimes(3);
        expect(mockedApi.uploadLibraryFile).toHaveBeenNthCalledWith(1, 12, goodFile, goodFile.name, 31);
        expect(mockedApi.uploadLibraryFile).toHaveBeenNthCalledWith(2, 12, retryFile, retryFile.name, 31);
        expect(mockedApi.uploadLibraryFile).toHaveBeenNthCalledWith(3, 12, retryFile, retryFile.name, 31);
    });
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
});

test("storage status controls provisioning visibility and ready state is re-read", async () => {
    mockedHttp.get.mockImplementation((url) => url === "usuarios/9"
        ? Promise.resolve({ data: { papel: "ADMIN" } })
        : url === "produtos?size=500"
            ? Promise.resolve({ data: { content: [] } })
            : Promise.reject(new Error(`Unexpected request: ${url}`)));
    mockedApi.getLibraryStorageStatus
        .mockResolvedValueOnce("NAO_PROVISIONADO")
        .mockResolvedValueOnce("PRONTO");
    const { unmount } = render(<BibliotecaCliente mode="admin" />);

    const provisionButton = await screen.findByRole("button", { name: "Provisionar armazenamento" });
    fireEvent.click(provisionButton);
    await waitFor(() => expect(mockedApi.provisionLibraryStorage).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(mockedApi.getLibraryStorageStatus).toHaveBeenCalledTimes(2));
    expect(screen.queryByRole("button", { name: "Provisionar armazenamento" })).not.toBeInTheDocument();

    unmount();
    render(<BibliotecaCliente mode="admin" />);
    await waitFor(() => expect(mockedApi.getLibraryStorageStatus).toHaveBeenCalledTimes(3));
    expect(screen.queryByRole("button", { name: "Provisionar armazenamento" })).not.toBeInTheDocument();
});

test("shows Graph credential errors without offering provisioning as if storage were absent", async () => {
    mockedHttp.get.mockImplementation((url) => url === "usuarios/9"
        ? Promise.resolve({ data: { papel: "ADMIN" } })
        : url === "produtos?size=500"
            ? Promise.resolve({ data: { content: [] } })
            : Promise.reject(new Error(`Unexpected request: ${url}`)));
    mockedApi.getLibraryStorageStatus.mockRejectedValue({
        isAxiosError: true,
        response: {
            status: 502,
            data: {
                graphStatus: "401",
                error: "As credenciais do Microsoft Graph foram recusadas",
            },
        },
    });
    render(<BibliotecaCliente mode="admin" />);

    expect(await screen.findByText("As credenciais do Microsoft Graph foram recusadas")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Provisionar armazenamento" })).not.toBeInTheDocument();
    expect(mockedApi.provisionLibraryStorage).not.toHaveBeenCalled();
});

test("keeps the recovery action visible when activation remains pending", async () => {
    mockedHttp.get.mockImplementation((url) => url === "usuarios/9"
        ? Promise.resolve({ data: { papel: "ADMIN" } })
        : url === "produtos?size=500"
            ? Promise.resolve({ data: { content: [] } })
            : Promise.reject(new Error(`Unexpected request: ${url}`)));
    mockedApi.getLibraryStorageStatus.mockResolvedValue("ATIVACAO_PENDENTE");
    render(<BibliotecaCliente mode="admin" />);

    fireEvent.click(await screen.findByRole("button", { name: "Tentar ativar armazenamento" }));

    expect(await screen.findByText("A ativação ainda está pendente. Você pode tentar novamente."))
        .toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Tentar ativar armazenamento" })).toBeInTheDocument();
    expect(mockedApi.provisionLibraryStorage).toHaveBeenCalledTimes(1);
});

test("allows a non-ready library to be created and explains provisioning separately", async () => {
    mockedHttp.get.mockImplementation((url) => url === "usuarios/9"
        ? Promise.resolve({ data: { papel: "ADMIN" } })
        : url === "produtos?size=500"
            ? Promise.resolve({ data: { content: [] } })
            : Promise.reject(new Error(`Unexpected request: ${url}`)));
    mockedApi.getLibraryStorageStatus.mockResolvedValue("ATIVACAO_PENDENTE");
    mockedApi.createLibrary.mockResolvedValue({ id: 13, nome: "Nova", descricao: "", produtoIds: [] });
    render(<BibliotecaCliente mode="admin" />);

    expect(await screen.findByRole("button", { name: "Tentar ativar armazenamento" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Nova biblioteca" }));
    expect(await screen.findByRole("button", { name: "Tentar ativar" })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Nome"), { target: { value: "Nova" } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));
    await waitFor(() => expect(mockedApi.createLibrary).toHaveBeenCalledWith("Nova", ""));
});

test.each([
    "https://www.canva.com/design/DAHKPS9IpYo/Fpw7akWiT7LaBfTjfrG6DA/edit",
    "https://example.test/documento?modo=editar#pagina",
    "http://example.test/documento",
])("opens external web URLs in a protected new tab: %s", async (url) => {
    mockedApi.listLibraryItems.mockResolvedValue([
        { id: 25, titulo: "Destino externo", tipo: "LINK_EXTERNO", linkExterno: url },
    ]);
    render(<BibliotecaCliente cliforId={197} />);
    fireEvent.click(await screen.findByRole("button", { name: "Abrir biblioteca Admissão" }));
    const link = await screen.findByRole("link", { name: "Destino externo" });
    expect(link).toHaveAttribute("href", url);
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
});

test.each(["javascript:alert(1)", "data:text/html,test", "ftp://example.test/file", "invalid", "https://user:password@example.test"])(
    "does not open unsafe or invalid external URLs: %s", async (url) => {
    mockedApi.listLibraryItems.mockResolvedValue([
        { id: 25, titulo: "Destino externo", tipo: "LINK_EXTERNO", linkExterno: url },
    ]);
    render(<BibliotecaCliente cliforId={197} />);
    fireEvent.click(await screen.findByRole("button", { name: "Abrir biblioteca Admissão" }));

    expect(await screen.findByText("Destino externo")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Destino externo" })).not.toBeInTheDocument();
});

test.each([
    "https://www.canva.com/design/DAHKPS9IpYo/Fpw7akWiT7LaBfTjfrG6DA/edit",
    "https://example.test/documento?modo=editar#pagina",
    "http://example.test/documento",
])("publishes and edits links from any web site: %s", async (url) => {
    mockedHttp.get.mockImplementation((path) => path === "usuarios/9"
        ? Promise.resolve({ data: { papel: "ADMIN" } })
        : Promise.resolve({ data: { content: [] } }));
    render(<BibliotecaCliente mode="admin" />);
    await openLibrary();
    fireEvent.click(screen.getByRole("button", { name: "Publicar link" }));
    fireEvent.change(screen.getByLabelText("Título do link"), { target: { value: " Documento " } });
    fireEvent.change(screen.getByLabelText("URL do link"), { target: { value: ` ${url} ` } });
    fireEvent.click(screen.getByRole("button", { name: "Publicar" }));
    await waitFor(() => expect(mockedApi.addLibraryLink).toHaveBeenCalledWith(12, "Documento", url, undefined));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: "Editar Modelo Canva" }));
    fireEvent.change(screen.getByLabelText("URL do link"), { target: { value: url } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar link" }));
    await waitFor(() => expect(mockedApi.updateLibraryLink).toHaveBeenCalledWith(12, 24, "Modelo Canva", url));
});

test.each(["javascript:alert(1)", "invalid", "https://user:password@example.test"])(
    "rejects invalid publication and editing before contacting the API: %s", async (url) => {
        mockedHttp.get.mockImplementation((path) => path === "usuarios/9"
            ? Promise.resolve({ data: { papel: "ADMIN" } })
            : Promise.resolve({ data: { content: [] } }));
        render(<BibliotecaCliente mode="admin" />);
        await openLibrary();
        fireEvent.click(screen.getByRole("button", { name: "Publicar link" }));
        fireEvent.change(screen.getByLabelText("Título do link"), { target: { value: "Documento" } });
        fireEvent.change(screen.getByLabelText("URL do link"), { target: { value: url } });
        fireEvent.click(screen.getByRole("button", { name: "Publicar" }));
        expect(within(screen.getByRole("dialog")).getByText(/Informe um título e uma URL válida/)).toBeInTheDocument();
        expect(mockedApi.addLibraryLink).not.toHaveBeenCalled();
        fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
        await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
        fireEvent.click(screen.getByRole("button", { name: "Editar Modelo Canva" }));
        fireEvent.change(screen.getByLabelText("URL do link"), { target: { value: url } });
        fireEvent.click(screen.getByRole("button", { name: "Salvar link" }));
        expect(within(screen.getByRole("dialog")).getByText(/Informe um título e uma URL válida/)).toBeInTheDocument();
        expect(mockedApi.updateLibraryLink).not.toHaveBeenCalled();
    }
);

test("clears a previous client's library when loading a new client fails", async () => {
    mockedApi.listLibraries.mockImplementation((id) =>
        id === 197 ? Promise.resolve([library]) : Promise.reject(new Error("Connection lost"))
    );
    const { rerender } = render(<BibliotecaCliente cliforId={197} />);
    await openLibrary();

    rerender(<BibliotecaCliente cliforId={198} />);

    expect(await screen.findByRole("alert")).toHaveTextContent("Ocorreu um erro ao acessar a biblioteca.");
    expect(screen.queryByRole("button", { name: "Guia.pdf" })).not.toBeInTheDocument();
    expect(mockedApi.listLibraries).toHaveBeenCalledWith(198);
});

test("admin can confirm soft deactivation and replace a file without changing its library", async () => {
    mockedHttp.get.mockImplementation((url) => url === "usuarios/9"
        ? Promise.resolve({ data: { papel: "ADMIN" } })
        : url === "produtos?size=500"
            ? Promise.resolve({ data: { content: [] } })
            : Promise.reject(new Error(`Unexpected request: ${url}`)));
    render(<BibliotecaCliente mode="admin" />);
    await openLibrary();

    fireEvent.click(screen.getByRole("button", { name: "Substituir Guia.pdf" }));
    fireEvent.change(screen.getByLabelText("Título"), { target: { value: "Guia atualizado.pdf" } });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(["updated pdf"], "guia.pdf", { type: "application/pdf" });
    fireEvent.change(input, { target: { files: [file] } });
    fireEvent.click(screen.getByRole("button", { name: "Substituir versão" }));
    await waitFor(() => expect(mockedApi.replaceLibraryFile).toHaveBeenCalledWith(12, 23, file, "Guia atualizado.pdf"));
    await waitFor(() => expect(screen.queryByRole("dialog", { hidden: true }))
        .not.toBeInTheDocument());

    fireEvent.click(await screen.findByRole("button", { name: "Desativar biblioteca" }));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("Desativar biblioteca?")).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole("button", { name: "Desativar" }));
    await waitFor(() => expect(mockedApi.deactivateLibrary).toHaveBeenCalledWith(12));
});
