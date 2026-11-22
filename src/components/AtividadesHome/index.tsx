import { useEffect, useMemo, useState } from "react";
import {
    Box,
    Button,
    Checkbox,
    Chip,
    CircularProgress,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    TextField,
    Typography,
} from "@mui/material";
import ChecklistRtlOutlinedIcon from "@mui/icons-material/ChecklistRtlOutlined";
import OpenInNewOutlinedIcon from "@mui/icons-material/OpenInNewOutlined";
import http from "../../http";
import autenticaStore from "../../stores/autentica.store";
import ITaskUser from "../../types/ITaskUser";
import ITask from "../../types/ITask";
import IBodyRequest from "../../types/IBodyRequest";
import IColumn from "../../types/IColumn";
import ICard from "../../types/ICard";
import ModalCRM from "../../pages/Crm/Modal";
import { mostrarMensagem } from "../../stores/mensagem.store";

const ULTIMAS_CONFIRMADAS = 5;

const panelSx = {
    p: { xs: 2, md: 3 },
    borderRadius: "20px",
    bgcolor: "rgba(255, 255, 255, 0.78)",
    border: "1px solid rgba(20, 20, 20, 0.1)",
    boxShadow: "0 16px 48px rgba(20, 20, 20, 0.06)",
    backdropFilter: "blur(6px)",
    minWidth: 0,
};

const chipSx = { bgcolor: "rgba(20, 20, 20, 0.07)", color: "#141414", fontWeight: 700 };

interface AtividadesHomeProps {
    colunas: IColumn[];
    colunasCarregadas: boolean;
    onCardsChanged?: () => void;
}

const parseDateBr = (value?: string | null) => {
    if (!value) return Number.POSITIVE_INFINITY;
    if (value.includes("/")) {
        const [dd, mm, yyyy] = value.split("/");
        const t = new Date(`${yyyy}-${mm?.padStart(2, "0")}-${dd?.padStart(2, "0")}T00:00:00`).getTime();
        return Number.isNaN(t) ? Number.POSITIVE_INFINITY : t;
    }
    const t = new Date(value).getTime();
    return Number.isNaN(t) ? Number.POSITIVE_INFINITY : t;
};

const parseConclusao = (value?: string | null) => {
    const t = parseDateBr(value);
    return t === Number.POSITIVE_INFINITY ? 0 : t;
};

const formatDateDisplay = (value?: string | null) => {
    if (!value) return "";
    if (value.includes("/")) return value;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString("pt-BR");
};

const isoWithoutMillis = () => new Date().toISOString().replace(/\.\d{3}Z$/, "");

const mesmaTask = (a: ITaskUser, b: ITaskUser) => a === b || (Boolean(a.id) && a.id === b.id);

