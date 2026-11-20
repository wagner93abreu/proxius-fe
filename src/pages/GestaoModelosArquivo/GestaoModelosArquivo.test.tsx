import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import http from "../../http";
import * as modelos from "../../http/modelosArquivo";
import GestaoModelosArquivo from ".";

jest.mock("../../http", () => ({ __esModule: true, default: { get: jest.fn() } }));
jest.mock("../../http/modelosArquivo", () => ({
    ...jest.requireActual("../../http/modelosArquivo"),
    listModelos: jest.fn(), createModelo: jest.fn(), updateModelo: jest.fn(),
    deactivateModelo: jest.fn(), listModeloContents: jest.fn(),
    createModeloFolder: jest.fn(), uploadModeloFile: jest.fn(), withdrawModeloFile: jest.fn(),
    deleteModeloFile: jest.fn(), getModeloFileContent: jest.fn(),
    renameModeloFolder: jest.fn(), deleteModeloFolder: jest.fn(),
}));
const api = modelos as jest.Mocked<typeof modelos>;
const model = { id: 3, nome: "Admissão", descricao: "Original", ativo: true };
const folder = { id: "parent", name: "Documentos", folder: {}, size: null, webUrl: null, contentType: null, lastModifiedDateTime: null };

beforeEach(() => {
    jest.resetAllMocks();
    process.env.REACT_APP_SHAREPOINT_ENABLED = "true";
    process.env.REACT_APP_MODEL_CATALOG_ENABLED = "true";
    localStorage.setItem("userID", "9");
    localStorage.setItem("authToken", "test-token");
    (http.get as jest.Mock).mockResolvedValue({ data: { papel: "ADMIN" } });
    api.listModelos.mockResolvedValue([model]);
    api.listModeloContents.mockResolvedValue([folder]);
});

afterEach(() => {
    localStorage.clear();
    delete process.env.REACT_APP_SHAREPOINT_ENABLED;
    delete process.env.REACT_APP_MODEL_CATALOG_ENABLED;
    jest.restoreAllMocks();
});

test.each(["CLIENTE", "COLABORADOR", "ATENDIMENTO"])("denies catalog management to %s", async (papel) => {
    (http.get as jest.Mock).mockResolvedValue({ data: { papel } });
    render(<GestaoModelosArquivo />);
    expect(await screen.findByText("Acesso restrito a administradores.")).toBeInTheDocument();
    expect(api.listModelos).not.toHaveBeenCalled();
    expect(screen.queryByRole("button", { name: "Novo modelo" })).not.toBeInTheDocument();
});

test("does not request the catalog when disabled", async () => {
    process.env.REACT_APP_MODEL_CATALOG_ENABLED = "false";
    render(<GestaoModelosArquivo />);
    expect(await screen.findByText(/acervo de modelos está temporariamente indisponível/)).toBeInTheDocument();
    expect(api.listModelos).not.toHaveBeenCalled();
});

test("admin creates, edits and deactivates a model without altering delivered copies", async () => {
    api.createModelo.mockResolvedValue(model);
    api.updateModelo.mockResolvedValue({ ...model, nome: "Admissão atualizada" });
    api.deactivateModelo.mockResolvedValue();
    render(<GestaoModelosArquivo />);
    fireEvent.click(await screen.findByRole("button", { name: "Novo modelo" }));
    fireEvent.change(screen.getByLabelText("Nome"), { target: { value: " Admissão " } });
    fireEvent.change(screen.getByLabelText("Descrição"), { target: { value: " Original " } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));
    await waitFor(() => expect(api.createModelo).toHaveBeenCalledWith("Admissão", "Original"));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    fireEvent.click(await screen.findByRole("button", { name: "Editar" }));
    fireEvent.change(screen.getByLabelText("Nome"), { target: { value: "Admissão atualizada" } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));
    await waitFor(() => expect(api.updateModelo).toHaveBeenCalledWith(3, "Admissão atualizada", "Original"));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    const confirm = jest.spyOn(window, "confirm").mockReturnValue(true);
    fireEvent.click(await screen.findByRole("button", { name: "Desativar" }));
    await waitFor(() => expect(api.deactivateModelo).toHaveBeenCalledWith(3));
    expect(confirm).toHaveBeenCalledWith(expect.stringContaining("cópias já entregues não serão alteradas"));
});

