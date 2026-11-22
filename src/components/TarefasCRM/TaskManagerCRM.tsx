import createCrmSelectStyles from "../../styles/crmSelectStyles";
import React, { useEffect, useMemo, useState } from "react";
import dayjs, { Dayjs } from "dayjs";
import {
    Box,
    Button,
    Checkbox,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    TextField,
    Typography,
} from "@mui/material";
import Select from "react-select";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";

import autenticaStore from "../../stores/autentica.store";
import http from "../../http";

import IBodyRequest from "../../types/IBodyRequest";
import ICard from "../../types/ICard";
import ITask from "../../types/ITask";
import IUser from "../../types/IUser";
import { mostrarMensagem } from "../../stores/mensagem.store";

type TaskView = ITask & { localId: string };

type SelectOption = { value: string | number; label: string };

type TaskManagerCRMProps = {
    cardId: string | number;
    title: string;
    addButtonLabel: string;
    visibleValue: number;
    fixedDescription?: string;
    showDescriptionField?: boolean;
    showDescriptionColumn?: boolean;
    emptyStateText?: string;
    addDialogTitle?: string;
    editDialogTitle?: string;
};

export default function TaskManagerCRM({
    cardId,
    title,
    addButtonLabel,
    visibleValue,
    fixedDescription,
    showDescriptionField = true,
    showDescriptionColumn = true,
    emptyStateText = "Nenhum registro cadastrado.",
    addDialogTitle,
    editDialogTitle,
}: TaskManagerCRMProps) {
    const { usuario } = autenticaStore;

    const [tasks, setTasks] = useState<TaskView[]>([]);
    const [colaboradores, setColaboradores] = useState<IUser[]>([]);
    const [loading, setLoading] = useState(false);

    const [taskModalOpen, setTaskModalOpen] = useState(false);
    const [taskModalMode, setTaskModalMode] = useState<"add" | "edit">("add");
    const [taskModalIndex, setTaskModalIndex] = useState<number | null>(null);
    const [taskDescription, setTaskDescription] = useState("");
    const [taskResponsavel, setTaskResponsavel] = useState<SelectOption | null>(null);
    const [taskEstimatedDate, setTaskEstimatedDate] = useState<Dayjs | null>(null);
    const [isSavingTask, setIsSavingTask] = useState(false);

    const [deleteTarget, setDeleteTarget] = useState<TaskView | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const [confirmOpen, setConfirmOpen] = useState(false);
    const [confirmTask, setConfirmTask] = useState<TaskView | null>(null);
    const [confirmChecked, setConfirmChecked] = useState(false);

    const axiosConfig = {
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${usuario.token}`,
        },
    };

    const resolvedAddDialogTitle = addDialogTitle || addButtonLabel;
    const resolvedEditDialogTitle = editDialogTitle || `Editar ${title.toLowerCase()}`;

    const generateLocalId = () => (crypto.randomUUID ? crypto.randomUUID() : `tmp-${Date.now()}-${Math.random()}`);

    const isoWithoutMillis = () => new Date().toISOString().replace(/\.\d{3}Z$/, "");

    const normalizeVisible = (value?: number | boolean | null) => {
        if (typeof value === "number") return value;
        return value ? 1 : 0;
    };

    const sortTasksByCreatedAtDesc = (list: TaskView[]) => {
        return [...list].sort((a, b) => {
            const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return bTime - aTime;
        });
    };

    const formatDateDisplay = (value?: string | null) => {
        if (!value) return "";
        if (value.includes("/")) return value;
        const parsed = dayjs(value);
        if (!parsed.isValid()) return "";
        return parsed.format("DD/MM/YYYY HH:mm");
    };

    const toDayjsFromEstimated = (value?: string | null): Dayjs | null => {
        if (!value) return null;

        const trimmed = String(value).trim();
        if (!trimmed) return null;

        if (trimmed.includes("/")) {
            const [datePart, timePart] = trimmed.split(" ");
            const parts = datePart.split("/");
            if (parts.length !== 3) return null;
            const [dd, mm, yyyy] = parts;
            if (!dd || !mm || !yyyy) return null;
            const normalizedTime = timePart && /^\d{2}:\d{2}$/.test(timePart) ? timePart : "00:00";
            return dayjs(`${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}T${normalizedTime}`);
        }

        return dayjs(trimmed);
    };


    const colaboradoresTask = useMemo(
        () => [
            { value: 0, label: "Cliente" },
            ...colaboradores.filter((colaborador) => colaborador.papel !== "CLIENTE").map((colaborador) => ({
                value: colaborador.id,
                label: colaborador.nome,
            })),
        ],
        [colaboradores]
    );

    const fetchColaboradores = async () => {
        try {
            const { data } = await http.get<IBodyRequest<IUser>>("usuarios?size=200", axiosConfig);
            const ativos = (data?.content || []).filter((u: IUser) => u.active);
            setColaboradores(ativos);
        } catch (erro) {
            // silencioso: ainda dá para salvar como Cliente
        }
    };

    const fetchTasks = async () => {
        if (!cardId) return;
        setLoading(true);
        try {
            const { data } = await http.get<ICard>(`card/${cardId}`, axiosConfig);
            const list = (data?.tasks || [])
                .map((t: any) => ({
                    ...t,
                    visible: normalizeVisible(t.visible),
                    localId: generateLocalId(),
                }))
                .filter((t: any) => t.visible === visibleValue);

            setTasks(sortTasksByCreatedAtDesc(list));
        } catch (erro) {
            mostrarMensagem(erro, "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!usuario.token) return;
        fetchColaboradores();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [usuario.token]);

    useEffect(() => {
        fetchTasks();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cardId, visibleValue]);

    const getResponsavelOption = (task: TaskView) => {
        if (task.assignedTo === "Cliente" || task.assignedToId === "o" || task.assignedToId === 0) {
            return { value: 0, label: "Cliente" };
        }
        if (task.assignedToId && task.assignedTo) {
            return { value: task.assignedToId, label: task.assignedTo };
        }
        return null;
    };

    const openAddTaskModal = () => {
        setTaskModalMode("add");
        setTaskModalIndex(null);
        setTaskDescription(fixedDescription || "");
        setTaskResponsavel(null);
        setTaskEstimatedDate(null);
        setTaskModalOpen(true);
    };

    const openEditTaskModal = (task: TaskView) => {
        const index = tasks.findIndex((t) => t.id === task.id || t.localId === task.localId);
        if (index < 0) return;
        setTaskModalMode("edit");
        setTaskModalIndex(index);
        setTaskDescription(fixedDescription || task.description || "");
        setTaskResponsavel(getResponsavelOption(task));
        setTaskEstimatedDate(toDayjsFromEstimated(task.estimatedDate));
        setTaskModalOpen(true);
    };

    const closeTaskModal = () => {
        setTaskModalOpen(false);
        setTaskModalIndex(null);
    };

    const upsertTask = async (payload: Partial<TaskView>) => {
        if (!payload) return;
        try {
            if (!payload.id) {
                await http.post<ITask>("task", payload, axiosConfig);
            } else {
                await http.put("task", payload, axiosConfig);
            }
        } catch (erro) {
            mostrarMensagem(erro, "error");
            throw erro;
        }
    };

    const handleSaveTask = async () => {
        const description = (fixedDescription || taskDescription).trim();
        if ((!fixedDescription && description.length < 3) || !taskResponsavel) return;

        const assignedToId = taskResponsavel.value;
        const assignedTo = taskResponsavel.label;
        const estimatedDateIso = taskEstimatedDate ? taskEstimatedDate.format("YYYY-MM-DDTHH:mm:00") : null;

        setIsSavingTask(true);
        try {
            if (taskModalMode === "add") {
                const payload: Partial<TaskView> = {
                    cardId: cardId as any,
                    description,
                    assignedToId: assignedToId as any,
                    assignedTo,
                    estimatedDate: estimatedDateIso || null,
                    done: false,
                    conclusionDate: "",
                    visible: visibleValue,
                };
                await upsertTask(payload);
                await fetchTasks();
                closeTaskModal();
                return;
            }

            if (taskModalIndex === null) return;
            const current = tasks[taskModalIndex];
            if (!current?.id) return;

            const payload: Partial<TaskView> = {
                id: current.id,
                cardId: cardId as any,
                description,
                assignedToId: assignedToId as any,
                assignedTo,
                estimatedDate: estimatedDateIso || null,
                visible: visibleValue,
            };

            await upsertTask(payload);
            await fetchTasks();
            closeTaskModal();
        } finally {
            setIsSavingTask(false);
        }
    };

    const handleDoneToggle = async (task: TaskView, checked: boolean) => {
        if (!task.id) return;
        const conclusionDate = checked ? isoWithoutMillis() : "";
        setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, done: checked, conclusionDate } : t)));
        try {
            await upsertTask({ id: task.id, done: checked, conclusionDate, visible: visibleValue });
        } finally {
            fetchTasks();
        }
    };

    const handleRequestDoneToggle = (task: TaskView, checked: boolean) => {
        setConfirmTask(task);
        setConfirmChecked(checked);
        setConfirmOpen(true);
    };

    const handleCancelDoneToggle = () => {
        setConfirmOpen(false);
        setConfirmTask(null);
    };

    const handleConfirmDoneToggle = async () => {
        if (!confirmTask) {
            setConfirmOpen(false);
            return;
        }
        await handleDoneToggle(confirmTask, confirmChecked);
        setConfirmOpen(false);
        setConfirmTask(null);
    };

    const handleRequestDeleteTask = (task: TaskView) => {
        setDeleteTarget(task);
    };

    const handleConfirmDeleteTask = async () => {
        if (!deleteTarget) return;
        setIsDeleting(true);
        try {
            if (deleteTarget.id) {
                await http.delete(`task/${deleteTarget.id}`, axiosConfig);
            }
            setDeleteTarget(null);
            fetchTasks();
        } catch (erro) {
            mostrarMensagem(erro, "error");
        } finally {
            setIsDeleting(false);
        }
    };

    const getResponsavelNome = (task: TaskView) => {
        if (task.assignedToId === "o" || task.assignedToId === 0 || task.assignedTo === "Cliente") {
            return "Cliente";
        }
        return task.assignedTo || "";
    };

    const descriptionColSpan = showDescriptionColumn ? 6 : 5;
    const dateTimePickerStyles = {
        "& .MuiPaper-root": {
            backgroundColor: "#ffffff",
            color: "#242424",
        },
        "& .MuiPickersLayout-root": {
            backgroundColor: "#ffffff",
            color: "#242424",
        },
    };

    return (
        <Box
            sx={{
                backgroundColor: "#ffffff",
                borderRadius: "14px",
                border: "1px solid rgba(20, 20, 20, 0.1)",
                padding: "12px",
            }}
        >
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="h6" align="left" gutterBottom style={{ color: "#242424", margin: 0 }}>
                    {title}
                </Typography>
                <Button
                    onClick={openAddTaskModal}
                    disabled={loading}
                    sx={{
                        backgroundColor: "transparent",
                        border: "2px solid #141414",
                        color: "#141414",
                        boxShadow: "none",
                        padding: "5px 16px",
                        fontWeight: 700,
                        textTransform: "none",
                        "&:hover": { backgroundColor: "rgba(20, 20, 20, 0.06)" },
                    }}
                >
                    {addButtonLabel}
                </Button>
            </Box>

            <Box sx={{ width: "100%", overflowX: "auto" }}>
                <Table
                    size="small"
                    sx={{
                        backgroundColor: "rgba(0, 0, 0, 0)",
                        color: "#242424",
                        borderCollapse: "collapse",
                        tableLayout: "fixed",
                        width: "100%",
                        minWidth: showDescriptionColumn ? "980px" : "760px",
                        "& td, & th": { borderBottom: "1px solid rgba(20, 20, 20, 0.16)", fontSize: "13px" },
                        "& th": { borderBottom: "1px solid rgba(20, 20, 20, 0.16)", fontSize: "13px" },
                    }}
                >
                    <TableHead>
                        <TableRow>
                            <TableCell align="center" style={{ color: "#242424", width: "40px" }}>
                                Feito
                            </TableCell>
                            {showDescriptionColumn && <TableCell style={{ color: "#242424", width: "45%" }}>Descrição</TableCell>}
                            <TableCell style={{ color: "#242424", width: showDescriptionColumn ? "18%" : "32%" }}>Atendente</TableCell>
                            <TableCell align="center" style={{ color: "#242424", width: "14%", minWidth: "125px" }}>
                                Prevista
                            </TableCell>
                            <TableCell align="center" style={{ color: "#242424", width: "14%", minWidth: "125px" }}>
                                Realizada
                            </TableCell>
                            <TableCell align="center" style={{ color: "#242424", width: "90px" }}>
                                Ações
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {tasks.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={descriptionColSpan} sx={{ color: "#666666" }}>
                                    {loading ? "Carregando..." : emptyStateText}
                                </TableCell>
                            </TableRow>
                        ) : (
                            tasks.map((task) => (
                                <TableRow key={task.id || task.localId} sx={{ "& td": { color: "#242424" } }}>
                                    <TableCell align="center">
                                        <Checkbox
                                            sx={{ color: "#141414", "&.Mui-checked": { color: "#141414" } }}
                                            checked={!!task.done}
                                            onChange={(e) => handleRequestDoneToggle(task, e.target.checked)}
                                        />
                                    </TableCell>
                                    {showDescriptionColumn && (
                                        <TableCell>
                                            <Typography
                                                variant="body2"
                                                sx={{ color: "#242424", whiteSpace: "pre-wrap", wordBreak: "break-word", fontSize: "13px" }}
                                            >
                                                {task.description || ""}
                                            </Typography>
                                        </TableCell>
                                    )}
                                    <TableCell>
                                        <Typography variant="body2" sx={{ color: "#242424", fontSize: "13px" }}>
                                            {getResponsavelNome(task)}
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="center">
                                        <TextField
                                            fullWidth
                                            variant="outlined"
                                            size="small"
                                            value={formatDateDisplay(task.estimatedDate)}
                                            InputProps={{ readOnly: true, style: { color: "#242424", fontSize: "13px", textAlign: "center" } }}
                                            sx={{
                                                minWidth: "125px",
                                                "& .MuiOutlinedInput-notchedOutline": { border: "none" },
                                                "& .MuiOutlinedInput-root": { padding: 0 },
                                                "& .MuiInputBase-input": { textAlign: "center" },
                                            }}
                                        />
                                    </TableCell>
                                    <TableCell align="center">
                                        <TextField
                                            fullWidth
                                            variant="outlined"
                                            size="small"
                                            value={formatDateDisplay(task.conclusionDate)}
                                            InputProps={{ readOnly: true, style: { color: "#242424", fontSize: "13px", textAlign: "center" } }}
                                            sx={{
                                                minWidth: "125px",
                                                "& .MuiOutlinedInput-notchedOutline": { border: "none" },
                                                "& .MuiOutlinedInput-root": { padding: 0 },
                                                "& .MuiInputBase-input": { textAlign: "center" },
                                            }}
                                        />
                                    </TableCell>
                                    <TableCell align="center">
                                        <Box display="flex" justifyContent="center" gap={1}>
                                            <IconButton size="small" aria-label="Editar tarefa" onClick={() => openEditTaskModal(task)} sx={{ color: "#666666" }}>
                                                ✎
                                            </IconButton>
                                            <IconButton size="small" aria-label="Excluir tarefa" onClick={() => handleRequestDeleteTask(task)} sx={{ color: "#666666" }}>
                                                x
                                            </IconButton>
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </Box>

            <Dialog
                open={taskModalOpen}
                onClose={closeTaskModal}
                fullWidth
                maxWidth="sm"
                PaperProps={{ sx: { backgroundColor: "#ffffff", color: "#242424" } }}
            >
                <DialogTitle sx={{ color: "#242424" }}>{taskModalMode === "add" ? resolvedAddDialogTitle : resolvedEditDialogTitle}</DialogTitle>
                <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    {showDescriptionField && (
                        <Box>
                            <Typography variant="body2" sx={{ color: "#141414", mb: 0.5 }}>
                                Descrição
                            </Typography>
                            <TextField
                                fullWidth
                                value={taskDescription}
                                onChange={(e) => setTaskDescription(e.target.value)}
                                multiline
                                minRows={3}
                                InputProps={{ sx: { color: "#242424" } }}
                                sx={{ background: "rgba(255,255,255,0.06)", mt: 0.5 }}
                            />
                        </Box>
                    )}
                    <Box>
                        <Typography variant="body2" sx={{ color: "#141414", mb: 0.5 }}>
                            Selecionar atendente
                        </Typography>
                        <Select
                            value={taskResponsavel}
                            options={colaboradoresTask}
                            onChange={(option: any) => setTaskResponsavel(option)}
                            isSearchable
                            styles={createCrmSelectStyles()}
                            placeholder="Selecione"
                            menuPortalTarget={document.body}
                            menuPosition="fixed"
                        />
                    </Box>
                    <Box>
                        <Typography variant="body2" sx={{ color: "#141414", mb: 0.5 }}>
                            Data prevista
                        </Typography>
                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                            <DateTimePicker
                                value={taskEstimatedDate}
                                onChange={(newValue) => setTaskEstimatedDate(newValue)}
                                format="DD/MM/YYYY HH:mm"
                                slotProps={{
                                    popper: {
                                        sx: dateTimePickerStyles,
                                    },
                                    desktopPaper: {
                                        sx: {
                                            backgroundColor: "#ffffff",
                                            color: "#242424",
                                        },
                                    },
                                    mobilePaper: {
                                        sx: {
                                            backgroundColor: "#ffffff",
                                            color: "#242424",
                                            ...dateTimePickerStyles,
                                        },
                                    },
                                    textField: {
                                        fullWidth: true,
                                        required: true,
                                        sx: {
                                            background: "rgba(255,255,255,0.06)",
                                            mt: 0.5,
                                            input: { color: "#242424" },
                                            label: { color: "#666666" },
                                        },
                                    },
                                }}
                            />
                        </LocalizationProvider>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ display: "flex", gap: 1 }}>
                    <Button onClick={closeTaskModal} sx={{ color: "#242424" }}>
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleSaveTask}
                        color="primary"
                        disabled={isSavingTask || (!fixedDescription && taskDescription.trim().length < 3) || !taskResponsavel}
                        sx={{ fontWeight: 700, color: "#141414" }}
                    >
                        {isSavingTask ? "Salvando..." : "Salvar"}
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog
                open={confirmOpen}
                onClose={handleCancelDoneToggle}
                fullWidth
                maxWidth="xs"
                PaperProps={{ sx: { backgroundColor: "#ffffff", color: "#242424" } }}
            >
                <DialogTitle sx={{ color: "#242424" }}>Confirmar</DialogTitle>
                <DialogContent>
                    <Typography color="text.primary">
                        {confirmChecked ? "Deseja marcar a tarefa como finalizada?" : "Deseja retornar a tarefa para pendente?"}
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ display: "flex", gap: 1 }}>
                    <Button onClick={handleCancelDoneToggle} sx={{ color: "#242424" }}>
                        Cancelar
                    </Button>
                    <Button onClick={handleConfirmDoneToggle} color="primary" sx={{ fontWeight: 700, color: "#141414" }}>
                        Confirmar
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog
                open={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                fullWidth
                maxWidth="xs"
                PaperProps={{ sx: { backgroundColor: "#ffffff", color: "#242424" } }}
            >
                <DialogTitle sx={{ color: "#242424" }}>Confirmar exclusão</DialogTitle>
                <DialogContent>
                    <Typography color="text.primary">Deseja remover este registro?</Typography>
                </DialogContent>
                <DialogActions sx={{ display: "flex", gap: 1 }}>
                    <Button onClick={() => setDeleteTarget(null)} disabled={isDeleting} sx={{ color: "#242424" }}>
                        Cancelar
                    </Button>
                    <Button onClick={handleConfirmDeleteTask} color="primary" disabled={isDeleting} sx={{ fontWeight: 700, color: "#141414" }}>
                        {isDeleting ? "Removendo..." : "Remover"}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}