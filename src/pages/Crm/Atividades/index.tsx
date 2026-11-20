import React, { useEffect, useMemo, useState } from "react";
import {
    Box,
    Checkbox,
    CircularProgress,
    Button,
    MenuItem,
    Modal,
    Select,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    TextField,
    Typography,
} from '@mui/material';
import styled from 'styled-components';
import autenticaStore from "../../../stores/autentica.store";
import http from "../../../http";
import ITaskUser from "../../../types/ITaskUser";
import ITask from "../../../types/ITask";
import IUser from "../../../types/IUser";
import IBodyRequest from "../../../types/IBodyRequest";
import IColumn from "../../../types/IColumn";
import ICard from "../../../types/ICard";
import ModalCRM from "../Modal";
import { ThemeProvider } from "@mui/material/styles";
import IconButton from "@mui/material/IconButton";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import lightTheme from "../../../styles/lightTheme";
import { mostrarMensagem } from "../../../stores/mensagem.store";

const BoxCustomizado = styled(Box)`
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 95vw; 
        min-height: 80vh;
        max-height: 85vh;
        overflow-y: auto;
        scrollbar-width: thin;
        scrollbar-color: rgba(85, 8, 29, 0.25) #fffdfa;
        background-color: #fffdfa;
        border: none;
        border-radius: 20px;
        padding: 24px;
    box-sizing: border-box;
    border: 1px solid rgba(85, 8, 29, 0.12);
    box-shadow: 0 24px 60px rgba(85, 8, 29, 0.18);
    color: #35252b;

        @media (max-width: 768px) {
                width: 95vw; 
        }
`;

interface ModalAtividadesProps {
    open: boolean;
    handleClose: () => void;
    colunas: IColumn[];
    refreshCards: () => void;
}

