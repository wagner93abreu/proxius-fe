import { FormEvent, useCallback, useEffect, useState } from "react";
import axios from "axios";
import {
    Alert, Box, Button, Chip, Container, Dialog, DialogActions, DialogContent, DialogTitle,
    Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography,
} from "@mui/material";
import { adminApi } from "./api";
import HistoricoArmazenamento from "../Armazenamento/Historico";
import {
    formatBytes, formatTimestamp, measuredUsage, requestError, stateLabel,
    StorageDetail, StorageHistoryPage, StorageSummary,
} from "../Armazenamento/model";

interface Session { authenticated: boolean; login: string; changePassword: boolean; csrfToken: string }
interface Tenant { id: string; slug: string; name: string; database: string; status: string; managed: boolean }
interface Audit { id: number; actor: string; action: string; tenantId: string | null; createdAt: string }
const emptyTenant = { name: "", slug: "", login: "", email: "", password: "" };

function message(error: unknown): string {
    if (axios.isAxiosError(error)) {
        const data: unknown = error.response?.data;
        if (typeof data === "string" && data.length < 500) return data;
        if (data && typeof data === "object" && "error" in data && typeof data.error === "string") return data.error;
        if (error.response?.status === 400) return "Confira os campos. As senhas devem ter entre 14 e 72 caracteres ASCII sem espacos.";
        if (error.response?.status === 401) return "Sessao expirada ou credenciais invalidas.";
        return "Nao foi possivel concluir a operacao. Verifique a API local na porta 8080 e atualize a sessao.";
    }
    return "Nao foi possivel concluir a operacao.";
}

