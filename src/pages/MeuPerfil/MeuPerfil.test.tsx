import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import MeuPerfil from ".";
import http from "../../http";

jest.mock("../../http", () => ({ __esModule: true, default: { get: jest.fn(), put: jest.fn() } }));
jest.mock("../../stores/autentica.store", () => ({
    __esModule: true, default: { usuario: { token: "test-token" } },
}));
jest.mock("../../PublicPhotoConfig", () => ({ usePublicPhotoBaseUrl: () => "" }));

beforeEach(() => {
    jest.clearAllMocks();
    localStorage.setItem("userID", "1");
    (http.put as jest.Mock).mockResolvedValue({ data: {} });
});

test("staff can edit and clear a long booking link", async () => {
    (http.get as jest.Mock).mockResolvedValue({ data: {
        id: 1, login: "user", email: "user@example.test", nome: "Pessoa",
        papel: "ATENDIMENTO", foto: "", linkAgenda: "https://example.test/old",
    } });
    render(<MeuPerfil />);
    const field = await screen.findByPlaceholderText("https://...");
    expect(field).toHaveValue("https://example.test/old");
    expect(field).toHaveAttribute("maxlength", "2048");
    const url = "https://example.test/" + "x".repeat(90);
    fireEvent.change(field, { target: { value: url } });
    fireEvent.click(screen.getByRole("button", { name: "Atualizar" }));
    await waitFor(() => expect(http.put).toHaveBeenCalledWith("usuarios",
        expect.objectContaining({ id: 1, linkAgenda: url }), expect.anything()));
    fireEvent.change(field, { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: "Atualizar" }));
    await waitFor(() => expect(http.put).toHaveBeenLastCalledWith("usuarios",
        expect.objectContaining({ linkAgenda: "" }), expect.anything()));
});

test("client profile does not show or submit a booking link", async () => {
    (http.get as jest.Mock).mockResolvedValue({ data: {
        id: 1, login: "user", email: "user@example.test", nome: "Pessoa",
        papel: "CLIENTE", foto: "", linkAgenda: null,
    } });
    render(<MeuPerfil />);
    await screen.findByDisplayValue("user@example.test");
    expect(screen.queryByPlaceholderText("https://...")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Atualizar" }));
    await waitFor(() => expect(http.put).toHaveBeenCalled());
    expect((http.put as jest.Mock).mock.calls[0][1]).not.toHaveProperty("linkAgenda");
});
