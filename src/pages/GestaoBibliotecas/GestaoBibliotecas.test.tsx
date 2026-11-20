import React from "react";
import { render, screen } from "@testing-library/react";
import GestaoBibliotecas from ".";
import http from "../../http";
import { isLibraryEnabled } from "../../http/bibliotecas";

jest.mock("../../http", () => ({
    __esModule: true,
    default: { get: jest.fn() },
}));
jest.mock("../../http/bibliotecas", () => ({
    isLibraryEnabled: jest.fn(() => true),
    libraryAuthHeaders: jest.requireActual("../../http/bibliotecas").libraryAuthHeaders,
}));
jest.mock("../../components/BibliotecaCliente", () => ({
    __esModule: true,
    default: ({ cliforId, mode }: { cliforId?: number; mode: string }) => {
        const theme = jest.requireActual("@mui/material/styles").useTheme();
        return <div style={{ color: theme.palette.primary.main, backgroundColor: theme.palette.background.paper }}>
            Gestão {mode}: {cliforId ?? "nenhum cliente"}
        </div>;
    },
}));

const get = http.get as jest.Mock;

beforeEach(() => {
    localStorage.setItem("userID", "9");
    localStorage.setItem("authToken", "test-token");
    get.mockReset();
    (isLibraryEnabled as jest.Mock).mockReturnValue(true);
    get.mockImplementation((url: string) => {
        if (url === "usuarios/9") return Promise.resolve({ data: { papel: "ADMIN" } });
        return Promise.reject(new Error("Unexpected request"));
    });
});

afterEach(() => localStorage.clear());

test("presents an accessible page heading and scopes the light wine theme to management", async () => {
    render(<GestaoBibliotecas />);
    expect(screen.getByRole("heading", { level: 1, name: "Gestão de bibliotecas" })).toBeInTheDocument();
    expect(await screen.findByText("Gestão admin: nenhum cliente")).toHaveStyle({
        color: "#55081d",
        backgroundColor: "#fffdfa",
    });
});

test("keeps the expired-session message and does not request data without credentials", () => {
    localStorage.removeItem("authToken");
    render(<GestaoBibliotecas />);
    expect(screen.getByRole("alert")).toHaveTextContent("Sua sessão expirou. Faça login novamente.");
    expect(get).not.toHaveBeenCalled();
});

test("keeps the feature-disabled warning without rendering management", async () => {
    (isLibraryEnabled as jest.Mock).mockReturnValue(false);
    render(<GestaoBibliotecas />);
    expect(await screen.findByRole("alert")).toHaveTextContent("Habilite REACT_APP_LIBRARY_ENABLED");
    expect(screen.queryByText(/Gestão admin:/)).not.toBeInTheDocument();
});

test("opens global library management without requiring a client selection", async () => {
    render(<GestaoBibliotecas />);
    expect(await screen.findByText("Gestão admin: nenhum cliente")).toBeInTheDocument();
    expect(get).toHaveBeenCalledWith("usuarios/9", expect.objectContaining({
        headers: expect.objectContaining({ Authorization: expect.any(String) }),
    }));
    expect(get).toHaveBeenCalledTimes(1);
    expect(screen.queryByLabelText("ID do cliente (para concessões)")).not.toBeInTheDocument();
});

test("blocks management for non-admin users", async () => {
    get.mockResolvedValue({ data: { papel: "CLIENTE" } });
    render(<GestaoBibliotecas />);
    expect(await screen.findByText("Acesso restrito a administradores.")).toBeInTheDocument();
    expect(screen.queryByText(/Gestão admin:/)).not.toBeInTheDocument();
});

test("reports authentication failures rather than claiming the user lacks admin access", async () => {
    get.mockRejectedValue(new Error("Invalid token"));
    render(<GestaoBibliotecas />);
    expect(await screen.findByText("Não foi possível verificar o perfil. Faça login novamente.")).toBeInTheDocument();
    expect(screen.queryByText("Acesso restrito a administradores.")).not.toBeInTheDocument();
});
