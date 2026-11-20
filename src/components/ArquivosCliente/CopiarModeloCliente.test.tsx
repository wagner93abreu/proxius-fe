import React from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import http from "../../http";
import { getModeloCopy, listModelos, startModeloCopy } from "../../http/modelosArquivo";
import CopiarModeloCliente from "./CopiarModeloCliente";

jest.mock("../../http", () => ({ __esModule: true, default: { get: jest.fn() } }));
jest.mock("../../http/modelosArquivo", () => ({
    ...jest.requireActual("../../http/modelosArquivo"),
    listModelos: jest.fn(), startModeloCopy: jest.fn(), getModeloCopy: jest.fn(),
}));
const get = http.get as jest.Mock;
const start = startModeloCopy as jest.Mock;
const poll = getModeloCopy as jest.Mock;
const storageKey = "model-copy:9:197";

beforeEach(() => {
    jest.resetAllMocks();
    Object.defineProperty(window, "crypto", {
        configurable: true,
        value: { getRandomValues: (bytes: Uint8Array) => bytes.fill(7) },
    });
    process.env.REACT_APP_MODEL_CATALOG_ENABLED = "true";
    localStorage.setItem("userID", "9");
    localStorage.setItem("authToken", "team-token");
    get.mockImplementation((path: string) => Promise.resolve({
        data: path.startsWith("usuarios") ? { papel: "ATENDIMENTO" } : { id: 197, nomecomercial: "Cliente validado" },
    }));
    (listModelos as jest.Mock).mockResolvedValue([{ id: 3, nome: "Admissão", ativo: true }]);
    start.mockResolvedValue({ id: "op-1", estado: "PENDENTE" });
    poll.mockResolvedValue({ id: "op-1", estado: "EM_ANDAMENTO", progresso: 30 });
});

afterEach(() => {
    localStorage.clear();
    delete process.env.REACT_APP_MODEL_CATALOG_ENABLED;
    jest.useRealTimers();
    jest.restoreAllMocks();
});

async function selectModel() {
    fireEvent.click(await screen.findByRole("button", { name: "Copiar modelo para cliente" }));
    fireEvent.mouseDown(await screen.findByRole("combobox", { name: "Modelo" }));
    fireEvent.click(await screen.findByRole("option", { name: "Admissão" }));
}

test("does not contact model endpoints while disabled", () => {
    delete process.env.REACT_APP_MODEL_CATALOG_ENABLED;
    render(<CopiarModeloCliente cliforId={197} />);
    expect(get).not.toHaveBeenCalled();
    expect(screen.queryByRole("button", { name: "Copiar modelo para cliente" })).not.toBeInTheDocument();
});

test.each(["CLIENTE", "COLABORADOR"])("does not offer model copying to %s or validate its destination", async (papel) => {
    get.mockResolvedValue({ data: { papel } });
    render(<CopiarModeloCliente cliforId={197} />);
    await waitFor(() => expect(get).toHaveBeenCalledTimes(1));
    expect(screen.queryByRole("button", { name: "Copiar modelo para cliente" })).not.toBeInTheDocument();
    expect(listModelos).not.toHaveBeenCalled();
    expect(poll).not.toHaveBeenCalled();
});

