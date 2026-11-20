import React, { useRef, useState } from "react";
import { folderDisplayName } from "./folderDisplayName";
import {
    Alert,
    Box,
    Button,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    LinearProgress,
    List,
    ListItem,
    ListItemText,
    Stack,
    TextField,
    Tooltip,
    Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import DownloadIcon from "@mui/icons-material/Download";
import EditIcon from "@mui/icons-material/Edit";
import RefreshIcon from "@mui/icons-material/Refresh";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import VisibilityIcon from "@mui/icons-material/Visibility";
import FolderOutlinedIcon from "@mui/icons-material/FolderOutlined";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useSharePointFiles } from "../../hooks/useSharePointFiles";
import * as sharepoint from "../../http/sharepoint";
import { ISharePointFile } from "../../types/ISharePointFile";
import CopiarModeloCliente from "./CopiarModeloCliente";
import { DeleteFolderDialog, FolderActionButtons, RenameFolderDialog } from "../FolderActions";
import { isOfficeEditable } from "../../utils/editableFiles";
export { isOfficeEditable } from "../../utils/editableFiles";
const DEFAULT_MAX_BYTES = 10 * 1024 * 1024;

export function formatBytes(bytes?: number | null) {
    if (bytes == null) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const formatDate = (iso?: string | null) => (iso ? new Date(iso).toLocaleString("pt-BR") : "");

const iconSx = { color: "#55081d" };
const outlinedSx = {
    borderColor: "#55081d",
    color: "#55081d",
    fontWeight: 700,
    "&:hover": { borderColor: "#6f102a", color: "#6f102a" },
};

interface ArquivosClienteProps {
    cliforId?: string | number | null;
    titulo?: string;
}

export default function ArquivosCliente(props: ArquivosClienteProps) {
    return <FileExplorer key={props.cliforId} {...props} />;
}

function FileExplorer({ cliforId, titulo = "Meus arquivos" }: ArquivosClienteProps) {
    const [folderPath, setFolderPath] = useState<ISharePointFile[]>([]);
    const currentFolder = folderPath[folderPath.length - 1] ?? null;
    const { files, capabilities, loading, error, setError, uploadProgress, refresh, upload, remove } =
        useSharePointFiles(cliforId, currentFolder?.id);
    const inputRef = useRef<HTMLInputElement>(null);
    const [busyItem, setBusyItem] = useState<string | null>(null);
    const [preview, setPreview] = useState<{ name: string; url: string } | null>(null);
    const [toDelete, setToDelete] = useState<ISharePointFile | null>(null);
    const [folderDialog, setFolderDialog] = useState(false);
    const [folderName, setFolderName] = useState("");
    const [creatingFolder, setCreatingFolder] = useState(false);
    const [folderError, setFolderError] = useState("");
    const [folderAction, setFolderAction] = useState<{ type: "rename" | "delete"; folder: ISharePointFile } | null>(null);
    const [folderActionBusy, setFolderActionBusy] = useState(false);
    const [folderActionError, setFolderActionError] = useState("");

    const maxBytes = capabilities?.maxFileSizeBytes ?? DEFAULT_MAX_BYTES;
    const canUpload = capabilities?.canUpload ?? false;
    const canCreateFolder = capabilities?.canCreateFolder ?? canUpload;
    const canDelete = capabilities?.canDelete ?? false;
    const canManageFolders = capabilities?.canManageFolders ?? false;
    const linksEnabled = capabilities?.linksEnabled ?? false;
    const uploading = uploadProgress !== null;

    if (!cliforId) return null;

    const createFolder = async () => {
        if (!folderName.trim()) {
            setFolderError("Informe o nome da pasta.");
            return;
        }
        setCreatingFolder(true);
        setFolderError("");
        try {
            await sharepoint.createFolder(cliforId, folderName.trim(), currentFolder?.id);
            setFolderDialog(false);
            setFolderName("");
            await refresh();
        } catch (err) {
            setFolderError(sharepoint.sharePointErrorMessage(err));
        } finally {
            setCreatingFolder(false);
        }
    };

    const handleFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        event.target.value = "";
        if (!file) return;
        if (file.size > maxBytes) {
            setError(`O arquivo excede o tamanho máximo de ${formatBytes(maxBytes)}.`);
            return;
        }
        await upload(file);
    };

    const runItemAction = async (itemId: string, action: () => Promise<void>) => {
        setBusyItem(itemId);
        setError(null);
        try {
            await action();
        } catch (err) {
            setError(sharepoint.sharePointErrorMessage(err));
        } finally {
            setBusyItem(null);
        }
    };

    const handlePreview = (file: ISharePointFile) =>
        runItemAction(file.id, async () => {
            const { url } = await sharepoint.previewFile(cliforId, file.id);
            setPreview({ name: file.name, url });
        });

    const handleEdit = (file: ISharePointFile) => {
        // The tab must be opened synchronously in the click handler, otherwise pop-up blockers stop it.
        const tab = window.open("", "_blank");
        return runItemAction(file.id, async () => {
            try {
                const link = await sharepoint.createLink(cliforId, file.id, "edit");
                if (tab) {
                    tab.opener = null;
                    tab.location.href = link.webUrl;
                } else {
                    window.location.assign(link.webUrl);
                }
            } catch (err) {
                tab?.close();
                throw err;
            }
        });
    };

    const handleDownload = (file: ISharePointFile) =>
        runItemAction(file.id, async () => {
            const { blob, fileName } = await sharepoint.downloadFile(cliforId, file.id, file.name);
            sharepoint.saveBlob(blob, fileName);
        });

    const openFolderAction = (type: "rename" | "delete", folder: ISharePointFile) => {
        setFolderActionError("");
        setFolderAction({ type, folder });
    };

    const closeFolderAction = () => {
        if (folderActionBusy) return;
        setFolderAction(null);
        setFolderActionError("");
    };

    const submitRename = async (nome: string) => {
        if (!folderAction || folderAction.type !== "rename" || folderActionBusy) return;
        const target = folderAction.folder;
        setFolderActionBusy(true);
        setFolderActionError("");
        try {
            const updated = await sharepoint.renameFolder(cliforId, target.id, nome);
            const newName = updated?.name || nome;
            setFolderPath((path) => path.map((folder) => folder.id === target.id ? { ...folder, name: newName } : folder));
            setFolderAction(null);
            await refresh();
        } catch (err) {
            setFolderActionError(sharepoint.sharePointErrorMessage(err));
        } finally {
            setFolderActionBusy(false);
        }
    };

    const submitFolderDelete = async () => {
        if (!folderAction || folderAction.type !== "delete" || folderActionBusy) return;
        const target = folderAction.folder;
        setFolderActionBusy(true);
        setFolderActionError("");
        try {
            await sharepoint.deleteFolder(cliforId, target.id);
            setFolderAction(null);
            const index = folderPath.findIndex((folder) => folder.id === target.id);
            if (index >= 0) {
                // The open folder (or one of its ancestors) no longer exists: go back to its parent.
                setFolderPath((path) => path.slice(0, index));
            } else {
                await refresh();
            }
        } catch (err) {
            setFolderActionError(sharepoint.sharePointErrorMessage(err));
        } finally {
            setFolderActionBusy(false);
        }
    };

    const confirmDelete = async () => {
        if (!toDelete) return;
        const item = toDelete;
        setToDelete(null);
        setBusyItem(item.id);
        await remove(item.id);
        setBusyItem(null);
    };

    return (
        <Box
            sx={{
                backgroundColor: "rgba(255,255,255,0.6)",
                border: "1px solid rgba(85, 8, 29, 0.16)",
                borderRadius: 2,
                padding: 2,
                color: "#55081d",
                width: "95%",
            }}
        >
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                <Typography variant="h6" style={{ color: "#55081d" }}>
                    {titulo}
                </Typography>
                <Stack direction="row" spacing={1} alignItems="center">
                    <CopiarModeloCliente key={cliforId} cliforId={cliforId} onNavigate={(id, name) =>
                        setFolderPath([{ id, name, folder: {}, size: null, webUrl: null, contentType: null, lastModifiedDateTime: null }])
                    } />
                    <Tooltip title="Atualizar">
                        <span>
                            <IconButton aria-label="Atualizar lista" onClick={refresh} disabled={loading} sx={iconSx}>
                                <RefreshIcon />
                            </IconButton>
                        </span>
                    </Tooltip>
                    {canUpload && (
                        <Button
                            variant="outlined"
                            startIcon={<UploadFileIcon />}
                            onClick={() => inputRef.current?.click()}
                            disabled={uploading || creatingFolder || loading || folderActionBusy}
                            sx={outlinedSx}
                        >
                            Enviar arquivo
                        </Button>
                    )}
                    {canCreateFolder && (
                        <Button variant="outlined" sx={outlinedSx} disabled={loading || uploading || creatingFolder || folderActionBusy}
                            onClick={() => { setFolderError(""); setFolderDialog(true); }}>
                            Criar pasta
                        </Button>
                    )}
                    <input
                        ref={inputRef}
                        type="file"
                        hidden
                        data-testid="sharepoint-file-input"
                        onChange={handleFileSelected}
                    />
                </Stack>
            </Stack>

            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }} aria-label="Caminho da pasta">
                <Button
                    size="small"
                    onClick={() => setFolderPath([])}
                    disabled={folderPath.length === 0 || folderActionBusy}
                    sx={{ color: "#55081d", textTransform: "none" }}
                >
                    Arquivos Editáveis
                </Button>
                {folderPath.map((folder, index) => (
                    <React.Fragment key={folder.id}>
                        <Typography aria-hidden="true">/</Typography>
                        <Button
                            size="small"
                            onClick={() => setFolderPath((path) => path.slice(0, index + 1))}
                            disabled={index === folderPath.length - 1 || folderActionBusy}
                            aria-current={index === folderPath.length - 1 ? "location" : undefined}
                            sx={{ color: "#55081d", textTransform: "none" }}
                        >
                            {folderDisplayName(folder.name)}
                        </Button>
                    </React.Fragment>
                ))}
                {folderPath.length > 0 && (
                    <Tooltip title="Voltar para a pasta anterior">
                        <span>
                            <IconButton
                                aria-label="Voltar para pasta anterior"
                                onClick={() => setFolderPath((path) => path.slice(0, -1))}
                                disabled={folderActionBusy}
                                sx={iconSx}
                            >
                                <ArrowBackIcon />
                            </IconButton>
                        </span>
                    </Tooltip>
                )}
                {currentFolder && canManageFolders && (
                    <FolderActionButtons
                        name={folderDisplayName(currentFolder.name)}
                        color="#55081d"
                        disabled={folderActionBusy || loading || uploading}
                        onRename={() => openFolderAction("rename", currentFolder)}
                        onDelete={() => openFolderAction("delete", currentFolder)}
                    />
                )}
            </Stack>

            {uploading && (
                <Box sx={{ mb: 1 }}>
                    <Typography variant="caption">Enviando... {uploadProgress}%</Typography>
                    <LinearProgress variant="determinate" value={uploadProgress ?? 0} />
                </Box>
            )}

            {error && (
                <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 1 }}>
                    {error}
                </Alert>
            )}

            {loading ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
                    <CircularProgress size={28} sx={iconSx} aria-label="Carregando arquivos" />
                </Box>
            ) : files.length === 0 ? (
                !error && <Typography variant="body2">
                    {currentFolder ? "Esta pasta está vazia." : "Nenhum arquivo por aqui ainda."}
                </Typography>
            ) : (
                <List dense disablePadding>
                    {files.map((file) => {
                        const busy = busyItem === file.id;
                        const isFolder = Boolean(file.folder);
                        if (isFolder) {
                            return (
                                <ListItem
                                    key={file.id}
                                    divider
                                    disablePadding
                                    secondaryAction={canManageFolders ? (
                                        <FolderActionButtons
                                            name={folderDisplayName(file.name)}
                                            color="#55081d"
                                            disabled={folderActionBusy || uploading}
                                            onRename={() => openFolderAction("rename", file)}
                                            onDelete={() => openFolderAction("delete", file)}
                                        />
                                    ) : undefined}
                                    sx={canManageFolders ? { pr: 10 } : undefined}
                                >
                                    <Button
                                        fullWidth
                                        disabled={folderActionBusy}
                                        onClick={() => setFolderPath((path) => [...path, file])}
                                        startIcon={<FolderOutlinedIcon />}
                                        sx={{
                                            justifyContent: "flex-start",
                                            py: 1.25,
                                            color: "#55081d",
                                            textTransform: "none",
                                            fontWeight: 700,
                                        }}
                                    >
                                        {folderDisplayName(file.name)}
                                    </Button>
                                </ListItem>
                            );
                        }
                        return (
                            <ListItem
                                key={file.id}
                                divider
                                secondaryAction={
                                    <Stack direction="row" spacing={0.5} alignItems="center">
                                        {busy && <CircularProgress size={18} sx={iconSx} />}
                                        <Tooltip title="Visualizar">
                                            <span>
                                                <IconButton aria-label={`Visualizar ${file.name}`} disabled={busy} onClick={() => handlePreview(file)} sx={iconSx}>
                                                    <VisibilityIcon fontSize="small" />
                                                </IconButton>
                                            </span>
                                        </Tooltip>
                                        {linksEnabled && isOfficeEditable(file.name) && (
                                            <Tooltip title="Editar no Office online">
                                                <span>
                                                    <IconButton aria-label={`Editar ${file.name}`} disabled={busy} onClick={() => handleEdit(file)} sx={iconSx}>
                                                        <EditIcon fontSize="small" />
                                                    </IconButton>
                                                </span>
                                            </Tooltip>
                                        )}
                                        <Tooltip title="Baixar">
                                            <span>
                                                <IconButton aria-label={`Baixar ${file.name}`} disabled={busy} onClick={() => handleDownload(file)} sx={iconSx}>
                                                    <DownloadIcon fontSize="small" />
                                                </IconButton>
                                            </span>
                                        </Tooltip>
                                        {canDelete && (
                                            <Tooltip title="Excluir">
                                                <span>
                                                    <IconButton aria-label={`Excluir ${file.name}`} disabled={busy} onClick={() => setToDelete(file)} sx={iconSx}>
                                                        <DeleteOutlineIcon fontSize="small" />
                                                    </IconButton>
                                                </span>
                                            </Tooltip>
                                        )}
                                    </Stack>
                                }
                                sx={{ pr: canDelete ? 22 : 17 }}
                            >
                                <ListItemText
                                    primary={
                                        <Box
                                            component="button"
                                            type="button"
                                            disabled={busy}
                                            onClick={() =>
                                                linksEnabled && isOfficeEditable(file.name)
                                                    ? handleEdit(file)
                                                    : handlePreview(file)
                                            }
                                            title={
                                                linksEnabled && isOfficeEditable(file.name)
                                                    ? `Abrir ${file.name} no editor online`
                                                    : `Visualizar ${file.name}`
                                            }
                                            sx={{
                                                all: "unset",
                                                cursor: "pointer",
                                                color: "#55081d",
                                                display: "block",
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                                whiteSpace: "nowrap",
                                                maxWidth: "100%",
                                                "&:hover": { textDecoration: "underline" },
                                            }}
                                        >
                                            {file.name}
                                        </Box>
                                    }
                                    secondary={[formatBytes(file.size), formatDate(file.lastModifiedDateTime)].filter(Boolean).join(" • ")}
                                />
                            </ListItem>
                        );
                    })}
                </List>
            )}

            <Dialog open={Boolean(preview)} onClose={() => setPreview(null)} fullWidth maxWidth="lg">
                <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", color: "#55081d" }}>
                    <Typography noWrap component="span" variant="h6">{preview?.name}</Typography>
                    <IconButton aria-label="Fechar visualização" onClick={() => setPreview(null)} sx={iconSx}>
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent sx={{ p: 0, height: "80vh" }}>
                    {preview && (
                        <iframe
                            title={`Visualização de ${preview.name}`}
                            src={preview.url}
                            style={{ border: 0, width: "100%", height: "100%" }}
                            sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-downloads"
                            referrerPolicy="no-referrer"
                        />
                    )}
                </DialogContent>
            </Dialog>

            <Dialog open={Boolean(toDelete)} onClose={() => setToDelete(null)}>
                <DialogTitle sx={{ color: "#55081d" }}>Excluir arquivo</DialogTitle>
                <DialogContent>
                    <Typography>
                        Deseja excluir "{toDelete?.name}"? O arquivo irá para a lixeira do contêiner.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setToDelete(null)} sx={{ color: "#55081d" }}>Cancelar</Button>
                    <Button
                        onClick={confirmDelete}
                        variant="contained"
                        sx={{ backgroundColor: "#55081d", "&:hover": { backgroundColor: "#6f102a" } }}
                    >
                        Excluir
                    </Button>
                </DialogActions>
            </Dialog>
            <RenameFolderDialog
                open={folderAction?.type === "rename"}
                currentName={folderAction ? folderDisplayName(folderAction.folder.name) : ""}
                busy={folderActionBusy}
                error={folderActionError}
                onCancel={closeFolderAction}
                onSubmit={(nome) => void submitRename(nome)}
            />
            <DeleteFolderDialog
                open={folderAction?.type === "delete"}
                folderName={folderAction ? folderDisplayName(folderAction.folder.name) : ""}
                childCount={folderAction?.folder.folder?.childCount}
                busy={folderActionBusy}
                error={folderActionError}
                onCancel={closeFolderAction}
                onConfirm={() => void submitFolderDelete()}
            />
            <Dialog open={folderDialog} onClose={() => !creatingFolder && setFolderDialog(false)}>
                <DialogTitle>Criar pasta</DialogTitle>
                <DialogContent>
                    <TextField autoFocus label="Nome da pasta" value={folderName} disabled={creatingFolder}
                        onChange={(event) => setFolderName(event.target.value)} sx={{ mt: 1 }} />
                    {folderError && <Alert severity="error" sx={{ mt: 1 }}>{folderError}</Alert>}
                </DialogContent>
                <DialogActions>
                    <Button disabled={creatingFolder} onClick={() => setFolderDialog(false)}>Cancelar</Button>
                    <Button disabled={creatingFolder} onClick={createFolder}>
                        {creatingFolder ? "Criando..." : "Confirmar criação"}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
