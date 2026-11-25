import http from "../http";
import autenticaStore from "./autentica.store";

jest.mock("../http", () => ({ __esModule: true, default: { get: jest.fn() } }));
jest.mock("./mensagem.store", () => ({ mostrarMensagem: jest.fn() }));

beforeEach(() => {
    jest.clearAllMocks();
    autenticaStore.logout(false);
});

test("stores the tenant session only after resolving an active local user", async () => {
    (http.get as jest.Mock).mockResolvedValue({ data: { login: "local-user", userId: 42 } });
    await autenticaStore.loginCentral("tenant-token");
    expect(http.get).toHaveBeenCalledWith("tenant-poc/me", {
        headers: { Authorization: "Bearer tenant-token" }, timeout: 15000,
    });
    expect(localStorage.getItem("authToken")).toBe("tenant-token");
    expect(localStorage.getItem("user")).toBe("local-user");
    expect(localStorage.getItem("userID")).toBe("42");
    expect(autenticaStore.estaAutenticado).toBe(true);
});

test("rejects an invalid tenant user without storing a session", async () => {
    (http.get as jest.Mock).mockResolvedValue({ data: { login: "local-user", userId: 0 } });
    await expect(autenticaStore.loginCentral("tenant-token")).rejects.toThrow();
    expect(localStorage.getItem("authToken")).toBeNull();
    expect(autenticaStore.estaAutenticado).toBe(false);
});