export default function AtividadesHome({ colunas, colunasCarregadas, onCardsChanged }: AtividadesHomeProps) {
    const { usuario } = autenticaStore;
    const [tasks, setTasks] = useState<ITaskUser[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedCard, setSelectedCard] = useState<ICard | null>(null);

    const axiosConfig = useMemo(() => ({
        headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + usuario.token,
        },
    }), [usuario.token]);

    const userId = localStorage.getItem("userID") ?? "";

    const columnStatusMap = useMemo(() => {
        const mapping = new Map<string, string>();
        colunas.forEach((column) => mapping.set(String(column.id), `${column.tipo} - ${column.name}`));
        return mapping;
    }, [colunas]);

    const fetchData = async () => {
        if (!userId) return;
        setLoading(true);
        try {
            const [abertas, todas] = await Promise.all([
                http.get<IBodyRequest<ITaskUser>>(`task/get-task-by-user?size=200&page=0&userId=${userId}&openOnly=true`, axiosConfig),
                http.get<IBodyRequest<ITaskUser>>(`task/get-task-by-user?size=200&page=0&userId=${userId}&openOnly=false`, axiosConfig),
            ]);
            const unicas = new Map<string, ITaskUser>();
            [...(abertas.data.content ?? []), ...(todas.data.content ?? [])].forEach((task, index) => {
                unicas.set(task.id ? String(task.id) : `sem-id-${index}`, task);
            });
            setTasks(Array.from(unicas.values()));
        } catch (erro) {
            mostrarMensagem(erro, "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Cards de colunas inativas são os arquivados e ficam fora da Home.
    const visiveis = useMemo(() => tasks.filter((task) =>
        !colunasCarregadas || !task.cardStatusId || columnStatusMap.has(String(task.cardStatusId))
    ), [tasks, colunasCarregadas, columnStatusMap]);

    const pendentes = useMemo(() => visiveis
        .filter((task) => !task.done)
        .sort((a, b) => {
            const diff = parseDateBr(a.estimatedDate) - parseDateBr(b.estimatedDate);
            if (diff !== 0 && !Number.isNaN(diff)) return diff;
            return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        }), [visiveis]);

    const confirmadas = useMemo(() => visiveis
        .filter((task) => task.done)
        .sort((a, b) => parseConclusao(b.conclusionDate) - parseConclusao(a.conclusionDate))
        .slice(0, ULTIMAS_CONFIRMADAS), [visiveis]);

    const updateLocalTask = (task: ITaskUser, patch: Partial<ITaskUser>) => {
        setTasks((prev) => prev.map((item) => (mesmaTask(item, task) ? { ...item, ...patch } : item)));
    };

    const upsertTask = async (task: ITaskUser, patch: Partial<ITaskUser>) => {
        const payload = { ...task, ...patch };
        try {
            if (!payload.id) {
                const { data } = await http.post<ITask>("task", payload, axiosConfig);
                updateLocalTask(task, { ...patch, id: data.id });
            } else {
                await http.put("task", payload, axiosConfig);
                updateLocalTask(task, patch);
            }
            onCardsChanged?.();
        } catch (erro) {
            mostrarMensagem(erro, "error");
        }
    };

    const handleDoneToggle = (task: ITaskUser, checked: boolean) => {
        const conclusionDate = checked ? isoWithoutMillis() : null;
        updateLocalTask(task, { done: checked, conclusionDate });
        upsertTask(task, { done: checked, conclusionDate });
    };

    const isOverdue = (task: ITaskUser) => {
        if (task.done) return false;
        const ts = parseDateBr(task.estimatedDate);
        if (ts === Number.POSITIVE_INFINITY) return false;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return ts < today.getTime();
    };

    const handleEstimatedChange = (task: ITaskUser, value: string) => {
        const trimmed = value.trim();
        if (!trimmed) {
            updateLocalTask(task, { estimatedDate: null });
            upsertTask(task, { estimatedDate: null });
            return;
        }
        const parts = trimmed.split("/");
        if (parts.length === 3) {
            const [dd, mm, yyyy] = parts;
            const iso = `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}T23:59:59`;
            updateLocalTask(task, { estimatedDate: trimmed });
            upsertTask(task, { estimatedDate: iso });
        } else {
            updateLocalTask(task, { estimatedDate: trimmed });
        }
    };

    const handleOpenCard = async (cardId: string) => {
        if (!cardId) return;
        try {
            setLoading(true);
            const { data } = await http.get<ICard>(`card/${cardId}`, axiosConfig);
            setSelectedCard(data);
        } catch (erro) {
            mostrarMensagem(erro, "error");
        } finally {
            setLoading(false);
        }
    };

    const handleCloseCardModal = () => {
        setSelectedCard(null);
        onCardsChanged?.();
        fetchData();
    };

    const renderSecao = (titulo: string, lista: ITaskUser[], vazio: string) => (
        <>
            <TableRow>
                <TableCell colSpan={7} sx={{ bgcolor: "rgba(20, 20, 20, 0.04)", py: 1 }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                        <Typography component="span" sx={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "#141414" }}>
                            {titulo}
                        </Typography>
                        <Chip size="small" label={lista.length} sx={{ ...chipSx, height: 20 }} />
                    </Stack>
                </TableCell>
            </TableRow>
            {lista.length === 0 && (
                <TableRow>
                    <TableCell colSpan={7} sx={{ color: "#666666 !important", fontStyle: "italic", py: 2 }}>{vazio}</TableCell>
                </TableRow>
            )}
            {lista.map((task, index) => (
                <TableRow key={task.id || `${titulo}-${index}`} hover>
                    <TableCell align="center" sx={{ px: 0.5 }}>
                        <Checkbox
                            checked={task.done}
                            onChange={(e) => handleDoneToggle(task, e.target.checked)}
                            inputProps={{ "aria-label": `Marcar "${task.description || "atividade"}" como feita` }}
                            sx={{ color: "rgba(20, 20, 20, 0.45)", "&.Mui-checked": { color: "#141414" } }}
                        />
                    </TableCell>
                    <TableCell>
                        <Typography variant="body2" sx={{ fontSize: 13, whiteSpace: "pre-wrap", wordBreak: "break-word", color: task.done ? "#666666" : "#242424" }}>
                            {task.description || ""}
                        </Typography>
                    </TableCell>
                    <TableCell>
                        <Typography variant="body2" sx={{ fontSize: 13, fontWeight: 600, wordBreak: "break-word" }}>{task.cardNome || ""}</Typography>
                    </TableCell>
                    <TableCell>
                        <Typography variant="body2" sx={{ fontSize: 12, color: "#666666", wordBreak: "break-word" }}>
                            {columnStatusMap.get(String(task.cardStatusId)) || ""}
                        </Typography>
                    </TableCell>
                    <TableCell align="center">
                        <Button
                            variant="outlined"
                            size="small"
                            startIcon={<OpenInNewOutlinedIcon fontSize="small" />}
                            onClick={() => handleOpenCard(task.cardId)}
                            sx={{ minHeight: 32, px: 1.25, whiteSpace: "nowrap", fontSize: 12 }}
                        >
                            Abrir card
                        </Button>
                    </TableCell>
                    <TableCell align="center">
                        <TextField
                            size="small"
                            placeholder="dd/mm/aaaa"
                            value={formatDateDisplay(task.estimatedDate)}
                            onChange={(e) => updateLocalTask(task, { estimatedDate: e.target.value })}
                            onBlur={(e) => handleEstimatedChange(task, e.target.value)}
                            inputProps={{ "aria-label": "Prazo", style: { textAlign: "center", fontSize: 13 } }}
                            sx={{
                                width: 120,
                                "& .MuiOutlinedInput-root": { bgcolor: "#ffffff", borderRadius: "10px" },
                                "& input": { color: isOverdue(task) ? "#303030" : "#242424", fontWeight: isOverdue(task) ? 700 : 400 },
                            }}
                        />
                        {isOverdue(task) && <Typography variant="caption" display="block">Atrasado</Typography>}
                    </TableCell>
                    <TableCell align="center" sx={{ color: "#666666 !important" }}>
                        {formatDateDisplay(task.conclusionDate) || "—"}
                    </TableCell>
                </TableRow>
            ))}
        </>
    );

    return (
        <Box component="section" aria-labelledby="minhas-atividades-titulo" sx={panelSx}>
            <Stack direction="row" spacing={1.5} alignItems="center" justifyContent="space-between" sx={{ mb: 2 }} flexWrap="wrap" useFlexGap>
                <Stack direction="row" spacing={1.5} alignItems="center">
                    <Box sx={{ width: 44, height: 44, borderRadius: "14px", display: "grid", placeItems: "center", bgcolor: "rgba(20, 20, 20, 0.07)", color: "#141414" }}>
                        <ChecklistRtlOutlinedIcon aria-hidden="true" />
                    </Box>
                    <Box>
                        <Typography id="minhas-atividades-titulo" component="h2" variant="h6" sx={{ color: "#141414", lineHeight: 1.2 }}>
                            Minhas Atividades
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Pendentes de confirmação e as últimas {ULTIMAS_CONFIRMADAS} concluídas.
                        </Typography>
                    </Box>
                </Stack>
                <Chip label={`${pendentes.length} pendente${pendentes.length === 1 ? "" : "s"}`} sx={chipSx} />
            </Stack>

            {loading && tasks.length === 0 ? (
                <Box display="flex" justifyContent="center" alignItems="center" py={6}>
                    <CircularProgress sx={{ color: "#141414" }} aria-label="Carregando atividades" />
                </Box>
            ) : (
                <Box sx={{ width: "100%", overflowX: "auto", borderRadius: "14px", border: "1px solid rgba(20, 20, 20, 0.1)", bgcolor: "#ffffff", position: "relative" }}>
                    {loading && (
                        <Box sx={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", bgcolor: "rgba(255, 255, 255, 0.6)", zIndex: 1 }}>
                            <CircularProgress size={32} sx={{ color: "#141414" }} aria-label="Atualizando atividades" />
                        </Box>
                    )}
                    <Table
                        size="small"
                        sx={{
                            tableLayout: "fixed",
                            width: "100%",
                            minWidth: 900,
                            "& td, & th": { borderBottom: "1px solid rgba(20, 20, 20, 0.08)", fontSize: 13, color: "#242424" },
                            "& th": { fontWeight: 700, color: "#666666", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.04em", bgcolor: "#ffffff" },
                            "& tbody tr.MuiTableRow-hover:hover": { bgcolor: "rgba(20, 20, 20, 0.03)" },
                        }}
                    >
                        <TableHead>
                            <TableRow>
                                <TableCell align="center" sx={{ width: 56 }}>Feito</TableCell>
                                <TableCell sx={{ width: "32%" }}>Descrição</TableCell>
                                <TableCell sx={{ width: "17%" }}>Card Nome</TableCell>
                                <TableCell sx={{ width: "17%" }}>Status do Card</TableCell>
                                <TableCell align="center" sx={{ width: 130 }}>Card</TableCell>
                                <TableCell align="center" sx={{ width: 140 }}>Prazo</TableCell>
                                <TableCell align="center" sx={{ width: 110 }}>Realizado em</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {renderSecao("Pendentes de confirmação", pendentes, "Nenhuma atividade pendente.")}
                            {renderSecao("Últimas confirmadas", confirmadas, "Nenhuma atividade concluída ainda.")}
                        </TableBody>
                    </Table>
                </Box>
            )}

            {selectedCard && (
                <ModalCRM
                    open={Boolean(selectedCard)}
                    handleClose={handleCloseCardModal}
                    dados={selectedCard}
                    colunas={colunas}
                    arquivado={false}
                />
            )}
        </Box>
    );
}
