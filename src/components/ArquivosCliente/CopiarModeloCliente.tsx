import React, { useEffect, useState } from "react";
import { folderDisplayName } from "./folderDisplayName";
import {
    Alert, Button, Checkbox, CircularProgress, Dialog, DialogActions, DialogContent,
    DialogTitle, FormControl, FormControlLabel, InputLabel, LinearProgress, MenuItem,
    Select, Stack, Typography,
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import http from "../../http";
import { libraryAuthHeaders } from "../../http/bibliotecas";
import {
    getModeloCopy, IModeloArquivo, IOperacaoCopiaModelo, isModelCatalogEnabled,
    listModelos, parseModeloOperation, startModeloCopy,
} from "../../http/modelosArquivo";
import { sharePointErrorMessage } from "../../http/sharepoint";
import IUser from "../../types/IUser";
import IClifor from "../../types/IClifor";

interface CopiarModeloClienteProps {
    cliforId: string | number;
    onNavigate?: (folderId: string, folderName: string) => void;
}

interface CopyRequest {
    modeloId: string | number;
    nomeModelo: string;
    key: string;
    operation?: IOperacaoCopiaModelo;
}

const statusLabels = {
    PENDENTE: "Cópia pendente",
    EM_ANDAMENTO: "Cópia em andamento",
    CONCLUIDA: "Cópia concluída",
    FALHOU: "A cópia falhou",
};
const isTerminal = (operation?: IOperacaoCopiaModelo) =>
    operation?.estado === "CONCLUIDA" || operation?.estado === "FALHOU";

const errorMessage = (error: unknown) =>
    error instanceof Error && !("isAxiosError" in error) ? error.message : sharePointErrorMessage(error);

function formatUuidV4(bytes: Uint8Array) {
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function createIdempotencyKey() {
    if (typeof crypto === "undefined") throw new Error("Este navegador não oferece geração segura de chaves. Use um navegador atualizado.");
    if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
    return formatUuidV4(crypto.getRandomValues(new Uint8Array(16)));
}

function readRequest(storageKey: string): { request: CopyRequest | null; error: string } {
    try {
        const stored = localStorage.getItem(storageKey);
        if (!stored) return { request: null, error: "" };
        const data: unknown = JSON.parse(stored);
        if (!data || typeof data !== "object" ||
            !("modeloId" in data) || (typeof data.modeloId !== "string" && typeof data.modeloId !== "number") ||
            !("nomeModelo" in data) || typeof data.nomeModelo !== "string" ||
            !("key" in data) || typeof data.key !== "string" || !data.key) {
            throw new Error("Registro de cópia inválido. Não inicie outra cópia antes de conferir o destino.");
        }
        const operation = "operation" in data && data.operation ? parseModeloOperation(data.operation) : undefined;
        // The old fallback's unhyphenated keys were rejected before any server operation could be created.
        const key = !operation && /^[0-9a-f]{32}$/i.test(data.key)
            ? formatUuidV4(Uint8Array.from(data.key.match(/.{2}/g)!, (byte) => parseInt(byte, 16)))
            : data.key;
        return {
            request: {
                modeloId: data.modeloId,
                nomeModelo: data.nomeModelo,
                key,
                ...(operation ? { operation } : {}),
            },
            error: "",
        };
    } catch (error) {
        return { request: null, error: `Não foi possível recuperar a cópia: ${errorMessage(error)}` };
    }
}

function CopyDialog({ cliforId, onNavigate, clientName, userId }: CopiarModeloClienteProps & {
    clientName: string; userId: string;
}) {
    const storageKey = `model-copy:${encodeURIComponent(userId)}:${encodeURIComponent(String(cliforId))}`;
    const [restored] = useState(() => readRequest(storageKey));
    const [request, setRequest] = useState<CopyRequest | null>(restored.request);
    const [open, setOpen] = useState(false);
    const [models, setModels] = useState<IModeloArquivo[]>([]);
    const [modeloId, setModeloId] = useState("");
    const [confirmed, setConfirmed] = useState(false);
    const [loadingModels, setLoadingModels] = useState(false);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState(restored.error);
    const [pollError, setPollError] = useState("");
    const [pollAttempt, setPollAttempt] = useState(0);
    const [refreshingOperation, setRefreshingOperation] = useState(false);
    const operation = request?.operation;
    const pollingId = operation && !isTerminal(operation) ? operation.id : undefined;
    const copyKey = request?.key;
    const copyModelId = request?.modeloId;
    const copyModelName = request?.nomeModelo;

    const persist = (next: CopyRequest) => {
        // Persist the key before POST so an uncertain response can be retried after remount.
        localStorage.setItem(storageKey, JSON.stringify(next));
        setRequest(next);
    };

    useEffect(() => {
        if (!pollingId || !copyKey || copyModelId == null || copyModelName == null) return;
        let active = true;
        let timer: ReturnType<typeof setTimeout>;
        const poll = async () => {
            try {
                const nextOperation = await getModeloCopy(pollingId);
                if (!active) return;
                const next: CopyRequest = {
                    key: copyKey, modeloId: copyModelId, nomeModelo: copyModelName, operation: nextOperation,
                };
                localStorage.setItem(storageKey, JSON.stringify(next));
                setRequest(next);
                setPollError("");
                if (!isTerminal(nextOperation)) timer = setTimeout(poll, 3000);
            } catch (err) {
                if (active) setPollError(`Não foi possível atualizar o estado. ${errorMessage(err)}`);
            }
        };
        void poll();
        return () => { active = false; clearTimeout(timer); };
    }, [pollingId, copyKey, copyModelId, copyModelName, pollAttempt, storageKey]);

    const refreshCompletedOperation = async () => {
        if (!request?.operation || request.operation.estado !== "CONCLUIDA" || refreshingOperation) return;
        setRefreshingOperation(true);
        setPollError("");
        try {
            const updated = await getModeloCopy(request.operation.id);
            if (updated.estado !== "CONCLUIDA") throw new Error("O servidor retornou um estado inesperado para a cópia concluída.");
            persist({ ...request, operation: updated });
        } catch (err) {
            setPollError(`Não foi possível atualizar a pasta de destino. ${errorMessage(err)}`);
        } finally {
            setRefreshingOperation(false);
        }
    };

    const openDialog = async () => {
        setOpen(true);
        if (request?.operation?.estado === "CONCLUIDA") {
            await refreshCompletedOperation();
            return;
        }
        if (request || restored.error) return;
        setError("");
        setLoadingModels(true);
        try {
            setModels((await listModelos()).filter((model) => model.ativo));
        } catch (err) {
            setError(errorMessage(err));
        } finally {
            setLoadingModels(false);
        }
    };

    const submit = async () => {
        if (sending || operation || restored.error) return;
        const selected = models.find((model) => String(model.id) === modeloId);
        if (!request && (!selected || !confirmed)) return;
        setSending(true);
        setError("");
        try {
            let next = request;
            if (!next) {
                if (!selected) throw new Error("Selecione um modelo disponível.");
                next = { modeloId: selected.id, nomeModelo: selected.nome, key: createIdempotencyKey() };
            }
            persist(next);
            const accepted = await startModeloCopy(cliforId, next.modeloId, next.key);
            persist({ ...next, operation: accepted });
        } catch (err) {
            setError(errorMessage(err));
        } finally {
            setSending(false);
        }
    };

    const newCopy = async () => {
        if (!isTerminal(operation) ||
            !window.confirm("Criar intencionalmente outra cópia com uma nova chave? Uma nova pasta será criada, sem substituir a anterior.")) return;
        try {
            localStorage.removeItem(storageKey);
            setRequest(null);
            setModeloId("");
            setConfirmed(false);
            setError("");
            setPollError("");
            setLoadingModels(true);
            setModels((await listModelos()).filter((model) => model.ativo));
        } catch (err) {
            setError(errorMessage(err));
        } finally {
            setLoadingModels(false);
        }
    };

    const navigate = () => {
        if (operation?.estado === "CONCLUIDA" && operation.pastaDestinoId && onNavigate) {
            onNavigate(operation.pastaDestinoId, operation.nomePastaDestino || request?.nomeModelo || "Modelo copiado");
            setOpen(false);
        }
    };

    return (
        <>
            <Button variant="outlined" startIcon={<ContentCopyIcon />} onClick={openDialog}
                sx={{ borderColor: "#55081d", color: "#55081d", fontWeight: 700 }}>
                Copiar modelo para cliente
            </Button>
            {operation && <Typography role="status" variant="caption">{statusLabels[operation.estado]}</Typography>}
            <Dialog open={open} onClose={() => !sending && setOpen(false)} fullWidth maxWidth="sm">
                <DialogTitle sx={{ color: "#55081d" }}>Copiar modelo para cliente</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ pt: 1 }}>
                        <Typography>Cliente: <strong>{clientName} ({cliforId})</strong></Typography>
                        <Typography variant="body2">
                            A cópia criará uma pasta independente. Arquivos existentes não serão alterados nem substituídos.
                        </Typography>
                        {request ? <Typography>Modelo: {request.nomeModelo}</Typography> :
                            loadingModels ? <CircularProgress size={24} aria-label="Carregando modelos" /> : (
                                <FormControl fullWidth>
                                    <InputLabel id="modelo-cliente-label">Modelo</InputLabel>
                                    <Select labelId="modelo-cliente-label" label="Modelo" value={modeloId}
                                        onChange={(event) => { setModeloId(String(event.target.value)); setConfirmed(false); }}
                                        disabled={sending || Boolean(restored.error)}>
                                        {models.map((model) => (
                                            <MenuItem key={model.id} value={String(model.id)}>{model.nome}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            )}
                        {!request && !loadingModels && !models.length && !error &&
                            <Alert severity="info">Não há modelos disponíveis para copiar.</Alert>}
                        {!request && <FormControlLabel control={
                            <Checkbox checked={confirmed} disabled={sending} onChange={(event) => setConfirmed(event.target.checked)} />
                        } label="Confirmo a cópia para este cliente, sem sobrescrever arquivos existentes." />}
                        {error && <Alert severity="error">{error}</Alert>}
                        {request && !operation && <Alert severity="warning">
                            A confirmação do servidor ainda não foi recebida. Tente novamente com a mesma chave; não será criada uma cópia duplicada.
                        </Alert>}
                        {operation && (
                            <>
                                <Alert severity={operation.estado === "FALHOU" ? "error" : operation.estado === "CONCLUIDA" ? "success" : "info"}>
                                    {statusLabels[operation.estado]} — solicitação {operation.id}.
                                    {operation.estado === "FALHOU" && ` ${operation.erro || "O servidor não informou o motivo da falha."}`}
                                </Alert>
                                {!isTerminal(operation) && <LinearProgress
                                    variant={operation.progresso == null ? "indeterminate" : "determinate"}
                                    value={Math.max(0, Math.min(100, operation.progresso ?? 0))} />}
                                {operation.nomePastaDestino && <Typography>Pasta de destino: {folderDisplayName(operation.nomePastaDestino)}</Typography>}
                                {operation.estado === "CONCLUIDA" && operation.pastaDestinoId && onNavigate &&
                                    <Button disabled={refreshingOperation} onClick={navigate}>Abrir pasta de destino</Button>}
                                {isTerminal(operation) && <Button disabled={refreshingOperation} onClick={newCopy}>Iniciar outra cópia</Button>}
                            </>
                        )}
                        {pollError && <Alert severity="error" action={
                            <Button disabled={refreshingOperation} onClick={() => {
                                if (operation?.estado === "CONCLUIDA") void refreshCompletedOperation();
                                else { setPollError(""); setPollAttempt((value) => value + 1); }
                            }}>Tentar novamente</Button>
                        }>{pollError}</Alert>}
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpen(false)} disabled={sending}>Fechar</Button>
                    {!operation && <Button onClick={submit} variant="contained" sx={{ bgcolor: "#55081d" }}
                        disabled={Boolean(restored.error) || loadingModels || sending || (!request && (!modeloId || !confirmed))}>
                        {sending ? "Enviando..." : request ? "Tentar novamente com a mesma chave" : "Confirmar cópia"}
                    </Button>}
                </DialogActions>
            </Dialog>
        </>
    );
}

export default function CopiarModeloCliente(props: CopiarModeloClienteProps) {
    const [client, setClient] = useState<{ name: string; userId: string } | null>(null);
    const [error, setError] = useState("");
    useEffect(() => {
        let active = true;
        const validate = async () => {
            if (!isModelCatalogEnabled()) return;
            const userId = localStorage.getItem("userID");
            if (!userId || !localStorage.getItem("authToken")) return;
            try {
                const { data: user } = await http.get<IUser>(`usuarios/${encodeURIComponent(userId)}`, { headers: libraryAuthHeaders() });
                if (!active || !["ADMIN", "ATENDIMENTO"].includes(user.papel)) return;
                const { data: target } = await http.get<IClifor>(`clifor/${encodeURIComponent(String(props.cliforId))}`, { headers: libraryAuthHeaders() });
                if (target.id == null || String(target.id) !== String(props.cliforId)) {
                    throw new Error("Cliente de destino inválido. Atualize a área do cliente.");
                }
                if (active) setClient({ name: target.nomecomercial || target.nomesocial || String(target.id), userId });
            } catch (err) {
                if (active) setError(errorMessage(err));
            }
        };
        setClient(null);
        setError("");
        void validate();
        return () => { active = false; };
    }, [props.cliforId]);
    if (!isModelCatalogEnabled()) return null;
    if (error) return <Alert severity="error">Não foi possível verificar o acesso à cópia. {error}</Alert>;
    if (!client) return null;
    return <CopyDialog key={`${client.userId}:${props.cliforId}`} {...props} clientName={client.name} userId={client.userId} />;
}
