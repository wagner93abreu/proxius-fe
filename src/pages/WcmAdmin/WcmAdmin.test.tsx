import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import WcmAdmin from ".";
import { adminApi } from "./api";

jest.mock("./api", () => ({
    adminApi: { get: jest.fn(), post: jest.fn() },
}));
const get = adminApi.get as jest.Mock;
const post = adminApi.post as jest.Mock;
const session = { authenticated: false, login: "", changePassword: false, csrfToken: "test-csrf" };
const tenant = { id: "tenant-1", name: "Empresa Teste", slug: "empresa-teste", database: "tenant_local_test", status: "BLOCKED", managed: true };
const storage = {
    tenantId: "tenant-1", slug: "empresa-teste", name: "Empresa Teste", tenantStatus: "ACTIVE", simulated: true,
    state: "COMPLETE", usedBytes: 1024, knownBytes: 1024, expectedContainers: 1, collectedContainers: 1,
    collectedAt: "2026-01-02T03:04:05Z", lastCompleteAt: "2026-01-02T03:04:05Z",
    lastCompleteBytes: 1024, stale: false,
};

beforeEach(() => {
    jest.resetAllMocks();
    get.mockImplementation((path: string) => Promise.resolve({ data: path === "/session" ? session : [] }));
});

test("uses a separate platform login with CSRF and shows backend errors", async () => {
    post.mockRejectedValue({ isAxiosError: true, response: { data: "Credenciais invalidas", status: 401 } });
    render(<WcmAdmin />);
    const button = screen.getByRole("button", { name: "Entrar no painel" });
    await waitFor(() => expect(button).toBeEnabled());
    fireEvent.change(screen.getByLabelText(/^Senha/), { target: { value: "invalid" } });
    fireEvent.click(button);
    expect(await screen.findByText("Credenciais invalidas")).toBeInTheDocument();
    expect(post).toHaveBeenCalledWith("/login", { login: "wcmadmin", password: "invalid" }, {
        headers: { "X-CSRF-TOKEN": "test-csrf" },
    });
});

