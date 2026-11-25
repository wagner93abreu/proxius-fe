import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Login from ".";
import http from "../../http";
import autenticaStore from "../../stores/autentica.store";

jest.mock("../../centralIdentity", () => ({
    centralPreviewEnabled: () => true,
    isLocalTenant: () => true,
}));
jest.mock("../../http", () => ({ __esModule: true, default: { post: jest.fn() } }));
jest.mock("../../stores/autentica.store", () => ({
    __esModule: true, default: { isTokenExpired: jest.fn(), login: jest.fn(), loginCentral: jest.fn() },
}));

test("direct central login uses the email endpoint and does not offer legacy password reset", async () => {
    (http.post as jest.Mock).mockRejectedValue(new Error("credentials"));
    render(<MemoryRouter><Login /></MemoryRouter>);
    fireEvent.change(screen.getByPlaceholderText("seuemail@exemplo.com"), { target: { value: "test@example.invalid" } });
    fireEvent.change(screen.getByPlaceholderText("*******"), { target: { value: "test-password" } });
    fireEvent.click(screen.getByRole("button", { name: "Entrar" }));
    await waitFor(() => expect(http.post).toHaveBeenCalledWith("central-login",
        { email: "test@example.invalid", password: "test-password" }, expect.any(Object)));
    expect(autenticaStore.login).not.toHaveBeenCalled();
    expect(screen.queryByText("Esqueceu sua senha?")).not.toBeInTheDocument();
});
