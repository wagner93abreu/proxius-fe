import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import CentralLogin from ".";
import axios from "axios";

jest.mock("axios", () => ({ __esModule: true, default: { create: jest.fn(() => ({ post: jest.fn() })) } }));
const post = (axios.create as jest.Mock).mock.results[0].value.post as jest.Mock;
const code = "A".repeat(43);
const originalOpen = window.open;

beforeEach(() => {
    jest.clearAllMocks();
    post.mockReset();
});

afterEach(() => {
    window.open = originalOpen;
});

test("clears the initial password and transfers only to the chosen window and origin", async () => {
    const popup = { closed: false, close: jest.fn(), postMessage: jest.fn() };
    window.open = jest.fn().mockReturnValue(popup);
    post.mockResolvedValueOnce({ data: [{ id: "company-id", slug: "rhsc", name: "Empresa" }] })
        .mockResolvedValueOnce({ data: { code } });
    render(<CentralLogin />);
    fireEvent.change(screen.getByLabelText("E-mail"), { target: { value: "test@example.invalid" } });
    fireEvent.change(screen.getByLabelText("Senha"), { target: { value: "secret" } });
    fireEvent.click(screen.getByRole("button", { name: "Consultar empresas" }));
    await screen.findByRole("button", { name: "Empresa" });
    const password = screen.getByLabelText("Senha");
    expect(password).toHaveValue("");
    fireEvent.change(password, { target: { value: "secret" } });
    fireEvent.click(screen.getByRole("button", { name: "Empresa" }));
    expect(window.open).toHaveBeenCalledWith("http://rhsc.localhost/central-transfer", "_blank");
    await waitFor(() => expect(post).toHaveBeenCalledTimes(2));
    window.dispatchEvent(new MessageEvent("message", {
        origin: "http://evil.localhost", source: popup as unknown as Window, data: { type: "central-transfer-ready" },
    }));
    expect(popup.postMessage).not.toHaveBeenCalled();
    window.dispatchEvent(new MessageEvent("message", {
        origin: "http://rhsc.localhost", source: popup as unknown as Window, data: { type: "central-transfer-ready" },
    }));
    expect(popup.postMessage).toHaveBeenCalledWith({ type: "central-transfer-code", code }, "http://rhsc.localhost");
    window.dispatchEvent(new MessageEvent("message", {
        origin: "http://rhsc.localhost", source: popup as unknown as Window, data: { type: "central-transfer-complete" },
    }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Consultar empresas" })).toBeInTheDocument());
});

test("reports blocked popups without requesting a transfer", async () => {
    window.open = jest.fn().mockReturnValue(null);
    post.mockResolvedValueOnce({ data: [{ id: "id", slug: "rhsc", name: "Empresa" }] });
    render(<CentralLogin />);
    fireEvent.change(screen.getByLabelText("E-mail"), { target: { value: "test@example.invalid" } });
    fireEvent.change(screen.getByLabelText("Senha"), { target: { value: "secret" } });
    fireEvent.click(screen.getByRole("button", { name: "Consultar empresas" }));
    await screen.findByRole("button", { name: "Empresa" });
    fireEvent.change(screen.getByLabelText("Senha"), { target: { value: "secret" } });
    fireEvent.click(screen.getByRole("button", { name: "Empresa" }));
    expect(screen.getByRole("alert")).toHaveTextContent("pop-up");
    expect(post).toHaveBeenCalledTimes(1);
});
