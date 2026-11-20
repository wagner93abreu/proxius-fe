import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import PaginaBase from ".";

jest.mock("../../stores/autentica.store", () => ({
    __esModule: true,
    default: { estaAutenticado: true, logout: jest.fn() },
}));

jest.mock("../../components/SideBar", () => ({
    __esModule: true,
    default: () => null,
}));

test.each([
    "/painelDeControle", "/painelDeControle/bibliotecas", "/painelDeControle/bibliotecas/",
    "/painelDeControle/modelos-arquivo", "/meta", "/home", "/Home", "/Home/", "/HOME",
    "/AreaClienteAtendente/197", "/meuPerfil", "/comissao", "/precrm", "/dashboardResumo",
    "/metricasVendas", "/clifor", "/vendas", "/produtos", "/templatesContrato", "/painelNF",
    "/financeiro", "/Financeiro/",
    "/usuarios", "/taxas", "/categoriasFinanceiro", "/CategoriasFinanceiro/",
])(
    "uses a light shell on home, document management and attendant client routes %s",
    (path) => {
        render(
            <MemoryRouter initialEntries={[path]}>
                <Routes>
                    <Route element={<PaginaBase />}>
                        <Route path="*" element={<div>Conteúdo da página</div>} />
                    </Route>
                </Routes>
            </MemoryRouter>
        );
        expect(screen.getByRole("banner")).toHaveStyle({
            backgroundColor: "rgba(255,255,255,0.72)",
            zIndex: 1100,
        });
        expect(screen.getByRole("button", { name: "Abrir menu" })).toHaveStyle({ background: "#55081d" });
        expect(screen.getByRole("contentinfo")).toHaveStyle({ color: "#55081d", backgroundColor: "#f7f1e9" });
    }
);

test("preserves the existing dark shell outside management routes", () => {
    render(
        <MemoryRouter initialEntries={["/"]}>
            <Routes>
                <Route element={<PaginaBase />}>
                    <Route path="*" element={<div>Conteúdo da página</div>} />
                </Route>
            </Routes>
        </MemoryRouter>
    );
    expect(screen.getByRole("banner")).toHaveStyle({ backgroundColor: "rgb(20, 3, 9)", zIndex: 2000 });
    expect(screen.getByRole("contentinfo")).toHaveStyle({ color: "white", backgroundColor: "rgb(20, 3, 9)" });
});
