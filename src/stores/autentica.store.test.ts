import { mostrarMensagem } from "./mensagem.store";

jest.mock("./mensagem.store", () => ({ mostrarMensagem: jest.fn(() => Promise.resolve()) }));
jest.mock("../http", () => ({ __esModule: true, default: { get: jest.fn() } }));

beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
});

afterEach(() => localStorage.clear());

test("clears an expired session and queues a warning without reloading before the modal mounts", () => {
    localStorage.setItem("authToken", "expired-token");
    localStorage.setItem("user", "usuario");
    localStorage.setItem("userID", "42");
    localStorage.setItem("loginTime", String(Date.now() - 24 * 60 * 60 * 1000));

    const originalLocation = window.location;
    const reload = jest.fn();
    Object.defineProperty(window, "location", {
        configurable: true,
        value: { ...originalLocation, reload },
    });
    try {
        jest.isolateModules(() => {
            const store = require("./autentica.store").default;
            expect(store.estaAutenticado).toBe(false);
            expect(store.usuario).toEqual({ login: "", token: "" });
        });
        expect(localStorage.getItem("authToken")).toBeNull();
        expect(localStorage.getItem("user")).toBeNull();
        expect(localStorage.getItem("userID")).toBeNull();
        expect(localStorage.getItem("loginTime")).toBeNull();
        expect(mostrarMensagem).toHaveBeenCalledWith("Sua sessão expirou. Por favor, faça login novamente.", "warning");
        expect(reload).not.toHaveBeenCalled();
    } finally {
        Object.defineProperty(window, "location", { configurable: true, value: originalLocation });
    }
});

test("preserves the existing 24-hour session duration", () => {
    localStorage.setItem("authToken", "valid-token");
    localStorage.setItem("user", "usuario");
    localStorage.setItem("loginTime", String(Date.now() - 23 * 60 * 60 * 1000));

    jest.isolateModules(() => {
        const store = require("./autentica.store").default;
        expect(store.estaAutenticado).toBe(true);
        expect(store.isTokenExpired()).toBe(false);
    });
    expect(localStorage.getItem("authToken")).toBe("valid-token");
    expect(mostrarMensagem).not.toHaveBeenCalled();
});
