import { render, screen } from "@testing-library/react";
import AppRoutes from "./AppRoutes";

jest.mock("@mui/x-date-pickers/internals/demo", () => ({
    DemoContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
jest.mock("./pages/Login", () => () => <h1>Login operacional</h1>);

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

test.each(["proxius.com.br", "main.example.amplifyapp.com", "rhsc.localhost"])(
    "shows the landing page without redirecting on %s",
    async (hostname) => {
        const originalLocation = window.location;
        window.history.replaceState({}, "", "/");
        Object.defineProperty(window, "location", {
            configurable: true,
            value: { ...originalLocation, hostname },
        });
        try {
            render(<AppRoutes />);
            expect(await screen.findByRole("heading", { name: /Seu negócio, mais próximo do que importa/i })).toBeInTheDocument();
            expect(window.location.pathname).toBe("/");
            expect(screen.getAllByRole("link", { name: /Acessar sistema/i })[0]).toHaveAttribute("href", "/login");
        } finally {
            Object.defineProperty(window, "location", { configurable: true, value: originalLocation });
        }
    }
);

test("keeps the explicit login route available outside localhost", async () => {
    const originalLocation = window.location;
    window.history.replaceState({}, "", "/login");
    Object.defineProperty(window, "location", {
        configurable: true,
        value: { ...originalLocation, hostname: "proxius.com.br" },
    });
    try {
        render(<AppRoutes />);
        expect(await screen.findByRole("heading", { name: "Login operacional" })).toBeInTheDocument();
        expect(window.location.pathname).toBe("/login");
    } finally {
        Object.defineProperty(window, "location", { configurable: true, value: originalLocation });
        window.history.replaceState({}, "", "/");
    }
});
