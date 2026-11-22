import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import PlataformaInicial from ".";

test("provides separate links for RHSC and platform administration without an operational login", () => {
    localStorage.setItem("authToken", "legacy-token");
    try {
        render(<MemoryRouter><PlataformaInicial /></MemoryRouter>);
        expect(document.title).toBe("ProxiUs | Gestão mais próxima");
        expect(screen.getByRole("heading", { name: /Seu negócio, mais próximo do que importa/i })).toBeInTheDocument();
        expect(screen.getByRole("navigation", { name: "Navegação principal" }).querySelector('a[href="#recursos"]')).toBeInTheDocument();
        expect(screen.getAllByRole("link", { name: /Acessar sistema/i })[0])
            .toHaveAttribute("href", `${window.location.protocol}//rhsc.localhost${window.location.port ? `:${window.location.port}` : ""}/login`);
        expect(screen.getByRole("link", { name: "Administração da plataforma" })).toHaveAttribute("href", "/wcmadmin");
        expect(screen.getByText("ILUSTRAÇÃO DA PLATAFORMA")).toBeInTheDocument();
        expect(screen.queryByLabelText(/Senha/)).not.toBeInTheDocument();
    } finally {
        localStorage.clear();
    }
});
