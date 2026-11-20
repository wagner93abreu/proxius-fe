import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useNavigate } from "react-router-dom";
import useMediaQuery from "@mui/material/useMediaQuery";
import http from "../../http";
import AreaClienteAtendente from ".";

jest.mock("../../http", () => ({ __esModule: true, default: { get: jest.fn() } }));
jest.mock("../../stores/autentica.store", () => ({
    __esModule: true,
    default: { usuario: { token: "test-token" } },
}));
jest.mock("@mui/material/useMediaQuery", () => ({ __esModule: true, default: jest.fn() }));
jest.mock("../../components/PastasCliente", () => ({
    __esModule: true,
    default: ({ cliforId, sharePointEmbeddedEnabled }: { cliforId: string | null; sharePointEmbeddedEnabled: boolean }) =>
        <div data-testid="desktop-client-id" data-embedded={String(sharePointEmbeddedEnabled)}>{String(cliforId)}</div>,
}));
jest.mock("../../components/AtalhosAreaCliente", () => ({
    __esModule: true,
    default: ({ cliforId, sharePointEmbeddedEnabled }: { cliforId: string | null; sharePointEmbeddedEnabled: boolean }) =>
        <div data-testid="mobile-client-id" data-embedded={String(sharePointEmbeddedEnabled)}>{String(cliforId)}</div>,
}));
jest.mock("../../components/Comentarios", () => () => null);
jest.mock("../../components/MinhasAtividadesAtendente", () => () => null);
jest.mock("../../components/AgendarSessao", () => () => null);
jest.mock("../../components/ModalPerfilAreaCliente", () => () => null);

const mockedHttp = http as jest.Mocked<typeof http>;
const mockedUseMediaQuery = useMediaQuery as jest.Mock;
let isMobile = false;

function RouteControls() {
    const navigate = useNavigate();
    return <button onClick={() => navigate("/AreaClienteAtendente/198")}>Load client 198</button>;
}

function renderAtRoute(path = "/AreaClienteAtendente/197") {
    return render(
        <MemoryRouter initialEntries={[path]}>
            <RouteControls />
            <Routes>
                <Route path="/AreaClienteAtendente/:codCliente" element={<AreaClienteAtendente />} />
            </Routes>
        </MemoryRouter>
    );
}

beforeEach(() => {
    jest.resetAllMocks();
    localStorage.clear();
    localStorage.setItem("userID", "9");
    localStorage.setItem("user", "test-user");
    isMobile = false;
    mockedUseMediaQuery.mockImplementation(() => isMobile);
    mockedHttp.get.mockImplementation((url) => {
        if (url === "clifor/197" || url === "clifor/198") {
            return Promise.resolve({ data: { nomecomercial: "Cliente" } }) as never;
        }
        if (url.startsWith("card/")) return Promise.resolve({ data: [] }) as never;
        if (url.startsWith("/usuarios/login/")) return Promise.resolve({ data: { papel: "ADMIN" } }) as never;
        return Promise.resolve({ data: {} }) as never;
    });
});

afterEach(() => {
    localStorage.clear();
});

test.each([
    [false, "desktop-client-id"],
    [true, "mobile-client-id"],
])("loads the route client ID when the detail response omits id (mobile: %s)", async (mobile, testId) => {
    isMobile = mobile;

    renderAtRoute();

    expect(mockedHttp.get).toHaveBeenCalledWith("clifor/197", expect.any(Object));
    await waitFor(() => expect(screen.getByTestId(testId)).toHaveTextContent("197"));
    expect(screen.getByTestId(testId)).toHaveAttribute("data-embedded", "false");
});

test.each([
    [false, "desktop-client-id"],
    [true, "mobile-client-id"],
])("clears the previous client ID on route change (mobile: %s)", async (mobile, testId) => {
    isMobile = mobile;
    let resolveSecondDetail!: (response: { data: { nomecomercial: string } }) => void;
    mockedHttp.get.mockImplementation((url) => {
        if (url === "clifor/197") {
            return Promise.resolve({ data: { nomecomercial: "Cliente 197", sharePointEmbeddedEnabled: true } }) as never;
        }
        if (url === "clifor/198") {
            return new Promise((resolve) => {
                resolveSecondDetail = resolve;
            }) as never;
        }
        if (url.startsWith("card/")) return Promise.resolve({ data: [] }) as never;
        if (url.startsWith("/usuarios/login/")) return Promise.resolve({ data: { papel: "ADMIN" } }) as never;
        return Promise.resolve({ data: {} }) as never;
    });

    renderAtRoute();
    await waitFor(() => expect(screen.getByTestId(testId)).toHaveTextContent("197"));
    expect(screen.getByTestId(testId)).toHaveAttribute("data-embedded", "true");

    fireEvent.click(screen.getByRole("button", { name: "Load client 198" }));
    await waitFor(() => expect(screen.getByTestId(testId)).toHaveTextContent("null"));
    expect(screen.getByTestId(testId)).toHaveAttribute("data-embedded", "false");

    resolveSecondDetail({ data: { nomecomercial: "Cliente 198" } });
    await waitFor(() => expect(screen.getByTestId(testId)).toHaveTextContent("198"));
    expect(screen.getByTestId(testId)).toHaveAttribute("data-embedded", "false");
});
