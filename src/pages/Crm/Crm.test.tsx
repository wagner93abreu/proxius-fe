import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Crm from ".";
import http from "../../http";
import ICard from "../../types/ICard";
import IColumn from "../../types/IColumn";
import { randomUUID } from "crypto";

jest.mock("../../http", () => ({
    __esModule: true,
    default: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn() },
}));

jest.mock("../../stores/autentica.store", () => ({
    __esModule: true,
    default: { usuario: { token: "test-token", login: "admin" }, logout: jest.fn() },
}));

const colunas: IColumn[] = [
    { id: 1, name: "Novos leads", position: 1, active: true, tipo: "leads", cards: [] },
    { id: 2, name: "Em contato", position: 2, active: true, tipo: "leads", cards: [] },
    { id: 3, name: "Mentoria", position: 1, active: true, tipo: "clientes", cards: [] },
    { id: 4, name: "Arquivados", position: 1, active: true, tipo: "arquivado", cards: [] },
];

const card: ICard = {
    id: "card-1", nome: "Ana Souza", atendenteId: 7, atendente: "Maria",
    fotoAtendente: "", email: "", telefone: "", linkedin: "", instagram: "",
    objetivo: null, produtoId: null, produto: null, precoId: null, preco: null,
    descricao: "", statusId: 1, lastStatusUpdate: "2026-10-01T10:00:00",
    tags: "[1]", cliente: null, venda: null, linkPgto: null, taskStatus: "0/1",
    tasks: [{
        id: "task-1", cardId: "card-1", description: "Enviar proposta", createdAt: "2026-10-01T10:00:00",
        estimatedDate: null, conclusionDate: null, assignedTo: "Maria", assignedToId: 7,
        done: false, visible: 0, sessao: null,
    }],
    arquivos: [], comoConheceu: "", comoConheceuDetalhamento: "", createdAt: "2026-10-01T10:00:00",
};
const cards = [card, { ...card, id: "card-2", nome: "Bruno Lima", atendenteId: 8, atendente: "João", tags: "[]" }];

const renderCrm = () => render(<MemoryRouter initialEntries={["/crm"]}><Crm /></MemoryRouter>);
const abrirMenu = () => fireEvent.click(screen.getByRole("button", { name: "Opções do CRM" }));
const cryptoDescriptor = Object.getOwnPropertyDescriptor(globalThis, "crypto");

beforeAll(() => Object.defineProperty(globalThis, "crypto", { value: { randomUUID }, configurable: true }));
afterAll(() => {
    if (cryptoDescriptor) Object.defineProperty(globalThis, "crypto", cryptoDescriptor);
    else Reflect.deleteProperty(globalThis, "crypto");
});

beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(window, "alert").mockImplementation(() => {});
    localStorage.setItem("userID", "7");
    (http.get as jest.Mock).mockImplementation((url: string) => {
        let data: unknown;
        if (url === "column") data = colunas;
        else if (url === "tag") data = [{ id: 1, name: "Prioridade", color: "#123456;#ffffff" }];
        else if (url.startsWith("card/get-cards-by-column")) {
            data = url === "card/get-cards-by-column?statusId=4" ? [{ ...card, id: "archived", nome: "Lead arquivado", statusId: 4 }] : cards;
        } else if (url.startsWith("card/filter-by-nome")) data = [card];
        else if (url.startsWith("card/")) data = card;
        else if (url.startsWith("usuarios/")) data = { id: 7, nome: "Maria", papel: "ADMIN", active: "true" };
        else if (url.startsWith("usuarios?")) data = { content: [{ id: 7, nome: "Maria", papel: "ADMIN", active: "true" }] };
        else if (url.includes("get-task-by-user")) data = { content: [{ ...card.tasks[0], visible: 1, cardNome: card.nome, cardStatusId: "1" }] };
        else if (url.includes("?size=")) data = { content: [] };
        else data = [];
        return Promise.resolve({ data });
    });
    (http.put as jest.Mock).mockResolvedValue({ data: {} });
    (http.post as jest.Mock).mockResolvedValue({ data: {} });
});

afterEach(() => {
    localStorage.removeItem("userID");
    jest.restoreAllMocks();
});

