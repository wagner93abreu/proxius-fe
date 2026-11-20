import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import ArquivosCliente from ".";
import * as sharepoint from "../../http/sharepoint";

jest.mock("../../http/sharepoint", () => {
    const actual = jest.requireActual("../../http/sharepoint");
    return {
        ...actual,
        listFiles: jest.fn(),
        getCapabilities: jest.fn(),
        uploadFile: jest.fn(),
        downloadFile: jest.fn(),
        deleteFile: jest.fn(),
        createLink: jest.fn(),
        previewFile: jest.fn(),
        createFolder: jest.fn(),
        renameFolder: jest.fn(),
        deleteFolder: jest.fn(),
    };
});

const mocked = sharepoint as jest.Mocked<typeof sharepoint>;

const docx = {
    id: "item-1",
    name: "Contrato.docx",
    size: 2048,
    webUrl: null,
    contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    lastModifiedDateTime: "2026-09-25T12:00:00Z",
};

const clientCaps = { linksEnabled: true, canDelete: false, canUpload: true, maxFileSizeBytes: 10 * 1024 * 1024 };

function axiosError(status: number) {
    return Object.assign(new Error(`HTTP ${status}`), { isAxiosError: true, response: { status } });
}

beforeEach(() => {
    jest.resetAllMocks();
    mocked.listFiles.mockResolvedValue([docx]);
    mocked.getCapabilities.mockResolvedValue(clientCaps);
});

