import React, { useEffect, useMemo, useRef, useState } from "react";
import {
    Box,
    Button,
    Checkbox,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    TextField,
    Typography,
} from "@mui/material";
import styled from "styled-components";
import autenticaStore from "../../stores/autentica.store";
import http from "../../http";
import ITaskUser from "../../types/ITaskUser";
import ITask from "../../types/ITask";
import IUser from "../../types/IUser";
import IBodyRequest from "../../types/IBodyRequest";
import ICard from "../../types/ICard";
import IClifor from "../../types/IClifor";
import IComentario from "../../types/IComentario";
import { mostrarMensagem } from "../../stores/mensagem.store";

const BoxCustomizado = styled(Box)`
    position: relative;
    width: 60%;
    min-height: 60vh;
    max-height: 73.5vh;
    margin: 0px 0 0 0;
    overflow-y: auto;
    background-color: rgba(255,255,255,0.6);
    border: 1px solid rgba(85, 8, 29, 0.16);
    border-radius: 5px;
    padding: 1em 1em;
    padding-bottom: 0;

    @media (max-width: 768px) {
        width: 95%;
        margin-left: 0;
    }

        /* Ensure scrollbar colors apply across browsers */
    scrollbar-color: rgba(85, 8, 29, 0.35) #efe5d8;
    scrollbar-width: thin;

    @media (max-width: 1024px) {
        max-width: 95%;
        width: 95%;
    }

    /* Scrollbar styling scoped to this container (increased specificity) */
    &&::-webkit-scrollbar {
        width: 12px;
    }

    &&::-webkit-scrollbar-track {
        background: #efe5d8;
        border-radius: 10px;
        margin: 4px 2px;
    }

    &&::-webkit-scrollbar-thumb {
        background: rgba(85, 8, 29, 0.35);
        border-radius: 10px;
        border: 2px solid #efe5d8;
    }

    &&::-webkit-scrollbar-thumb:hover {
        background: rgba(85, 8, 29, 0.5);
    }
`;

const TableScroll = styled(Box)`
    width: 100%;
    overflow-x: auto;
    overflow-y: hidden;
    padding-bottom: 16px;

    scrollbar-width: none;

    &&::-webkit-scrollbar {
        height: 0px;
    }

    scrollbar-color: rgba(85, 8, 29, 0.35) #efe5d8;
`;

const FixedScrollBar = styled(Box)`
    position: sticky;
    bottom: 0;
    left: 0;
    width: 100%;
    overflow-x: auto;
    overflow-y: hidden;
    padding-top: 4px;
    background: linear-gradient(180deg, rgba(239, 229, 216, 0) 0%, rgba(239, 229, 216, 0.85) 60%, rgba(239, 229, 216, 1) 100%);
    z-index: 2;

    scrollbar-color: rgba(85, 8, 29, 0.5) #efe5d8;
    scrollbar-width: thin;

    &&::-webkit-scrollbar {
        height: 10px;
    }

    &&::-webkit-scrollbar-track {
        background: #efe5d8;
        border-radius: 10px;
        margin: 4px 2px;
    }

    &&::-webkit-scrollbar-thumb {
        background: rgba(85, 8, 29, 0.5);
        border-radius: 10px;
        border: 2px solid #efe5d8;
    }

    &&::-webkit-scrollbar-thumb:hover {
        background: rgba(85, 8, 29, 0.65);
    }
`;

