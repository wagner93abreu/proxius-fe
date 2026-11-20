import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import http from "../../http";
import PainelDeControle from ".";

jest.mock("../../http", () => ({ __esModule: true, default: { get: jest.fn() } }));
jest.mock("../../stores/autentica.store", () => ({
    __esModule: true,
    default: { usuario: { token: "test-token" } },
}));

const mockedHttp = http as jest.Mocked<typeof http>;

function renderPanel() {
    return render(
        <MemoryRouter initialEntries={["/painelDeControle"]}>
            <Routes>
                <Route path="/painelDeControle" element={<PainelDeControle />} />
                <Route path="/painelDeControle/modelos-arquivo" element={<div>Catálogo de modelos</div>} />
            </Routes>
        </MemoryRouter>
    );
}

beforeEach(() => {
    jest.resetAllMocks();
    localStorage.setItem("userID", "9");
    process.env.REACT_APP_LIBRARY_ENABLED = "false";
    process.env.REACT_APP_SHAREPOINT_ENABLED = "false";
    process.env.REACT_APP_MODEL_CATALOG_ENABLED = "false";
    mockedHttp.get.mockResolvedValue({ data: { papel: "ADMIN" } } as never);
});

afterEach(() => {
    localStorage.clear();
    delete process.env.REACT_APP_LIBRARY_ENABLED;
    delete process.env.REACT_APP_SHAREPOINT_ENABLED;
    delete process.env.REACT_APP_MODEL_CATALOG_ENABLED;
});

test("shows and navigates to model files for admins while feature flags are disabled", async () => {
    renderPanel();

    const modelsButton = await screen.findByRole("button", { name: "Modelos de arquivos" });
    expect(screen.queryByRole("button", { name: "Bibliotecas" })).not.toBeInTheDocument();

    fireEvent.click(modelsButton);
    expect(await screen.findByText("Catálogo de modelos")).toBeInTheDocument();
});

test("groups admin shortcuts with icons and descriptions", async () => {
    process.env.REACT_APP_LIBRARY_ENABLED = "true";
    renderPanel();

    expect(await screen.findByRole("heading", { level: 1, name: "Painel de Controle" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Administração e financeiro" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Gestão documental" })).toBeInTheDocument();
    for (const name of ["Usuários", "Taxas", "Categorias Financeiro", "Meta de Vendas", "Bibliotecas", "Modelos de arquivos"]) {
        expect(screen.getByRole("button", { name })).toBeInTheDocument();
    }
    expect(screen.getByRole("button", { name: "Usuários" })).toHaveAccessibleDescription("Gerencie acessos e perfis da equipe.");
});

test("does not show model files to non-admin users", async () => {
    mockedHttp.get.mockResolvedValue({ data: { papel: "ATENDIMENTO" } } as never);

    renderPanel();

    await waitFor(() => expect(mockedHttp.get).toHaveBeenCalled());
    expect(screen.queryByRole("button", { name: "Modelos de arquivos" })).not.toBeInTheDocument();
});

test("offers Asaas settings on a local tenant control panel", async () => {
    const original = window.location;
    Object.defineProperty(window, "location", { configurable: true, value: { ...original, hostname: "rhsc.localhost" } });
    try {
        renderPanel();
        expect(await screen.findByRole("button", { name: "Integração Asaas" })).toBeInTheDocument();
    } finally {
        Object.defineProperty(window, "location", { configurable: true, value: original });
    }
});
