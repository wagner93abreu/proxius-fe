import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import PlataformaInicial from ".";

test("provides separate links for RHSC and platform administration without an operational login", () => {
    localStorage.setItem("authToken", "legacy-token");
    try {
        render(<MemoryRouter><PlataformaInicial /></MemoryRouter>);
        expect(screen.getByRole("link", { name: "Acessar RH Sem Complicacoes" }))
            .toHaveAttribute("href", "http://rhsc.localhost:3000/login");
        expect(screen.getByRole("link", { name: "Administracao da plataforma" })).toHaveAttribute("href", "/wcmadmin");
        expect(screen.queryByLabelText(/Senha/)).not.toBeInTheDocument();
    } finally {
        localStorage.clear();
    }
});