export default function MinhasAtividades() {
    const { usuario } = autenticaStore;
    const [tasks, setTasks] = useState<ITaskUser[]>([]);
    const [colaboradores, setColaboradores] = useState<IUser[]>([]);
    const [loading, setLoading] = useState(false);
    const [cardModalOpen, setCardModalOpen] = useState(false);
    const [selectedCard, setSelectedCard] = useState<ICard | null>(null);
    const [cliforId, setCliforId] = useState<string | number | null>(null);
    const [clienteNome, setClienteNome] = useState<string>("");
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [confirmTaskIndex, setConfirmTaskIndex] = useState<number | null>(null);
    const [confirmChecked, setConfirmChecked] = useState(false);
    const tableScrollRef = useRef<HTMLDivElement | null>(null);
    const fixedScrollRef = useRef<HTMLDivElement | null>(null);
    const syncingScroll = useRef(false);
    const tableMinWidth = 900;

    const axiosConfig = {
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${usuario.token}`,
        },
    };

    const userId = useMemo(() => localStorage.getItem("userID"), [usuario]);

    const formatDateDisplay = (value?: string | null) => {
        if (!value) return "";
        if (value.includes("/")) return value;
        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString("pt-BR");
    };

    const isoWithoutMillis = () => new Date().toISOString().replace(/\.\d{3}Z$/, "");

    const parseDateBr = (value?: string | null) => {
        if (!value) return Number.POSITIVE_INFINITY;
        if (value.includes("/")) {
            const [dd, mm, yyyy] = value.split("/");
            const iso = `${yyyy}-${mm?.padStart(2, "0")}-${dd?.padStart(2, "0")}T00:00:00`;
            const t = new Date(iso).getTime();
            return Number.isNaN(t) ? Number.POSITIVE_INFINITY : t;
        }
        const t = new Date(value).getTime();
        return Number.isNaN(t) ? Number.POSITIVE_INFINITY : t;
    };

    const normalizeVisible = (value?: number | boolean | null) => {
        if (typeof value === "number") return value;
        return value ? 1 : 0;
    };

    const sortTasks = (list: ITaskUser[]) => {
        return [...list].sort((a, b) => {
            if (a.done !== b.done) return a.done ? 1 : -1;
            const aTime = parseDateBr(a.estimatedDate) || new Date(a.createdAt).getTime();
            const bTime = parseDateBr(b.estimatedDate) || new Date(b.createdAt).getTime();
            return aTime - bTime;
        });
    };

    const fetchSessaoMap = async (cardIds: (string | number)[]) => {
        if (!cardIds.length) return new Map<string, { titulo: string; conclusionDate: string | null }>();
        const sessaoMap = new Map<string, { titulo: string; conclusionDate: string | null }>();

        const requests = cardIds.map((id) =>
            http
                .get<IComentario[]>(`comentario/filter?origemTipo=PLANEJAMENTO&origemId=${id}`, axiosConfig)
                .then((resp) => resp.data)
                .catch(() => [])
        );

        const results = await Promise.all(requests);
        results.forEach((list) => {
            list.forEach((c) => {
                const key = String(c.id);
                if (!sessaoMap.has(key)) {
                    sessaoMap.set(key, { titulo: c.descricao || "", conclusionDate: c.conclusionDate || null });
                }
            });
        });

        return sessaoMap;
    };

    const fetchData = async () => {
        if (!true || !userId) return;
        setLoading(true);
        try {
            const { data: cliforList } = await http.get<IClifor[]>(`clifor/filter?attribute=idusuario&value=${userId}`, axiosConfig);
            const foundCliforId = cliforList?.[0]?.id ?? null;
            setClienteNome(cliforList?.[0]?.nomecomercial || cliforList?.[0]?.nomesocial || "");
            const clienteId = foundCliforId ?? cliforId;
            setCliforId(clienteId);

            if (!clienteId) {
                setTasks([]);
                return;
            }

            const promises: Promise<any>[] = [
                http.get<ICard[]>(`card/get-card-cliente-statusid?cliente=${clienteId}&statusId=8&statusId=9&statusId=10&statusId=11&statusId=12&statusId=19&statusId=21&statusId=22&statusId=23&statusId=25&statusId=26`, axiosConfig),
            ];

            if (colaboradores.length === 0) {
                promises.push(http.get<IBodyRequest<IUser>>("usuarios?size=200", axiosConfig));
            }

            const results = await Promise.all(promises);

            const cards: ICard[] = results[0]?.data ?? [];
            const cardIds = cards.map((card) => card.id).filter(Boolean);
            const sessaoMap = await fetchSessaoMap(cardIds);

            const flattenedTasks: ITaskUser[] = cards.flatMap((card) =>
                (card.tasks ?? []).map((task) => {
                    const sessaoId = task.sessao ?? "";
                    const sessaoInfo = sessaoMap.get(String(sessaoId));
                    const sessaoTitulo = sessaoInfo?.titulo || "";
                    const sessaoConclusionDate = sessaoInfo?.conclusionDate || null;
                    console.log("sessaoInfo", sessaoInfo);
                    return {
                        ...task,
                        cardId: card.id,
                        cardNome: card.nome,
                        cardStatusId: String(card.statusId),
                        visible: normalizeVisible(task.visible),
                        sessao: String(sessaoId),
                        sessaoTitulo: sessaoTitulo || null,
                        sessaoConclusionDate,
                    };
                })
            );

            const visibles = flattenedTasks.filter((task) => task.visible === 1);
            setTasks(sortTasks(visibles));

            if (results.length > 1 && results[1]) {
                const ativos = results[1].data.content.filter((user: IUser) => user.active);
                setColaboradores(ativos);
            }
        } catch (erro) {
            mostrarMensagem(erro, "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userId]);

    const updateLocalTask = (index: number, patch: Partial<ITaskUser>) => {
        setTasks((prev) => prev.map((task, i) => (i === index ? { ...task, ...patch } : task)));
    };

    const upsertTask = async (index: number, patch: Partial<ITaskUser>) => {
        const current = tasks[index];
        if (!current) return;
        const payload = { ...current, ...patch };

        try {
            if (!payload.id) {
                const { data } = await http.post<ITask>("task", payload, axiosConfig);
                updateLocalTask(index, { ...payload, id: data.id });
            } else {
                await http.put("task", payload, axiosConfig);
                updateLocalTask(index, payload);
            }
        } catch (erro) {
            mostrarMensagem(erro, "error");
        }
    };

    const applyDoneToggle = (index: number, checked: boolean) => {
        const conclusionDate = checked ? isoWithoutMillis() : null;
        updateLocalTask(index, { done: checked, conclusionDate });
        upsertTask(index, { done: checked, conclusionDate });
    };

    const handleDoneToggle = (index: number, checked: boolean) => {
        setConfirmTaskIndex(index);
        setConfirmChecked(checked);
        setConfirmOpen(true);
    };

    const handleConfirmDoneToggle = () => {
        if (confirmTaskIndex === null) {
            setConfirmOpen(false);
            return;
        }
        applyDoneToggle(confirmTaskIndex, confirmChecked);
        setConfirmOpen(false);
        setConfirmTaskIndex(null);
    };

    const handleCancelDoneToggle = () => {
        setConfirmOpen(false);
        setConfirmTaskIndex(null);
    };

    const handleDescriptionBlur = (index: number, value: string) => {
        if (value.trim() === tasks[index]?.description) return;
        updateLocalTask(index, { description: value });
        upsertTask(index, { description: value });
    };

    const isOverdue = (task: ITaskUser) => {
        if (task.done) return false;
        const ts = parseDateBr(task.estimatedDate);
        if (!ts || ts === Number.POSITIVE_INFINITY) return false;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return ts < today.getTime();
    };

    const handleEstimatedChange = (index: number, value: string) => {
        const trimmed = value.trim();
        if (!trimmed) {
            updateLocalTask(index, { estimatedDate: null as any });
            upsertTask(index, { estimatedDate: null });
            return;
        }
        const parts = trimmed.split("/");
        if (parts.length === 3) {
            const [dd, mm, yyyy] = parts;
            const iso = `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}T23:59:59`;
            updateLocalTask(index, { estimatedDate: trimmed });
            upsertTask(index, { estimatedDate: iso });
        } else {
            updateLocalTask(index, { estimatedDate: trimmed });
        }
    };

    const getResponsavelNome = (task: ITaskUser) => {
        if (task.assignedToId === "o" || task.assignedTo === "Cliente") {
            return clienteNome || "Cliente";
        }
        if (task.assignedTo) return task.assignedTo;
        const selected = colaboradores.find((c) => c.id === task.assignedToId);
        return selected?.nome || "";
    };

    const normalizeSessao = (value?: string | null) => (value ?? "").trim();

    const sessaoOrder = (sessao: string) => {
        const match = sessao.match(/(\d+)/);
        if (!match) return Number.POSITIVE_INFINITY;
        const n = parseInt(match[1], 10);
        return Number.isNaN(n) ? Number.POSITIVE_INFINITY : n;
    };

    const groupedTasks = useMemo(() => {
        const map = new Map<string, ITaskUser[]>();
        tasks.forEach((task) => {
            const key = normalizeSessao(task.sessaoTitulo || task.sessao);
            if (!map.has(key)) map.set(key, []);
            map.get(key)?.push(task);
        });

        return Array.from(map.entries()).sort((a, b) => {
            const orderA = sessaoOrder(a[0]);
            const orderB = sessaoOrder(b[0]);
            if (orderA === orderB) return a[0].localeCompare(b[0]);
            if (orderA === Number.POSITIVE_INFINITY) return 1;
            if (orderB === Number.POSITIVE_INFINITY) return -1;
            return orderA - orderB;
        });
    }, [tasks]);

    const handleOpenCard = async (cardId: string) => {
        if (!cardId) return;
        try {
            setLoading(true);
            const { data } = await http.get<ICard>(`card/${cardId}`, axiosConfig);
            setSelectedCard(data);
            setCardModalOpen(true);
        } catch (erro) {
            mostrarMensagem(erro, "error");
        } finally {
            setLoading(false);
        }
    };

    const handleCloseCardModal = () => {
        setCardModalOpen(false);
        setSelectedCard(null);
        fetchData();
    };

    const syncScroll = (source: "table" | "fixed") => {
        if (syncingScroll.current) return;
        syncingScroll.current = true;
        const from = source === "table" ? tableScrollRef.current : fixedScrollRef.current;
        const to = source === "table" ? fixedScrollRef.current : tableScrollRef.current;
        if (from && to) {
            to.scrollLeft = from.scrollLeft;
        }
        window.requestAnimationFrame(() => {
            syncingScroll.current = false;
        });
    };

    return (
        <BoxCustomizado>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" align="left" gutterBottom style={{ color: "#55081d", margin: 0 }}>
                    To Do's / Entregáveis
                </Typography>
            </Box>

            {loading ? (
                <Box display="flex" justifyContent="center" alignItems="center" py={4}>
                    <CircularProgress sx={{ color: "#55081d" }} />
                </Box>
            ) : (
                <>
                    <TableScroll ref={tableScrollRef} onScroll={() => syncScroll("table")}>
                        <Table
                            size="small"
                            sx={{
                                backgroundColor: "rgba(255,255,255,0.45)",
                                color: "#55081d",
                                borderCollapse: "collapse",
                                tableLayout: "fixed",
                                width: "100%",
                                minWidth: tableMinWidth,
                                "& td, & th": { borderBottom: "1px solid rgba(85, 8, 29, 0.15)" },
                                "@media (max-width: 768px)": {
                                    "& td, & th": { fontSize: "13px" },
                                    "& .MuiTypography-root": { fontSize: "13px" },
                                    "& .MuiInputBase-input": { fontSize: "13px" },
                                },
                            }}
                        >
                    <TableHead>
                        <TableRow sx={{ "& th": { borderBottom: "1px solid #55081d" } }}>
                            <TableCell align="center" style={{ color: "#55081d", width: "30px" }}>
                                Feito
                            </TableCell>
                            <TableCell style={{ color: "#55081d", width: "400px" }}>Descrição</TableCell>
                            {/* <TableCell style={{ color: "#55081d", width: "120px" }}>Prazo</TableCell> */}
                            <TableCell style={{ color: "#55081d", width: "120px" }}>Responsável</TableCell>
                            <TableCell style={{ color: "#55081d", width: "110px" }}>Data Realizado</TableCell>
                            
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {groupedTasks.map(([sessao, list]) => {
                            const sessaoConclusion = list.find((t) => t.sessaoConclusionDate)?.sessaoConclusionDate;
                            return (
                                <React.Fragment key={sessao || "sem-sessao"}>
                                    <TableRow>
                                        <TableCell
                                            colSpan={4}
                                            sx={{ color: "#55081d", fontWeight: 700, borderBottom: "1px solid #55081d", whiteSpace: "pre-line" }}
                                        >
                                            {sessao || "Sem sessão"}
                                            {sessaoConclusion && (
                                                <>
                                                    {"\n"}
                                                    <span style={{ color: "rgba(85, 8, 29, 0.65)", fontWeight: 400 }}>
                                                        {`Reunião realizada no dia ${formatDateDisplay(sessaoConclusion)}`}
                                                    </span>
                                                </>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                    {list.map((task, index) => (
                                    <TableRow
                                        key={task.id || `task-${sessao}-${index}`}
                                        sx={{ "& td": { color: "#55081d", borderBottom: "1px solid rgba(85, 8, 29, 0.15)" } }}
                                    >
                                        <TableCell align="center">
                                            <Checkbox
                                                sx={{ color: "#55081d", "&.Mui-checked": { color: "#55081d" } }}
                                                checked={task.done}
                                                onChange={(e) => handleDoneToggle(tasks.indexOf(task), e.target.checked)}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <TextField
                                                fullWidth
                                                variant="outlined"
                                                size="small"
                                                multiline
                                                minRows={1}
                                                value={task.description || ""}
                                                InputProps={{ readOnly: true, style: { color: "#55081d", whiteSpace: "pre-wrap" } }}
                                                sx={{
                                                    "& .MuiOutlinedInput-notchedOutline": { border: "none" },
                                                    "& .MuiOutlinedInput-root": { padding: 0 },
                                                }}
                                            />
                                        </TableCell>
                                        {/* <TableCell>
                                            <TextField
                                                type="text"
                                                variant="outlined"
                                                size="small"
                                                placeholder="dd/mm/aaaa"
                                                value={formatDateDisplay(task.estimatedDate)}
                                                InputProps={{ readOnly: true, style: { color: isOverdue(task) ? "#ff5c5c" : "white" } }}
                                                sx={{
                                                    "& .MuiOutlinedInput-notchedOutline": { border: "none" },
                                                    "& .MuiOutlinedInput-root": { padding: 0 },
                                                }}
                                            />
                                        </TableCell> */}
                                        <TableCell>
                                            <Typography variant="body2" sx={{ color: "#55081d" }}>
                                                {getResponsavelNome(task)}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <TextField
                                                fullWidth
                                                variant="outlined"
                                                size="small"
                                                value={formatDateDisplay(task.conclusionDate)}
                                                InputProps={{ readOnly: true, style: { color: "#55081d" } }}
                                                sx={{
                                                    "& .MuiOutlinedInput-notchedOutline": { border: "none" },
                                                    "& .MuiOutlinedInput-root": { padding: 0 },
                                                }}
                                            />
                                        </TableCell>
                                        
                                    </TableRow>
                                    ))}
                                </React.Fragment>
                            );
                        })}
                    </TableBody>
                        </Table>
                    </TableScroll>
                    <FixedScrollBar ref={fixedScrollRef} onScroll={() => syncScroll("fixed")}>
                        <Box sx={{ width: "100%", minWidth: tableMinWidth, height: 1 }} />
                    </FixedScrollBar>
                </>
            )}
            <Dialog
                open={confirmOpen}
                onClose={handleCancelDoneToggle}
                fullWidth
                maxWidth="xs"
                PaperProps={{ sx: { backgroundColor: "#f7efe4", color: "#55081d" } }}
            >
                <DialogTitle sx={{ color: "#55081d" }}>Confirmar</DialogTitle>
                <DialogContent>
                    <Typography color="#55081d">
                        {confirmChecked ? "Deseja marcar a tarefa como finalizada?" : "Deseja retornar a tarefa para pendente?"}
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ display: "flex", gap: 1 }}>
                    <Button onClick={handleCancelDoneToggle} sx={{ color: "#55081d" }}>Cancelar</Button>
                    <Button onClick={handleConfirmDoneToggle} sx={{ fontWeight: 700, color: "#55081d" }}>
                        Confirmar
                    </Button>
                </DialogActions>
            </Dialog>
        </BoxCustomizado>
    );
}
