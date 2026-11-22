import { render, screen } from "@testing-library/react";
import AppRoutes from "./AppRoutes";

jest.mock("@mui/x-date-pickers/internals/demo", () => ({
    DemoContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

test.each(["/Login", "/home", "/checkout", "/produtos"])("keeps %s off the operational system on localhost", async (path) => {
    window.history.replaceState({}, "", path);
    localStorage.setItem("user", "old-user");
    localStorage.setItem("authToken", "old-token");
    try {
        render(<AppRoutes />);
        expect(await screen.findByRole("heading", { name: /Seu negócio, mais próximo do que importa/i })).toBeInTheDocument();
        expect(window.location.pathname).toBe("/");
        expect(screen.queryByPlaceholderText("login")).not.toBeInTheDocument();
    } finally {
        localStorage.clear();
        window.history.replaceState({}, "", "/");
    }
});
