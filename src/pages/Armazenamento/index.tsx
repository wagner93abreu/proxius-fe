import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
    Alert, Box, Chip, Container, Link as MuiLink, Paper, Stack, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Typography,
} from "@mui/material";
import { Link } from "react-router-dom";
import http from "../../http";
import autenticaStore from "../../stores/autentica.store";
import HistoricoArmazenamento from "./Historico";
import { formatBytes, formatTimestamp, measuredUsage, requestError, stateLabel, StorageDetail, StorageHistoryPage } from "./model";

interface CurrentUser { papel: string }

function isLocalTenant(): boolean {
    return /^[a-z0-9](?:[a-z0-9-]{0,48}[a-z0-9])?\.localhost$/.test(window.location.hostname);
}

function profileError(error: unknown): string {
    if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) return "Sua sessão expirou. Entre novamente.";
        if (error.response?.status === 403) return "Seu usuário não tem permissão para acessar esta tela.";
        if (error.response?.status === 404) return "Não foi possível localizar o usuário da sessão.";
        if (!error.response) return "Não foi possível conectar à API local. Verifique se ela está ativa.";
    }
    return "Não foi possível confirmar o perfil do usuário.";
}

export default function Armazenamento() {
    const token = autenticaStore.usuario.token;
    const localTenant = isLocalTenant();
    const config = useMemo(() => ({ headers: { Authorization: `Bearer ${token}` } }), [token]);
    const [detail, setDetail] = useState<StorageDetail | null>(null);
    const [access, setAccess] = useState<"checking" | "admin" | "denied">("checking");
    const [error, setError] = useState("");

    useEffect(() => {
        if (!localTenant) return;
        if (!token) {
            setAccess("denied");
            setError("Sua sessão expirou. Entre novamente.");
            return;
        }
        let active = true;
        const userId = localStorage.getItem("userID");
        if (!userId) {
            setAccess("denied");
            setError("Não foi possível identificar o usuário da sessão.");
            return;
        }
        http.get<CurrentUser>(`usuarios/${encodeURIComponent(userId)}`, config)
            .then(({ data }) => {
                if (!active) return;
                if (data.papel !== "ADMIN") {
                    setAccess("denied");
                    setError("Esta tela está disponível somente para ADMIN da empresa.");
                    return;
                }
                setAccess("admin");
                void http.get<StorageDetail>("armazenamento", config)
                    .then(({ data: result }) => { if (active) setDetail(result); })
                    .catch(e => { if (active) setError(requestError(e, "empresa")); });
            })
            .catch(e => {
                if (active) {
                    setAccess("denied");
                    setError(profileError(e));
                }
            });
        return () => { active = false; };
    }, [config, token]);

    const loadHistory = useCallback(async (page: number, from?: string, to?: string) => {
        const params = new URLSearchParams({ page: String(page), size: "24" });
        if (from) params.set("from", from);
        if (to) params.set("to", to);
        const { data } = await http.get<StorageHistoryPage>(`armazenamento/historico?${params.toString()}`, config);
        return data;
    }, [config]);

    if (!localTenant) return <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error">O armazenamento está disponível somente em um subdomínio local de empresa.</Alert>
    </Container>;

    return <Container maxWidth="lg" sx={{ py: 4 }}>
        <Stack spacing={3}>
            <Stack direction="row" spacing={2} alignItems="baseline" flexWrap="wrap">
                <Typography component="h1" variant="h4">Armazenamento</Typography>
                <Chip label="SIMULATED" color="info" size="small" />
                <MuiLink component={Link} to="/painelDeControle">Voltar ao Painel de Controle</MuiLink>
            </Stack>
            <Alert severity="info">
                Medição técnica simulada para acompanhamento. Não representa cobrança, preço ou limite de armazenamento.
                GiB usa a base binária: 1 GiB = 1.073.741.824 bytes. Esta tela somente consulta dados; não inicia coletas.
            </Alert>
            {error && <Alert severity="error">{error}</Alert>}
            {access === "checking" && !error && <Typography>Verificando acesso de administrador…</Typography>}
            {access === "admin" && !detail && !error && <Typography>Carregando medição de armazenamento…</Typography>}
            {access === "admin" && detail && <>
                <Paper sx={{ p: 3 }}>
                    <Stack spacing={1}>
                        <Typography component="h2" variant="h6">Uso medido</Typography>
                        <Typography>{measuredUsage(detail.summary)}</Typography>
                        <Typography variant="body2" color="text.secondary">
                            Estado: {stateLabel(detail.summary.state)} · Containers coletados: {detail.summary.collectedContainers}/{detail.summary.expectedContainers}
                            {detail.summary.stale ? " · Medição desatualizada" : ""}
                        </Typography>
                        <Typography variant="body2">Coleta mais recente: {formatTimestamp(detail.summary.collectedAt)}</Typography>
                        <Typography variant="body2">Última medição completa: {detail.summary.lastCompleteBytes === null
                            ? "Nenhuma medição completa"
                            : `${formatBytes(detail.summary.lastCompleteBytes)} — ${formatTimestamp(detail.summary.lastCompleteAt)}`}</Typography>
                    </Stack>
                </Paper>
                <Box component="section" aria-labelledby="storage-containers-heading">
                    <Typography id="storage-containers-heading" component="h2" variant="h6" sx={{ mb: 1 }}>Detalhamento por container</Typography>
                    <TableContainer component={Paper}>
                        <Table aria-label="Detalhamento de containers de armazenamento">
                            <TableHead><TableRow>
                                <TableCell>Finalidades</TableCell><TableCell>Recurso local</TableCell>
                                <TableCell>Estado</TableCell><TableCell>Uso medido</TableCell>
                                <TableCell>Coletado em</TableCell><TableCell>Erro</TableCell>
                            </TableRow></TableHead>
                            <TableBody>
                                {detail.containers.map(container => <TableRow key={container.id}>
                                    <TableCell>{container.purposes || "—"}</TableCell>
                                    <TableCell>{container.localResource || "—"}</TableCell>
                                    <TableCell>{container.state}</TableCell>
                                    <TableCell>{container.usedBytes === null ? "Indisponível" : formatBytes(container.usedBytes)}</TableCell>
                                    <TableCell>{formatTimestamp(container.collectedAt)}</TableCell>
                                    <TableCell>{container.error || "—"}</TableCell>
                                </TableRow>)}
                                {detail.containers.length === 0 && <TableRow><TableCell colSpan={6}>Nenhum container cadastrado.</TableCell></TableRow>}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Box>
                <HistoricoArmazenamento loadPage={loadHistory} context="empresa" />
            </>}
        </Stack>
    </Container>;
}
