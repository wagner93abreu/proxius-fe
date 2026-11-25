import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import IntegracaoAsaas from ".";
import http from "../../http";

jest.mock("../../http", () => ({
    __esModule: true, default: { get: jest.fn(), put: jest.fn(), delete: jest.fn() },
}));
jest.mock("../../stores/autentica.store", () => ({
    __esModule: true, default: { usuario: { token: "tenant-token" } },
}));
const client = http as jest.Mocked<typeof http>;
const originalLocation = window.location;
const empty = { environment: "SANDBOX", apiKeyConfigured: false, webhookTokenConfigured: false, externalCallsEnabled: false, updatedAt: null };
const configured = { ...empty, apiKeyConfigured: true, webhookTokenConfigured: true };

beforeEach(() => {
    jest.resetAllMocks();
    Object.defineProperty(window, "location", { configurable: true, value: { ...originalLocation, hostname: "rhsc.localhost" } });
    client.get.mockResolvedValue({ data: empty });
});
afterEach(() => {
    Object.defineProperty(window, "location", { configurable: true, value: originalLocation });
});
function show() { return render(<MemoryRouter><IntegracaoAsaas /></MemoryRouter>); }

test("saves password fields and clears them after successful encrypted storage", async () => {
    client.put.mockResolvedValue({ data: configured });
    show();
    const api = await screen.findByLabelText(/^Chave da API Asaas/);
    const webhook = screen.getByLabelText(/^Token de autenticacao do webhook/);
    expect(api).toHaveAttribute("type", "password");
    expect(webhook).toHaveAttribute("type", "password");
    expect(api).toBeRequired();
    fireEvent.change(api, { target: { value: "fake-api-key" } });
    fireEvent.change(webhook, { target: { value: "fake-webhook" } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar configuracao" }));
    expect(await screen.findByText(/Chave validada no Sandbox/)).toBeInTheDocument();
    expect(client.put).toHaveBeenCalledWith("integracoes/asaas", {
        environment: "SANDBOX", apiKey: "fake-api-key", webhookToken: "fake-webhook",
    }, { headers: { Authorization: "Bearer tenant-token" } });
    expect(api).toHaveValue("");
    expect(webhook).toHaveValue("");
});

test("does not populate saved secrets and preserves them when fields are blank", async () => {
    client.get.mockResolvedValue({ data: configured });
    client.put.mockResolvedValue({ data: configured });
    show();
    const api = await screen.findByLabelText(/^Chave da API Asaas/);
    expect(api).toHaveValue("");
    expect(api).not.toBeRequired();
    fireEvent.click(screen.getByRole("button", { name: "Salvar configuracao" }));
    await waitFor(() => expect(client.put).toHaveBeenCalledWith("integracoes/asaas", {
        environment: "SANDBOX", apiKey: undefined, webhookToken: undefined,
    }, expect.any(Object)));
});

test("requires both secrets again when changing environment", async () => {
    client.get.mockResolvedValue({ data: configured });
    show();
    await screen.findByLabelText(/^Chave da API Asaas/);
    fireEvent.mouseDown(screen.getByRole("combobox", { name: "Ambiente Asaas" }));
    fireEvent.click(await screen.findByRole("option", { name: /Producao/ }));
    expect(screen.getByLabelText(/^Chave da API Asaas/)).toBeRequired();
    expect(screen.getByLabelText(/^Token de autenticacao do webhook/)).toBeRequired();
});

test("requires confirmation to remove only this tenant's credentials", async () => {
    client.get.mockResolvedValue({ data: configured });
    client.delete.mockResolvedValue({});
    show();
    fireEvent.click(await screen.findByRole("button", { name: "Remover credenciais" }));
    expect(client.delete).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Confirmar remocao" }));
    expect(await screen.findByText("Credenciais removidas desta empresa.")).toBeInTheDocument();
    expect(client.delete).toHaveBeenCalledWith("integracoes/asaas", { headers: { Authorization: "Bearer tenant-token" } });
});

test("does not display the form to non-admin users", async () => {
    client.get.mockRejectedValue({ isAxiosError: true, response: { status: 403 } });
    show();
    expect(await screen.findByText(/Apenas administradores da empresa/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Salvar configuracao" })).not.toBeInTheDocument();
});

test("shows validation failure without clearing entered credentials", async () => {
    client.put.mockRejectedValue({ isAxiosError: true, response: { status: 422 } });
    show();
    const api = await screen.findByLabelText(/^Chave da API Asaas/);
    const webhook = screen.getByLabelText(/^Token de autenticacao do webhook/);
    fireEvent.change(api, { target: { value: "invalid-test-key" } });
    fireEvent.change(webhook, { target: { value: "fake-webhook" } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar configuracao" }));
    expect(await screen.findByText(/Sandbox Asaas recusou a chave/)).toBeInTheDocument();
    expect(api).toHaveValue("invalid-test-key");
    expect(webhook).toHaveValue("fake-webhook");
});

test("never requests configuration outside a local tenant host", () => {
    Object.defineProperty(window, "location", { configurable: true, value: { ...originalLocation, hostname: "rhintegrado.com.br" } });
    show();
    expect(client.get).not.toHaveBeenCalled();
    expect(screen.getByText(/Esta configuracao esta disponivel somente/)).toBeInTheDocument();
});