export default function ModalAtividades({ open, handleClose, refreshCards, colunas }: ModalAtividadesProps) {
    const { usuario } = autenticaStore;
    const [tasks, setTasks] = useState<ITaskUser[]>([]);
    const [colaboradores, setColaboradores] = useState<IUser[]>([]);
    const [loading, setLoading] = useState(false);
    const [cardModalOpen, setCardModalOpen] = useState(false);
    const [selectedCard, setSelectedCard] = useState<ICard | null>(null);
    const [responsavelId, setResponsavelId] = useState<string | number | "">("");

    const axiosConfig = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${usuario.token}`,
        },
    };

    const userId = useMemo(() => localStorage.getItem('userID') ?? '', [usuario]);

    const columnStatusMap = useMemo(() => {
        const mapping = new Map<string, string>();
        colunas.forEach((column) => {
            mapping.set(String(column.id), `${column.tipo} - ${column.name}`);
        });
        return mapping;
    }, [colunas]);

    const formatCardStatus = (statusId?: string | null) => {
        if (!statusId) return '';
        return columnStatusMap.get(String(statusId)) ?? '';
    };

    const formatDateInput = (isoDate?: string | null) => {
        if (!isoDate) return '';
        const date = new Date(isoDate);
        return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10);
    };

    const formatDateDisplay = (value?: string | null) => {
        if (!value) return '';
        if (value.includes('/')) return value; // assume already dd/mm/aaaa
        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('pt-BR');
    };

    const isoWithoutMillis = () => new Date().toISOString().replace(/\.\d{3}Z$/, '');

    const parseDateBr = (value?: string | null) => {
        if (!value) return Number.POSITIVE_INFINITY;
        if (value.includes('/')) {
            const [dd, mm, yyyy] = value.split('/');
            const iso = `${yyyy}-${mm?.padStart(2, '0')}-${dd?.padStart(2, '0')}T00:00:00`;
            const t = new Date(iso).getTime();
            return Number.isNaN(t) ? Number.POSITIVE_INFINITY : t;
        }
        const t = new Date(value).getTime();
        return Number.isNaN(t) ? Number.POSITIVE_INFINITY : t;
    };

    const sortTasks = (list: ITaskUser[]) => {
        return [...list].sort((a, b) => {
            if (a.done !== b.done) return a.done ? 1 : -1; // não concluídas primeiro
            const aTime = parseDateBr(a.estimatedDate) || new Date(a.createdAt).getTime();
            const bTime = parseDateBr(b.estimatedDate) || new Date(b.createdAt).getTime();
            return aTime - bTime; // mais próximas primeiro
        });
    };

    const fetchData = async (forceUserId?: string | number) => {
        const targetUserId = forceUserId ?? (responsavelId || userId);
        if (!open || !targetUserId) return;
        setLoading(true);
        try {
            const promises: Promise<any>[] = [
                http.get<IBodyRequest<ITaskUser>>(`task/get-task-by-user?size=50&page=0&userId=${targetUserId}&openOnly=false`, axiosConfig),
            ];

            if (colaboradores.length === 0) {
                promises.push(http.get<IBodyRequest<IUser>>('usuarios?size=200', axiosConfig));
            }

            const results = await Promise.all(promises);
            setTasks(sortTasks(results[0].data.content ?? []));
            if (results.length > 1 && results[1]) {
                const ativos = results[1].data.content.filter((user: IUser) => user.active);
                setColaboradores(ativos);
                if (!responsavelId) {
                    const defaultId = userId || (ativos[0]?.id ?? "");
                    setResponsavelId(defaultId);
                }
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
    }, [open]);

    useEffect(() => {
        if (open && responsavelId) {
            fetchData(responsavelId);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [responsavelId]);

    const updateLocalTask = (index: number, patch: Partial<ITaskUser>) => {
        setTasks((prev) => prev.map((task, i) => (i === index ? { ...task, ...patch } : task)));
    };

    const upsertTask = async (index: number, patch: Partial<ITaskUser>) => {
        const current = tasks[index];
        if (!current) return;
        const payload = { ...current, ...patch };

        try {
            if (!payload.id) {
                const { data } = await http.post<ITask>('task', payload, axiosConfig);
                updateLocalTask(index, { ...payload, id: data.id });
            } else {
                await http.put('task', payload, axiosConfig);
                updateLocalTask(index, payload);
            }
            refreshCards();
        } catch (erro) {
            mostrarMensagem(erro, "error");
        }
    };

    const handleDoneToggle = (index: number, checked: boolean) => {
        const conclusionDate = checked ? isoWithoutMillis() : null;
        updateLocalTask(index, { done: checked, conclusionDate });
        upsertTask(index, { done: checked, conclusionDate });
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
        const parts = trimmed.split('/');
        if (parts.length === 3) {
            const [dd, mm, yyyy] = parts;
            const iso = `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}T23:59:59`;
            updateLocalTask(index, { estimatedDate: trimmed });
            upsertTask(index, { estimatedDate: iso });
        } else {
            updateLocalTask(index, { estimatedDate: trimmed });
        }
    };

    const handleAssignedChange = (index: number, value: number | string) => {
        const selected = colaboradores.find((c) => c.id === value);
        const assignedTo = selected ? selected.nome : '';
        updateLocalTask(index, { assignedToId: value, assignedTo });
        upsertTask(index, { assignedToId: value, assignedTo });
    };

    const handleResponsavelChange = (value: string | number) => {
        setResponsavelId(value);
    };

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
        refreshCards();
        fetchData();
    };

    return (
        <ThemeProvider theme={lightTheme}>
            <Modal
                open={open}
                onClose={handleClose}
                aria-labelledby="crm-atividades-titulo"
            >
                <Box>
                    <BoxCustomizado role="dialog" aria-labelledby="crm-atividades-titulo">
                        <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1} mb={2}>
                            <Typography id="crm-atividades-titulo" variant="h6" align="left" gutterBottom style={{ color: "#55081d", margin: 0 }}>
                                Minhas Atividades
                            </Typography>
                            <Select
                                size="small"
                                value={responsavelId}
                                onChange={(e) => handleResponsavelChange(e.target.value as string | number)}
                                displayEmpty
                                sx={{ minWidth: 200, background: 'rgba(85, 8, 29, 0.04)', color: "#35252b" }}
                            >
                                <MenuItem value="" disabled>Responsável</MenuItem>
                                {colaboradores.filter((colab) => colab.papel !== 'CLIENTE').map((colab) => (
                                    <MenuItem key={colab.id} value={colab.id}>{colab.nome}</MenuItem>
                                ))}
                            </Select>
                            <IconButton aria-label="Fechar atividades" onClick={handleClose} sx={{ color: "#55081d" }}>
                                <CloseOutlinedIcon />
                            </IconButton>
                        </Box>

                            {loading ? (
                                <Box display="flex" justifyContent="center" alignItems="center" py={4}>
                                    <CircularProgress color="primary" />
                                </Box>
                            ) : (
                                <Box sx={{ width: '100%', overflowX: 'auto' }}>
                                    <Table
                                        size="small"
                                        sx={{
                                            backgroundColor: 'rgba(0, 0, 26, 0)',
                                            color: "#35252b",
                                            borderCollapse: 'collapse',
                                            tableLayout: 'fixed',
                                            width: '100%',
                                            minWidth: '1280px',
                                            '& td, & th': { borderBottom: '1px solid rgba(85, 8, 29, 0.16)', fontSize: '13px' },
                                            '& th': { borderBottom: '1px solid rgba(85, 8, 29, 0.16)', fontSize: '13px' },
                                        }}
                                    >
                                        <TableHead>
                                            <TableRow>
                                                <TableCell align="center" style={{ color: "#35252b", width: '56px', minWidth: '56px' }}>Feito</TableCell>
                                                <TableCell style={{ color: "#35252b", width: '34%' }}>Descrição</TableCell>
                                                <TableCell style={{ color: "#35252b", width: '16%' }}>Card Nome</TableCell>
                                                <TableCell style={{ color: "#35252b", width: '15%' }}>Status do Card</TableCell>
                                                <TableCell align="center" style={{ color: "#35252b", width: '110px' }}>Card</TableCell>
                                                <TableCell align="center" style={{ color: "#35252b", width: '14%', minWidth: '125px' }}>Prazo</TableCell>
                                                <TableCell align="center" style={{ color: "#35252b", width: '14%', minWidth: '125px' }}>Realizado em</TableCell>
                                                {/* <TableCell style={{ color: "#35252b", width: '16%' }}>Responsável</TableCell> */}
                                                {/* <TableCell style={{ color: "#35252b" }}>Criada em</TableCell> */}
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {tasks.map((task, index) => (
                                                <TableRow key={task.id || `task-${index}`}
                                                    sx={{ '& td': { color: "#35252b" } }}
                                                >
                                                    <TableCell align="center" sx={{ width: '56px', minWidth: '56px', px: 0.5 }}>
                                                        <Checkbox
                                                            sx={{ color: '#55081d', '&.Mui-checked': { color: '#55081d' } }}
                                                            checked={task.done}
                                                            onChange={(e) => handleDoneToggle(index, e.target.checked)}
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography variant="body2" sx={{ color: "#35252b", fontSize: '13px', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                                                            {task.description || ''}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography variant="body2" sx={{ color: "#35252b", fontSize: '13px' }}>
                                                            {task.cardNome || ''}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography variant="body2" sx={{ color: "#35252b", fontSize: '13px' }}>
                                                            {formatCardStatus(task.cardStatusId) || ''}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell align="center">
                                                        <Button
                                                            variant="contained"
                                                            color="primary"
                                                            size="small"
                                                            sx={{ backgroundColor: '#55081d', color: '#fff', fontWeight: 700, '&:hover': { backgroundColor: '#6f102a' } }}
                                                            onClick={() => handleOpenCard(task.cardId)}
                                                        >
                                                            Abrir card
                                                        </Button>
                                                    </TableCell>
                                                    <TableCell align="center">
                                                        <TextField
                                                            type="text"
                                                            variant="outlined"
                                                            size="small"
                                                            placeholder="dd/mm/aaaa"
                                                            value={formatDateDisplay(task.estimatedDate)}
                                                            onChange={(e) => updateLocalTask(index, { estimatedDate: e.target.value })}
                                                            onBlur={(e) => handleEstimatedChange(index, e.target.value)}
                                                            InputProps={{ style: { color: isOverdue(task) ? '#c62828' : "#35252b", fontSize: '13px', textAlign: 'center' } }}
                                                            sx={{
                                                                minWidth: '125px',
                                                                '& .MuiInputBase-input': { textAlign: 'center' },
                                                            }}
                                                        />
                                                    </TableCell>
                                                    <TableCell align="center">
                                                        <TextField
                                                            fullWidth
                                                            variant="outlined"
                                                            size="small"
                                                            value={formatDateDisplay(task.conclusionDate)}
                                                            InputProps={{ readOnly: true, style: { color: "#35252b", fontSize: '13px', textAlign: 'center' } }}
                                                            sx={{
                                                                minWidth: '125px',
                                                                '& .MuiInputBase-input': { textAlign: 'center' },
                                                            }}
                                                        />
                                                    </TableCell>
                                                    {/* <TableCell>
                                                        <Select
                                                            fullWidth
                                                            size="small"
                                                            value={task.assignedToId ?? ''}
                                                            onChange={(e) => handleAssignedChange(index, e.target.value as number | string)}
                                                            displayEmpty
                                                            sx={{ color: "#35252b", fontSize: '13px' }}
                                                        >
                                                            <MenuItem value="">
                                                                <em>Cliente</em>
                                                            </MenuItem>
                                                            {colaboradores.map((colab) => (
                                                                <MenuItem key={colab.id} value={colab.id}>
                                                                    {colab.nome}
                                                                </MenuItem>
                                                            ))}
                                                        </Select>
                                                    </TableCell> */}
                                                    {/* <TableCell>{formatDateDisplay(task.createdAt)}</TableCell> */}
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </Box>
                            )}
                        </BoxCustomizado>
                        {cardModalOpen && selectedCard && (
                            <ModalCRM
                                open={cardModalOpen}
                                handleClose={handleCloseCardModal}
                                dados={selectedCard}
                                colunas={colunas}
                                arquivado={false}
                            />
                        )}
                </Box>
            </Modal>
        </ThemeProvider>
    );
}