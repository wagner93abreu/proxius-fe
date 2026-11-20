import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import useMediaQuery from "@mui/material/useMediaQuery";
import http from "../../http";
import AreaCliente from ".";

jest.mock("../../http", () => ({ __esModule: true, default: { get: jest.fn() } }));
jest.mock("../../stores/autentica.store", () => ({
    __esModule: true, default: { usuario: { token: "test-token" }, logout: jest.fn() },
}));
jest.mock("@mui/material/useMediaQuery", () => ({ __esModule: true, default: jest.fn() }));
jest.mock("../../components/PastasCliente", () => ({
    __esModule: true,
    default: ({ sharePointEmbeddedEnabled }: { sharePointEmbeddedEnabled: boolean }) =>
        <div data-testid="desktop-files">{String(sharePointEmbeddedEnabled)}</div>,
}));
jest.mock("../../components/AtalhosAreaCliente", () => ({
    __esModule: true,
    default: ({ sharePointEmbeddedEnabled }: { sharePointEmbeddedEnabled: boolean }) =>
        <div data-testid="mobile-files">{String(sharePointEmbeddedEnabled)}</div>,
}));
jest.mock("../../components/Comentarios", () => () => null);
jest.mock("../../components/MinhasAtividades", () => () => null);
jest.mock("../../components/AgendarSessao", () => () => null);
jest.mock("../../components/ModalPerfilAreaCliente", () => () => null);

beforeEach(() => {
    jest.clearAllMocks();
    localStorage.setItem("userID", "9");
});
afterEach(() => localStorage.clear());

test.each([
    [false, "desktop-files", true],
    [true, "mobile-files", true],
    [false, "desktop-files", false],
    [true, "mobile-files", undefined],
])("passes only explicit record opt-in to customer files (mobile %s, surface %s, flag %s)", async (mobile, testId, enabled) => {
    (useMediaQuery as jest.Mock).mockReturnValue(mobile);
    (http.get as jest.Mock).mockImplementation((url: string) => {
        if (url.startsWith("clifor/filter")) return Promise.resolve({
            data: [{ id: 197, nomecomercial: "Cliente", sharePointEmbeddedEnabled: enabled }],
        });
        if (url.startsWith("card/")) return Promise.resolve({ data: [{ id: "1" }] });
        return Promise.resolve({ data: { nome: "Cliente", papel: "CLIENTE" } });
    });
    render(<AreaCliente />);
    expect(screen.queryByTestId(testId)).not.toBeInTheDocument();
    await waitFor(() => expect(screen.getByTestId(testId)).toHaveTextContent(String(enabled === true)));
});

test.each([[false, "desktop-files"], [true, "mobile-files"]])(
    "defaults to standard storage while the customer record is loading (mobile %s)",
    async (mobile, testId) => {
        (useMediaQuery as jest.Mock).mockReturnValue(mobile);
        let resolveDetail!: (response: unknown) => void;
        (http.get as jest.Mock).mockImplementation((url: string) => {
            if (url.startsWith("clifor/filter")) return new Promise(resolve => { resolveDetail = resolve; });
            if (url.startsWith("card/")) return Promise.resolve({ data: [{ id: "1" }] });
            return Promise.resolve({ data: { nome: "Cliente", papel: "CLIENTE" } });
        });
        render(<AreaCliente />);
        await waitFor(() => expect(screen.getByTestId(testId)).toHaveTextContent("false"));
        resolveDetail({ data: [{ id: 197, nomecomercial: "Cliente", sharePointEmbeddedEnabled: true }] });
        await waitFor(() => expect(screen.getByTestId(testId)).toHaveTextContent("true"));
    }
);
