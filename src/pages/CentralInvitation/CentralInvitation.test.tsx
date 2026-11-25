import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import axios from "axios";
import CentralInvitation from ".";
import { TextEncoder } from "util";

jest.mock("axios", () => ({
    __esModule: true,
    default: {
        create: jest.fn(() => ({ post: jest.fn() })),
        isAxiosError: (error: { isAxiosError?: boolean }) => error.isAxiosError === true,
    },
}));
const post = (axios.create as jest.Mock).mock.results[0].value.post as jest.Mock;
const code = "A".repeat(43);
beforeEach(() => post.mockReset());

test("sets the initial password with a code and confirmation", async () => {
    const original = global.TextEncoder;
    Object.defineProperty(global, "TextEncoder", { configurable: true, value: TextEncoder });
    post.mockResolvedValue({});
    try {
        render(<MemoryRouter><CentralInvitation mode="setup" /></MemoryRouter>);
        fireEvent.change(screen.getByLabelText("Código de ativação"), { target: { value: code } });
        fireEvent.change(screen.getByLabelText("Nova senha"), { target: { value: "owner-password" } });
        fireEvent.change(screen.getByLabelText("Confirme a senha"), { target: { value: "different" } });
        fireEvent.click(screen.getByRole("button", { name: "Definir senha" }));
        expect(screen.getByRole("alert")).toHaveTextContent("senhas devem coincidir");
        expect(post).not.toHaveBeenCalled();
        fireEvent.change(screen.getByLabelText("Confirme a senha"), { target: { value: "owner-password" } });
        fireEvent.click(screen.getByRole("button", { name: "Definir senha" }));
        await screen.findByRole("status");
        expect(post).toHaveBeenCalledWith("central-discovery/setup-password",
            { token: code, password: "owner-password" });
        expect(screen.queryByLabelText("Nova senha")).not.toBeInTheDocument();
    } finally {
        Object.defineProperty(global, "TextEncoder", { configurable: true, value: original });
    }
});

test("verifies the code in the request body and offers the invitation step", async () => {
    post.mockResolvedValue({});
    render(<MemoryRouter><CentralInvitation mode="verify" /></MemoryRouter>);
    fireEvent.change(screen.getByLabelText("Código de verificação"), { target: { value: code } });
    fireEvent.click(screen.getByRole("button", { name: "Verificar" }));
    await screen.findByRole("status");
    expect(post).toHaveBeenCalledWith("central-discovery/verify-email", { token: code });
    expect(screen.getByRole("link", { name: /Ir para aceite/ })).toHaveAttribute("href", "/aceitar-convite");
    expect(screen.queryByLabelText("Código de verificação")).not.toBeInTheDocument();
});

test("accepts an invitation with the account credentials, without storing the secret", async () => {
    post.mockResolvedValue({});
    render(<MemoryRouter><CentralInvitation mode="accept" /></MemoryRouter>);
    fireEvent.change(screen.getByLabelText("Código do convite"), { target: { value: code } });
    fireEvent.change(screen.getByLabelText("E-mail da conta"), { target: { value: "test@example.invalid" } });
    fireEvent.change(screen.getByLabelText("Senha da conta"), { target: { value: "secret" } });
    fireEvent.click(screen.getByRole("button", { name: "Aceitar convite" }));
    await screen.findByRole("status");
    expect(post).toHaveBeenCalledWith("central-discovery/accept-invitation",
        { token: code, email: "test@example.invalid", password: "secret" });
    expect(screen.queryByLabelText("Senha da conta")).not.toBeInTheDocument();
    expect(localStorage.getItem("authToken")).toBeNull();
});

test("reports invalid or expired invitations without claiming success", async () => {
    post.mockRejectedValue({ isAxiosError: true, response: { status: 400 } });
    render(<MemoryRouter><CentralInvitation mode="accept" /></MemoryRouter>);
    fireEvent.change(screen.getByLabelText("Código do convite"), { target: { value: code } });
    fireEvent.change(screen.getByLabelText("E-mail da conta"), { target: { value: "test@example.invalid" } });
    fireEvent.change(screen.getByLabelText("Senha da conta"), { target: { value: "secret" } });
    fireEvent.click(screen.getByRole("button", { name: "Aceitar convite" }));
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("Convite inválido ou expirado"));
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
});

test("reports rate limiting without claiming success", async () => {
    post.mockRejectedValue({ isAxiosError: true, response: { status: 429 } });
    render(<MemoryRouter><CentralInvitation mode="verify" /></MemoryRouter>);
    fireEvent.change(screen.getByLabelText("Código de verificação"), { target: { value: code } });
    fireEvent.click(screen.getByRole("button", { name: "Verificar" }));
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("Muitas tentativas"));
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
});

test("rejects malformed codes without sending them", async () => {
    render(<MemoryRouter><CentralInvitation mode="verify" /></MemoryRouter>);
    fireEvent.change(screen.getByLabelText("Código de verificação"), { target: { value: "invalid" } });
    fireEvent.click(screen.getByRole("button", { name: "Verificar" }));
    expect(screen.getByRole("alert")).toHaveTextContent("código válido");
    expect(post).not.toHaveBeenCalled();
});