test("exibe etiquetas existentes em tons neutros sem alterar seus dados", async () => {
    renderCrm();
    const ana = await screen.findByRole("button", { name: "Abrir card de Ana Souza" });
    expect(await within(ana).findByTestId("crm-tag-1")).toHaveStyle({ backgroundColor: "#ededed", color: "#242424" });
    expect(http.put).not.toHaveBeenCalled();
});

test("aplica o tema claro e preserva os filtros e a movimentação dos cards", async () => {
    renderCrm();
    const ana = await screen.findByRole("button", { name: "Abrir card de Ana Souza" });
    expect(ana).toHaveStyle({ backgroundColor: "#ffffff", color: "#242424" });
    expect(screen.getByRole("banner")).toHaveStyle({ backgroundColor: "rgba(255, 255, 255, 0.94)" });
    expect(await within(ana).findByTestId("crm-tag-1")).toHaveStyle({ backgroundColor: "#ededed", color: "#242424" });

    abrirMenu();
    expect(screen.getByRole("button", { name: "Gestão de Parceiros" })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Atendente"), { target: { value: "id:7" } });
    expect(screen.queryByRole("button", { name: "Abrir card de Bruno Lima" })).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Atendente"), { target: { value: "" } });
    fireEvent.change(screen.getByLabelText("Tag"), { target: { value: "1" } });
    expect(screen.queryByRole("button", { name: "Abrir card de Bruno Lima" })).not.toBeInTheDocument();
    abrirMenu();

    fireEvent.drop(screen.getByRole("region", { name: "Em contato" }), {
        dataTransfer: { getData: () => card.id },
    });
    await waitFor(() => expect(http.put).toHaveBeenCalledWith("card", { id: card.id, statusId: 2 }, expect.any(Object)));

    fireEvent.click(screen.getByRole("button", { name: "Adicionar card em Novos leads" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Nome do LEAD" }), { target: { value: "Novo lead" } });
    fireEvent.click(screen.getByRole("button", { name: "Adicionar" }));
    await waitFor(() => expect(http.post).toHaveBeenCalledWith("card", { nome: "Novo lead", statusId: 1 }, expect.any(Object)));
});

test("abre o card claro e mantém as abas e os formulários internos", async () => {
    renderCrm();
    fireEvent.click(await screen.findByRole("button", { name: "Abrir card de Ana Souza" }));
    const dialog = await screen.findByRole("dialog", { name: "Cliente/Lead" });
    expect(dialog).toHaveStyle({ backgroundColor: "#ffffff", color: "#242424" });
    await waitFor(() => expect(http.get).toHaveBeenCalledWith("card/card-1", expect.any(Object)));
    expect(window.alert).not.toHaveBeenCalled();
    expect(await within(dialog).findByText("Enviar proposta")).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole("tab", { name: "Sessão gratuita" }));
    expect(await within(dialog).findByRole("button", { name: "Agendar sessão" })).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole("tab", { name: "Processo de Vendas" }));
    expect(await within(dialog).findByText("Nenhum processo de venda cadastrado.")).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole("button", { name: "Fechar card" }));
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Cliente/Lead" })).not.toBeInTheDocument());
});

test("aplica o tema claro aos modais do menu direito", async () => {
    renderCrm();
    await screen.findByRole("button", { name: "Abrir card de Ana Souza" });
    for (const [item, titulo, fechar] of [
        ["Minhas Atividades", "Minhas Atividades", "Fechar atividades"],
        ["Etiquetas", "Etiquetas", "Fechar etiquetas"],
        ["Arquivados", "Arquivados", "Fechar arquivados"],
    ]) {
        abrirMenu();
        fireEvent.click(screen.getByRole("button", { name: item }));
        const dialog = await screen.findByRole("dialog", { name: titulo });
        expect(dialog).toHaveStyle({ backgroundColor: "#ffffff", color: "#242424" });
        fireEvent.click(within(dialog).getByRole("button", { name: fechar }));
        await waitFor(() => expect(screen.queryByRole("dialog", { name: titulo })).not.toBeInTheDocument());
    }
});
