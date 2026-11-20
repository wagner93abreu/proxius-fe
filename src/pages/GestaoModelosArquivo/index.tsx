import React, { useEffect, useRef, useState } from "react";
import {
    Alert,
    Box,
    Button,
    Card,
    Chip,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    Stack,
    TextField,
    Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { ThemeProvider } from "@mui/material/styles";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import BlockOutlinedIcon from "@mui/icons-material/BlockOutlined";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import CreateNewFolderIcon from "@mui/icons-material/CreateNewFolder";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import FolderOutlinedIcon from "@mui/icons-material/FolderOutlined";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import InsertDriveFileOutlinedIcon from "@mui/icons-material/InsertDriveFileOutlined";
import SnippetFolderOutlinedIcon from "@mui/icons-material/SnippetFolderOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import styled from "styled-components";
import Container from "../../components/Container";
import http from "../../http";
import { libraryAuthHeaders } from "../../http/bibliotecas";
import {
    createModelo,
    createModeloFolder,
    deleteModeloFile,
    deleteModeloFolder,
    deactivateModelo,
    getModeloFileContent,
    IModeloArquivo,
    listModeloContents,
    listModelos,
    isModelCatalogEnabled,
    renameModeloFolder,
    updateModelo,
    uploadModeloFile,
} from "../../http/modelosArquivo";
import { isSharePointEnabled, sharePointErrorMessage } from "../../http/sharepoint";
import IUser from "../../types/IUser";
import { ISharePointFile } from "../../types/ISharePointFile";
import { EDITABLE_FILE_ACCEPT, isOfficeEditable } from "../../utils/editableFiles";
import lightTheme from "../../styles/lightTheme";
import { DeleteFolderDialog, FolderActionButtons, RenameFolderDialog } from "../../components/FolderActions";

const maxFileSize = 10 * 1024 * 1024;

interface IModeloUploadFile {
    file: File;
    status: "pending" | "uploading" | "uploaded" | "failed";
    error?: string;
    retryable: boolean;
}

const inlineFileTypes = new Set([
    "application/pdf", "image/jpeg", "image/png", "image/gif", "image/webp", "image/bmp",
]);

function canPreviewModelFile(item: ISharePointFile) {
    return !!item.contentType && inlineFileTypes.has(item.contentType.split(";")[0].trim().toLowerCase());
}

const ContainerClaro = styled(Container)`
    background: linear-gradient(180deg, #efe5d8 0%, #e2d8cc 100%);
    color: #55081d;
    min-height: calc(100dvh - 48px);
    box-sizing: border-box;
    margin: 0;
    padding: 40px 32px 64px;

    @media (max-width: 600px) {
        padding: 24px 16px 48px;
    }
`;

const panelSx = {
    p: { xs: 2, sm: 3 }, border: "1px solid rgba(85, 8, 29, 0.16)", borderRadius: "20px",
    bgcolor: "rgba(255,255,255,0.72)", boxShadow: "0 16px 48px rgba(85, 8, 29, 0.06)",
};
const chipSx = { bgcolor: "rgba(85, 8, 29, 0.06)", color: "primary.main" };
const emptySx = {
    p: { xs: 3, sm: 6 }, textAlign: "center", border: "1px dashed", borderColor: "divider",
    borderRadius: 3, bgcolor: "rgba(255,255,255,0.5)", color: "text.secondary",
} as const;
const iconTileSx = {
    display: "grid", placeItems: "center", width: 44, height: 44, flexShrink: 0,
    borderRadius: 2, bgcolor: "rgba(85, 8, 29, 0.06)", color: "primary.main",
};

function fileTypeLabel(name: string) {
    const extension = name.split(".").pop()?.toLowerCase() ?? "";
    if (["doc", "docx", "docm", "dot", "dotx", "odt", "rtf"].includes(extension)) return "Word";
    if (["xls", "xlsx", "xlsm", "xlt", "xltx", "ods", "csv"].includes(extension)) return "Excel";
    if (["ppt", "pptx", "pptm", "pps", "ppsx", "pot", "potx", "odp"].includes(extension)) return "PowerPoint";
    return "Arquivo";
}

interface ModeloDialogProps {
    initial?: IModeloArquivo | null;
    onClose: () => void;
    onSave: (nome: string, descricao: string) => Promise<void>;
}

function ModeloDialog({ initial, onClose, onSave }: ModeloDialogProps) {
    const [nome, setNome] = useState(initial?.nome ?? "");
    const [descricao, setDescricao] = useState(initial?.descricao ?? "");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const submit = async () => {
        if (!nome.trim()) {
            setError("Informe o nome do modelo.");
            return;
        }
        setSaving(true);
        try {
            await onSave(nome.trim(), descricao.trim());
            onClose();
        } catch (err) {
            setError(sharePointErrorMessage(err));
        } finally {
            setSaving(false);
        }
    };
    return (
        <Dialog open onClose={() => !saving && onClose()} fullWidth maxWidth="sm">
            <DialogTitle>{initial ? "Editar modelo" : "Novo modelo"}</DialogTitle>
            <DialogContent>
                <Stack spacing={2} sx={{ pt: 1 }}>
                    <TextField autoFocus label="Nome" value={nome} onChange={(event) => setNome(event.target.value)} />
                    <TextField label="Descrição" multiline minRows={2} value={descricao} onChange={(event) => setDescricao(event.target.value)} />
                    {error && <Alert severity="error">{error}</Alert>}
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} disabled={saving}>Cancelar</Button>
                <Button onClick={submit} disabled={saving} variant="contained">
                    {saving ? "Salvando..." : "Salvar"}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default function GestaoModelosArquivo() {
    const [role, setRole] = useState<string | null>(null);
    const [models, setModels] = useState<IModeloArquivo[]>([]);
    const [selected, setSelected] = useState<IModeloArquivo | null>(null);
    const [contents, setContents] = useState<ISharePointFile[]>([]);
    const [folderPath, setFolderPath] = useState<ISharePointFile[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [dialogModel, setDialogModel] = useState<IModeloArquivo | null | undefined>(undefined);
    const [folderDialog, setFolderDialog] = useState(false);
    const [folderName, setFolderName] = useState("");
    const [fileError, setFileError] = useState("");
    const [uploadFiles, setUploadFiles] = useState<IModeloUploadFile[]>([]);
    const [previewFile, setPreviewFile] = useState<ISharePointFile | null>(null);
    const [previewUrl, setPreviewUrl] = useState("");
    const [previewLoading, setPreviewLoading] = useState(false);
    const [busy, setBusy] = useState(false);
    const [folderAction, setFolderAction] = useState<{ type: "rename" | "delete"; folder: ISharePointFile } | null>(null);
    const [folderActionError, setFolderActionError] = useState("");
    const uploadRef = useRef<HTMLInputElement>(null);
    const contentsRequest = useRef(0);
    const previewRequest = useRef(0);
    const previewObjectUrl = useRef<string | null>(null);
    const currentFolder = folderPath[folderPath.length - 1] ?? null;

    useEffect(() => () => {
        previewRequest.current += 1;
        if (previewObjectUrl.current) URL.revokeObjectURL(previewObjectUrl.current);
    }, []);

    useEffect(() => {
        let active = true;
        const userId = localStorage.getItem("userID");
        if (!userId || !localStorage.getItem("authToken")) {
            setRole("");
            return () => { active = false; };
        }
        http.get<IUser>(`usuarios/${encodeURIComponent(userId)}`, { headers: libraryAuthHeaders() })
            .then(({ data }) => active && setRole(data.papel))
            .catch((err) => {
                if (active) {
                    setRole("");
                    setError(sharePointErrorMessage(err));
                }
            });
        return () => { active = false; };
    }, []);

    const loadModels = async () => {
        setLoading(true);
        setError("");
        try {
            setModels(await listModelos());
        } catch (err) {
            setError(sharePointErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (role === "ADMIN" && isSharePointEnabled() && isModelCatalogEnabled()) loadModels();
    }, [role]);

    const loadContents = async (model: IModeloArquivo, parentId?: string | null) => {
        const request = ++contentsRequest.current;
        setLoading(true);
        setContents([]);
        setError("");
        try {
            const items = await listModeloContents(model.id, parentId);
            if (request === contentsRequest.current) setContents(items);
        } catch (err) {
            if (request === contentsRequest.current) setError(sharePointErrorMessage(err));
        } finally {
            if (request === contentsRequest.current) setLoading(false);
        }
    };

    const selectModel = (model: IModeloArquivo) => {
        if (busy) return;
        setSelected(model);
        setFileError("");
        setFolderPath([]);
        setContents([]);
        void loadContents(model);
    };

    const saveModel = async (nome: string, descricao: string) => {
        if (dialogModel) {
            const updated = await updateModelo(dialogModel.id, nome, descricao);
            if (selected?.id === updated.id) setSelected(updated);
        }
        else await createModelo(nome, descricao);
        await loadModels();
    };

    const submitFolder = async () => {
        if (!selected) return;
        if (!folderName.trim()) {
            setError("Informe o nome da pasta.");
            return;
        }
        setBusy(true);
        setError("");
        try {
            await createModeloFolder(selected.id, folderName.trim(), currentFolder?.id);
            setFolderDialog(false);
            setFolderName("");
            await loadContents(selected, currentFolder?.id);
        } catch (err) {
            setError(sharePointErrorMessage(err));
        } finally {
            setBusy(false);
        }
    };

    const selectUploadFiles = (files: FileList | null) => {
        if (!files) return;
        setFileError("");
        setUploadFiles(Array.from(files, (file) => {
            if (!isOfficeEditable(file.name)) {
                return {
                    file, status: "failed", retryable: false,
                    error: "Envie um original editável suportado (Word, Excel ou PowerPoint).",
                };
            }
            if (file.size > maxFileSize) {
                return { file, status: "failed", retryable: false, error: "O arquivo excede o limite de 10 MB." };
            }
            return { file, status: "pending", retryable: false };
        }));
    };

    const uploadSelectedFiles = async () => {
        if (!selected || uploadFiles.length === 0) return;
        const filesToUpload = uploadFiles
            .map((entry, index) => ({ entry, index }))
            .filter(({ entry }) => entry.status === "pending" || (entry.status === "failed" && entry.retryable));
        if (filesToUpload.length === 0) return;
        const model = selected;
        const parentId = currentFolder?.id;
        const folderId = parentId ?? undefined;
        setFileError("");
        setBusy(true);
        let requestFailed = false;
        for (const { entry, index } of filesToUpload) {
            setUploadFiles((current) => current.map((item, itemIndex) => itemIndex === index
                ? { ...item, status: "uploading", error: undefined } : item));
            try {
                await uploadModeloFile(model.id, entry.file, folderId);
                setUploadFiles((current) => current.map((item, itemIndex) => itemIndex === index
                    ? { ...item, status: "uploaded", retryable: false, error: undefined } : item));
            } catch (uploadError) {
                requestFailed = true;
                setUploadFiles((current) => current.map((item, itemIndex) => itemIndex === index
                    ? { ...item, status: "failed", retryable: true, error: sharePointErrorMessage(uploadError) } : item));
            }
        }
        if (filesToUpload.length > 0) await loadContents(model, parentId);
        const validationFailed = uploadFiles.some((entry) => entry.status === "failed" && !entry.retryable);
        if (!validationFailed && !requestFailed) setUploadFiles([]);
        setBusy(false);
    };

    const selectedFile = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        event.target.value = "";
        selectUploadFiles(files);
    };

    const deactivate = async (model: IModeloArquivo) => {
        if (!window.confirm(`Desativar "${model.nome}"? As cópias já entregues não serão alteradas.`)) return;
        setBusy(true);
        setError("");
        try {
            await deactivateModelo(model.id);
            if (selected?.id === model.id) {
                ++contentsRequest.current;
                setSelected(null);
                setContents([]);
            }
            await loadModels();
        } catch (err) {
            setError(sharePointErrorMessage(err));
        } finally {
            setBusy(false);
        }
    };

    const removeModelFile = async (item: ISharePointFile) => {
        if (!selected) return;
        const message = `Excluir permanentemente "${item.name}" do acervo mestre? As cópias já entregues aos clientes não serão alteradas.`;
        if (!window.confirm(message)) return;
        const model = selected;
        const parentId = currentFolder?.id;
        setBusy(true);
        setError("");
        try {
            await deleteModeloFile(model.id, item.id);
            await loadContents(model, parentId);
        } catch (err) {
            setError(sharePointErrorMessage(err));
        } finally {
            setBusy(false);
        }
    };

    const openModelFile = async (item: ISharePointFile) => {
        if (!selected) return;
        const model = selected;
        const requestId = ++previewRequest.current;
        setPreviewFile(item);
        setPreviewUrl("");
        setPreviewLoading(true);
        setError("");
        try {
            const content = await getModeloFileContent(model.id, item.id);
            if (requestId !== previewRequest.current) return;
            const objectUrl = URL.createObjectURL(content);
            if (previewObjectUrl.current) URL.revokeObjectURL(previewObjectUrl.current);
            previewObjectUrl.current = objectUrl;
            setPreviewUrl(objectUrl);
            if (!canPreviewModelFile(item)) {
                const link = document.createElement("a");
                link.href = objectUrl;
                link.download = item.name;
                document.body.appendChild(link);
                link.click();
                link.remove();
                setPreviewFile(null);
                setPreviewUrl("");
                window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
                previewObjectUrl.current = null;
            }
        } catch (err) {
            if (requestId === previewRequest.current) {
                setPreviewFile(null);
                setError(sharePointErrorMessage(err));
            }
        } finally {
            if (requestId === previewRequest.current) setPreviewLoading(false);
        }
    };

    const closeFilePreview = () => {
        previewRequest.current += 1;
        setPreviewFile(null);
        setPreviewUrl("");
        if (previewObjectUrl.current) {
            URL.revokeObjectURL(previewObjectUrl.current);
            previewObjectUrl.current = null;
        }
    };

    const openFolderAction = (type: "rename" | "delete", folder: ISharePointFile) => {
        if (busy) return;
        setFolderActionError("");
        setFolderAction({ type, folder });
    };

    const closeFolderAction = () => {
        if (busy) return;
        setFolderAction(null);
        setFolderActionError("");
    };

    const submitFolderRename = async (nome: string) => {
        if (!selected || folderAction?.type !== "rename" || busy) return;
        const model = selected;
        const target = folderAction.folder;
        const parentId = currentFolder?.id;
        setBusy(true);
        setFolderActionError("");
        try {
            const updated = await renameModeloFolder(model.id, target.id, nome);
            const newName = updated?.name || nome;
            setFolderPath((path) => path.map((folder) => folder.id === target.id ? { ...folder, name: newName } : folder));
            setFolderAction(null);
            await loadContents(model, parentId);
        } catch (err) {
            setFolderActionError(sharePointErrorMessage(err));
        } finally {
            setBusy(false);
        }
    };

    const submitFolderDelete = async () => {
        if (!selected || folderAction?.type !== "delete" || busy) return;
        const model = selected;
        const target = folderAction.folder;
        setBusy(true);
        setFolderActionError("");
        try {
            await deleteModeloFolder(model.id, target.id);
            setFolderAction(null);
            const index = folderPath.findIndex((folder) => folder.id === target.id);
            // When the open folder (or an ancestor) was removed, go back to its parent.
            const nextPath = index >= 0 ? folderPath.slice(0, index) : folderPath;
            setFolderPath(nextPath);
            await loadContents(model, nextPath[nextPath.length - 1]?.id);
        } catch (err) {
            setFolderActionError(sharePointErrorMessage(err));
        } finally {
            setBusy(false);
        }
    };

    const goToRoot = () => {
        if (!selected) return;
        setFolderPath([]);
        void loadContents(selected);
    };

    return (
        <ThemeProvider theme={lightTheme}>
            <ContainerClaro aria-labelledby="gestao-modelos-title">
                <Box sx={{ maxWidth: 1280, mx: "auto" }}>
                    <Stack component="header" direction="row" alignItems="center" spacing={2} sx={{ mb: 4 }}>
                        <Box sx={{
                            display: { xs: "none", sm: "grid" }, placeItems: "center", width: 64, height: 64,
                            bgcolor: "rgba(255,255,255,0.65)", border: "1px solid", borderColor: "divider",
                            borderRadius: 3, flexShrink: 0,
                        }}>
                            <SnippetFolderOutlinedIcon sx={{ fontSize: 32 }} aria-hidden="true" />
                        </Box>
                        <Box>
                            <Typography variant="overline" sx={{ letterSpacing: "0.12em", color: "text.secondary" }}>
                                Gestão documental
                            </Typography>
                            <Typography id="gestao-modelos-title" component="h1" variant="h5"
                                sx={{ fontSize: { xs: 26, sm: 32 }, mb: 0.75 }}>
                                Modelos de arquivos
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Acervo mestre separado dos materiais de consulta. Somente administradores podem mantê-lo.
                            </Typography>
                        </Box>
                    </Stack>
                    {role === null ? <Stack direction="row" alignItems="center" spacing={2} role="status">
                        <CircularProgress size={24} aria-label="Verificando acesso" />
                        <Typography color="text.secondary">Verificando acesso...</Typography>
                    </Stack> :
                        role !== "ADMIN" ? <Alert severity="error">{error || "Acesso restrito a administradores."}</Alert> :
                            !isModelCatalogEnabled() ? <Alert severity="info">O acervo de modelos está temporariamente indisponível enquanto a API e a validação do SharePoint Embedded não estiverem concluídas.</Alert> :
                                !isSharePointEnabled() ? <Alert severity="warning">Habilite REACT_APP_SHAREPOINT_ENABLED para usar o acervo.</Alert> : (
                                    <Stack spacing={3}>
                                        <Box sx={panelSx}>
                                            <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ xs: "stretch", sm: "center" }}
                                                justifyContent="space-between" gap={2} sx={{ mb: 3 }}>
                                                <Box>
                                                    <Stack direction="row" alignItems="center" spacing={1.5}>
                                                        <Typography component="h2" variant="h6">Catálogo</Typography>
                                                        {!loading && (
                                                            <Chip size="small" sx={chipSx}
                                                                label={`${models.length} ${models.length === 1 ? "modelo" : "modelos"}`} />
                                                        )}
                                                    </Stack>
                                                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                                        Originais editáveis entregues como cópia aos clientes.
                                                    </Typography>
                                                </Box>
                                                <Button disabled={busy} variant="contained" startIcon={<AddIcon />} onClick={() => setDialogModel(null)}>
                                                    Novo modelo
                                                </Button>
                                            </Stack>
                                            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                                            {loading && !selected && (
                                                <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                                                    <CircularProgress size={24} aria-label="Carregando catálogo" />
                                                    <Typography color="text.secondary">Carregando catálogo...</Typography>
                                                </Stack>
                                            )}
                                            {!loading && models.length === 0 ? (
                                                <Typography role="status" sx={emptySx}>Nenhum modelo cadastrado.</Typography>
                                            ) : (
                                                <Box component="ul" sx={{
                                                    listStyle: "none", m: 0, p: 0, display: "grid", gap: 2,
                                                    gridTemplateColumns: { xs: "minmax(0, 1fr)", sm: "repeat(2, minmax(0, 1fr))", lg: "repeat(3, minmax(0, 1fr))" },
                                                }}>
                                                    {models.map((model) => {
                                                        const isSelected = selected?.id === model.id;
                                                        return (
                                                            <Card component="li" key={model.id} variant="outlined" sx={{
                                                                display: "flex", flexDirection: "column", p: 3, gap: 2,
                                                                borderColor: isSelected ? "primary.main" : "divider",
                                                                boxShadow: isSelected ? "0 8px 24px rgba(85, 8, 29, 0.1)" : "none",
                                                                opacity: model.ativo ? 1 : 0.72,
                                                                transition: "border-color 160ms ease, box-shadow 160ms ease",
                                                                "&:hover": { borderColor: "primary.main", boxShadow: "0 8px 24px rgba(85, 8, 29, 0.08)" },
                                                                "@media (prefers-reduced-motion: reduce)": { transition: "none" },
                                                            }}>
                                                                <Stack direction="row" alignItems="flex-start" justifyContent="space-between" gap={1}>
                                                                    <Box sx={iconTileSx}>
                                                                        <DescriptionOutlinedIcon aria-hidden="true" />
                                                                    </Box>
                                                                    <Chip size="small" label={model.ativo ? "Ativo" : "Inativo"} sx={model.ativo
                                                                        ? { bgcolor: "rgba(46, 125, 50, 0.1)", color: "#1b5e20" }
                                                                        : { bgcolor: "rgba(117, 101, 107, 0.12)", color: "text.secondary" }} />
                                                                </Stack>
                                                                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                                                                    <Button disabled={busy} onClick={() => selectModel(model)} aria-pressed={isSelected}
                                                                        sx={{
                                                                            p: 0, minWidth: 0, justifyContent: "flex-start", textAlign: "left",
                                                                            fontSize: 17, fontWeight: 700, color: "text.primary", overflowWrap: "anywhere",
                                                                            "&:hover": { bgcolor: "transparent", color: "primary.main", textDecoration: "underline" },
                                                                        }}>
                                                                        {model.nome}
                                                                    </Button>
                                                                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, overflowWrap: "anywhere" }}>
                                                                        {model.descricao || "Sem descrição."}
                                                                    </Typography>
                                                                </Box>
                                                                <Stack direction="row" spacing={1} sx={{ pt: 2, borderTop: "1px solid", borderColor: "divider" }}>
                                                                    <Button disabled={busy} size="small" variant="text" startIcon={<EditOutlinedIcon />}
                                                                        onClick={() => setDialogModel(model)}>Editar</Button>
                                                                    {model.ativo && (
                                                                        <Button disabled={busy} size="small" color="error" startIcon={<BlockOutlinedIcon />}
                                                                            onClick={() => void deactivate(model)}>Desativar</Button>
                                                                    )}
                                                                </Stack>
                                                            </Card>
                                                        );
                                                    })}
                                                </Box>
                                            )}
                                        </Box>
                                        {selected && (
                                            <Box component="section" aria-labelledby="modelo-selecionado-title" sx={panelSx}>
                                                <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between"
                                                    alignItems={{ xs: "stretch", md: "flex-start" }} gap={2} sx={{ mb: 2 }}>
                                                    <Box sx={{ minWidth: 0 }}>
                                                        <Typography variant="overline" sx={{ letterSpacing: "0.12em", color: "text.secondary" }}>
                                                            Arquivos do modelo
                                                        </Typography>
                                                        <Typography id="modelo-selecionado-title" component="h2" variant="h6" sx={{ overflowWrap: "anywhere" }}>
                                                            {selected.nome}
                                                        </Typography>
                                                    </Box>
                                                    {selected.ativo && (
                                                        <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                                                            <Button variant="outlined" disabled={busy || loading} startIcon={<CreateNewFolderIcon />}
                                                                onClick={() => setFolderDialog(true)}>Criar pasta</Button>
                                                            <Button variant="contained" startIcon={<UploadFileIcon />}
                                                                onClick={() => uploadFiles.some((entry) =>
                                                                    entry.status === "pending" || (entry.status === "failed" && entry.retryable))
                                                                    ? void uploadSelectedFiles() : uploadRef.current?.click()}
                                                                disabled={busy}>
                                                                {uploadFiles.some((entry) => entry.status === "failed" && entry.retryable)
                                                                    ? "Tentar novamente"
                                                                    : uploadFiles.some((entry) => entry.status === "pending") || uploadFiles.length === 0
                                                                        ? "Enviar originais" : "Selecionar originais"}
                                                            </Button>
                                                            <input
                                                                ref={uploadRef}
                                                                type="file"
                                                                hidden
                                                                multiple
                                                                accept={EDITABLE_FILE_ACCEPT}
                                                                data-testid="modelo-file-input"
                                                                onChange={selectedFile}
                                                            />
                                                        </Stack>
                                                    )}
                                                </Stack>
                                                <Stack component="nav" aria-label="Caminho do modelo" direction="row" alignItems="center"
                                                    flexWrap="wrap" gap={0.5} sx={{
                                                        mb: 2, px: 1, py: 0.5, borderRadius: 2,
                                                        bgcolor: "rgba(85, 8, 29, 0.04)", border: "1px solid", borderColor: "divider",
                                                    }}>
                                                    {folderPath.length > 0 && (
                                                        <IconButton size="small" disabled={busy} aria-label="Voltar para pasta anterior" onClick={() => {
                                                            const nextPath = folderPath.slice(0, -1);
                                                            setFolderPath(nextPath);
                                                            void loadContents(selected, nextPath[nextPath.length - 1]?.id);
                                                        }}>
                                                            <ArrowBackIcon fontSize="small" />
                                                        </IconButton>
                                                    )}
                                                    <Button disabled={busy} size="small" startIcon={<HomeOutlinedIcon />} onClick={goToRoot}>
                                                        Raiz
                                                    </Button>
                                                    {folderPath.map((folder, index) => (
                                                        <React.Fragment key={folder.id}>
                                                            <ChevronRightIcon fontSize="small" sx={{ color: "text.secondary" }} aria-hidden="true" />
                                                            <Button size="small" disabled={busy || index === folderPath.length - 1}
                                                                aria-current={index === folderPath.length - 1 ? "location" : undefined}
                                                                sx={{ textTransform: "none", "&.Mui-disabled": { color: "text.primary" } }}
                                                                onClick={() => {
                                                                    const nextPath = folderPath.slice(0, index + 1);
                                                                    setFolderPath(nextPath);
                                                                    void loadContents(selected, nextPath[nextPath.length - 1]?.id);
                                                                }}>{folder.name}</Button>
                                                        </React.Fragment>
                                                    ))}
                                                    {currentFolder && (
                                                        <Box sx={{ ml: "auto" }}>
                                                            <FolderActionButtons
                                                                name={currentFolder.name}
                                                                disabled={busy || loading}
                                                                onRename={() => openFolderAction("rename", currentFolder)}
                                                                onDelete={() => openFolderAction("delete", currentFolder)}
                                                            />
                                                        </Box>
                                                    )}
                                                </Stack>
                                                {fileError && <Alert severity="error" onClose={() => setFileError("")} sx={{ mb: 2 }}>{fileError}</Alert>}
                                                {uploadFiles.length > 0 && (
                                                    <Stack component="ul" spacing={1} aria-label="Arquivos selecionados" sx={{ m: 0, mb: 2, pl: 2.5 }}>
                                                        {uploadFiles.map((entry, index) => (
                                                            <Box component="li" key={`${entry.file.name}-${index}`}>
                                                                <Typography variant="body2">{entry.file.name} — {
                                                                    entry.status === "pending" ? "Aguardando envio" :
                                                                        entry.status === "uploading" ? "Enviando..." :
                                                                            entry.status === "uploaded" ? "Enviado" : "Falha"
                                                                }</Typography>
                                                                {entry.error && <Typography role="alert" variant="caption" color="error">{entry.error}</Typography>}
                                                            </Box>
                                                        ))}
                                                    </Stack>
                                                )}
                                                {loading ? (
                                                    <Stack direction="row" alignItems="center" spacing={2} sx={{ py: 2 }}>
                                                        <CircularProgress size={24} aria-label="Carregando arquivos" />
                                                        <Typography color="text.secondary">Carregando arquivos...</Typography>
                                                    </Stack>
                                                ) : contents.length === 0 ? (
                                                    <Typography role="status" sx={emptySx}>Esta pasta está vazia.</Typography>
                                                ) : (
                                                    <Box component="ul" sx={{
                                                        listStyle: "none", m: 0, p: 0, border: "1px solid", borderColor: "divider",
                                                        borderRadius: 3, overflow: "hidden", bgcolor: "background.paper",
                                                    }}>
                                                        {contents.map((item) => (
                                                            <Box component="li" key={item.id} sx={{
                                                                "&:not(:last-of-type)": { borderBottom: "1px solid", borderColor: "divider" },
                                                            }}>
                                                                {item.folder ? (
                                                                    <Stack direction="row" alignItems="center" sx={{ pr: 1.5 }}>
                                                                    <Button disabled={busy} fullWidth
                                                                        startIcon={<Box component="span" sx={{ ...iconTileSx, width: 36, height: 36 }}><FolderOutlinedIcon /></Box>}
                                                                        sx={{
                                                                            justifyContent: "flex-start", textTransform: "none", px: 2, py: 1.25,
                                                                            borderRadius: 0, color: "text.primary", fontWeight: 600, textAlign: "left",
                                                                            overflowWrap: "anywhere",
                                                                        }}
                                                                        onClick={() => { setFolderPath((path) => [...path, item]); void loadContents(selected, item.id); }}>
                                                                        {item.name}
                                                                    </Button>
                                                                    <FolderActionButtons
                                                                        name={item.name}
                                                                        disabled={busy || loading}
                                                                        onRename={() => openFolderAction("rename", item)}
                                                                        onDelete={() => openFolderAction("delete", item)}
                                                                    />
                                                                    </Stack>
                                                                ) : (
                                                                    <Stack direction="row" alignItems="center" flexWrap="wrap" spacing={1.5}
                                                                        sx={{ px: 2, py: 1.25 }}>
                                                                        <Box sx={{ ...iconTileSx, width: 36, height: 36 }}>
                                                                            <InsertDriveFileOutlinedIcon fontSize="small" aria-hidden="true" />
                                                                        </Box>
                                                                        <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                                                                            <Typography variant="body2" sx={{ fontWeight: 600, overflowWrap: "anywhere" }}>{item.name}</Typography>
                                                                        </Box>
                                                                        <Chip size="small" label={fileTypeLabel(item.name)} sx={{ ...chipSx, flexShrink: 0 }} />
                                                                        <Button size="small" disabled={busy || loading}
                                                                            startIcon={canPreviewModelFile(item)
                                                                                ? <VisibilityOutlinedIcon /> : <DownloadOutlinedIcon />}
                                                                            onClick={() => void openModelFile(item)}>
                                                                            {canPreviewModelFile(item) ? "Visualizar" : "Baixar original"}
                                                                        </Button>
                                                                        <Button size="small" color="error" disabled={busy || loading}
                                                                            startIcon={<DeleteOutlineIcon />}
                                                                            onClick={() => void removeModelFile(item)}>
                                                                            Excluir arquivo
                                                                        </Button>
                                                                    </Stack>
                                                                )}
                                                            </Box>
                                                        ))}
                                                    </Box>
                                                )}
                                            </Box>
                                        )}
                                    </Stack>
                                )}
                </Box>
                {dialogModel !== undefined && (
                    <ModeloDialog initial={dialogModel} onClose={() => setDialogModel(undefined)} onSave={saveModel} />
                )}
                <Dialog open={folderDialog} onClose={() => !busy && setFolderDialog(false)} fullWidth maxWidth="xs">
                    <DialogTitle>Criar pasta</DialogTitle>
                    <DialogContent>
                        <TextField autoFocus fullWidth label="Nome da pasta" value={folderName} onChange={(event) => setFolderName(event.target.value)} sx={{ mt: 1 }} />
                        {error && <Alert severity="error" sx={{ mt: 1 }}>{error}</Alert>}
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setFolderDialog(false)} disabled={busy}>Cancelar</Button>
                        <Button variant="contained" onClick={() => void submitFolder()} disabled={!folderName.trim() || busy}>Criar pasta</Button>
                    </DialogActions>
                </Dialog>
                <RenameFolderDialog
                    open={folderAction?.type === "rename"}
                    currentName={folderAction ? folderAction.folder.name : ""}
                    busy={busy}
                    error={folderActionError}
                    onCancel={closeFolderAction}
                    onSubmit={(nome) => void submitFolderRename(nome)}
                />
                <DeleteFolderDialog
                    open={folderAction?.type === "delete"}
                    folderName={folderAction ? folderAction.folder.name : ""}
                    childCount={folderAction?.folder.folder?.childCount}
                    busy={busy}
                    error={folderActionError}
                    onCancel={closeFolderAction}
                    onConfirm={() => void submitFolderDelete()}
                />
                <Dialog open={!!previewFile} onClose={closeFilePreview} fullWidth maxWidth="lg">
                    <DialogTitle>{previewFile?.name}</DialogTitle>
                    <DialogContent sx={{ height: { xs: "65vh", md: "75vh" }, p: 1 }}>
                        {previewLoading ? (
                            <CircularProgress aria-label="Carregando pré-visualização" />
                        ) : previewUrl && previewFile?.contentType?.split(";")[0].trim().toLowerCase() === "application/pdf" ? (
                            <iframe title={`Pré-visualização de ${previewFile.name}`} src={previewUrl}
                                style={{ width: "100%", height: "100%", border: 0 }} />
                        ) : previewUrl ? (
                            <Box component="img" src={previewUrl} alt={previewFile?.name}
                                sx={{ maxWidth: "100%", maxHeight: "100%", display: "block", mx: "auto" }} />
                        ) : null}
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={closeFilePreview}>Fechar visualização</Button>
                    </DialogActions>
                </Dialog>
            </ContainerClaro>
        </ThemeProvider>
    );
}
