import { useEffect, useState } from "react";
import {
    Alert, Button, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    TextField, Typography,
} from "@mui/material";
import { formatBytes, formatTimestamp, requestError, stateLabel, StorageHistoryPage } from "./model";

interface HistoricoProps {
    loadPage: (page: number, from?: string, to?: string) => Promise<StorageHistoryPage>;
    context: "empresa" | "plataforma";
}

export default function HistoricoArmazenamento({ loadPage, context }: HistoricoProps) {
    const [data, setData] = useState<StorageHistoryPage | null>(null);
    const [page, setPage] = useState(0);
    const [fromInput, setFromInput] = useState("");
    const [toInput, setToInput] = useState("");
    const [appliedFrom, setAppliedFrom] = useState("");
    const [appliedTo, setAppliedTo] = useState("");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");

    async function fetchPage(targetPage: number, from: string, to: string) {
        setBusy(true);
        setError("");
        try {
            setData(await loadPage(targetPage, from || undefined, to || undefined));
            setPage(targetPage);
        } catch (e) {
            setData(null);
            setError(requestError(e, context));
        } finally {
            setBusy(false);
        }
    }

    useEffect(() => {
        setData(null);
        setPage(0);
        void fetchPage(0, appliedFrom, appliedTo);
        // The loader identifies the selected tenant and is intentionally the refresh trigger.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loadPage]);

    function applyFilter() {
        const from = fromInput ? new Date(fromInput) : null;
        const to = toInput ? new Date(toInput) : null;
        if ((from && Number.isNaN(from.getTime())) || (to && Number.isNaN(to.getTime()))) {
            setError("Informe um intervalo de datas válido.");
            return;
        }
        if (from && to && from > to) {
            setError("A data inicial deve ser anterior à data final.");
            return;
        }
        const fromIso = from?.toISOString() ?? "";
        const toIso = to?.toISOString() ?? "";
        setAppliedFrom(fromIso);
        setAppliedTo(toIso);
        void fetchPage(0, fromIso, toIso);
    }

    return <Paper variant="outlined" sx={{ p: 2 }}>
        <Stack spacing={2}>
            <Typography component="h3" variant="h6">Histórico de medições</Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ sm: "center" }}>
                <TextField type="datetime-local" label="De" value={fromInput} onChange={e => setFromInput(e.target.value)}
                    InputLabelProps={{ shrink: true }} size="small" />
                <TextField type="datetime-local" label="Até" value={toInput} onChange={e => setToInput(e.target.value)}
                    InputLabelProps={{ shrink: true }} size="small" />
                <Button variant="outlined" onClick={applyFilter} disabled={busy}>Aplicar período</Button>
                <Button onClick={() => {
                    setFromInput(""); setToInput(""); setAppliedFrom(""); setAppliedTo("");
                    void fetchPage(0, "", "");
                }} disabled={busy}>Limpar período</Button>
            </Stack>
            {error && <Alert severity="error">{error}</Alert>}
            {data && <>
                <TableContainer>
                    <Table size="small" aria-label="Histórico de armazenamento">
                        <TableHead><TableRow>
                            <TableCell>Coletada em</TableCell><TableCell>Estado</TableCell>
                            <TableCell>Uso reportado</TableCell><TableCell>Última medição completa</TableCell>
                        </TableRow></TableHead>
                        <TableBody>{data.items.map((row, index) => <TableRow key={`${row.collectedAt ?? "none"}-${index}`}>
                            <TableCell>{formatTimestamp(row.collectedAt)}</TableCell>
                            <TableCell>{stateLabel(row.state)}{row.stale ? " (desatualizada)" : ""}</TableCell>
                            <TableCell>{row.state === "PARTIAL"
                                ? `Subtotal conhecido: ${formatBytes(row.knownBytes)} (não é o total)`
                                : row.state === "NEVER" ? "Ainda não medido"
                                    : row.state === "FAILED" ? "Falha na coleta; consumo indisponível"
                                        : row.usedBytes === null ? "Valor indisponível" : formatBytes(row.usedBytes)}</TableCell>
                            <TableCell>{row.lastCompleteBytes === null
                                ? "Nenhuma medição completa"
                                : `${formatBytes(row.lastCompleteBytes)} — ${formatTimestamp(row.lastCompleteAt)}`}</TableCell>
                        </TableRow>)}
                        {data.items.length === 0 && <TableRow><TableCell colSpan={4}>Nenhuma medição neste período.</TableCell></TableRow>}
                        </TableBody>
                    </Table>
                </TableContainer>
                <Stack direction="row" spacing={2} alignItems="center" justifyContent="flex-end">
                    <Typography variant="body2">Página {data.page + 1} · {data.size} registros</Typography>
                    <Button disabled={busy || page === 0} onClick={() => void fetchPage(page - 1, appliedFrom, appliedTo)}>Anterior</Button>
                    <Button disabled={busy || !data.hasNext} onClick={() => void fetchPage(page + 1, appliedFrom, appliedTo)}>Próxima</Button>
                </Stack>
            </>}
        </Stack>
    </Paper>;
}