test("rejects a mismatched Clifor rather than offering a copy", async () => {
    get.mockResolvedValueOnce({ data: { papel: "ADMIN" } }).mockResolvedValueOnce({ data: { id: 999 } });
    render(<CopiarModeloCliente cliforId={197} />);
    expect(await screen.findByText(/Cliente de destino inválido/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Copiar modelo para cliente" })).not.toBeInTheDocument();
});

test.each(["ADMIN", "ATENDIMENTO"])("%s explicitly confirms no overwrite, polls and navigates to the destination", async (papel) => {
    get.mockResolvedValueOnce({ data: { papel } }).mockResolvedValueOnce({ data: { id: 197, nomecomercial: "Cliente validado" } });
    poll.mockResolvedValue({ id: "op-1", estado: "CONCLUIDA", pastaDestinoId: "destino", nomePastaDestino: "Admissão entregue" });
    const navigate = jest.fn();
    render(<CopiarModeloCliente cliforId={197} onNavigate={navigate} />);
    await selectModel();
    expect(screen.getByText(/Cliente validado/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Confirmar cópia" })).toBeDisabled();
    fireEvent.click(screen.getByRole("checkbox", { name: /sem sobrescrever/ }));
    fireEvent.click(screen.getByRole("button", { name: "Confirmar cópia" }));
    fireEvent.click(await screen.findByRole("button", { name: "Abrir pasta de destino" }));
    expect(navigate).toHaveBeenCalledWith("destino", "Admissão entregue");
    expect(start).toHaveBeenCalledWith(197, 3, expect.any(String));
    expect(poll).toHaveBeenCalledWith("op-1");
    expect(JSON.parse(localStorage.getItem(storageKey)!).operation.estado).toBe("CONCLUIDA");
});

test("an uncertain POST survives remount and retries the same model and key", async () => {
    start.mockRejectedValueOnce(new Error("Resposta perdida"));
    const { unmount } = render(<CopiarModeloCliente cliforId={197} />);
    await selectModel();
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: "Confirmar cópia" }));
    await screen.findByText("Resposta perdida");
    const key = start.mock.calls[0][2];
    expect(key).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    expect(key).toBe("07070707-0707-4707-8707-070707070707");
    expect(JSON.parse(localStorage.getItem(storageKey)!).key).toBe(key);
    unmount();
    render(<CopiarModeloCliente cliforId={197} />);
    fireEvent.click(await screen.findByRole("button", { name: "Copiar modelo para cliente" }));
    fireEvent.click(await screen.findByRole("button", { name: "Tentar novamente com a mesma chave" }));
    await waitFor(() => expect(start).toHaveBeenLastCalledWith(197, 3, key));
    await screen.findByText(/Cópia em andamento —/);
    expect(start).toHaveBeenCalledTimes(2);
});

test("reopening a completed copy reloads a renamed destination and persists its current label", async () => {
    localStorage.setItem(storageKey, JSON.stringify({
        modeloId: 3, nomeModelo: "Admissão", key: "12345678-1234-4234-8234-123456789abc",
        operation: { id: "op-1", estado: "CONCLUIDA", pastaDestinoId: "destino", nomePastaDestino: "Nome antigo" },
    }));
    poll.mockResolvedValue({ id: "op-1", estado: "CONCLUIDA", pastaDestinoId: "destino", nomePastaDestino: "Nome atualizado" });
    const navigate = jest.fn();
    render(<CopiarModeloCliente cliforId={197} onNavigate={navigate} />);
    fireEvent.click(await screen.findByRole("button", { name: "Copiar modelo para cliente" }));
    expect(await screen.findByText("Pasta de destino: Nome atualizado")).toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole("button", { name: "Abrir pasta de destino" })).toBeEnabled());
    fireEvent.click(screen.getByRole("button", { name: "Abrir pasta de destino" }));
    expect(navigate).toHaveBeenCalledWith("destino", "Nome atualizado");
    expect(JSON.parse(localStorage.getItem(storageKey)!).operation.nomePastaDestino).toBe("Nome atualizado");
    expect(start).not.toHaveBeenCalled();
});

test("persists the native randomUUID unchanged before posting", async () => {
    const key = "12345678-1234-4234-8234-123456789abc";
    Object.defineProperty(window, "crypto", {
        configurable: true,
        value: { randomUUID: jest.fn(() => key) },
    });
    start.mockImplementation(() => {
        expect(JSON.parse(localStorage.getItem(storageKey)!).key).toBe(key);
        return Promise.reject(new Error("Resposta perdida"));
    });
    render(<CopiarModeloCliente cliforId={197} />);
    await selectModel();
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: "Confirmar cópia" }));
    await screen.findByText("Resposta perdida");
    expect(start).toHaveBeenCalledWith(197, 3, key);
});

