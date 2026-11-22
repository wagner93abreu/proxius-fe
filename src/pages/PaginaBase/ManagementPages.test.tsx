import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import PaginaBase from ".";
import MeuPerfil from "../MeuPerfil";
import Comissao from "../Comissao";
import Precrm from "../Precrm";
import DashBoardResumo from "../DashBoardResumo";
import MetricasVendas from "../MetricasVendas";
import Clifor from "../Clifor";
import Vendas from "../Vendas";
import Produto from "../Produto";
import ContractTemplate from "../ContractTemplate";
import PainelNF from "../PainelNF";
import Financeiro from "../Financeiro";
import Usuarios from "../Usuarios";
import Taxas from "../Taxas";
import CategoriasFinanceiro from "../CategoriasFinanceiro";
import http from "../../http";

jest.mock("../../http", () => ({
    __esModule: true,
    default: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn() },
}));
jest.mock("../../stores/autentica.store", () => ({
    __esModule: true,
    default: { usuario: { token: "test-token", login: "admin" }, estaAutenticado: true, logout: jest.fn() },
}));
jest.mock("../../components/SideBar", () => ({ __esModule: true, default: () => null }));
jest.mock("@mui/x-date-pickers/internals/demo", () => ({
    DemoContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

const cliente = {
    id: 1, idusuario: 1, nomecomercial: "Maria", nomesocial: "Souza",
    cpfcnpj: "12345678901", active: true, endereco: { pais: "Brasil", uf: "SP" },
};
const produto = {
    id: 4, origem: "MENTORIA", nome: "Mentoria de RH", descricao: "Produto de teste",
    regras: "", active: true, duracaoAcessoQuantidade: 30, duracaoAcessoUnidade: "DIA",
};
const usuario = { id: "1", login: "maria", nome: "Maria Souza", email: "maria@example.com", papel: "ADMIN", active: true, foto: "" };
const template = { id: 2, name: "Contrato de mentoria", description: "Contrato padrão" };
const taxa = { id: 5, fornecedor: "STONE", tipo: "CREDITO", bandeira: "VISA", parcela: 1, valormaximo: 1000, porcentagem: true, valortaxa: 2 };
const categoria = { id: 6, tipo: "E", denominacao: "Receitas", categoria: "Mentorias", exemplo: "Venda de mentoria", active: true };
const renderPage = (path: string, element: React.ReactElement) => render(
    <MemoryRouter initialEntries={[path]}>
        <Routes>
            <Route element={<PaginaBase />}>
                <Route path="*" element={element} />
            </Route>
        </Routes>
    </MemoryRouter>
);

beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(window, "alert").mockImplementation(() => {});
    localStorage.setItem("userID", "1");
    (http.get as jest.Mock).mockImplementation((url: string) => {
        let data: unknown;
        if (url.startsWith("usuarios/")) data = usuario;
        else if (url.startsWith("usuarios?")) data = { content: [usuario] };
        else if (url.startsWith("clifor/filter")) data = [cliente];
        else if (url.startsWith("clifor?")) data = { content: [cliente] };
        else if (url.startsWith("produtos?")) data = { content: [produto] };
        else if (url.startsWith("contract-template?")) data = { content: [template] };
        else if (url.startsWith("taxa?")) data = { content: [taxa] };
        else if (url.startsWith("categoriafinanceiro?")) data = { content: [categoria] };
        else if (url.startsWith("venda/resumo")) data = {
            content: [{ id: 3, produtoPrincipal: produto.nome, nomeCliente: usuario.nome, valorComprador: 100, comissao: 10, dataVenda: "2026-10-01", status: "CONFIRMADA" }],
            totalElements: 1,
        };
        else if (url.includes("resumo-financeiro")) data = { totalEntradas: 100, totalSaidas: 50 };
        else if (url.startsWith("precificacao/produto")) data = [];
        else if (url.includes("?size=") || url.includes("?page=")) data = { content: [], totalElements: 0 };
        else data = [];
        return Promise.resolve({ data });
    });
    (http.put as jest.Mock).mockResolvedValue({ data: {} });
    (http.post as jest.Mock).mockResolvedValue({ data: {} });
    (http.delete as jest.Mock).mockResolvedValue({ data: {} });
});

afterEach(() => {
    localStorage.removeItem("userID");
    jest.restoreAllMocks();
});

test.each([
    ["/comissao", <Comissao />, "Comissões"],
    ["/precrm", <Precrm />, "Cadastro de PRECRM"],
    ["/clifor", <Clifor />, "Cadastro de Cliente/Fornecedor"],
    ["/vendas", <Vendas />, "Vendas"],
    ["/produtos", <Produto />, "Produtos"],
    ["/templatesContrato", <ContractTemplate />, "Templates de Contratos"],
    ["/painelNF", <PainelNF />, "Painel de NF"],
    ["/financeiro", <Financeiro />, "Cadastro Financeiro"],
    ["/usuarios", <Usuarios />, "Painel de Usuários"],
    ["/taxas", <Taxas />, "Taxas"],
    ["/categoriasFinanceiro", <CategoriasFinanceiro />, "Categorias Financeiro"],
] as const)("aplica o tema claro à tabela de %s sem enviar alterações", async (path, element, title) => {
    renderPage(path, element);
    expect(screen.getByRole("heading", { name: title })).toHaveStyle({ color: "#141414" });
    const grid = await screen.findByRole("grid");
    expect(grid).toHaveStyle({ backgroundColor: "#ffffff", color: "#242424" });
    expect(within(grid).getAllByRole("columnheader")[0]).toBeVisible();
    await waitFor(() => expect(http.get).toHaveBeenCalled());
    expect(http.post).not.toHaveBeenCalled();
    expect(http.put).not.toHaveBeenCalled();
    expect(http.delete).not.toHaveBeenCalled();
    expect(window.alert).not.toHaveBeenCalled();
});

test("mantém o carregamento e a atualização do perfil com campos claros", async () => {
    renderPage("/meuPerfil", <MeuPerfil />);
    const nome = await screen.findByDisplayValue(usuario.nome);
    expect(nome).toHaveStyle({ backgroundColor: "#fff", color: "#242424" });
    fireEvent.change(nome, { target: { value: "Maria Atualizada" } });
    fireEvent.click(screen.getByRole("button", { name: "Atualizar" }));
    await waitFor(() => expect(http.put).toHaveBeenCalledWith(
        "usuarios", { id: "1", login: "maria", nome: "Maria Atualizada", email: usuario.email, password: null },
        expect.anything()
    ));
});

test("mantém os consolidados do dashboard no tema claro", async () => {
    renderPage("/dashboardResumo", <DashBoardResumo />);
    expect(await screen.findByRole("heading", { name: "Olá, Maria" })).toHaveStyle({ color: "#141414" });
    expect(await screen.findByRole("heading", { name: "CONSOLIDADO FINANCEIRO" })).toHaveStyle({ color: "#141414" });
    expect(screen.getByRole("heading", { name: "VENDAS" })).toBeVisible();
    expect(window.alert).not.toHaveBeenCalled();
});

test("mantém as seções e os filtros do funil de vendas", async () => {
    renderPage("/metricasVendas", <MetricasVendas />);
    expect(screen.getByRole("heading", { name: "FUNIL DE VENDAS" })).toHaveStyle({ color: "#141414" });
    expect(await screen.findByText("Funil Comercial")).toBeVisible();
    expect(screen.getByText("Meta Mensal")).toBeVisible();
    expect(screen.getByText("Realizado")).toBeVisible();
    expect(screen.getAllByRole("combobox")).toHaveLength(3);
    expect(window.alert).not.toHaveBeenCalled();
});

test.each([
    ["/produtos", <Produto />, "Cadastrar", "Cadastrar Produto", "Produto"],
    ["/templatesContrato", <ContractTemplate />, "Cadastrar", "Cadastrar Template de Contrato", "Template de Contrato"],
    ["/precrm", <Precrm />, "Cadastrar", "Cadastrar PRECRM", "PRECRM"],
    ["/clifor", <Clifor />, "Cadastrar", "Cadastro de Cliente e Fornecedor:", "Cliente e Fornecedor"],
    ["/financeiro", <Financeiro />, "Cadastrar", "Cadastrar Lançamento Financeiro", "Lançamento Financeiro"],
    ["/usuarios", <Usuarios />, "Cadastrar usuario", "Cadastro de Usuário:", "Cadastro de Usuário"],
    ["/taxas", <Taxas />, "Cadastrar", "Cadastrar Taxa", "Taxa"],
    ["/categoriasFinanceiro", <CategoriasFinanceiro />, "Cadastrar categoria", "Cadastrar Categoria", "Categoria Financeiro"],
] as const)("mantém o formulário de cadastro claro em %s", async (path, element, button, formText, dialogName) => {
    renderPage(path, element);
    fireEvent.click(screen.getByRole("button", { name: button }));
    expect(await screen.findByRole("heading", { name: formText })).toBeVisible();
    expect(screen.getByRole("dialog", { name: dialogName })).toHaveStyle({ backgroundColor: "#ffffff" });
    expect(http.post).not.toHaveBeenCalled();
    expect(window.alert).not.toHaveBeenCalled();
});

test.each([
    ["/usuarios", <Usuarios />, "Editar usuario", "Editar Usuário", usuario.nome],
    ["/taxas", <Taxas />, "Editar", "Taxa", taxa.fornecedor],
    ["/categoriasFinanceiro", <CategoriasFinanceiro />, "Editar categoria", "Categoria Financeiro", categoria.categoria],
] as const)("mantém a seleção e o formulário de edição em %s", async (path, element, button, dialogName, value) => {
    renderPage(path, element);
    const grid = screen.getByRole("grid");
    fireEvent.click(await within(grid).findByRole("checkbox", { name: "Select row" }));
    fireEvent.click(screen.getByRole("button", { name: button }));
    const dialog = await screen.findByRole("dialog", { name: dialogName });
    expect(dialog).toHaveStyle({ backgroundColor: "#ffffff" });
    expect(within(dialog).getByDisplayValue(value)).toHaveStyle({ backgroundColor: "#fff", color: "#242424" });
    expect(http.put).not.toHaveBeenCalled();
    expect(window.alert).not.toHaveBeenCalled();
});

test.each([
    ["/usuarios", <Usuarios />, "usuarios/desativar/1"],
    ["/categoriasFinanceiro", <CategoriasFinanceiro />, "categoriafinanceiro/desativar/6"],
] as const)("preserva a ação de ativar/desativar em %s", async (path, element, endpoint) => {
    renderPage(path, element);
    fireEvent.click(await within(screen.getByRole("grid")).findByRole("checkbox", { name: "Select row" }));
    fireEvent.click(screen.getByRole("button", { name: "Ativar/Desativar" }));
    await waitFor(() => expect(http.put).toHaveBeenCalledWith(endpoint, null, expect.anything()));
});

test("preserva o envio da categoria editada", async () => {
    renderPage("/categoriasFinanceiro", <CategoriasFinanceiro />);
    fireEvent.click(await within(screen.getByRole("grid")).findByRole("checkbox", { name: "Select row" }));
    fireEvent.click(screen.getByRole("button", { name: "Editar categoria" }));
    const dialog = screen.getByRole("dialog", { name: "Categoria Financeiro" });
    fireEvent.change(within(dialog).getByDisplayValue(categoria.categoria), { target: { value: "Cursos" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Salvar" }));
    await waitFor(() => expect(http.put).toHaveBeenCalledWith(
        "categoriafinanceiro", { id: "6", tipo: "E", denominacao: "Receitas", categoria: "Cursos", exemplo: categoria.exemplo },
        expect.anything()
    ));
});
