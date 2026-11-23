import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { runInAction } from "mobx";
import http from "../../http";
import autenticaStore from "../../stores/autentica.store";
import Login from ".";
import ModalMensagens from "../../components/ModalMensagens";
import { fecharMensagem, getMensagemAtual } from "../../stores/mensagem.store";

jest.mock("../../http", () => ({
    __esModule: true,
    default: { post: jest.fn(), get: jest.fn() },
}));
jest.mock("react-google-recaptcha", () => ({
    __esModule: true,
    default: () => <div>Verificar reCAPTCHA</div>,
}));
const mockedHttp = http as jest.Mocked<typeof http>;

beforeEach(() => {
    jest.resetAllMocks();
    localStorage.clear();
    jest.spyOn(window, "alert").mockImplementation(() => undefined);
});

afterEach(() => {
    act(() => {
        while (getMensagemAtual()) fecharMensagem();
    });
    jest.useRealTimers();
    jest.restoreAllMocks();
});

function renderLogin() {
    render(
        <MemoryRouter>
            <Routes>
                <Route path="/" element={<Login />} />
                <Route path="/home" element={<div>Página inicial</div>} />
            </Routes>
            <ModalMensagens />
        </MemoryRouter>
    );
    fireEvent.change(screen.getByPlaceholderText("login"), { target: { value: "usuario" } });
    fireEvent.change(screen.getByPlaceholderText("*******"), { target: { value: "senha" } });
}

test("apresenta a marca ProxiUs na entrada", () => {
    renderLogin();
    expect(screen.getByRole("img", { name: "ProxiUs" })).toHaveTextContent("P.");
    expect(screen.getByRole("heading", { name: "ProxiUs" })).toBeInTheDocument();
});

test("shows backend errors in a persistent modal and restores focus after closing", async () => {
    mockedHttp.post.mockRejectedValue({
        isAxiosError: true,
        response: { data: { message: "Login ou senha inválidos." } },
    });
    renderLogin();
    const submit = screen.getByRole("button", { name: "Entrar" });
    submit.focus();
    fireEvent.click(submit);

    const dialog = await screen.findByRole("alertdialog");
    expect(within(dialog).getByText("Login ou senha inválidos.")).toBeInTheDocument();
    jest.useFakeTimers();
    act(() => jest.advanceTimersByTime(6000));
    expect(dialog).toBeVisible();
    jest.useRealTimers();
    fireEvent.click(within(dialog).getByRole("button", { name: "Entendi" }));

    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
    expect(submit).toHaveFocus();
    expect(mockedHttp.post).toHaveBeenCalledWith("login", { login: "usuario", senha: "senha" }, expect.any(Object));
    expect(window.alert).not.toHaveBeenCalled();
});

test.each(["a.localhost", "b.localhost", "nova-empresa.localhost", "proxius.com.br", "main.example.amplifyapp.com"])("allows login without reCAPTCHA on %s", async (hostname) => {
    const originalLocation = window.location;
    Object.defineProperty(window, "location", {
        configurable: true,
        value: { ...originalLocation, hostname },
    });
    mockedHttp.post.mockRejectedValue({
        isAxiosError: true,
        response: { data: { message: "Erro de teste" } },
    });
    try {
        renderLogin();
        expect(screen.queryByText("Verificar reCAPTCHA")).not.toBeInTheDocument();
        fireEvent.click(screen.getByRole("button", { name: "Entrar" }));
        expect(await screen.findByRole("alertdialog")).toHaveTextContent("Erro de teste");
        expect(mockedHttp.post).toHaveBeenCalledWith("login", { login: "usuario", senha: "senha" }, expect.any(Object));
    } finally {
        Object.defineProperty(window, "location", { configurable: true, value: originalLocation });
    }
});

test("shows the backend login error without calling browser alert", async () => {
    mockedHttp.post.mockRejectedValue({
        isAxiosError: true,
        response: { data: { message: "Login ou senha inválidos." } },
    });
    renderLogin();
    fireEvent.click(screen.getByRole("button", { name: "Entrar" }));

    expect(await screen.findByRole("alertdialog")).toHaveTextContent("Login ou senha inválidos.");
    expect(mockedHttp.post).toHaveBeenCalledWith("login", { login: "usuario", senha: "senha" }, expect.any(Object));
    expect(window.alert).not.toHaveBeenCalled();
});

test("keeps login unauthenticated and shows an error when loading user data fails", async () => {
    mockedHttp.post.mockResolvedValue({ data: { token: "test-token" } });
    mockedHttp.get.mockRejectedValue({
        isAxiosError: true,
        response: { data: { message: "Erro ao buscar dados do usuário." } },
    });
    renderLogin();
    fireEvent.click(screen.getByRole("button", { name: "Entrar" }));

    expect(await screen.findByRole("alertdialog")).toHaveTextContent("Erro ao buscar dados do usuário.");
    expect(mockedHttp.get).toHaveBeenCalledWith("usuarios/login/usuario", expect.any(Object));
    expect(autenticaStore.estaAutenticado).toBe(false);
    expect(localStorage.getItem("authToken")).toBeNull();
    expect(screen.queryByText("Página inicial")).not.toBeInTheDocument();
    expect(window.alert).not.toHaveBeenCalled();
});

test("shows password recovery errors in the modal and preserves the recovery form", async () => {
    mockedHttp.post.mockRejectedValue({
        isAxiosError: true,
        response: { data: { erro: "Não foi possível enviar o link." } },
    });
    renderLogin();
    fireEvent.click(screen.getByRole("button", { name: "Esqueceu sua senha?" }));
    fireEvent.change(screen.getByPlaceholderText("seuemail@exemplo.com"), { target: { value: "teste@example.com" } });
    fireEvent.click(screen.getByRole("button", { name: "Enviar link" }));

    const dialog = await screen.findByRole("alertdialog");
    expect(dialog).toHaveTextContent("Não foi possível enviar o link.");
    fireEvent.click(within(dialog).getByRole("button", { name: "Entendi" }));

    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
    expect(screen.getByRole("dialog")).toBeVisible();
    expect(screen.getByPlaceholderText("seuemail@exemplo.com")).toHaveValue("teste@example.com");
    expect(window.alert).not.toHaveBeenCalled();
});

test("persists the session and navigates only after successfully loading user data", async () => {
    const originalLocation = window.location;
    const reload = jest.fn();
    Object.defineProperty(window, "location", {
        configurable: true,
        value: { ...originalLocation, reload },
    });
    mockedHttp.post.mockResolvedValue({ data: { token: "test-token" } });
    mockedHttp.get.mockResolvedValue({ data: { id: 42 } });

    try {
        renderLogin();
        fireEvent.click(screen.getByRole("button", { name: "Entrar" }));

        expect(await screen.findByText("Página inicial")).toBeInTheDocument();
        expect(autenticaStore.estaAutenticado).toBe(true);
        expect(autenticaStore.usuario).toEqual({ login: "usuario", token: "test-token" });
        expect(localStorage.getItem("userID")).toBe("42");
        expect(localStorage.getItem("authToken")).toBe("test-token");
        expect(localStorage.getItem("user")).toBe("usuario");
        expect(Number(localStorage.getItem("loginTime"))).toBeGreaterThan(0);
        expect(reload).toHaveBeenCalledTimes(1);
        expect(window.alert).not.toHaveBeenCalled();
    } finally {
        Object.defineProperty(window, "location", { configurable: true, value: originalLocation });
        runInAction(() => {
            autenticaStore.estaAutenticado = false;
            autenticaStore.usuario = { login: "", token: "" };
        });
        localStorage.clear();
    }
});