test("repairs a rejected legacy fallback key before retrying and persists its canonical form", async () => {
    localStorage.setItem(storageKey, JSON.stringify({
        modeloId: 3, nomeModelo: "Admissão", key: "07070707070707070707070707070707",
    }));
    const key = "07070707-0707-4707-8707-070707070707";
    start.mockImplementation(() => {
        expect(JSON.parse(localStorage.getItem(storageKey)!).key).toBe(key);
        return Promise.reject(new Error("Resposta perdida"));
    });
    render(<CopiarModeloCliente cliforId={197} />);
    fireEvent.click(await screen.findByRole("button", { name: "Copiar modelo para cliente" }));
    fireEvent.click(await screen.findByRole("button", { name: "Tentar novamente com a mesma chave" }));
    await screen.findByText("Resposta perdida");
    expect(start).toHaveBeenCalledWith(197, 3, key);
    expect(listModelos).not.toHaveBeenCalled();
});

test("does not rewrite a stored key attached to an existing completed operation", async () => {
    const key = "07070707070707070707070707070707";
    poll.mockResolvedValue({ id: "op-1", estado: "CONCLUIDA", pastaDestinoId: "destination-folder" });
    localStorage.setItem(storageKey, JSON.stringify({
        modeloId: 3, nomeModelo: "Admissão", key,
        operation: { id: "op-1", estado: "CONCLUIDA", pastaDestinoId: "destination-folder" },
    }));
    render(<CopiarModeloCliente cliforId={197} />);
    fireEvent.click(await screen.findByRole("button", { name: "Copiar modelo para cliente" }));
    expect(await screen.findByText(/Cópia concluída —/)).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem(storageKey)!).key).toBe(key);
    expect(start).not.toHaveBeenCalled();
    expect(poll).toHaveBeenCalledTimes(1);
});

test("does not start a non-durable operation when persisting its key fails", async () => {
    render(<CopiarModeloCliente cliforId={197} />);
    await selectModel();
    const storage = jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
        throw new Error("Armazenamento indisponível");
    });
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: "Confirmar cópia" }));
    expect(await screen.findByText("Armazenamento indisponível")).toBeInTheDocument();
    expect(start).not.toHaveBeenCalled();
    storage.mockRestore();
});

test("restores an operation, surfaces polling errors, resumes and reports server failure", async () => {
    localStorage.setItem(storageKey, JSON.stringify({
        modeloId: 3, nomeModelo: "Admissão", key: "same-key", operation: { id: "op-1", estado: "PENDENTE" },
    }));
    poll.mockRejectedValueOnce(new Error("Servidor indisponível")).mockResolvedValue({
        id: "op-1", estado: "FALHOU", erro: "Destino indisponível",
    });
    render(<CopiarModeloCliente cliforId={197} />);
    fireEvent.click(await screen.findByRole("button", { name: "Copiar modelo para cliente" }));
    expect(await screen.findByText(/Não foi possível atualizar o estado/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
    expect(await screen.findByText(/Destino indisponível/)).toBeInTheDocument();
    expect(start).not.toHaveBeenCalled();
    expect(poll).toHaveBeenCalledTimes(2);
    const confirm = jest.spyOn(window, "confirm").mockReturnValue(false);
    fireEvent.click(screen.getByRole("button", { name: "Iniciar outra cópia" }));
    expect(confirm).toHaveBeenCalled();
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    confirm.mockReturnValue(true);
    fireEvent.click(screen.getByRole("button", { name: "Iniciar outra cópia" }));
    fireEvent.mouseDown(await screen.findByRole("combobox", { name: "Modelo" }));
    fireEvent.click(await screen.findByRole("option", { name: "Admissão" }));
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: "Confirmar cópia" }));
    await waitFor(() => expect(start).toHaveBeenCalled());
    expect(start.mock.calls[0][2]).not.toBe("same-key");
});

test("polls while dialog is closed, and stops after unmount", async () => {
    jest.useFakeTimers();
    localStorage.setItem(storageKey, JSON.stringify({
        modeloId: 3, nomeModelo: "Admissão", key: "same-key", operation: { id: "op-1", estado: "PENDENTE" },
    }));
    const { unmount } = render(<CopiarModeloCliente cliforId={197} />);
    await act(async () => { await Promise.resolve(); });
    await waitFor(() => expect(poll).toHaveBeenCalledTimes(1));
    await act(async () => { jest.advanceTimersByTime(3000); });
    expect(poll).toHaveBeenCalledTimes(2);
    unmount();
    await act(async () => { jest.advanceTimersByTime(6000); });
    expect(poll).toHaveBeenCalledTimes(2);
});