test("lists files and hides delete for clients", async () => {
    render(<ArquivosCliente cliforId={197} />);

    expect(await screen.findByText("Contrato.docx")).toBeInTheDocument();
    expect(mocked.listFiles).toHaveBeenCalledWith(197, undefined);
    expect(screen.queryByLabelText("Excluir Contrato.docx")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Editar Contrato.docx")).toBeInTheDocument();
});

test("shows delete for staff and deletes after confirmation", async () => {
    mocked.getCapabilities.mockResolvedValue({ ...clientCaps, canDelete: true });
    mocked.deleteFile.mockResolvedValue();
    render(<ArquivosCliente cliforId={197} />);

    fireEvent.click(await screen.findByLabelText("Excluir Contrato.docx"));
    fireEvent.click(screen.getByRole("button", { name: "Excluir" }));

    await waitFor(() => expect(mocked.deleteFile).toHaveBeenCalledWith(197, "item-1"));
    await waitFor(() => expect(screen.queryByText("Contrato.docx")).not.toBeInTheDocument());
});

test("uploads the selected file and refreshes the list", async () => {
    mocked.uploadFile.mockResolvedValue(docx);
    render(<ArquivosCliente cliforId={197} />);
    await screen.findByText("Contrato.docx");

    const file = new File(["abc"], "novo.pdf", { type: "application/pdf" });
    fireEvent.change(screen.getByTestId("sharepoint-file-input"), { target: { files: [file] } });

    await waitFor(() => expect(mocked.uploadFile).toHaveBeenCalledWith(197, file, expect.any(Function), undefined));
    await waitFor(() => expect(mocked.listFiles).toHaveBeenCalledTimes(2));
});

test("navigates nested folders and represents an empty folder", async () => {
    const folder = { ...docx, id: "folder-1", name: "Modelos", folder: { childCount: 0 } };
    mocked.listFiles.mockReset().mockResolvedValueOnce([folder]).mockResolvedValueOnce([]);
    render(<ArquivosCliente cliforId={197} />);

    fireEvent.click(await screen.findByRole("button", { name: "Modelos" }));

    expect(await screen.findByText("Esta pasta está vazia.")).toBeInTheDocument();
    expect(mocked.listFiles).toHaveBeenLastCalledWith(197, "folder-1");
    fireEvent.click(screen.getByRole("button", { name: "Arquivos Editáveis" }));
    await waitFor(() => expect(mocked.listFiles).toHaveBeenLastCalledWith(197, undefined));
});

test("uploads a file into the currently open folder", async () => {
    const folder = { ...docx, id: "folder-1", name: "Clientes", folder: { childCount: 1 } };
    mocked.listFiles.mockReset().mockResolvedValueOnce([folder]).mockResolvedValue([docx]);
    mocked.uploadFile.mockResolvedValue(docx);
    render(<ArquivosCliente cliforId={197} />);
    fireEvent.click(await screen.findByRole("button", { name: "Clientes" }));
    await screen.findByText("Contrato.docx");

    const file = new File(["abc"], "novo.docx");
    fireEvent.change(screen.getByTestId("sharepoint-file-input"), { target: { files: [file] } });

    await waitFor(() => expect(mocked.uploadFile).toHaveBeenCalledWith(
        197,
        file,
        expect.any(Function),
        "folder-1"
    ));
});

test("finishing an upload after navigation does not replace the new folder listing", async () => {
    const folder = { ...docx, id: "parent", name: "Pai", folder: {} };
    mocked.listFiles.mockResolvedValueOnce([folder]).mockResolvedValue([]);
    let finishUpload: (file: typeof docx) => void = () => { throw new Error("Upload not started"); };
    mocked.uploadFile.mockImplementation(() => new Promise((resolve) => { finishUpload = resolve; }));
    render(<ArquivosCliente cliforId={197} />);
    fireEvent.click(await screen.findByRole("button", { name: "Pai" }));
    await screen.findByText("Esta pasta está vazia.");
    fireEvent.change(screen.getByTestId("sharepoint-file-input"), {
        target: { files: [new File(["abc"], "novo.docx")] },
    });
    fireEvent.click(screen.getByRole("button", { name: "Arquivos Editáveis" }));
    await waitFor(() => expect(mocked.listFiles).toHaveBeenLastCalledWith(197, undefined));
    finishUpload(docx);
    await waitFor(() => expect(screen.queryByText(/Enviando/)).not.toBeInTheDocument());
    expect(mocked.listFiles).toHaveBeenCalledTimes(3);
    expect(mocked.listFiles).toHaveBeenLastCalledWith(197, undefined);
});

test.each([false, true])("creates a normal client folder when canDelete is %s", async (canDelete) => {
    mocked.getCapabilities.mockResolvedValue({ ...clientCaps, canDelete });
    mocked.createFolder.mockResolvedValue({ ...docx, id: "new-folder", name: "Nova", folder: {} });
    render(<ArquivosCliente cliforId={197} />);
    await screen.findByText("Contrato.docx");
    fireEvent.click(screen.getByRole("button", { name: "Criar pasta" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirmar criação" }));
    expect(screen.getByText("Informe o nome da pasta.")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Nome da pasta"), { target: { value: " Nova " } });
    fireEvent.click(screen.getByRole("button", { name: "Confirmar criação" }));
    await waitFor(() => expect(mocked.createFolder).toHaveBeenCalledWith(197, "Nova", undefined));
    await waitFor(() => expect(mocked.listFiles).toHaveBeenCalledTimes(2));
});

test("respects folder capability denial and reports creation failure in a nested folder", async () => {
    mocked.getCapabilities.mockResolvedValue({ ...clientCaps, canCreateFolder: false });
    const { unmount } = render(<ArquivosCliente cliforId={197} />);
    await screen.findByText("Contrato.docx");
    expect(screen.queryByRole("button", { name: "Criar pasta" })).not.toBeInTheDocument();
    unmount();
    mocked.getCapabilities.mockResolvedValue(clientCaps);
    mocked.listFiles.mockResolvedValueOnce([{ ...docx, id: "parent", name: "Pai", folder: {} }]).mockResolvedValue([]);
    mocked.createFolder.mockRejectedValue(axiosError(403));
    render(<ArquivosCliente cliforId={197} />);
    fireEvent.click(await screen.findByRole("button", { name: "Pai" }));
    await screen.findByText("Esta pasta está vazia.");
    fireEvent.click(screen.getByRole("button", { name: "Criar pasta" }));
    fireEvent.change(screen.getByLabelText("Nome da pasta"), { target: { value: "Filha" } });
    fireEvent.click(screen.getByRole("button", { name: "Confirmar criação" }));
    expect(await screen.findByText("Você não tem permissão para esta ação.")).toBeInTheDocument();
    expect(mocked.createFolder).toHaveBeenCalledWith(197, "Filha", "parent");
});

test("blocks files larger than the backend limit before uploading", async () => {
    mocked.getCapabilities.mockResolvedValue({ ...clientCaps, maxFileSizeBytes: 2 });
    render(<ArquivosCliente cliforId={197} />);
    await screen.findByText("Contrato.docx");

    const file = new File(["abc"], "grande.pdf");
    fireEvent.change(screen.getByTestId("sharepoint-file-input"), { target: { files: [file] } });

    expect(await screen.findByText(/excede o tamanho máximo/)).toBeInTheDocument();
    expect(mocked.uploadFile).not.toHaveBeenCalled();
});

test("shows a friendly message when the backend rejects the upload with 413", async () => {
    mocked.uploadFile.mockRejectedValue(axiosError(413));
    render(<ArquivosCliente cliforId={197} />);
    await screen.findByText("Contrato.docx");

    fireEvent.change(screen.getByTestId("sharepoint-file-input"), {
        target: { files: [new File(["abc"], "a.pdf")] },
    });

    expect(await screen.findByText("O arquivo excede o tamanho máximo permitido.")).toBeInTheDocument();
});

test("opens the edit link in a tab opened synchronously", async () => {
    const tab = { opener: {}, location: { href: "" }, close: jest.fn() };
    const openSpy = jest.spyOn(window, "open").mockReturnValue(tab as unknown as Window);
    mocked.createLink.mockResolvedValue({
        webUrl: "https://tenant.sharepoint.com/edit",
        type: "edit",
        scope: "anonymous",
        expirationDateTime: null,
    });
    render(<ArquivosCliente cliforId={197} />);

    fireEvent.click(await screen.findByLabelText("Editar Contrato.docx"));

    expect(openSpy).toHaveBeenCalledWith("", "_blank");
    await waitFor(() => expect(tab.location.href).toBe("https://tenant.sharepoint.com/edit"));
    expect(tab.opener).toBeNull();
    openSpy.mockRestore();
});

test("clicking an Office file name opens it directly in the online editor", async () => {
    const tab = { opener: {}, location: { href: "" }, close: jest.fn() };
    const openSpy = jest.spyOn(window, "open").mockReturnValue(tab as unknown as Window);
    mocked.createLink.mockResolvedValue({
        webUrl: "https://tenant.sharepoint.com/edit?action=edit",
        type: "edit",
        scope: "anonymous",
        expirationDateTime: null,
    });
    render(<ArquivosCliente cliforId={197} />);

    fireEvent.click(await screen.findByText("Contrato.docx"));

    await waitFor(() => expect(tab.location.href).toBe("https://tenant.sharepoint.com/edit?action=edit"));
    expect(mocked.createLink).toHaveBeenCalledWith(197, "item-1", "edit");
    openSpy.mockRestore();
});

test("opens the preview inside a dialog iframe", async () => {
    mocked.previewFile.mockResolvedValue({ url: "https://tenant.sharepoint.com/embed?nb=true" });
    render(<ArquivosCliente cliforId={197} />);

    fireEvent.click(await screen.findByLabelText("Visualizar Contrato.docx"));

    const iframe = await screen.findByTitle("Visualização de Contrato.docx");
    expect(iframe).toHaveAttribute("src", "https://tenant.sharepoint.com/embed?nb=true");
});

describe("folder rename and recursive delete", () => {
    const folder = { ...docx, id: "folder-1", name: "Contratos - 1a2b3c4d", size: null, folder: { childCount: 3 } };

    function deferred<T>() {
        let resolve!: (value: T) => void;
        let reject!: (reason: unknown) => void;
        const promise = new Promise<T>((res, rej) => { resolve = res; reject = rej; });
        return { promise, resolve, reject };
    }

    beforeEach(() => {
        mocked.listFiles.mockResolvedValue([folder, docx]);
        mocked.getCapabilities.mockResolvedValue({ ...clientCaps, canManageFolders: true });
    });

    test("folder actions follow canManageFolders, not the staff file canDelete permission", async () => {
        mocked.getCapabilities.mockResolvedValue({ ...clientCaps, canDelete: true, canManageFolders: false });
        const { unmount } = render(<ArquivosCliente cliforId={197} />);
        await screen.findByText("Contrato.docx");
        expect(screen.getByLabelText("Excluir Contrato.docx")).toBeInTheDocument();
        expect(screen.queryByLabelText("Renomear pasta Contratos")).not.toBeInTheDocument();
        expect(screen.queryByLabelText("Excluir pasta Contratos")).not.toBeInTheDocument();
        unmount();

        mocked.getCapabilities.mockResolvedValue({ ...clientCaps, canDelete: false, canManageFolders: true });
        render(<ArquivosCliente cliforId={197} />);
        expect(await screen.findByLabelText("Renomear pasta Contratos")).toBeInTheDocument();
        expect(screen.getByLabelText("Excluir pasta Contratos")).toBeInTheDocument();
        expect(screen.queryByLabelText("Excluir Contrato.docx")).not.toBeInTheDocument();
    });

    test("renames using the visible display name and refreshes the list", async () => {
        mocked.renameFolder.mockResolvedValue({ ...folder, name: "Contratos 2026" });
        render(<ArquivosCliente cliforId={197} />);
        fireEvent.click(await screen.findByLabelText("Renomear pasta Contratos"));
        const input = screen.getByLabelText("Novo nome da pasta");
        expect(input).toHaveValue("Contratos");
        expect(screen.getByRole("button", { name: "Salvar" })).toBeDisabled();
        fireEvent.change(input, { target: { value: "  Contratos 2026 " } });
        fireEvent.click(screen.getByRole("button", { name: "Salvar" }));
        await waitFor(() => expect(mocked.renameFolder).toHaveBeenCalledWith(197, "folder-1", "Contratos 2026"));
        await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
        expect(mocked.listFiles).toHaveBeenCalledTimes(2);
    });

    test("cancelling rename does not call the API", async () => {
        render(<ArquivosCliente cliforId={197} />);
        fireEvent.click(await screen.findByLabelText("Renomear pasta Contratos"));
        fireEvent.change(screen.getByLabelText("Novo nome da pasta"), { target: { value: "Outro" } });
        fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
        await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
        expect(mocked.renameFolder).not.toHaveBeenCalled();
    });

    test("locks the rename dialog while busy and keeps the typed name with the error", async () => {
        const pending = deferred<null>();
        mocked.renameFolder.mockReturnValue(pending.promise);
        render(<ArquivosCliente cliforId={197} />);
        fireEvent.click(await screen.findByLabelText("Renomear pasta Contratos"));
        fireEvent.change(screen.getByLabelText("Novo nome da pasta"), { target: { value: "Duplicada" } });
        fireEvent.click(screen.getByRole("button", { name: "Salvar" }));
        expect(await screen.findByRole("button", { name: "Salvando..." })).toBeDisabled();
        expect(screen.getByRole("button", { name: "Cancelar" })).toBeDisabled();
        fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
        expect(screen.getByRole("dialog")).toBeInTheDocument();
        pending.reject(axiosError(409));
        expect(await screen.findByText(/Já existe um item com este nome/)).toBeInTheDocument();
        expect(screen.getByLabelText("Novo nome da pasta")).toHaveValue("Duplicada");
        expect(screen.getByRole("button", { name: "Cancelar" })).toBeEnabled();
        expect(mocked.listFiles).toHaveBeenCalledTimes(1);
    });

    test("requires the exact typed confirmation, warns about all contents and supports cancel", async () => {
        mocked.deleteFolder.mockResolvedValue();
        render(<ArquivosCliente cliforId={197} />);
        fireEvent.click(await screen.findByLabelText("Excluir pasta Contratos"));
        const dialog = screen.getByRole("dialog");
        expect(dialog).toHaveTextContent("todas as subpastas e arquivos dentro dela também serão removidos");
        expect(dialog).toHaveTextContent("Itens diretamente nesta pasta: 3");
        const confirm = screen.getByRole("button", { name: "Excluir pasta" });
        const input = screen.getByLabelText('Digite "excluir" para confirmar');
        expect(confirm).toBeDisabled();
        for (const value of ["Excluir", "excluir ", "EXCLUIR", "exclui"]) {
            fireEvent.change(input, { target: { value } });
            expect(confirm).toBeDisabled();
        }
        fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
        await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
        expect(mocked.deleteFolder).not.toHaveBeenCalled();

        fireEvent.click(screen.getByLabelText("Excluir pasta Contratos"));
        expect(screen.getByLabelText('Digite "excluir" para confirmar')).toHaveValue("");
        fireEvent.change(screen.getByLabelText('Digite "excluir" para confirmar'), { target: { value: "excluir" } });
        fireEvent.click(screen.getByRole("button", { name: "Excluir pasta" }));
        await waitFor(() => expect(mocked.deleteFolder).toHaveBeenCalledWith(197, "folder-1"));
        await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
        expect(mocked.listFiles).toHaveBeenCalledTimes(2);
    });

    test("locks the delete dialog while busy and retains the error in context", async () => {
        const pending = deferred<void>();
        mocked.deleteFolder.mockReturnValue(pending.promise);
        render(<ArquivosCliente cliforId={197} />);
        fireEvent.click(await screen.findByLabelText("Excluir pasta Contratos"));
        fireEvent.change(screen.getByLabelText('Digite "excluir" para confirmar'), { target: { value: "excluir" } });
        fireEvent.click(screen.getByRole("button", { name: "Excluir pasta" }));
        expect(await screen.findByRole("button", { name: "Excluindo..." })).toBeDisabled();
        expect(screen.getByRole("button", { name: "Cancelar" })).toBeDisabled();
        fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
        expect(screen.getByRole("dialog")).toBeInTheDocument();
        pending.reject(axiosError(502));
        expect(await screen.findByText(/Falha ao comunicar com o SharePoint/)).toBeInTheDocument();
        expect(screen.getByRole("dialog")).toHaveTextContent("Contratos");
        expect(screen.getByLabelText('Digite "excluir" para confirmar')).toHaveValue("excluir");
        expect(screen.getByRole("button", { name: "Excluir pasta" })).toBeEnabled();
    });

    test("renaming the open folder updates the breadcrumb and deleting it returns to the parent", async () => {
        mocked.listFiles.mockReset().mockImplementation(async (_id, parentId) => parentId ? [] : [folder]);
        mocked.renameFolder.mockResolvedValue(null);
        mocked.deleteFolder.mockResolvedValue();
        render(<ArquivosCliente cliforId={197} />);
        fireEvent.click(await screen.findByRole("button", { name: "Contratos" }));
        await screen.findByText("Esta pasta está vazia.");
        fireEvent.click(screen.getByLabelText("Renomear pasta Contratos"));
        fireEvent.change(screen.getByLabelText("Novo nome da pasta"), { target: { value: "Acordos" } });
        fireEvent.click(screen.getByRole("button", { name: "Salvar" }));
        await waitFor(() => expect(mocked.renameFolder).toHaveBeenCalledWith(197, "folder-1", "Acordos"));
        expect(await screen.findByRole("button", { name: "Acordos" })).toHaveAttribute("aria-current", "location");

        fireEvent.click(screen.getByLabelText("Excluir pasta Acordos"));
        fireEvent.change(screen.getByLabelText('Digite "excluir" para confirmar'), { target: { value: "excluir" } });
        fireEvent.click(screen.getByRole("button", { name: "Excluir pasta" }));
        await waitFor(() => expect(mocked.deleteFolder).toHaveBeenCalledWith(197, "folder-1"));
        await waitFor(() => expect(mocked.listFiles).toHaveBeenLastCalledWith(197, undefined));
        await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
        expect(await screen.findByRole("button", { name: "Contratos" })).toBeInTheDocument();
        expect(screen.queryByRole("button", { name: "Acordos" })).not.toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Arquivos Editáveis" })).toBeDisabled();
    });
});

test("parses RFC 5987 file names from Content-Disposition", () => {
    expect(
        sharepoint.fileNameFromContentDisposition(
            "attachment; filename=\"=?UTF-8?Q?x?=\"; filename*=UTF-8''Relat%C3%B3rio%20final.pdf",
            "fallback"
        )
    ).toBe("Relatório final.pdf");
    expect(sharepoint.fileNameFromContentDisposition('attachment; filename="a.pdf"', "f")).toBe("a.pdf");
    expect(sharepoint.fileNameFromContentDisposition(undefined, "f")).toBe("f");
});