test("navigates folders and uploads multiple supported originals under the selected parent", async () => {
    api.listModeloContents.mockResolvedValueOnce([folder]).mockResolvedValue([]);
    api.createModeloFolder.mockResolvedValue(folder);
    api.uploadModeloFile.mockResolvedValue({ ...folder, folder: null, name: "original.docx" });
    render(<GestaoModelosArquivo />);
    fireEvent.click(await screen.findByRole("button", { name: "Admissão" }));
    fireEvent.click(await screen.findByRole("button", { name: "Documentos" }));
    await screen.findByText("Esta pasta está vazia.");
    expect(api.listModeloContents).toHaveBeenLastCalledWith(3, "parent");
    fireEvent.click(screen.getByRole("button", { name: "Criar pasta" }));
    fireEvent.change(screen.getByLabelText("Nome da pasta"), { target: { value: " Filha " } });
    fireEvent.click(screen.getAllByRole("button", { name: "Criar pasta" }).pop()!);
    await waitFor(() => expect(api.createModeloFolder).toHaveBeenCalledWith(3, "Filha", "parent"));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    fireEvent.change(screen.getByTestId("modelo-file-input"), { target: { files: [new File(["pdf"], "scan.pdf")] } });
    expect(await screen.findByText(/original editável suportado/)).toBeInTheDocument();
    expect(api.uploadModeloFile).not.toHaveBeenCalled();
    const originals = [
        new File(["original"], "original.docx"),
        new File(["spreadsheet"], "salary.xlsx"),
    ];
    fireEvent.change(screen.getByTestId("modelo-file-input"), { target: { files: originals } });
    fireEvent.click(screen.getByRole("button", { name: "Enviar originais" }));
    await waitFor(() => {
        expect(api.uploadModeloFile).toHaveBeenCalledTimes(2);
        expect(api.uploadModeloFile).toHaveBeenNthCalledWith(1, 3, originals[0], "parent");
        expect(api.uploadModeloFile).toHaveBeenNthCalledWith(2, 3, originals[1], "parent");
    });
    await waitFor(() => expect(api.listModeloContents).toHaveBeenCalledTimes(4));
    fireEvent.click(screen.getByRole("button", { name: "Voltar para pasta anterior" }));
    await waitFor(() => expect(api.listModeloContents).toHaveBeenLastCalledWith(3, undefined));
});