test("requires password rotation before displaying tenant controls", async () => {
    get.mockResolvedValue({ data: { ...session, authenticated: true, login: "wcmadmin", changePassword: true } });
    render(<WcmAdmin />);
    expect(await screen.findByRole("heading", { name: "Troca obrigatoria de senha" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Criar empresa e banco" })).not.toBeInTheDocument();
    expect(get).not.toHaveBeenCalledWith("/tenants");
    expect(get).not.toHaveBeenCalledWith("/armazenamento");
});

test("creates a tenant and sends its initial administrator without a tenant JWT", async () => {
    get.mockImplementation((path: string) => Promise.resolve({
        data: path === "/session" ? { ...session, authenticated: true, login: "wcmadmin" } : [],
    }));
    post.mockResolvedValue({ data: {} });
    render(<WcmAdmin />);
    await screen.findByRole("button", { name: "Criar empresa e banco" });
    fireEvent.change(screen.getByLabelText(/^Nome da empresa/), { target: { value: "Nova Empresa" } });
    fireEvent.change(screen.getByLabelText(/^Subdominio/), { target: { value: "nova-empresa" } });
    fireEvent.change(screen.getByLabelText(/^Login do administrador da empresa/), { target: { value: "gestor" } });
    fireEvent.change(screen.getByLabelText(/^E-mail do administrador da empresa/), { target: { value: "gestor@example.invalid" } });
    fireEvent.change(screen.getByLabelText(/^Senha inicial da empresa/), { target: { value: "Senha-inicial-123!" } });
    fireEvent.click(screen.getByRole("button", { name: "Criar empresa e banco" }));
    expect(await screen.findByText("Empresa criada com banco exclusivo e usuario administrador.")).toBeInTheDocument();
    expect(post).toHaveBeenCalledWith("/tenants", {
        name: "Nova Empresa", slug: "nova-empresa", login: "gestor", email: "gestor@example.invalid", password: "Senha-inicial-123!",
    }, { headers: { "X-CSRF-TOKEN": "test-csrf" } });
});

test("requires exact name confirmation and a password to delete a blocked managed tenant", async () => {
    get.mockImplementation((path: string) => Promise.resolve({
        data: path === "/session" ? { ...session, authenticated: true, login: "wcmadmin" } : path === "/tenants" ? [tenant] : [],
    }));
    post.mockResolvedValue({ data: {} });
    render(<WcmAdmin />);
    fireEvent.click(await screen.findByRole("button", { name: "Excluir banco" }));
    const dialog = screen.getByRole("dialog");
    const confirm = within(dialog).getByRole("button", { name: "Confirmar exclusao irreversivel" });
    expect(confirm).toBeDisabled();
    fireEvent.change(within(dialog).getByLabelText(/^Nome de confirmacao/), { target: { value: "Empresa Teste" } });
    fireEvent.change(within(dialog).getByLabelText(/^Sua senha da plataforma/), { target: { value: "Senha-atual-123!" } });
    fireEvent.click(confirm);
    await waitFor(() => expect(post).toHaveBeenCalledWith("/tenants/tenant-1/delete", {
        confirmation: "Empresa Teste", password: "Senha-atual-123!",
    }, { headers: { "X-CSRF-TOKEN": "test-csrf" } }));
});

test("never offers deletion for existing protected databases", async () => {
    get.mockImplementation((path: string) => Promise.resolve({
        data: path === "/session" ? { ...session, authenticated: true, login: "wcmadmin" }
            : path === "/tenants" ? [{ ...tenant, managed: false }] : [],
    }));
    render(<WcmAdmin />);
    await screen.findByText("Banco protegido contra exclusao");
    expect(screen.queryByRole("button", { name: "Excluir banco" })).not.toBeInTheDocument();
});

test("does not load the administrative session from a tenant host", () => {
    const original = window.location;
    Object.defineProperty(window, "location", { configurable: true, value: { ...original, hostname: "a.localhost" } });
    try {
        render(<WcmAdmin />);
        expect(screen.getByText(/Este painel esta disponivel somente/)).toBeInTheDocument();
        expect(get).not.toHaveBeenCalled();
    } finally {
        Object.defineProperty(window, "location", { configurable: true, value: original });
    }
});

test("loads platform storage only after password rotation and sends the CSRF token for collection", async () => {
    get.mockImplementation((path: string) => Promise.resolve({
        data: path === "/session" ? { ...session, authenticated: true, login: "wcmadmin" }
            : path === "/armazenamento" ? [storage] : [],
    }));
    post.mockResolvedValue({ data: storage });
    render(<WcmAdmin />);
    const collect = await screen.findByRole("button", { name: "Coletar agora" });
    fireEvent.click(collect);

    expect(await screen.findByText(/Coleta concluída/)).toBeInTheDocument();
    expect(post).toHaveBeenCalledWith("/armazenamento/tenant-1/coletar", {}, {
        headers: { "X-CSRF-TOKEN": "test-csrf" },
    });
});

test("explains that a platform collection is already running on HTTP 409", async () => {
    get.mockImplementation((path: string) => Promise.resolve({
        data: path === "/session" ? { ...session, authenticated: true, login: "wcmadmin" }
            : path === "/armazenamento" ? [storage] : [],
    }));
    post.mockRejectedValue({ isAxiosError: true, response: { status: 409 } });
    render(<WcmAdmin />);
    fireEvent.click(await screen.findByRole("button", { name: "Coletar agora" }));

    expect(await screen.findByText(/Uma coleta já está em andamento/)).toBeInTheDocument();
});

test("warns when a manual collection returns a partial summary instead of reporting success", async () => {
    get.mockImplementation((path: string) => Promise.resolve({
        data: path === "/session" ? { ...session, authenticated: true, login: "wcmadmin" }
            : path === "/armazenamento" ? [storage] : [],
    }));
    post.mockResolvedValue({ data: { ...storage, state: "PARTIAL", usedBytes: null, knownBytes: 512 } });
    render(<WcmAdmin />);
    fireEvent.click(await screen.findByRole("button", { name: "Coletar agora" }));

    expect(await screen.findByText(/Coleta parcial: subtotal conhecido/)).toBeInTheDocument();
    expect(screen.queryByText("Coleta concluída. A auditoria é mantida pela API.")).not.toBeInTheDocument();
});

test("loads tenant detail and paginated platform history from their dedicated endpoints", async () => {
    get.mockImplementation((path: string) => {
        if (path === "/session") return Promise.resolve({
            data: { ...session, authenticated: true, login: "wcmadmin" },
        });
        if (path === "/armazenamento") return Promise.resolve({ data: [storage] });
        if (path === "/armazenamento/tenant-1") return Promise.resolve({
            data: { summary: storage, containers: [] },
        });
        if (path.startsWith("/armazenamento/tenant-1/historico?")) return Promise.resolve({
            data: { items: [], page: 0, size: 24, hasNext: false },
        });
        return Promise.resolve({ data: [] });
    });
    render(<WcmAdmin />);
    fireEvent.click(await screen.findByRole("button", { name: "Detalhes" }));

    expect(await screen.findByText("Empresa Teste — detalhamento")).toBeInTheDocument();
    expect(get).toHaveBeenCalledWith("/armazenamento/tenant-1");
    await waitFor(() => expect(get).toHaveBeenCalledWith(
        expect.stringMatching(/^\/armazenamento\/tenant-1\/historico\?page=0&size=24$/),
    ));
});
