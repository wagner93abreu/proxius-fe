import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import AgendarSessao from ".";
import http from "../../http";

jest.mock("../../http", () => ({ __esModule: true, default: { get: jest.fn() } }));
jest.mock("../../PublicPhotoConfig", () => ({ usePublicPhotoBaseUrl: () => "" }));

beforeEach(() => {
    jest.clearAllMocks();
    localStorage.setItem("authToken", "test-token");
});

test("loads the current attendant's link and opens it safely", async () => {
    (http.get as jest.Mock).mockResolvedValue({ data: { linkAgenda: "https://example.test/booking" } });
    const open = jest.spyOn(window, "open").mockImplementation(() => null);
    render(<AgendarSessao atendenteId={2} atendente="Pessoa" fotoAtendente="" />);
    const button = screen.getByRole("button", { name: "Agende aqui!" });
    await waitFor(() => expect(button).toBeEnabled());
    expect(http.get).toHaveBeenCalledWith("usuarios/2/agenda", {
        headers: { Authorization: "Bearer test-token" },
    });
    fireEvent.click(button);
    expect(open).toHaveBeenCalledWith("https://example.test/booking", "_blank", "noopener,noreferrer");
    open.mockRestore();
});

test("disables booking when no link is configured", async () => {
    (http.get as jest.Mock).mockResolvedValue({ data: { linkAgenda: null } });
    render(<AgendarSessao atendenteId={3} atendente="Pessoa" fotoAtendente="" />);
    expect(await screen.findByText("Agenda não configurada.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Agende aqui!" })).toBeDisabled();
});

test("reports request errors and does not open invalid links", async () => {
    (http.get as jest.Mock).mockRejectedValue(new Error("network"));
    render(<AgendarSessao atendenteId={3} atendente="Pessoa" fotoAtendente="" />);
    expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível carregar a agenda.");
    expect(screen.getByRole("button", { name: "Agende aqui!" })).toBeDisabled();
});

test("does not keep another attendant's link after a change", async () => {
    (http.get as jest.Mock).mockResolvedValueOnce({ data: { linkAgenda: "https://example.test/first" } })
        .mockResolvedValueOnce({ data: { linkAgenda: "javascript:alert(1)" } });
    const { rerender } = render(<AgendarSessao atendenteId={2} atendente="Primeiro" fotoAtendente="" />);
    await waitFor(() => expect(screen.getByRole("button", { name: "Agende aqui!" })).toBeEnabled());
    rerender(<AgendarSessao atendenteId={3} atendente="Segundo" fotoAtendente="" />);
    expect(await screen.findByText("Agenda não configurada.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Agende aqui!" })).toBeDisabled();
});
