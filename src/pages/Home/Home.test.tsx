import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Home from ".";
import http from "../../http";
import { PublicPhotoConfigProvider } from "../../PublicPhotoConfig";

jest.mock("../../http", () => ({
    __esModule: true,
    default: { get: jest.fn(), put: jest.fn(), post: jest.fn() },
}));

jest.mock("../../stores/autentica.store", () => ({
    __esModule: true,
    default: { usuario: { token: "t", login: "colab" } },
}));

jest.mock("../Crm/Modal", () => ({
    __esModule: true,
    default: () => null,
}));

const task = (id: string, overrides: Record<string, unknown>) => ({
    id,
    cardId: `card-${id}`,
    cardNome: `Card ${id}`,
    cardStatusId: "1",
    description: `Atividade ${id}`,
    createdAt: "2026-01-01T00:00:00",
    estimatedDate: null,
    conclusionDate: null,
    assignedTo: null,
    assignedToId: null,
    done: false,
    visible: 1,
    sessao: null,
    ...overrides,
});

const tasks = [
    task("p1", { estimatedDate: "2000-01-01" }),
    task("arq", { cardStatusId: "98" }),
    ...Array.from({ length: 7 }, (_, i) => task(`d${i}`, { done: true, conclusionDate: `2026-02-0${i + 1}T10:00:00` })),
];

beforeEach(() => {
    localStorage.setItem("userID", "7");
    (http.get as jest.Mock).mockImplementation((url: string) => {
        if (url.startsWith("clifor/filter")) return Promise.resolve({ data: [{ nomecomercial: "Maria" }] });
        if (url === "usuarios/7") return Promise.resolve({ data: { papel: "ATENDIMENTO", foto: "" } });
        if (url === "column") {
            return Promise.resolve({
                data: [
                    { id: 1, name: "Onboarding", position: 1, active: true, tipo: "clientes", cards: [] },
                    { id: 98, name: "Inativa", position: 2, active: false, tipo: "clientes", cards: [] },
                    { id: 99, name: "Arquivados", position: 2, active: true, tipo: "arquivado", cards: [] },
                ],
            });
        }
        if (url.startsWith("card/get-cards-by-column")) {
            return Promise.resolve({ data: [
                { id: "c1", nome: "Cliente Mentorado", statusId: 1, atendenteId: 7, cliente: null },
                { id: "c2", nome: "Outro Cliente", statusId: 1, atendenteId: 3, cliente: null },
                ...(url.includes("statusId=99")
                    ? [{ id: "c3", nome: "Cliente Arquivado", statusId: 99, atendenteId: 7, cliente: null }]
                    : []),
            ] });
        }
        if (url.startsWith("task/get-task-by-user")) {
            const openOnly = url.includes("openOnly=true");
            return Promise.resolve({ data: { content: openOnly ? tasks.filter((t) => !t.done) : tasks } });
        }
        return Promise.resolve({ data: {} });
    });
});

afterEach(() => localStorage.clear());

test("mostra saudação, relógio, atividades pendentes + 5 últimas concluídas e mentorados", async () => {
    render(
        <MemoryRouter>
            <Home />
        </MemoryRouter>
    );

    expect(await screen.findByRole("heading", { level: 1, name: "Olá, Maria" })).toBeInTheDocument();
    expect(screen.getByAltText("Sua foto de perfil")).toBeInTheDocument();
    expect(screen.getByLabelText("Data e hora atuais")).toBeInTheDocument();

    const atividades = screen.getByRole("region", { name: "Minhas Atividades" });
    expect(await within(atividades).findByText("Atividade p1")).toBeInTheDocument();
    expect(within(atividades).getByText("Atrasado")).toBeInTheDocument();
    expect(within(atividades).queryByText("Atividade arq")).not.toBeInTheDocument();
    expect(within(atividades).getByText("Atividade d6")).toBeInTheDocument();
    expect(within(atividades).getByText("Atividade d2")).toBeInTheDocument();
    expect(within(atividades).queryByText("Atividade d1")).not.toBeInTheDocument();

    const mentorados = await screen.findByRole("region", { name: "Cliente/Lead" });
    expect(within(mentorados).getByText("Cliente Mentorado")).toBeInTheDocument();
    expect(within(mentorados).queryByText("Outro Cliente")).not.toBeInTheDocument();
    expect(within(mentorados).queryByText("Cliente Arquivado")).not.toBeInTheDocument();
    expect(within(mentorados).getByRole("button", { name: "Abrir card de Cliente Mentorado" })).toBeInTheDocument();
    expect(http.get).toHaveBeenCalledWith(
        "card/get-cards-by-column?statusId=1",
        expect.any(Object),
    );
});

test("a foto usa a URL retornada pela API", async () => {
    Object.defineProperty(window, "location", { configurable: true, value: { hostname: "rhsc.localhost" } });
    const anterior = (http.get as jest.Mock).getMockImplementation()!;
    (http.get as jest.Mock).mockImplementation((url: string, ...args: unknown[]) => {
        if (url === "public-config") return Promise.resolve({ data: { publicPhotoBaseUrl: "https://fotos.example.test/" } });
        if (url === "usuarios/7") return Promise.resolve({ data: { papel: "ATENDIMENTO", foto: "7/foto_perfil.png" } });
        return anterior(url, ...args);
    });
    render(<PublicPhotoConfigProvider><MemoryRouter><Home /></MemoryRouter></PublicPhotoConfigProvider>);
    expect(await screen.findByAltText("Sua foto de perfil")).toBeInTheDocument();
    await screen.findByRole("heading", { name: "Olá, Maria" });
    await screen.findByText("Cliente Mentorado");
    expect(screen.getByAltText("Sua foto de perfil")).toHaveAttribute("src", "https://fotos.example.test/7/foto_perfil.png");
});