test("retries only failed model originals after a partial upload", async () => {
    const first = new File(["first"], "first.docx");
    const retry = new File(["retry"], "retry.xlsx");
    let retryAttempts = 0;
    api.uploadModeloFile.mockImplementation(async (_modelId, file) => {
        if (file === retry && retryAttempts++ === 0) throw new Error("Temporary upload failure");
        return { ...folder, folder: null, name: file.name };
    });
    render(<GestaoModelosArquivo />);
    fireEvent.click(await screen.findByRole("button", { name: "Admissão" }));
    fireEvent.change(screen.getByTestId("modelo-file-input"), { target: { files: [first, retry] } });
    fireEvent.click(screen.getByRole("button", { name: "Enviar originais" }));

    expect(await screen.findByText("retry.xlsx — Falha")).toBeInTheDocument();
    expect(screen.getByText("first.docx — Enviado")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
    await waitFor(() => {
        expect(api.uploadModeloFile).toHaveBeenCalledTimes(3);
        expect(api.uploadModeloFile).toHaveBeenNthCalledWith(1, 3, first, undefined);
        expect(api.uploadModeloFile).toHaveBeenNthCalledWith(2, 3, retry, undefined);
        expect(api.uploadModeloFile).toHaveBeenNthCalledWith(3, 3, retry, undefined);
    });
});

test("previews PDF originals through the authenticated content API", async () => {
    const pdf = { ...folder, id: "pdf-file", name: "guia.pdf", folder: null, contentType: "application/pdf" };
    const office = { ...folder, id: "office-file", name: "contrato.docx", folder: null,
        contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" };
    api.listModeloContents.mockResolvedValue([pdf, office]);
    api.getModeloFileContent.mockResolvedValue(new Blob(["pdf"], { type: "application/pdf" }));
    const createObjectUrl = jest.fn().mockReturnValue("blob:model-preview");
    const revokeObjectUrl = jest.fn();
    Object.defineProperty(URL, "createObjectURL", { configurable: true, value: createObjectUrl });
    Object.defineProperty(URL, "revokeObjectURL", { configurable: true, value: revokeObjectUrl });

    render(<GestaoModelosArquivo />);
    fireEvent.click(await screen.findByRole("button", { name: "Admissão" }));
    fireEvent.click(await screen.findByRole("button", { name: "Visualizar" }));
    expect(await screen.findByTitle("Pré-visualização de guia.pdf")).toHaveAttribute("src", "blob:model-preview");
    expect(api.getModeloFileContent).toHaveBeenCalledWith(3, "pdf-file");
    fireEvent.click(screen.getByRole("button", { name: "Fechar visualização" }));
    await waitFor(() => expect(revokeObjectUrl).toHaveBeenCalledWith("blob:model-preview"));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
});

test("only offers permanent deletion with confirmation and preserves original download", async () => {
    const pdf = { ...folder, id: "pdf-file", name: "guia.pdf", folder: null, contentType: "application/pdf" };
    const office = { ...folder, id: "office-file", name: "contrato.docx", folder: null,
        contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" };
    api.listModeloContents.mockResolvedValue([pdf, office]);
    api.deleteModeloFile.mockResolvedValue(undefined);
    const confirm = jest.spyOn(window, "confirm").mockReturnValue(false);

    render(<GestaoModelosArquivo />);
    fireEvent.click(await screen.findByRole("button", { name: "Admissão" }));
    await waitFor(() => expect(screen.getAllByRole("button", { name: "Excluir arquivo" })[0]).toBeEnabled());
    expect(screen.queryByRole("button", { name: "Retirar" })).not.toBeInTheDocument();
    fireEvent.click(screen.getAllByRole("button", { name: "Excluir arquivo" })[0]);
    expect(api.deleteModeloFile).not.toHaveBeenCalled();
    confirm.mockReturnValue(true);

    await waitFor(() => expect(screen.getAllByRole("button", { name: "Excluir arquivo" })[0]).toBeEnabled());
    fireEvent.click(screen.getAllByRole("button", { name: "Excluir arquivo" })[0]);
    await waitFor(() => expect(api.deleteModeloFile).toHaveBeenCalledWith(3, "pdf-file"));
    expect(confirm).toHaveBeenLastCalledWith(expect.stringContaining("Excluir permanentemente"));
    expect(confirm).toHaveBeenLastCalledWith(expect.stringContaining("cópias já entregues"));
    expect(screen.getByRole("button", { name: "Baixar original" })).toBeInTheDocument();
});

test("presents the catalog with the light document-management layout", async () => {
    render(<GestaoModelosArquivo />);
    expect(screen.getByRole("heading", { level: 1, name: "Modelos de arquivos" })).toBeInTheDocument();
    expect(screen.getByText("Gestão documental")).toBeInTheDocument();
    expect(await screen.findByText("1 modelo")).toBeInTheDocument();
    expect(screen.getByText("Ativo")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Admissão" }));
    expect(await screen.findByRole("navigation", { name: "Caminho do modelo" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Admissão" })).toBeInTheDocument();
});

describe("model folder rename and recursive delete (ADMIN)", () => {
    const axiosError = (status: number) => Object.assign(new Error(`HTTP ${status}`), { isAxiosError: true, response: { status } });
    function deferred<T>() {
        let resolve!: (value: T) => void;
        let reject!: (reason: unknown) => void;
        const promise = new Promise<T>((res, rej) => { resolve = res; reject = rej; });
        return { promise, resolve, reject };
    }
    async function openModel(folderName = "Documentos") {
        render(<GestaoModelosArquivo />);
        fireEvent.click(await screen.findByRole("button", { name: "Admissão" }));
        await screen.findByRole("button", { name: folderName });
    }

    test("preserves a legitimate hexadecimal folder suffix when renaming and refreshes the current listing", async () => {
        api.listModeloContents.mockResolvedValue([{ ...folder, name: "Documentos - 0f0e0d0c" }]);
        api.renameModeloFolder.mockResolvedValue({ ...folder, name: "Documentos RH" });
        await openModel("Documentos - 0f0e0d0c");
        fireEvent.click(screen.getByLabelText("Renomear pasta Documentos - 0f0e0d0c"));
        expect(screen.getByLabelText("Novo nome da pasta")).toHaveValue("Documentos - 0f0e0d0c");
        expect(screen.getByRole("button", { name: "Salvar" })).toBeDisabled();
        fireEvent.change(screen.getByLabelText("Novo nome da pasta"), { target: { value: " Documentos RH " } });
        fireEvent.click(screen.getByRole("button", { name: "Salvar" }));
        await waitFor(() => expect(api.renameModeloFolder).toHaveBeenCalledWith(3, "parent", "Documentos RH"));
        await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
        expect(api.listModeloContents).toHaveBeenCalledTimes(2);
        expect(api.listModeloContents).toHaveBeenLastCalledWith(3, undefined);
    });

    test("keeps the rename dialog locked while busy and shows errors in context", async () => {
        const pending = deferred<null>();
        api.renameModeloFolder.mockReturnValue(pending.promise);
        await openModel();
        fireEvent.click(screen.getByLabelText("Renomear pasta Documentos"));
        fireEvent.change(screen.getByLabelText("Novo nome da pasta"), { target: { value: "Duplicada" } });
        fireEvent.click(screen.getByRole("button", { name: "Salvar" }));
        expect(await screen.findByRole("button", { name: "Salvando..." })).toBeDisabled();
        expect(screen.getByRole("button", { name: "Cancelar" })).toBeDisabled();
        fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
        expect(screen.getByRole("dialog")).toBeInTheDocument();
        pending.reject(axiosError(409));
        expect(await screen.findByText(/Já existe um item com este nome/)).toBeInTheDocument();
        expect(screen.getByLabelText("Novo nome da pasta")).toHaveValue("Duplicada");
        fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
        await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    });

    test("requires typing excluir exactly, supports cancel and deletes recursively", async () => {
        api.deleteModeloFolder.mockResolvedValue();
        await openModel();
        fireEvent.click(screen.getByLabelText("Excluir pasta Documentos"));
        expect(screen.getByRole("dialog")).toHaveTextContent("todas as subpastas e arquivos dentro dela também serão removidos");
        const confirm = screen.getByRole("button", { name: "Excluir pasta" });
        expect(confirm).toBeDisabled();
        fireEvent.change(screen.getByLabelText('Digite "excluir" para confirmar'), { target: { value: "Excluir" } });
        expect(confirm).toBeDisabled();
        fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
        await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
        expect(api.deleteModeloFolder).not.toHaveBeenCalled();

        fireEvent.click(screen.getByLabelText("Excluir pasta Documentos"));
        fireEvent.change(screen.getByLabelText('Digite "excluir" para confirmar'), { target: { value: "excluir" } });
        fireEvent.click(screen.getByRole("button", { name: "Excluir pasta" }));
        await waitFor(() => expect(api.deleteModeloFolder).toHaveBeenCalledWith(3, "parent"));
        await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
        expect(api.listModeloContents).toHaveBeenLastCalledWith(3, undefined);
    });

    test("locks delete while busy, keeps errors, and returns to the parent after deleting the open folder", async () => {
        api.listModeloContents.mockImplementation(async (_id, parentId) => parentId ? [] : [folder]);
        const pending = deferred<void>();
        api.deleteModeloFolder.mockReturnValueOnce(pending.promise).mockResolvedValue();
        await openModel();
        fireEvent.click(screen.getByRole("button", { name: "Documentos" }));
        await screen.findByText("Esta pasta está vazia.");
        fireEvent.click(screen.getByLabelText("Excluir pasta Documentos"));
        fireEvent.change(screen.getByLabelText('Digite "excluir" para confirmar'), { target: { value: "excluir" } });
        fireEvent.click(screen.getByRole("button", { name: "Excluir pasta" }));
        expect(await screen.findByRole("button", { name: "Excluindo..." })).toBeDisabled();
        expect(screen.getByRole("button", { name: "Cancelar" })).toBeDisabled();
        pending.reject(axiosError(403));
        expect(await screen.findByText("Você não tem permissão para esta ação.")).toBeInTheDocument();
        expect(screen.getByLabelText('Digite "excluir" para confirmar')).toHaveValue("excluir");
        fireEvent.click(screen.getByRole("button", { name: "Excluir pasta" }));
        await waitFor(() => expect(api.deleteModeloFolder).toHaveBeenCalledTimes(2));
        await waitFor(() => expect(api.listModeloContents).toHaveBeenLastCalledWith(3, undefined));
        await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
        expect(screen.queryByRole("button", { name: "Voltar para pasta anterior" })).not.toBeInTheDocument();
    });
});

test("surfaces catalog errors without closing the save dialog", async () => {
    api.createModelo.mockRejectedValue(Object.assign(new Error("Forbidden"), { isAxiosError: true, response: { status: 403 } }));
    render(<GestaoModelosArquivo />);
    fireEvent.click(await screen.findByRole("button", { name: "Novo modelo" }));
    fireEvent.change(screen.getByLabelText("Nome"), { target: { value: "Novo" } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));
    expect(await screen.findByText("Você não tem permissão para esta ação.")).toBeInTheDocument();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
});