export default function WcmAdmin() {
    const [session, setSession] = useState<Session | null>(null);
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [audit, setAudit] = useState<Audit[]>([]);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const [busy, setBusy] = useState(false);
    const [login, setLogin] = useState("wcmadmin");
    const [password, setPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [repeatPassword, setRepeatPassword] = useState("");
    const [tenant, setTenant] = useState(emptyTenant);
    const [deleting, setDeleting] = useState<Tenant | null>(null);
    const [confirmation, setConfirmation] = useState("");
    const [deletePassword, setDeletePassword] = useState("");
    const [storageRows, setStorageRows] = useState<StorageSummary[]>([]);
    const [storageError, setStorageError] = useState("");
    const [storageWarning, setStorageWarning] = useState("");
    const [selectedStorageTenant, setSelectedStorageTenant] = useState("");
    const [storageDetail, setStorageDetail] = useState<StorageDetail | null>(null);
    const [storageDetailError, setStorageDetailError] = useState("");
    const [storageBusy, setStorageBusy] = useState(false);
    const local = window.location.hostname === "localhost";

    const loadStorageRows = useCallback(async () => {
        setStorageError("");
        try {
            const { data } = await adminApi.get<StorageSummary[]>("/armazenamento");
            setStorageRows(data);
        } catch (e) {
            setStorageRows([]);
            setStorageError(requestError(e, "plataforma"));
        }
    }, []);

    const refresh = useCallback(async () => {
        const current = (await adminApi.get<Session>("/session")).data;
        setSession(current);
        if (current.authenticated && !current.changePassword) {
            const [rows, events] = await Promise.all([
                adminApi.get<Tenant[]>("/tenants"), adminApi.get<Audit[]>("/audit"), loadStorageRows(),
            ]);
            setTenants(rows.data);
            setAudit(events.data);
        } else {
            setTenants([]);
            setAudit([]);
            setStorageRows([]);
            setStorageDetail(null);
            setSelectedStorageTenant("");
        }
    }, [loadStorageRows]);

    useEffect(() => {
        if (local) void refresh().catch(e => setError(message(e)));
    }, [local, refresh]);

    async function perform(operation: () => Promise<void>) {
        setBusy(true);
        setError("");
        setNotice("");
        try {
            await operation();
        } catch (e) {
            setError(message(e));
        } finally {
            setBusy(false);
        }
    }

    const headers = { "X-CSRF-TOKEN": session?.csrfToken ?? "" };
    async function selectStorageTenant(tenantId: string) {
        setSelectedStorageTenant(tenantId);
        setStorageDetail(null);
        setStorageDetailError("");
        setStorageBusy(true);
        try {
            const { data } = await adminApi.get<StorageDetail>(`/armazenamento/${encodeURIComponent(tenantId)}`);
            setStorageDetail(data);
        } catch (e) {
            setStorageDetailError(requestError(e, "plataforma"));
        } finally {
            setStorageBusy(false);
        }
    }

    const loadPlatformHistory = useCallback(async (page: number, from?: string, to?: string) => {
        if (!selectedStorageTenant) throw new Error("Selecione uma empresa.");
        const params = new URLSearchParams({ page: String(page), size: "24" });
        if (from) params.set("from", from);
        if (to) params.set("to", to);
        const { data } = await adminApi.get<StorageHistoryPage>(
            `/armazenamento/${encodeURIComponent(selectedStorageTenant)}/historico?${params.toString()}`,
        );
        return data;
    }, [selectedStorageTenant]);

    async function collectStorage(tenantId: string) {
        setStorageBusy(true);
        setStorageError("");
        setStorageWarning("");
        setStorageDetailError("");
        setNotice("");
        try {
            const { data: collected } = await adminApi.post<StorageSummary>(
                `/armazenamento/${encodeURIComponent(tenantId)}/coletar`, {}, { headers },
            );
            await refresh();
            if (selectedStorageTenant === tenantId) await selectStorageTenant(tenantId);
            if (collected.state === "PARTIAL") {
                setStorageWarning(`Coleta parcial: subtotal conhecido de ${formatBytes(collected.knownBytes)}; não representa o total. A auditoria é mantida pela API.`);
            } else if (collected.state === "FAILED") {
                setStorageWarning("A coleta falhou; consumo indisponível. A auditoria é mantida pela API.");
            } else if (collected.state === "NEVER") {
                setStorageWarning("A API ainda não retornou uma medição. O estado foi atualizado; consulte novamente mais tarde.");
            } else {
                setNotice("Coleta concluída. A auditoria é mantida pela API.");
            }
        } catch (e) {
            if (axios.isAxiosError(e) && e.response?.status === 409) {
                setStorageError("Uma coleta já está em andamento para esta empresa.");
            } else {
                setStorageError(requestError(e, "plataforma"));
            }
        } finally {
            setStorageBusy(false);
        }
    }
    async function signIn(event: FormEvent) {
        event.preventDefault();
        await perform(async () => {
            await adminApi.post("/login", { login, password }, { headers });
            setPassword("");
            await refresh();
        });
    }
    async function changePassword(event: FormEvent) {
        event.preventDefault();
        if (newPassword !== repeatPassword) { setError("As novas senhas nao conferem."); return; }
        await perform(async () => {
            await adminApi.post("/password", { currentPassword: password, newPassword }, { headers });
            setPassword(""); setNewPassword(""); setRepeatPassword("");
            await refresh();
            setNotice("Senha alterada. Entre novamente com a nova senha.");
        });
    }
    async function createTenant(event: FormEvent) {
        event.preventDefault();
        await perform(async () => {
            await adminApi.post("/tenants", tenant, { headers });
            setTenant(emptyTenant);
            await refresh();
            setNotice("Empresa criada com banco exclusivo e usuario administrador.");
        });
    }
    async function changeStatus(row: Tenant) {
        await perform(async () => {
            await adminApi.post(`/tenants/${row.id}/status`, { blocked: row.status === "ACTIVE" }, { headers });
            await refresh();
        });
    }
    async function deleteTenant(event: FormEvent) {
        event.preventDefault();
        if (!deleting) return;
        await perform(async () => {
            await adminApi.post(`/tenants/${deleting.id}/delete`, { confirmation, password: deletePassword }, { headers });
            setDeleting(null); setConfirmation(""); setDeletePassword("");
            await refresh();
            setNotice("Banco excluido. O registro e a auditoria foram preservados.");
        });
    }

    if (!local) return <Container><Alert severity="error">Este painel esta disponivel somente em http://localhost:3000/wcmadmin.</Alert></Container>;
    return <Container maxWidth="lg" sx={{ py: 4 }}>
        <Stack spacing={3}>
            <Typography variant="h4" component="h1">WCM Admin — gestao da plataforma</Typography>
            <Alert severity="warning">Ambiente exclusivamente local. Integrações externas bloqueadas. A exclusao de banco e irreversivel.</Alert>
            {error && <Alert severity="error" onClose={() => setError("")}>{error}</Alert>}
            {notice && <Alert severity="success">{notice}</Alert>}
            <Box><Button disabled={busy} onClick={() => void perform(refresh)}>Atualizar sessao e lista</Button></Box>
            {!session?.authenticated ? <Paper sx={{ p: 3, maxWidth: 480 }}>
                <Typography variant="h6" component="h2">Acesso exclusivo da plataforma</Typography>
                <Typography sx={{ mb: 2 }}>Nao utilize as credenciais das empresas.</Typography>
                <Stack component="form" spacing={2} onSubmit={signIn}>
                    <TextField label="Login da plataforma" value={login} onChange={e => setLogin(e.target.value)} required autoComplete="username" inputProps={{ maxLength: 80 }} />
                    <TextField label="Senha" type="password" value={password} onChange={e => setPassword(e.target.value)} required autoComplete="current-password" inputProps={{ maxLength: 72 }} />
                    <Button type="submit" variant="contained" disabled={busy || !session?.csrfToken}>Entrar no painel</Button>
                </Stack>
            </Paper> : <>
                <Stack direction="row" spacing={2} alignItems="center">
                    <Typography>Administrador: {session.login}</Typography>
                    <Button disabled={busy} onClick={() => void perform(async () => {
                        await adminApi.post("/logout", {}, { headers });
                        await refresh();
                    })}>Sair do painel</Button>
                </Stack>
                {session.changePassword ? <Paper sx={{ p: 3, maxWidth: 540 }}>
                    <Typography variant="h6" component="h2">Troca obrigatoria de senha</Typography>
                    <Stack component="form" spacing={2} onSubmit={changePassword} sx={{ mt: 2 }}>
                        <TextField label="Senha atual" type="password" value={password} onChange={e => setPassword(e.target.value)} required autoComplete="current-password" inputProps={{ maxLength: 72 }} />
                        <TextField label="Nova senha" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required autoComplete="new-password" helperText="14 a 72 caracteres ASCII sem espacos; use uma senha unica." inputProps={{ minLength: 14, maxLength: 72, pattern: "[!-~]+" }} />
                        <TextField label="Confirme a nova senha" type="password" value={repeatPassword} onChange={e => setRepeatPassword(e.target.value)} required autoComplete="new-password" />
                        <Button type="submit" disabled={busy} variant="contained">Alterar senha</Button>
                    </Stack>
                </Paper> : <>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" component="h2">Cadastrar empresa / tenant</Typography>
                        <Stack component="form" spacing={2} onSubmit={createTenant} sx={{ mt: 2 }}>
                            <TextField label="Nome da empresa" required value={tenant.name} inputProps={{ maxLength: 160 }} onChange={e => setTenant({ ...tenant, name: e.target.value })} />
                            <TextField label="Subdominio" required value={tenant.slug} inputProps={{ pattern: "[a-z0-9]([a-z0-9-]{0,48}[a-z0-9])?", maxLength: 50 }} helperText="Ex.: empresa-teste → http://empresa-teste.localhost:3000" onChange={e => setTenant({ ...tenant, slug: e.target.value })} />
                            <TextField label="Login do administrador da empresa" required autoComplete="off" value={tenant.login} inputProps={{ pattern: "[a-zA-Z0-9._@-]+", maxLength: 80 }} onChange={e => setTenant({ ...tenant, login: e.target.value })} />
                            <TextField label="E-mail do administrador da empresa" type="email" required value={tenant.email} inputProps={{ maxLength: 150 }} onChange={e => setTenant({ ...tenant, email: e.target.value })} />
                            <TextField label="Senha inicial da empresa" type="password" required autoComplete="new-password" value={tenant.password} helperText="14 a 72 caracteres ASCII sem espacos. Nenhum e-mail sera enviado." inputProps={{ minLength: 14, maxLength: 72, pattern: "[!-~]+" }} onChange={e => setTenant({ ...tenant, password: e.target.value })} />
                            <Button type="submit" variant="contained" disabled={busy}>{busy ? "Processando..." : "Criar empresa e banco"}</Button>
                        </Stack>
                    </Paper>
                    <Typography variant="h6" component="h2">Empresas</Typography>
                    <TableContainer component={Paper}><Table aria-label="Empresas cadastradas">
                        <TableHead><TableRow><TableCell>Empresa</TableCell><TableCell>Banco</TableCell><TableCell>Estado</TableCell><TableCell>Acoes</TableCell></TableRow></TableHead>
                        <TableBody>{tenants.map(row => <TableRow key={row.id}>
                            <TableCell>{row.name}<br /><a href={`http://${row.slug}.localhost:3000/login`} target="_blank" rel="noreferrer">{row.slug}.localhost</a></TableCell>
                            <TableCell>{row.database}{!row.managed && <Typography variant="caption" display="block">Banco protegido contra exclusao</Typography>}</TableCell>
                            <TableCell><Chip size="small" label={row.status} /></TableCell>
                            <TableCell>
                                {["ACTIVE", "BLOCKED"].includes(row.status) && <Button disabled={busy} onClick={() => void changeStatus(row)}>{row.status === "ACTIVE" ? "Bloquear" : "Desbloquear"}</Button>}
                                {row.managed && ["BLOCKED", "FAILED", "DELETING"].includes(row.status) && <Button color="error" disabled={busy} onClick={() => { setDeleting(row); setConfirmation(""); setDeletePassword(""); }}>Excluir banco</Button>}
                            </TableCell>
                        </TableRow>)}</TableBody>
                    </Table></TableContainer>
                    <Typography variant="h6" component="h2">Ultimos 100 eventos de auditoria</Typography>
                    <TableContainer component={Paper}><Table size="small" aria-label="Auditoria administrativa">
                        <TableHead><TableRow><TableCell>Data</TableCell><TableCell>Ator</TableCell><TableCell>Acao</TableCell><TableCell>Tenant</TableCell></TableRow></TableHead>
                        <TableBody>{audit.map(row => <TableRow key={row.id}><TableCell>{new Date(row.createdAt).toLocaleString()}</TableCell><TableCell>{row.actor}</TableCell><TableCell>{row.action}</TableCell><TableCell>{row.tenantId ?? "—"}</TableCell></TableRow>)}</TableBody>
                    </Table></TableContainer>
                    <Paper sx={{ p: 3 }}>
                        <Stack spacing={2}>
                            <Stack direction="row" spacing={1} alignItems="center">
                                <Typography variant="h6" component="h2">Armazenamento por empresa</Typography>
                            </Stack>
                            <Alert severity="info">
                                Ambientes SIMULATED e Microsoft TEST separados; não representa cobrança, preços ou limites.
                                GiB usa a base binária: 1 GiB = 1.073.741.824 bytes. A coleta manual é registrada pela API na auditoria.
                            </Alert>
                            {storageError && <Alert severity="error">{storageError}</Alert>}
                            {storageWarning && <Alert severity="warning">{storageWarning}</Alert>}
                            <TableContainer>
                                <Table size="small" aria-label="Resumo de armazenamento por empresa">
                                    <TableHead><TableRow>
                                        <TableCell>Empresa</TableCell><TableCell>Estado</TableCell><TableCell>Uso medido</TableCell>
                                        <TableCell>Última medição completa</TableCell><TableCell>Coleta</TableCell><TableCell>Ações</TableCell>
                                    </TableRow></TableHead>
                                    <TableBody>
                                        {storageRows.map(row => <TableRow key={row.tenantId}>
                                            <TableCell>{row.name} ({row.slug} · {row.tenantStatus}) <Chip label={row.simulated ? "SIMULATED" : "Microsoft TEST"} size="small" /></TableCell>
                                            <TableCell>{stateLabel(row.state)}{row.stale ? " · Desatualizada" : ""}</TableCell>
                                            <TableCell>{measuredUsage(row)}</TableCell>
                                            <TableCell>{row.lastCompleteBytes === null
                                                ? "Nenhuma medição completa"
                                                : `${formatBytes(row.lastCompleteBytes)} — ${formatTimestamp(row.lastCompleteAt)}`}</TableCell>
                                            <TableCell>{formatTimestamp(row.collectedAt)}</TableCell>
                                            <TableCell>
                                                <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                                                    <Button size="small" disabled={storageBusy} onClick={() => void selectStorageTenant(row.tenantId)}>
                                                        {selectedStorageTenant === row.tenantId ? "Atualizar detalhes" : "Detalhes"}
                                                    </Button>
                                                    <Button size="small" variant="outlined" disabled={storageBusy || !session.csrfToken}
                                                        onClick={() => void collectStorage(row.tenantId)}>Coletar agora</Button>
                                                </Stack>
                                            </TableCell>
                                        </TableRow>)}
                                        {storageRows.length === 0 && !storageError && <TableRow>
                                            <TableCell colSpan={6}>Nenhuma empresa ou medição disponível.</TableCell>
                                        </TableRow>}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                            {selectedStorageTenant && <>
                                {storageDetailError && <Alert severity="error">{storageDetailError}</Alert>}
                                {storageBusy && !storageDetail && <Typography>Carregando detalhes…</Typography>}
                                {storageDetail && storageDetail.summary.tenantId === selectedStorageTenant && <>
                                    <Box component="section" aria-labelledby="platform-storage-detail">
                                        <Typography id="platform-storage-detail" component="h3" variant="subtitle1">
                                            {storageDetail.summary.name} — detalhamento
                                        </Typography>
                                        <Typography>{measuredUsage(storageDetail.summary)}</Typography>
                                        <Chip label={storageDetail.summary.simulated ? "SIMULATED" : "Microsoft TEST"} size="small" />
                                        <Typography variant="body2">Estado: {stateLabel(storageDetail.summary.state)} · Containers coletados: {storageDetail.summary.collectedContainers}/{storageDetail.summary.expectedContainers}</Typography>
                                        <Typography variant="body2">Coleta mais recente: {formatTimestamp(storageDetail.summary.collectedAt)}</Typography>
                                        <Typography variant="body2">Última medição completa: {storageDetail.summary.lastCompleteBytes === null
                                            ? "Nenhuma medição completa"
                                            : `${formatBytes(storageDetail.summary.lastCompleteBytes)} — ${formatTimestamp(storageDetail.summary.lastCompleteAt)}`}</Typography>
                                        <TableContainer component={Paper} variant="outlined" sx={{ mt: 1 }}>
                                            <Table size="small" aria-label="Containers da empresa selecionada">
                                                <TableHead><TableRow>
                                                    <TableCell>Finalidades</TableCell><TableCell>Recurso local</TableCell>
                                                    <TableCell>Estado</TableCell><TableCell>Uso medido</TableCell>
                                                    <TableCell>Coletado em</TableCell><TableCell>Erro</TableCell>
                                                </TableRow></TableHead>
                                                <TableBody>
                                                    {storageDetail.containers.map(container => <TableRow key={container.id}>
                                                        <TableCell>{container.purposes || "—"}</TableCell>
                                                        <TableCell>{container.localResource || "—"}</TableCell>
                                                        <TableCell>{container.state}</TableCell>
                                                        <TableCell>{container.usedBytes === null ? "Indisponível" : formatBytes(container.usedBytes)}</TableCell>
                                                        <TableCell>{formatTimestamp(container.collectedAt)}</TableCell>
                                                        <TableCell>{container.error || "—"}</TableCell>
                                                    </TableRow>)}
                                                    {storageDetail.containers.length === 0 && <TableRow><TableCell colSpan={6}>Nenhum container cadastrado.</TableCell></TableRow>}
                                                </TableBody>
                                            </Table>
                                        </TableContainer>
                                    </Box>
                                    <HistoricoArmazenamento loadPage={loadPlatformHistory} context="plataforma" />
                                </>}
                            </>}
                        </Stack>
                    </Paper>
                </>}
            </>}
        </Stack>
        <Dialog open={deleting !== null} onClose={() => { if (!busy) { setDeleting(null); setDeletePassword(""); } }} fullWidth maxWidth="sm">
            <Box component="form" onSubmit={deleteTenant}>
                <DialogTitle>Excluir banco definitivamente</DialogTitle>
                <DialogContent><Stack spacing={2} sx={{ pt: 1 }}>
                    <Alert severity="error">Todos os dados de {deleting?.name} serao apagados. Esta operacao nao pode ser desfeita.</Alert>
                    <Typography>Digite exatamente: {deleting?.name}</Typography>
                    <TextField label="Nome de confirmacao" required value={confirmation} onChange={e => setConfirmation(e.target.value)} />
                    <TextField label="Sua senha da plataforma" type="password" required autoComplete="current-password" inputProps={{ maxLength: 72 }} value={deletePassword} onChange={e => setDeletePassword(e.target.value)} />
                    {error && <Alert severity="error">{error}</Alert>}
                </Stack></DialogContent>
                <DialogActions><Button disabled={busy} onClick={() => { setDeleting(null); setDeletePassword(""); }}>Cancelar</Button><Button type="submit" color="error" disabled={busy || confirmation !== deleting?.name}>Confirmar exclusao irreversivel</Button></DialogActions>
            </Box>
        </Dialog>
    </Container>;
}
