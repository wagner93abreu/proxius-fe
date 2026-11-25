import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import ModalCadastro from ".";
import http from "../../../http";
import { centralRegistrationPreviewEnabled } from "../../../centralIdentity";

jest.mock("../../../http", () => ({ __esModule: true, default: { post: jest.fn() } }));
jest.mock("../../../centralIdentity", () => ({
    centralRegistrationPreviewEnabled: jest.fn(),
}));

const post = http.post as jest.Mock;
const centralPreview = centralRegistrationPreviewEnabled as jest.Mock;

beforeEach(() => {
    post.mockReset();
    centralPreview.mockReset();
});

test("central registration omits password and submits a pending invite", async () => {
    centralPreview.mockReturnValue(true);
    post.mockResolvedValue({ data: { status: "SENT" } });
    const handleClose = jest.fn();
    render(<ModalCadastro open handleClose={handleClose} />);

    expect(screen.queryByLabelText("Senha")).not.toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText("Digite seu login"), { target: { value: "new.user" } });
    fireEvent.change(screen.getByPlaceholderText("Digite seu nome"), { target: { value: "New User" } });
    fireEvent.change(screen.getByPlaceholderText("Digite seu email"), { target: { value: "new@example.com" } });
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "CLIENTE" } });
    fireEvent.click(screen.getByRole("button", { name: "Cadastrar" }));

    await waitFor(() => expect(post).toHaveBeenCalledWith("central-users", {
        login: "new.user",
        email: "new@example.com",
        name: "New User",
        role: "CLIENTE",
    }, expect.any(Object)));
    expect(handleClose).toHaveBeenCalled();
});

test("delivery failure keeps the pending identity and offers retry instead of duplicate create", async () => {
    centralPreview.mockReturnValue(true);
    const identityId = "a0b6630f-bae9-478b-b5c5-c770a6bf9e08";
    post.mockRejectedValue({
        isAxiosError: true,
        response: { status: 502, data: { identityId, status: "PENDING_DELIVERY", invitationSent: false } },
    });
    const handleClose = jest.fn();
    render(<ModalCadastro open handleClose={handleClose} />);
    fireEvent.change(screen.getByPlaceholderText("Digite seu login"), { target: { value: "new.user" } });
    fireEvent.change(screen.getByPlaceholderText("Digite seu nome"), { target: { value: "New User" } });
    fireEvent.change(screen.getByPlaceholderText("Digite seu email"), { target: { value: "new@example.com" } });
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "CLIENTE" } });
    fireEvent.click(screen.getByRole("button", { name: "Cadastrar" }));

    const retry = await screen.findByRole("button", { name: "Reemitir convite" });
    expect(screen.getByRole("button", { name: "Cadastro pendente" })).toBeDisabled();
    post.mockResolvedValue({ data: { status: "SENT" } });
    fireEvent.click(retry);

    await waitFor(() => expect(post).toHaveBeenLastCalledWith(`central-users/${identityId}/retry`, {}, expect.any(Object)));
    await waitFor(() => expect(handleClose).toHaveBeenCalled());
});

test("legacy registration still requires and sends a local password", async () => {
    centralPreview.mockReturnValue(false);
    post.mockResolvedValue({});
    render(<ModalCadastro open handleClose={jest.fn()} />);
    fireEvent.change(screen.getByPlaceholderText("Digite seu login"), { target: { value: "new.user" } });
    fireEvent.change(screen.getByPlaceholderText("Digite seu nome"), { target: { value: "New User" } });
    fireEvent.change(screen.getByPlaceholderText("Digite seu email"), { target: { value: "new@example.com" } });
    fireEvent.change(screen.getByPlaceholderText("Digite sua senha"), { target: { value: "password1" } });
    fireEvent.change(screen.getByPlaceholderText("Digite sua senha novamente"), { target: { value: "password1" } });
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "CLIENTE" } });
    fireEvent.click(screen.getByRole("button", { name: "Cadastrar" }));

    await waitFor(() => expect(post).toHaveBeenCalledWith("usuarios", expect.objectContaining({
        password: "password1",
        login: "new.user",
    }), expect.any(Object)));
});
