import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import http from "../../http";
import Meta from ".";
import ModalMensagens from "../../components/ModalMensagens";

jest.mock("../../http", () => ({ __esModule: true, default: { get: jest.fn(), delete: jest.fn() } }));
jest.mock("../../stores/autentica.store", () => ({
    __esModule: true,
    default: { usuario: { token: "test-token" } },
}));

const mockedHttp = http as jest.Mocked<typeof http>;

beforeEach(() => {
    jest.resetAllMocks();
    mockedHttp.get.mockResolvedValue({
        data: { content: [{ id: 1, data: "2026-10-01", valorMinimo: 8000, valorPadrao: 10000, valorMaximo: 12000 }] },
    } as never);
});

afterEach(() => jest.restoreAllMocks());

test("presents sales goals in the light layout with formatted values", async () => {
    render(<><Meta /><ModalMensagens /></>);

    expect(screen.getByRole("heading", { level: 1, name: "Meta de Vendas" })).toBeInTheDocument();
    expect(await screen.findByText("01/10/2026")).toBeInTheDocument();
    expect(screen.getByText("1 meta")).toBeInTheDocument();
    for (const name of ["Cadastrar meta", "Editar meta", "Excluir"]) {
        expect(screen.getByRole("button", { name })).toBeInTheDocument();
    }
});

test("keeps the existing selection validation when editing without a selected goal", async () => {
    const alert = jest.spyOn(window, "alert").mockImplementation(() => undefined);
    render(<><Meta /><ModalMensagens /></>);
    await screen.findByText("01/10/2026");

    fireEvent.click(screen.getByRole("button", { name: "Editar meta" }));
    const dialog = await screen.findByRole("alertdialog", { name: "Atenção" });
    expect(dialog).toHaveTextContent("nenhum registro selecionado!");
    expect(alert).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Entendi" }));
    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: "Cadastrar meta" }));
    expect(await screen.findByRole("heading", { name: "Cadastrar Meta" })).toBeInTheDocument();
    await waitFor(() => expect(mockedHttp.get).toHaveBeenCalled());
});
