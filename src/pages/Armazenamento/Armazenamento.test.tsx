import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Armazenamento from ".";
import http from "../../http";

jest.mock("../../http", () => ({
    __esModule: true, default: { get: jest.fn() },
}));
jest.mock("../../stores/autentica.store", () => ({
    __esModule: true, default: { usuario: { token: "tenant-token" } },
}));

const get = http.get as jest.Mock;
const originalLocation = window.location;
const summary = {
    tenantId: "tenant-id", slug: "rhsc", name: "Empresa RHSC", tenantStatus: "ACTIVE", simulated: true as const,
    state: "PARTIAL" as const, usedBytes: null, knownBytes: 1024, expectedContainers: 2, collectedContainers: 1,
    collectedAt: "2026-01-02T03:04:05Z", lastCompleteAt: "2025-12-31T12:00:00Z",
    lastCompleteBytes: 2048, stale: false,
};

beforeEach(() => {
    jest.resetAllMocks();
    localStorage.setItem("userID", "1");
    Object.defineProperty(window, "location", {
        configurable: true, value: { ...originalLocation, hostname: "rhsc.localhost" },
    });
});
afterEach(() => {
    localStorage.removeItem("userID");
    Object.defineProperty(window, "location", { configurable: true, value: originalLocation });
});

test("renders partial measurements as a known subtotal, not a total", async () => {
    get.mockImplementation((path: string) => {
        if (path.startsWith("usuarios/")) return Promise.resolve({ data: { papel: "ADMIN" } });
        if (path === "armazenamento") return Promise.resolve({
            data: { summary, containers: [{ id: "internal-id", purposes: "documentos", localResource: "rhsc-docs",
                state: "COMPLETE", usedBytes: 1024, collectedAt: summary.collectedAt, error: null }] },
        });
        if (path.startsWith("armazenamento/historico?")) return Promise.resolve({
            data: { items: [summary], page: 0, size: 24, hasNext: false },
        });
        return Promise.reject(new Error("Unexpected request"));
    });
    render(<MemoryRouter><Armazenamento /></MemoryRouter>);

    expect(await screen.findAllByText(/Subtotal conhecido: 1\.024 bytes/)).not.toHaveLength(0);
    expect(screen.getByText(/não é o total/)).toBeInTheDocument();
    expect(screen.getByText(/2\.048 bytes/)).toBeInTheDocument();
    expect(screen.getByText("documentos")).toBeInTheDocument();
    expect(screen.getByText("SIMULATED")).toBeInTheDocument();
    await waitFor(() => expect(get).toHaveBeenCalledWith(
        expect.stringMatching(/^armazenamento\/historico\?page=0&size=24$/),
        expect.objectContaining({ headers: { Authorization: "Bearer tenant-token" } }),
    ));
});

test("distinguishes a failed collection from zero bytes and reports history API errors", async () => {
    get.mockImplementation((path: string) => {
        if (path.startsWith("usuarios/")) return Promise.resolve({ data: { papel: "ADMIN" } });
        if (path === "armazenamento") return Promise.resolve({
            data: { summary: { ...summary, state: "FAILED", usedBytes: null, knownBytes: 0, lastCompleteBytes: null },
                containers: [] },
        });
        return Promise.reject({ isAxiosError: true, response: { status: 404 } });
    });
    render(<MemoryRouter><Armazenamento /></MemoryRouter>);

    expect(await screen.findByText("Falha na coleta; consumo indisponível")).toBeInTheDocument();
    expect(await screen.findByText(/endpoint de armazenamento não está disponível/)).toBeInTheDocument();
    expect(screen.queryByText(/0 bytes/)).not.toBeInTheDocument();
});

test("renders a measured zero distinctly from an unmeasured or failed result", async () => {
    get.mockImplementation((path: string) => {
        if (path.startsWith("usuarios/")) return Promise.resolve({ data: { papel: "ADMIN" } });
        if (path === "armazenamento") return Promise.resolve({
            data: { summary: { ...summary, state: "COMPLETE", usedBytes: 0, knownBytes: 0, lastCompleteBytes: 0 },
                containers: [] },
        });
        if (path.startsWith("armazenamento/historico?")) return Promise.resolve({
            data: { items: [], page: 0, size: 24, hasNext: false },
        });
        return Promise.reject(new Error("Unexpected request"));
    });
    render(<MemoryRouter><Armazenamento /></MemoryRouter>);

    expect(await screen.findAllByText("0 bytes (0,000000 GiB)")).not.toHaveLength(0);
    expect(screen.queryByText(/Ainda não medido/)).not.toBeInTheDocument();
});

test("does not request storage for non-admin users", async () => {
    get.mockResolvedValue({ data: { papel: "USER" } });
    render(<MemoryRouter><Armazenamento /></MemoryRouter>);

    expect(await screen.findByText(/somente para ADMIN/)).toBeInTheDocument();
    expect(get).toHaveBeenCalledTimes(1);
    expect(get).toHaveBeenCalledWith("usuarios/1", expect.any(Object));
});

test("does not make API requests outside local tenant hosts", () => {
    Object.defineProperty(window, "location", {
        configurable: true, value: { ...originalLocation, hostname: "rhintegrado.com.br" },
    });
    render(<MemoryRouter><Armazenamento /></MemoryRouter>);
    expect(screen.getByText(/somente em um subdomínio local/)).toBeInTheDocument();
    expect(get).not.toHaveBeenCalled();
});
