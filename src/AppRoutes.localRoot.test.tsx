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

test("exposes the central login at the local root only when explicitly enabled", async () => {
    const previous = process.env.REACT_APP_CENTRAL_IDENTITY_PREVIEW;
    process.env.REACT_APP_CENTRAL_IDENTITY_PREVIEW = "true";
    window.history.replaceState({}, "", "/login");
    try {
        render(<AppRoutes />);
        expect(await screen.findByRole("heading", { name: "Acessar ProxiUs" })).toBeInTheDocument();
    } finally {
        process.env.REACT_APP_CENTRAL_IDENTITY_PREVIEW = previous;
        window.history.replaceState({}, "", "/");
    }
});

test("links the local landing page to the root central login when the preview is enabled", () => {
    const previous = process.env.REACT_APP_CENTRAL_IDENTITY_PREVIEW;
    process.env.REACT_APP_CENTRAL_IDENTITY_PREVIEW = "true";
    window.history.replaceState({}, "", "/");
    try {
        render(<AppRoutes />);
        expect(screen.getAllByRole("link", { name: /Acessar sistema/i })[0]).toHaveAttribute("href", "/login");
        expect(screen.getByRole("link", { name: "Acessar meu ambiente" })).toHaveAttribute("href", "/login");
    } finally {
        process.env.REACT_APP_CENTRAL_IDENTITY_PREVIEW = previous;
    }
});

test.each([
    ["/verificar-email", "Verificar e-mail"],
    ["/aceitar-convite", "Aceitar convite"],
    ["/definir-senha-inicial", "Definir senha inicial"],
])("restricts %s to the explicitly enabled invitation preview", async (path, title) => {
    const identity = process.env.REACT_APP_CENTRAL_IDENTITY_PREVIEW;
    const invitation = process.env.REACT_APP_CENTRAL_INVITATION_PREVIEW;
    try {
        process.env.REACT_APP_CENTRAL_IDENTITY_PREVIEW = "true";
        process.env.REACT_APP_CENTRAL_INVITATION_PREVIEW = "false";
        window.history.replaceState({}, "", path);
        const { unmount } = render(<AppRoutes />);
        expect(await screen.findByRole("heading", { name: /Seu negócio, mais próximo do que importa/i })).toBeInTheDocument();
        unmount();
        process.env.REACT_APP_CENTRAL_INVITATION_PREVIEW = "true";
        window.history.replaceState({}, "", path);
        render(<AppRoutes />);
        expect(await screen.findByRole("heading", { name: title })).toBeInTheDocument();
    } finally {
        process.env.REACT_APP_CENTRAL_IDENTITY_PREVIEW = identity;
        process.env.REACT_APP_CENTRAL_INVITATION_PREVIEW = invitation;
        window.history.replaceState({}, "", "/");
    }
});
