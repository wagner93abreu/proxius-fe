import { render, screen, waitFor } from "@testing-library/react";
import CentralTransfer from ".";
import http from "../../http";
import autenticaStore from "../../stores/autentica.store";

jest.mock("../../http", () => ({ __esModule: true, default: { post: jest.fn() } }));
jest.mock("../../stores/autentica.store", () => ({ __esModule: true, default: { loginCentral: jest.fn() } }));

beforeEach(() => {
    jest.clearAllMocks();
});

test("accepts a transfer only from the opener and trusted root origin", async () => {
    const opener = { postMessage: jest.fn() };
    const original = window.opener;
    Object.defineProperty(window, "opener", { configurable: true, writable: true, value: opener });
    (http.post as jest.Mock).mockRejectedValue(new Error("rejected"));
    try {
        render(<CentralTransfer />);
        expect(opener.postMessage).toHaveBeenCalledWith({ type: "central-transfer-ready" }, "http://localhost");
        const data = { type: "central-transfer-code", code: "A".repeat(43) };
        window.dispatchEvent(new MessageEvent("message", {
            origin: "http://evil.example", source: opener as unknown as Window, data,
        }));
        window.dispatchEvent(new MessageEvent("message", {
            origin: "http://localhost", source: window, data,
        }));
        expect(http.post).not.toHaveBeenCalled();
        window.dispatchEvent(new MessageEvent("message", {
            origin: "http://localhost", source: opener as unknown as Window, data,
        }));
        await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("Não foi possível entrar"));
        expect(http.post).toHaveBeenCalledTimes(1);
        expect(autenticaStore.loginCentral).not.toHaveBeenCalled();
        expect(opener.postMessage).toHaveBeenCalledWith({ type: "central-transfer-error" }, "http://localhost");
    } finally {
        Object.defineProperty(window, "opener", { configurable: true, writable: true, value: original });
    }
});

test("redeems a valid transfer and establishes the tenant session before notifying the opener", async () => {
    const opener = { postMessage: jest.fn() };
    const original = window.opener;
    Object.defineProperty(window, "opener", { configurable: true, writable: true, value: opener });
    (http.post as jest.Mock).mockResolvedValue({ data: { token: "tenant-token" } });
    (autenticaStore.loginCentral as jest.Mock).mockResolvedValue(undefined);
    try {
        render(<CentralTransfer />);
        window.dispatchEvent(new MessageEvent("message", {
            origin: "http://localhost", source: opener as unknown as Window,
            data: { type: "central-transfer-code", code: "A".repeat(43) },
        }));
        await waitFor(() => expect(autenticaStore.loginCentral).toHaveBeenCalledWith("tenant-token"));
        await waitFor(() => expect(opener.postMessage).toHaveBeenCalledWith(
            { type: "central-transfer-complete" }, "http://localhost"));
        expect(http.post).toHaveBeenCalledWith("central-handoff", { code: "A".repeat(43) }, { timeout: 15000 });
    } finally {
        Object.defineProperty(window, "opener", { configurable: true, writable: true, value: original });
    }
});
