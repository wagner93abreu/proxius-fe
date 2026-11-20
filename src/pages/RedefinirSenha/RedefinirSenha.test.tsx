import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import http from "../../http";
import ModalMensagens from "../../components/ModalMensagens";
import { fecharMensagem, getMensagemAtual } from "../../stores/mensagem.store";
import RedefinirSenha from ".";

jest.mock("../../http", () => ({ __esModule: true, default: { post: jest.fn() } }));
const mockedHttp = http as jest.Mocked<typeof http>;

afterEach(() => {
    act(() => {
        while (getMensagemAtual()) fecharMensagem();
    });
    jest.useRealTimers();
    jest.resetAllMocks();
});

function renderPage(url: string) {
    render(<MemoryRouter initialEntries={[url]}>
        <Routes>
            <Route path="/redefinir-senha" element={<RedefinirSenha />} />
            <Route path="/login" element={<div>Tela de login</div>} />
        </Routes>
        <ModalMensagens />
    </MemoryRouter>);
}

test("shows an invalid reset link using the shared error modal", async () => {
    renderPage("/redefinir-senha");
    expect(await screen.findByRole("alertdialog")).toHaveTextContent("Link de redefinição inválido.");
    expect(mockedHttp.post).not.toHaveBeenCalled();
});

test("waits for success acknowledgement before redirecting to login", async () => {
    mockedHttp.post.mockResolvedValue({ data: {} });
    renderPage("/redefinir-senha?token=test-token");
    for (const input of screen.getAllByPlaceholderText("*******")) {
        fireEvent.change(input, { target: { value: "nova-senha" } });
    }
    fireEvent.click(screen.getByRole("button", { name: "Redefinir senha" }));
    expect(await screen.findByRole("alertdialog", { name: "Tudo certo!" })).toHaveTextContent("Senha redefinida com sucesso!");

    jest.useFakeTimers();
    act(() => jest.advanceTimersByTime(10000));
    expect(screen.queryByText("Tela de login")).not.toBeInTheDocument();
    jest.useRealTimers();
    fireEvent.click(screen.getByRole("button", { name: "Entendi" }));
    expect(await screen.findByText("Tela de login")).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
});
