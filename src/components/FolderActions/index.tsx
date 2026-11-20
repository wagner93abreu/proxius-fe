import React, { useEffect, useState } from "react";
import {
    Alert,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    Stack,
    TextField,
    Tooltip,
    Typography,
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import DriveFileRenameOutlineIcon from "@mui/icons-material/DriveFileRenameOutline";
import { FOLDER_DELETE_CONFIRMATION } from "../../types/IFolderActions";

interface FolderActionButtonsProps {
    name: string;
    disabled?: boolean;
    onRename: () => void;
    onDelete: () => void;
    color?: string;
}

export function FolderActionButtons({ name, disabled, onRename, onDelete, color }: FolderActionButtonsProps) {
    const sx = color ? { color } : undefined;
    return (
        <Stack direction="row" spacing={0.5} alignItems="center" sx={{ flexShrink: 0 }}>
            <Tooltip title="Renomear pasta">
                <span>
                    <IconButton size="small" aria-label={`Renomear pasta ${name}`} disabled={disabled} onClick={onRename} sx={sx}>
                        <DriveFileRenameOutlineIcon fontSize="small" />
                    </IconButton>
                </span>
            </Tooltip>
            <Tooltip title="Excluir pasta">
                <span>
                    <IconButton size="small" aria-label={`Excluir pasta ${name}`} disabled={disabled} onClick={onDelete}
                        sx={color ? sx : { color: "error.main" }}>
                        <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                </span>
            </Tooltip>
        </Stack>
    );
}

interface RenameFolderDialogProps {
    open: boolean;
    currentName: string;
    busy: boolean;
    error?: string | null;
    onCancel: () => void;
    onSubmit: (nome: string) => void;
}

export function RenameFolderDialog({ open, currentName, busy, error, onCancel, onSubmit }: RenameFolderDialogProps) {
    const [nome, setNome] = useState(currentName);
    useEffect(() => {
        if (open) setNome(currentName);
    }, [open, currentName]);
    const trimmed = nome.trim();
    const canSave = !busy && trimmed.length > 0 && trimmed !== currentName;
    const close = () => { if (!busy) onCancel(); };
    return (
        <Dialog open={open} onClose={close} fullWidth maxWidth="xs" aria-labelledby="renomear-pasta-titulo">
            <DialogTitle id="renomear-pasta-titulo">Renomear pasta</DialogTitle>
            <DialogContent>
                <Stack spacing={2} sx={{ pt: 1 }}>
                    <Typography variant="body2">Nome atual: <strong>{currentName}</strong></Typography>
                    <TextField
                        autoFocus
                        fullWidth
                        label="Novo nome da pasta"
                        value={nome}
                        disabled={busy}
                        onChange={(event) => setNome(event.target.value)}
                        onKeyDown={(event) => {
                            if (event.key === "Enter" && canSave) {
                                event.preventDefault();
                                onSubmit(trimmed);
                            }
                        }}
                    />
                    {error && <Alert severity="error">{error}</Alert>}
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button onClick={close} disabled={busy}>Cancelar</Button>
                <Button variant="contained" disabled={!canSave} onClick={() => onSubmit(trimmed)}>
                    {busy ? "Salvando..." : "Salvar"}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

interface DeleteFolderDialogProps {
    open: boolean;
    folderName: string;
    childCount?: number | null;
    busy: boolean;
    error?: string | null;
    onCancel: () => void;
    onConfirm: () => void;
}

export function DeleteFolderDialog({ open, folderName, childCount, busy, error, onCancel, onConfirm }: DeleteFolderDialogProps) {
    const [typed, setTyped] = useState("");
    useEffect(() => {
        if (open) setTyped("");
    }, [open, folderName]);
    const confirmed = typed === FOLDER_DELETE_CONFIRMATION;
    const close = () => { if (!busy) onCancel(); };
    return (
        <Dialog open={open} onClose={close} fullWidth maxWidth="xs" aria-labelledby="excluir-pasta-titulo">
            <DialogTitle id="excluir-pasta-titulo">Excluir pasta</DialogTitle>
            <DialogContent>
                <Stack spacing={2} sx={{ pt: 1 }}>
                    <Alert severity="warning">
                        A pasta <strong>{folderName}</strong> será excluída junto com todo o seu conteúdo:
                        todas as subpastas e arquivos dentro dela também serão removidos.
                        {" "}Materiais e links cadastrados na pasta também serão removidos.
                    </Alert>
                    {typeof childCount === "number" && (
                        <Typography variant="body2">
                            Itens diretamente nesta pasta: {childCount}. Subpastas podem conter outros itens.
                        </Typography>
                    )}
                    <TextField
                        autoFocus
                        fullWidth
                        label={`Digite "${FOLDER_DELETE_CONFIRMATION}" para confirmar`}
                        value={typed}
                        disabled={busy}
                        autoComplete="off"
                        onChange={(event) => setTyped(event.target.value)}
                    />
                    {error && <Alert severity="error">{error}</Alert>}
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button onClick={close} disabled={busy}>Cancelar</Button>
                <Button variant="contained" color="error" disabled={busy || !confirmed} onClick={onConfirm}>
                    {busy ? "Excluindo..." : "Excluir pasta"}
                </Button>
            </DialogActions>
        </Dialog>
    );
}