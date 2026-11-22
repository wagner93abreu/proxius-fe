import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    Alert,
    Box,
    Button,
    Card,
    CardActionArea,
    CardContent,
    Checkbox,
    Chip,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControlLabel,
    Stack,
    TextField,
    Typography,
} from "@mui/material";
import FolderOutlinedIcon from "@mui/icons-material/FolderOutlined";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";
import InsertDriveFileOutlinedIcon from "@mui/icons-material/InsertDriveFileOutlined";
import LinkOutlinedIcon from "@mui/icons-material/LinkOutlined";
import PictureAsPdfOutlinedIcon from "@mui/icons-material/PictureAsPdfOutlined";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import ArrowForwardOutlinedIcon from "@mui/icons-material/ArrowForwardOutlined";
import CloudUploadOutlinedIcon from "@mui/icons-material/CloudUploadOutlined";
import CreateNewFolderOutlinedIcon from "@mui/icons-material/CreateNewFolderOutlined";
import PeopleOutlineIcon from "@mui/icons-material/PeopleOutline";
import axios from "axios";
import http from "../../http";
import IUser from "../../types/IUser";
import IProduto, { formatDuracaoAcesso } from "../../types/IProduto";
import {
    addLibraryLink,
    createLibrary,
    createLibraryFolder,
    deactivateLibrary,
    deleteLibraryFolder,
    getClientProducts,
    getLibraryItemContent,
    getLibraryStorageStatus,
    IBiblioteca,
    IItemBiblioteca,
    IAcessoProduto,
    libraryAuthHeaders,
    listLibraries,
    listLibraryFolders,
    listLibraryItems,
    IPastaBiblioteca,
    provisionLibraryStorage,
    reconcileClientSales,
    renameLibraryFolder,
    replaceLibraryFile,
    setClientProducts,
    setLibraryProducts,
    uploadLibraryFile,
    updateLibraryLink,
    withdrawLibraryItem,
} from "../../http/bibliotecas";
import { DeleteFolderDialog, FolderActionButtons, RenameFolderDialog } from "../FolderActions";

interface BibliotecaClienteProps {
    cliforId?: string | number;
    mode?: "consulta" | "admin";
}

interface IProductResponse {
    content: IProduto[];
}

type DialogName = "library" | "products" | "concessions" | "file" | "link" | "folder"
    | "replace" | "edit-link" | "deactivate" | null;
type StorageState = "NAO_PROVISIONADO" | "ATIVACAO_PENDENTE" | "PRONTO";

const browserPreviewTypes = ["application/pdf", "image/png", "image/jpeg", "image/webp"];
const officeTypes = [
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
];
const acceptedTypes = [...browserPreviewTypes, ...officeTypes];
const acceptedFileExtensions = [
    ".pdf", ".png", ".jpg", ".jpeg", ".webp", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx",
];
const acceptedFileInputTypes = [...acceptedTypes, ...acceptedFileExtensions].join(",");
const maxLibraryFileSize = 10 * 1024 * 1024;

interface ILibraryUploadFile {
    file: File;
    status: "pending" | "uploading" | "uploaded" | "failed";
    error?: string;
    retryable: boolean;
}

function statusAcesso(status: IAcessoProduto["status"]): "ACTIVE" | "EXPIRED" | "REVOKED" {
    switch (status) {
        case "ACTIVE":
        case "ATIVO":
            return "ACTIVE";
        case "EXPIRED":
        case "EXPIRADO":
            return "EXPIRED";
        default:
            return "REVOKED";
    }
}

function dataAcesso(value: string | null, vazio: string): string {
    if (!value) return vazio;
    const timestamp = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(value) ? value : `${value}Z`;
    const date = new Date(timestamp);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("pt-BR");
}

function errorMessage(error: unknown): string {
    if (!axios.isAxiosError(error)) return "Ocorreu um erro ao acessar a biblioteca.";
    if (!error.response) return "Não foi possível conectar ao servidor.";
    const responseData = error.response.data;
    if (
        typeof responseData === "object" &&
        responseData !== null &&
        "graphStatus" in responseData &&
        typeof responseData.graphStatus === "string" &&
        "error" in responseData &&
        typeof responseData.error === "string"
    ) {
        return responseData.error;
    }
    switch (error.response.status) {
        case 401:
            return "Sua sessão expirou. Faça login novamente.";
        case 403:
            return "Você não tem permissão para esta ação.";
        case 404:
            return "Biblioteca, pasta ou conteúdo não encontrado.";
        case 409:
            return "Já existe uma biblioteca ou pasta com esse nome.";
        case 413:
            return "O arquivo excede o tamanho máximo permitido.";
        case 415:
            return "Formato não suportado. Envie PDF, PNG, JPEG, WEBP, DOC, DOCX, XLS, XLSX, PPT ou PPTX.";
        case 429:
        case 502:
        case 503:
            return "Armazenamento temporariamente indisponível. Tente novamente em instantes.";
        default:
            return "Ocorreu um erro ao acessar a biblioteca.";
    }
}

function approvedExternalUrl(value: string): string | null {
    try {
        const url = new URL(value);
        if (
            (url.protocol === "https:" || url.protocol === "http:") &&
            !url.username &&
            !url.password
        ) {
            return url.toString();
        }
    } catch {
        return null;
    }
    return null;
}

function itemIcon(item: IItemBiblioteca) {
    if (item.tipo === "LINK_EXTERNO") return <LinkOutlinedIcon aria-hidden="true" />;
    if (item.contentType === "application/pdf") return <PictureAsPdfOutlinedIcon aria-hidden="true" />;
    if (item.contentType?.startsWith("image/")) return <ImageOutlinedIcon aria-hidden="true" />;
    return <InsertDriveFileOutlinedIcon aria-hidden="true" />;
}

function isSupportedLibraryFile(file: File): boolean {
    const extension = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
    return browserPreviewTypes.includes(file.type) || acceptedFileExtensions.includes(extension);
}

function isOfficeItem(item: IItemBiblioteca | null): boolean {
    return !!item && officeTypes.includes(item.contentType ?? "");
}

function isPreviewable(item: IItemBiblioteca): boolean {
    return item.tipo === "ARQUIVO" && !!item.contentType && acceptedTypes.includes(item.contentType);
}

export default function BibliotecaExplorer({ cliforId, mode = "consulta" }: BibliotecaClienteProps) {
    const clientId = mode === "admin" ? undefined : cliforId;
    const [libraries, setLibraries] = useState<IBiblioteca[]>([]);
    const [folders, setFolders] = useState<IPastaBiblioteca[]>([]);
    const [items, setItems] = useState<IItemBiblioteca[]>([]);
    const [openLibraryId, setOpenLibraryId] = useState<number | null>(null);
    const [openFolderId, setOpenFolderId] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [itemsLoading, setItemsLoading] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const [isStaff, setIsStaff] = useState(false);
    const [userRole, setUserRole] = useState<string | null>(null);
    const [products, setProducts] = useState<IProduto[]>([]);
    const [productsLoading, setProductsLoading] = useState(false);
    const [storageState, setStorageState] = useState<StorageState | null>(null);
    const [storageLoading, setStorageLoading] = useState(false);
    const [provisioning, setProvisioning] = useState(false);
    const [storageError, setStorageError] = useState("");
    const [dialog, setDialog] = useState<DialogName>(null);
    const [formError, setFormError] = useState("");
    const [refreshKey, setRefreshKey] = useState(0);

    const [newName, setNewName] = useState("");
    const [newDescription, setNewDescription] = useState("");
    const [libraryProductDraft, setLibraryProductDraft] = useState<number[]>([]);
    const [clientInput, setClientInput] = useState("");
    const [client, setClient] = useState<{ id: number; nome: string } | null>(null);
    const [clientAccesses, setClientAccesses] = useState<IAcessoProduto[]>([]);
    const [clientProductDraft, setClientProductDraft] = useState<number[]>([]);
    const [validatingClient, setValidatingClient] = useState(false);
    const [reconciling, setReconciling] = useState(false);
    const [salesReconciled, setSalesReconciled] = useState(false);
    const [fileTitle, setFileTitle] = useState("");
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploadFiles, setUploadFiles] = useState<ILibraryUploadFile[]>([]);
    const [linkTitle, setLinkTitle] = useState("");
    const [linkUrl, setLinkUrl] = useState("");
    const [folderName, setFolderName] = useState("");
    const [replacingItem, setReplacingItem] = useState<IItemBiblioteca | null>(null);
    const [editingLink, setEditingLink] = useState<IItemBiblioteca | null>(null);
    const [deactivatingLibrary, setDeactivatingLibrary] = useState<IBiblioteca | null>(null);
    const [folderAction, setFolderAction] = useState<{ type: "rename" | "delete"; folder: IPastaBiblioteca } | null>(null);
    const [folderActionError, setFolderActionError] = useState("");
    const [previewItem, setPreviewItem] = useState<IItemBiblioteca | null>(null);
    const [previewUrl, setPreviewUrl] = useState("");
    const [previewLoading, setPreviewLoading] = useState(false);
    const previewObjectUrl = useRef<string | null>(null);
    const previewRequest = useRef(0);
    const clientRequest = useRef(0);
    const libraryRequest = useRef(0);

    const openLibrary = useMemo(
        () => libraries.find((library) => library.id === openLibraryId) ?? null,
        [libraries, openLibraryId]
    );
    const openFolder = useMemo(
        () => folders.find((folder) => folder.id === openFolderId) ?? null,
        [folders, openFolderId]
    );

    const loadLibraries = useCallback(async () => {
        const requestId = ++libraryRequest.current;
        setLoading(true);
        setError("");
        try {
            const result = await listLibraries(clientId);
            if (requestId !== libraryRequest.current) return;
            setLibraries(result);
            setOpenLibraryId((current) => current != null && !result.some((library) => library.id === current)
                ? null : current);
        } catch (loadError) {
            if (requestId !== libraryRequest.current) return;
            setLibraries([]);
            setOpenLibraryId(null);
            setOpenFolderId(null);
            setFolders([]);
            setItems([]);
            setError(errorMessage(loadError));
        } finally {
            if (requestId === libraryRequest.current) setLoading(false);
        }
    }, [clientId]);

    useEffect(() => {
        let active = true;
        const userId = localStorage.getItem("userID");
        if (!userId) {
            setUserRole("CLIENTE");
            return () => { active = false; };
        }
        http.get<IUser>(`usuarios/${encodeURIComponent(userId)}`, {
            headers: libraryAuthHeaders(),
        }).then(({ data }) => {
            if (active) {
                setUserRole(data.papel);
                setIsStaff(mode === "admin" && data.papel === "ADMIN");
            }
        }).catch((roleError: unknown) => {
            if (active) {
                setUserRole("");
                setIsStaff(false);
                setLoading(false);
                setError(errorMessage(roleError));
            }
        });
        return () => { active = false; };
    }, [mode]);

    useEffect(() => {
        if (userRole === null || (mode === "admin" && userRole !== "ADMIN")
            || (mode === "consulta" && clientId == null)) return;
        void loadLibraries();
        return () => { libraryRequest.current += 1; };
    }, [clientId, loadLibraries, mode, userRole]);

    useEffect(() => {
        if (!isStaff) return;
        let active = true;
        setStorageLoading(true);
        setStorageError("");
        getLibraryStorageStatus().then((state) => {
            if (active) setStorageState(state);
        }).catch((statusError: unknown) => {
            if (active) setStorageError(errorMessage(statusError));
        }).finally(() => {
            if (active) setStorageLoading(false);
        });
        http.get<IProductResponse>("produtos?size=500", {
            headers: libraryAuthHeaders(),
        }).then(({ data }) => {
            if (active) setProducts(data.content ?? []);
        }).catch((loadError: unknown) => {
            if (active) setError(errorMessage(loadError));
        }).finally(() => {
            if (active) setProductsLoading(false);
        });
        setProductsLoading(true);
        return () => { active = false; };
    }, [isStaff]);

    useEffect(() => {
        if (openLibraryId == null) {
            setFolders([]);
            setItems([]);
            setOpenFolderId(null);
            return;
        }
        let active = true;
        setItemsLoading(true);
        setError("");
        Promise.all([
            listLibraryFolders(openLibraryId, clientId),
            listLibraryItems(openLibraryId, clientId, openFolderId ?? undefined),
        ]).then(([nextFolders, nextItems]) => {
            if (active) {
                setFolders(nextFolders);
                setItems(nextItems);
            }
        }).catch((loadError: unknown) => {
            if (active) {
                setFolders([]);
                setItems([]);
                setError(errorMessage(loadError));
            }
        }).finally(() => {
            if (active) setItemsLoading(false);
        });
        return () => { active = false; };
    }, [clientId, openFolderId, openLibraryId, refreshKey]);

    useEffect(() => () => {
        previewRequest.current += 1;
        if (previewObjectUrl.current) URL.revokeObjectURL(previewObjectUrl.current);
    }, []);

    const refreshContents = () => setRefreshKey((value) => value + 1);
    const closeDialog = () => {
        if (busy || provisioning || reconciling) return;
        setDialog(null);
        setFormError("");
    };

    const startDialog = (name: Exclude<DialogName, null>) => {
        setFormError("");
        setDialog(name);
        if (name === "library") {
            setNewName("");
            setNewDescription("");
        } else if (name === "products" && openLibrary) {
            setLibraryProductDraft(openLibrary.produtoIds ?? []);
        } else if (name === "concessions") {
            clientRequest.current += 1;
            setClientInput(cliforId == null ? "" : String(cliforId));
            setClient(null);
            setClientAccesses([]);
            setClientProductDraft([]);
            setSalesReconciled(false);
        } else if (name === "file" || name === "link" || name === "folder") {
            setFileTitle("");
            setSelectedFile(null);
            setUploadFiles([]);
            setLinkTitle("");
            setLinkUrl("");
            setFolderName("");
        }
    };

    const handleCreateLibrary = async () => {
        if (!newName.trim()) {
            setFormError("Informe o nome da biblioteca.");
            return;
        }
        setBusy(true);
        setFormError("");
        try {
            const created = await createLibrary(newName.trim(), newDescription.trim());
            setLibraries((current) => [...current, created]);
            setOpenLibraryId(created.id);
            setOpenFolderId(null);
            setDialog(null);
            setNotice("Biblioteca criada.");
        } catch (createError) {
            setFormError(errorMessage(createError));
        } finally {
            setBusy(false);
        }
    };

    const loadStorageStatus = async () => {
        setStorageLoading(true);
        setStorageError("");
        try {
            setStorageState(await getLibraryStorageStatus());
        } catch (statusError) {
            setStorageError(errorMessage(statusError));
        } finally {
            setStorageLoading(false);
        }
    };

    const handleProvisionStorage = async () => {
        setProvisioning(true);
        setFormError("");
        setStorageError("");
        try {
            await provisionLibraryStorage();
            const state = await getLibraryStorageStatus();
            setStorageState(state);
            if (state === "PRONTO") setNotice("Armazenamento compartilhado pronto.");
            else if (dialog) setFormError("A ativação ainda está pendente. Você pode tentar novamente.");
            else setStorageError("A ativação ainda está pendente. Você pode tentar novamente.");
        } catch (provisionError) {
            const message = errorMessage(provisionError);
            if (dialog) setFormError(message);
            else setStorageError(message);
        } finally {
            setProvisioning(false);
        }
    };

    const handleSaveLibraryProducts = async () => {
        if (!openLibrary) return;
        setBusy(true);
        setFormError("");
        try {
            await setLibraryProducts(openLibrary.id, libraryProductDraft);
            setLibraries((current) => current.map((library) => library.id === openLibrary.id
                ? { ...library, produtoIds: libraryProductDraft } : library));
            setDialog(null);
            setNotice("Produtos da biblioteca atualizados.");
        } catch (saveError) {
            setFormError(errorMessage(saveError));
        } finally {
            setBusy(false);
        }
    };

    const validateClient = async () => {
        const id = Number(clientInput);
        if (!Number.isSafeInteger(id) || id < 1) {
            setFormError("Informe um ID de cliente válido.");
            return;
        }
        const requestId = ++clientRequest.current;
        setValidatingClient(true);
        setFormError("");
        try {
            const { data } = await http.get<{ nomesocial: string; clifor: string }>(`clifor/${id}`, {
                headers: libraryAuthHeaders(),
            });
            if (requestId !== clientRequest.current) return;
            if (!["CLIENTE", "CLIFOR"].includes(data.clifor)) {
                setFormError("O cadastro informado não é um cliente.");
                return;
            }
            const accessResponse = await getClientProducts(id);
            if (requestId !== clientRequest.current) return;
            const accesses = accessResponse.acessos ?? [];
            setClient({ id, nome: data.nomesocial });
            setClientAccesses(accesses);
            setClientProductDraft(accesses
                .filter((access) => statusAcesso(access.status) === "ACTIVE")
                .map((access) => access.produtoId));
        } catch (validationError) {
            if (requestId === clientRequest.current) setFormError(errorMessage(validationError));
        } finally {
            if (requestId === clientRequest.current) setValidatingClient(false);
        }
    };

    const handleSaveClientProducts = async () => {
        if (!client) return;
        setBusy(true);
        setFormError("");
        try {
            const response = await setClientProducts(client.id, clientProductDraft.map((produtoId) => ({ produtoId })));
            const accesses = response.acessos ?? [];
            setClientAccesses(accesses);
            setClientProductDraft(accesses
                .filter((access) => statusAcesso(access.status) === "ACTIVE")
                .map((access) => access.produtoId));
            setDialog(null);
            setNotice("Concessões atualizadas.");
            await loadLibraries();
        } catch (saveError) {
            setFormError(errorMessage(saveError));
        } finally {
            setBusy(false);
        }
    };

    const handleReconcileSales = async () => {
        if (!client) return;
        setReconciling(true);
        setFormError("");
        setSalesReconciled(false);
        try {
            await reconcileClientSales(client.id);
            const response = await getClientProducts(client.id);
            const accesses = response.acessos ?? [];
            setClientAccesses(accesses);
            setClientProductDraft(accesses
                .filter((access) => statusAcesso(access.status) === "ACTIVE")
                .map((access) => access.produtoId));
            setSalesReconciled(true);
            await loadLibraries();
        } catch (reconcileError) {
            setFormError(errorMessage(reconcileError));
        } finally {
            setReconciling(false);
        }
    };

    const handleCreateFolder = async () => {
        if (!openLibrary || !folderName.trim()) {
            setFormError("Informe o nome da pasta.");
            return;
        }
        setBusy(true);
        setFormError("");
        try {
            await createLibraryFolder(openLibrary.id, folderName.trim());
            setDialog(null);
            setNotice("Pasta criada.");
            refreshContents();
        } catch (createError) {
            setFormError(errorMessage(createError));
        } finally {
            setBusy(false);
        }
    };

    const openFolderAction = (type: "rename" | "delete", folder: IPastaBiblioteca) => {
        if (busy) return;
        setFolderActionError("");
        setFolderAction({ type, folder });
    };

    const closeFolderAction = () => {
        if (busy) return;
        setFolderAction(null);
        setFolderActionError("");
    };

    const handleRenameFolder = async (nome: string) => {
        if (!openLibrary || folderAction?.type !== "rename" || busy) return;
        const target = folderAction.folder;
        setBusy(true);
        setFolderActionError("");
        try {
            const updated = await renameLibraryFolder(openLibrary.id, target.id, nome);
            const newName = updated?.nome || nome;
            setFolders((current) => current.map((folder) => folder.id === target.id ? { ...folder, nome: newName } : folder));
            setFolderAction(null);
            setNotice("Pasta renomeada.");
            refreshContents();
        } catch (renameError) {
            setFolderActionError(errorMessage(renameError));
        } finally {
            setBusy(false);
        }
    };

    const handleDeleteFolder = async () => {
        if (!openLibrary || folderAction?.type !== "delete" || busy) return;
        const target = folderAction.folder;
        setBusy(true);
        setFolderActionError("");
        try {
            await deleteLibraryFolder(openLibrary.id, target.id);
            setFolderAction(null);
            setFolders((current) => current.filter((folder) => folder.id !== target.id));
            if (openFolderId === target.id) setOpenFolderId(null);
            setNotice("Pasta excluída.");
            refreshContents();
        } catch (deleteError) {
            setFolderActionError(errorMessage(deleteError));
        } finally {
            setBusy(false);
        }
    };

    const handleUpload = async () => {
        if (!openLibrary || uploadFiles.length === 0) {
            setFormError("Selecione pelo menos um arquivo.");
            return;
        }
        const filesToUpload = uploadFiles
            .map((entry, index) => ({ entry, index }))
            .filter(({ entry }) => entry.status === "pending" || (entry.status === "failed" && entry.retryable));
        if (filesToUpload.length === 0) return;
        const libraryId = openLibrary.id;
        const folderId = openFolderId ?? undefined;
        setBusy(true);
        setFormError("");
        let uploadedCount = 0;
        let requestFailed = false;
        for (const { entry, index } of filesToUpload) {
            setUploadFiles((current) => current.map((item, itemIndex) => itemIndex === index
                ? { ...item, status: "uploading", error: undefined } : item));
            try {
                await uploadLibraryFile(libraryId, entry.file, entry.file.name, folderId);
                uploadedCount += 1;
                setUploadFiles((current) => current.map((item, itemIndex) => itemIndex === index
                    ? { ...item, status: "uploaded", retryable: false, error: undefined } : item));
            } catch (uploadError) {
                requestFailed = true;
                setUploadFiles((current) => current.map((item, itemIndex) => itemIndex === index
                    ? { ...item, status: "failed", retryable: true, error: errorMessage(uploadError) } : item));
            }
        }
        setBusy(false);
        if (uploadedCount > 0) refreshContents();
        const validationFailed = uploadFiles.some((entry) => entry.status === "failed" && !entry.retryable);
        if (!validationFailed && !requestFailed) {
            setDialog(null);
            setNotice(uploadedCount === 1 ? "Arquivo publicado." : `${uploadedCount} arquivos publicados.`);
        }
    };

    const handleSelectUploadFiles = (files: FileList | null) => {
        if (!files) return;
        setFormError("");
        setUploadFiles(Array.from(files, (file) => {
            if (!isSupportedLibraryFile(file)) {
                return { file, status: "failed", retryable: false,
                    error: "Formato não suportado. Envie PDF, PNG, JPEG, WEBP, DOC, DOCX, XLS, XLSX, PPT ou PPTX." };
            }
            if (file.size > maxLibraryFileSize) {
                return { file, status: "failed", retryable: false, error: "O arquivo excede o limite de 10 MB." };
            }
            return { file, status: "pending", retryable: false };
        }));
    };

    const handleAddLink = async () => {
        const safeUrl = approvedExternalUrl(linkUrl.trim());
        if (!openLibrary || !linkTitle.trim() || !safeUrl) {
            setFormError("Informe um título e uma URL válida começando com http:// ou https://, sem credenciais.");
            return;
        }
        setBusy(true);
        setFormError("");
        try {
            await addLibraryLink(openLibrary.id, linkTitle.trim(), safeUrl, openFolderId ?? undefined);
            setDialog(null);
            setNotice("Link publicado.");
            refreshContents();
        } catch (linkError) {
            setFormError(errorMessage(linkError));
        } finally {
            setBusy(false);
        }
    };

    const handleReplaceFile = async () => {
        if (!openLibrary || !replacingItem || !selectedFile || !fileTitle.trim()) {
            setFormError("Informe o título e selecione o arquivo substituto.");
            return;
        }
        if (!isSupportedLibraryFile(selectedFile)) {
            setFormError("Formato não suportado. Envie PDF, PNG, JPEG, WEBP, DOC, DOCX, XLS, XLSX, PPT ou PPTX.");
            return;
        }
        setBusy(true);
        setFormError("");
        try {
            await replaceLibraryFile(openLibrary.id, replacingItem.id, selectedFile, fileTitle.trim());
            setDialog(null);
            setReplacingItem(null);
            setNotice("Arquivo substituído.");
            refreshContents();
        } catch (replaceError) {
            setFormError(errorMessage(replaceError));
        } finally {
            setBusy(false);
        }
    };

    const startReplace = (item: IItemBiblioteca) => {
        setReplacingItem(item);
        setFileTitle(item.titulo);
        setSelectedFile(null);
        startDialog("replace");
    };

    const startEditLink = (item: IItemBiblioteca) => {
        setEditingLink(item);
        setLinkTitle(item.titulo);
        setLinkUrl(item.linkExterno ?? "");
        startDialog("edit-link");
    };

    const handleUpdateLink = async () => {
        const safeUrl = approvedExternalUrl(linkUrl.trim());
        if (!openLibrary || !editingLink || !linkTitle.trim() || !safeUrl) {
            setFormError("Informe um título e uma URL válida começando com http:// ou https://, sem credenciais.");
            return;
        }
        setBusy(true);
        setFormError("");
        try {
            await updateLibraryLink(openLibrary.id, editingLink.id, linkTitle.trim(), safeUrl);
            setDialog(null);
            setEditingLink(null);
            setNotice("Link atualizado.");
            refreshContents();
        } catch (updateError) {
            setFormError(errorMessage(updateError));
        } finally {
            setBusy(false);
        }
    };

    const handleWithdraw = async (item: IItemBiblioteca) => {
        if (!openLibrary) return;
        setBusy(true);
        setError("");
        try {
            await withdrawLibraryItem(openLibrary.id, item.id);
            setNotice("Material retirado.");
            refreshContents();
        } catch (withdrawError) {
            setError(errorMessage(withdrawError));
        } finally {
            setBusy(false);
        }
    };

    const handleDeactivateLibrary = async () => {
        if (!deactivatingLibrary) return;
        setBusy(true);
        setFormError("");
        try {
            await deactivateLibrary(deactivatingLibrary.id);
            setDialog(null);
            setOpenLibraryId(null);
            setOpenFolderId(null);
            setDeactivatingLibrary(null);
            await loadLibraries();
            setNotice("Biblioteca desativada.");
        } catch (deactivateError) {
            setFormError(errorMessage(deactivateError));
        } finally {
            setBusy(false);
        }
    };

    const openPreview = async (item: IItemBiblioteca) => {
        if (!openLibrary || !isPreviewable(item)) return;
        const requestId = ++previewRequest.current;
        setError("");
        setPreviewItem(item);
        setPreviewUrl("");
        setPreviewLoading(true);
        try {
            const blob = await getLibraryItemContent(openLibrary.id, item.id, clientId);
            if (requestId !== previewRequest.current) return;
            if (previewObjectUrl.current) URL.revokeObjectURL(previewObjectUrl.current);
            previewObjectUrl.current = URL.createObjectURL(blob);
            setPreviewUrl(previewObjectUrl.current);
        } catch (previewError) {
            if (requestId === previewRequest.current) {
                setPreviewItem(null);
                setError(errorMessage(previewError));
            }
        } finally {
            if (requestId === previewRequest.current) setPreviewLoading(false);
        }
    };

    const closePreview = () => {
        previewRequest.current += 1;
        setPreviewItem(null);
        setPreviewUrl("");
        if (previewObjectUrl.current) {
            URL.revokeObjectURL(previewObjectUrl.current);
            previewObjectUrl.current = null;
        }
    };

    const toggle = (current: number[], id: number) =>
        current.includes(id) ? current.filter((value) => value !== id) : [...current, id];

    const storageNeedsAction = storageState === "NAO_PROVISIONADO" || storageState === "ATIVACAO_PENDENTE";
    const modalTitle = openFolder ? openFolder.nome : openLibrary?.nome ?? "";
    const adminView = mode === "admin";

    return (
        <Box sx={{
            mt: 2, p: adminView ? { xs: 2, sm: 3 } : { xs: 1, sm: 2 },
            border: "1px solid rgba(20, 20, 20, 0.16)", borderRadius: adminView ? "20px" : 2,
            ...(adminView && {
                bgcolor: "rgba(255,255,255,0.72)", boxShadow: "0 16px 48px rgba(20, 20, 20, 0.06)",
                "& .MuiTypography-root, & .MuiButton-root": { overflowWrap: "anywhere" },
            }),
        }}>
            <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ xs: "stretch", sm: "center" }}
                justifyContent="space-between" gap={2} sx={{ mb: adminView ? 3 : 1 }}>
                <Box>
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                        <Typography variant="h6" component={adminView ? "h2" : "h6"}
                            sx={{ color: "#141414" }}>Bibliotecas</Typography>
                        {adminView && !loading && userRole === "ADMIN" && (
                            <Chip label={`${libraries.length} ${libraries.length === 1 ? "biblioteca" : "bibliotecas"}`}
                                size="small" sx={{ bgcolor: "rgba(20, 20, 20, 0.06)", color: "primary.main" }} />
                        )}
                    </Stack>
                    {adminView && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            Seu acervo de documentos e recursos, organizado em um só lugar.
                        </Typography>
                    )}
                </Box>
                {adminView && !loading && isStaff && (
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                        <Button variant="contained" disabled={busy} onClick={() => startDialog("library")}
                            startIcon={adminView ? <AddOutlinedIcon /> : undefined}>
                            Nova biblioteca
                        </Button>
                        <Button variant="outlined" disabled={busy} onClick={() => startDialog("concessions")}
                            startIcon={adminView ? <PeopleOutlineIcon /> : undefined}>
                            Concessões de clientes
                        </Button>
                    </Stack>
                )}
            </Stack>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {notice && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setNotice("")}>{notice}</Alert>}
            {userRole === "" ? null : mode === "admin" && !isStaff && userRole !== null ? (
                <Alert severity="error">A gestão de bibliotecas requer perfil ADMIN.</Alert>
            ) : loading ? (
                <CircularProgress aria-label="Carregando bibliotecas" />
            ) : (
                <>
                    {!adminView && isStaff && (
                        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mb: 2 }}>
                            <Button variant="contained" disabled={busy} onClick={() => startDialog("library")}>
                                Nova biblioteca
                            </Button>
                            <Button variant="outlined" disabled={busy} onClick={() => startDialog("concessions")}>
                                Concessões de clientes
                            </Button>
                        </Stack>
                    )}
                    {isStaff && storageLoading && <CircularProgress aria-label="Verificando armazenamento" />}
                    {isStaff && storageError && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {storageError}
                            <Button size="small" disabled={storageLoading} onClick={() => void loadStorageStatus()}>
                                Verificar novamente
                            </Button>
                        </Alert>
                    )}
                    {isStaff && storageNeedsAction && (
                        <Alert severity="warning" sx={{ mb: 2 }}>
                            {storageState === "ATIVACAO_PENDENTE"
                                ? "O armazenamento compartilhado aguarda ativação."
                                : "O armazenamento compartilhado ainda não foi provisionado."}
                            <Button
                                size="small"
                                disabled={busy || provisioning}
                                onClick={() => void handleProvisionStorage()}
                            >
                                {provisioning ? "Configurando..." : storageState === "ATIVACAO_PENDENTE"
                                    ? "Tentar ativar armazenamento" : "Provisionar armazenamento"}
                            </Button>
                        </Alert>
                    )}
                    {libraries.length === 0 ? (
                        <Typography role="status" sx={adminView ? {
                            p: { xs: 3, sm: 6 }, textAlign: "center", border: "1px dashed",
                            borderColor: "divider", borderRadius: 3, bgcolor: "rgba(255,255,255,0.5)",
                            color: "text.secondary",
                        } : undefined}>{mode === "admin"
                            ? "Nenhuma biblioteca cadastrada."
                            : "Nenhuma biblioteca disponível para este cliente."}</Typography>
                    ) : openLibrary == null ? (
                        <Box
                            sx={{
                                display: "grid",
                                gridTemplateColumns: adminView
                                    ? { xs: "minmax(0, 1fr)", sm: "repeat(2, minmax(0, 1fr))", lg: "repeat(3, minmax(0, 1fr))" }
                                    : "repeat(auto-fit, minmax(min(100%, 220px), 1fr))",
                                gap: 2,
                            }}
                        >
                            {libraries.map((library) => (
                                <Card key={library.id} variant="outlined" sx={adminView ? {
                                    borderColor: "divider",
                                    transition: "border-color 160ms ease, box-shadow 160ms ease",
                                    "&:hover": { borderColor: "primary.main", boxShadow: "0 8px 24px rgba(20, 20, 20, 0.08)" },
                                    "@media (prefers-reduced-motion: reduce)": { transition: "none" },
                                } : undefined}>
                                    <CardActionArea
                                        aria-label={`Abrir biblioteca ${library.nome}`}
                                        disabled={busy}
                                        sx={adminView ? { height: "100%", display: "flex", alignItems: "stretch" } : undefined}
                                        onClick={() => {
                                            setOpenLibraryId(library.id);
                                            setOpenFolderId(null);
                                        }}
                                    >
                                        <CardContent sx={{
                                            display: "flex", alignItems: adminView ? "flex-start" : "center", gap: 2,
                                            ...(adminView && { flexDirection: "column", p: 3, minHeight: 220, width: "100%", boxSizing: "border-box" }),
                                        }}>
                                            {adminView ? (
                                                <Box sx={{ display: "grid", placeItems: "center", width: 48, height: 48,
                                                    bgcolor: "#eeeeee", color: "primary.main", borderRadius: "12px" }}>
                                                    <FolderOutlinedIcon fontSize="large" aria-hidden="true" />
                                                </Box>
                                            ) : <FolderOutlinedIcon color="primary" fontSize="large" aria-hidden="true" />}
                                            <Box sx={{ minWidth: 0 }}>
                                                <Typography variant="subtitle1" component={adminView ? "h3" : "h6"}>{library.nome}</Typography>
                                                {library.descricao && (
                                                    <Typography variant="body2" color="text.secondary" sx={{ mt: adminView ? 0.5 : 0 }}>
                                                        {library.descricao}
                                                    </Typography>
                                                )}
                                            </Box>
                                            {adminView && (
                                                <Stack direction="row" alignItems="center" justifyContent="space-between"
                                                    sx={{ width: "100%", mt: "auto", pt: 1, color: "primary.main" }}>
                                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>Explorar biblioteca</Typography>
                                                    <ArrowForwardOutlinedIcon fontSize="small" aria-hidden="true" />
                                                </Stack>
                                            )}
                                        </CardContent>
                                    </CardActionArea>
                                </Card>
                            ))}
                        </Box>
                    ) : (
                        <>
                            <Stack component={adminView ? "nav" : "div"}
                                aria-label={adminView ? "Navegação da biblioteca" : undefined}
                                direction="row" flexWrap="wrap" alignItems="center" gap={1} sx={{
                                    mb: 2, ...(adminView && {
                                        p: 1, bgcolor: "rgba(20, 20, 20, 0.04)", borderRadius: 2,
                                        "& [aria-current]": { fontWeight: 600, px: 1 },
                                    }),
                                }}>
                                <Button disabled={busy} onClick={() => {
                                    setOpenLibraryId(null);
                                    setOpenFolderId(null);
                                }}>
                                    Bibliotecas
                                </Button>
                                {openFolder && (
                                    <>
                                        <Typography aria-hidden="true">/</Typography>
                                        <Button disabled={busy} onClick={() => setOpenFolderId(null)}>Raiz</Button>
                                        <Typography aria-hidden="true">/</Typography>
                                        <Typography aria-current="page">{openFolder.nome}</Typography>
                                        {isStaff && (
                                            <FolderActionButtons
                                                name={openFolder.nome}
                                                disabled={busy || itemsLoading}
                                                onRename={() => openFolderAction("rename", openFolder)}
                                                onDelete={() => openFolderAction("delete", openFolder)}
                                            />
                                        )}
                                    </>
                                )}
                                {!openFolder && <Typography aria-current="page">{openLibrary.nome}</Typography>}
                            </Stack>
                            {openLibrary.descricao && !openFolder && (
                                <Typography sx={{ mb: 1 }}>{openLibrary.descricao}</Typography>
                            )}
                            {isStaff && (
                                <Stack direction="row" flexWrap="wrap" gap={1} sx={{
                                    mb: 2, ...(adminView && {
                                        pb: 2, borderBottom: "1px solid", borderColor: "divider",
                                        "& .MuiButton-root": { flexGrow: { xs: 1, sm: 0 } },
                                    }),
                                }}>
                                    <Button variant="outlined" disabled={busy} onClick={() => startDialog("products")}>
                                        Produtos que liberam esta biblioteca
                                    </Button>
                                    <Button variant={adminView ? "contained" : "outlined"} disabled={busy || storageState !== "PRONTO"}
                                        startIcon={adminView ? <CloudUploadOutlinedIcon /> : undefined}
                                        onClick={() => startDialog("file")}>
                                        Publicar arquivo
                                    </Button>
                                    <Button variant="outlined" disabled={busy} onClick={() => startDialog("link")}
                                        startIcon={adminView ? <LinkOutlinedIcon /> : undefined}>
                                        Publicar link
                                    </Button>
                                    {!openFolder && (
                                        <Button variant="outlined" disabled={busy} onClick={() => startDialog("folder")}
                                            startIcon={adminView ? <CreateNewFolderOutlinedIcon /> : undefined}>
                                            Criar pasta
                                        </Button>
                                    )}
                                    <Button
                                        color="error"
                                        variant={adminView ? "text" : "outlined"}
                                        sx={adminView ? { ml: { sm: "auto" } } : undefined}
                                        disabled={busy}
                                        onClick={() => {
                                            setDeactivatingLibrary(openLibrary);
                                            startDialog("deactivate");
                                        }}
                                    >
                                        Desativar biblioteca
                                    </Button>
                                </Stack>
                            )}
                            {itemsLoading ? (
                                <CircularProgress aria-label="Carregando conteúdo" />
                            ) : (
                                <Stack spacing={1}>
                                    {!openFolder && folders.map((folder) => (
                                        <Card key={folder.id} variant="outlined" sx={isStaff ? {
                                            display: "flex", alignItems: "center", pr: 1,
                                            ...(adminView && { bgcolor: "#f7f7f7" }),
                                        } : undefined}>
                                            <CardActionArea
                                                aria-label={`Abrir pasta ${folder.nome}`}
                                                disabled={busy}
                                                onClick={() => setOpenFolderId(folder.id)}
                                            >
                                                <CardContent sx={{
                                                    display: "flex", alignItems: "center", gap: 1.5, py: adminView ? 1.5 : 1,
                                                    ...(adminView && { bgcolor: "#f7f7f7" }),
                                                }}>
                                                    <FolderOutlinedIcon color="primary" aria-hidden="true" />
                                                    <Typography sx={{ overflowWrap: "anywhere", minWidth: 0 }}>{folder.nome}</Typography>
                                                    {adminView && <ArrowForwardOutlinedIcon fontSize="small" aria-hidden="true"
                                                        sx={{ ml: "auto", color: "text.secondary", flexShrink: 0 }} />}
                                                </CardContent>
                                            </CardActionArea>
                                            {isStaff && (
                                                <FolderActionButtons
                                                    name={folder.nome}
                                                    disabled={busy}
                                                    onRename={() => openFolderAction("rename", folder)}
                                                    onDelete={() => openFolderAction("delete", folder)}
                                                />
                                            )}
                                        </Card>
                                    ))}
                                    {items.map((item) => {
                                        const externalUrl = item.tipo === "LINK_EXTERNO" && item.linkExterno
                                            ? approvedExternalUrl(item.linkExterno) : null;
                                        return (
                                            <Box
                                                key={item.id}
                                                sx={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: 1,
                                                    flexWrap: "wrap",
                                                    borderBottom: "1px solid rgba(0,0,0,.08)",
                                                    py: 1,
                                                    ...(adminView && {
                                                        p: 1.5, bgcolor: "background.paper", border: "1px solid",
                                                        borderColor: "divider", borderRadius: 2,
                                                        "& > .MuiButton-root:first-of-type, & > .MuiTypography-root:first-of-type": {
                                                            mr: "auto", minWidth: 0, maxWidth: "100%", textAlign: "left",
                                                        },
                                                    }),
                                                }}
                                            >
                                                {isPreviewable(item) ? (
                                                    <Button
                                                        startIcon={itemIcon(item)}
                                                        disabled={busy}
                                                        onClick={() => void openPreview(item)}
                                                    >
                                                        {item.titulo}
                                                    </Button>
                                                ) : externalUrl ? (
                                                    <Button
                                                        startIcon={itemIcon(item)}
                                                        component="a"
                                                        href={externalUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                    >
                                                        {item.titulo}
                                                    </Button>
                                                ) : (
                                                    <Typography sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                                        {itemIcon(item)}{item.titulo}
                                                    </Typography>
                                                )}
                                                {adminView && (
                                                    <Chip size="small" variant="outlined" sx={{ color: "text.secondary", flexShrink: 0 }}
                                                        label={item.tipo === "LINK_EXTERNO" ? "Link externo"
                                                            : item.contentType === "application/pdf" ? "PDF"
                                                                : item.contentType?.startsWith("image/") ? "Imagem" : "Arquivo"} />
                                                )}
                                                {externalUrl && (
                                                    <Typography variant="caption" color="text.secondary">
                                                        Abre fora do sistema; o acesso depende das permissões do site de destino.
                                                    </Typography>
                                                )}
                                                {isStaff && (
                                                    <>
                                                        {item.tipo === "LINK_EXTERNO" && (
                                                            <Button size="small" disabled={busy}
                                                                onClick={() => startEditLink(item)}
                                                                aria-label={`Editar ${item.titulo}`}>
                                                                Editar link
                                                            </Button>
                                                        )}
                                                        {item.tipo === "ARQUIVO" && (
                                                            <Button size="small" disabled={busy}
                                                                onClick={() => startReplace(item)}
                                                                aria-label={`Substituir ${item.titulo}`}>
                                                                Substituir
                                                            </Button>
                                                        )}
                                                        <Button size="small" color="error" disabled={busy}
                                                            onClick={() => void handleWithdraw(item)}
                                                            aria-label={`Retirar ${item.titulo}`}>
                                                            Retirar
                                                        </Button>
                                                    </>
                                                )}
                                            </Box>
                                        );
                                    })}
                                    {folders.length === 0 && items.length === 0 && (
                                        <Typography role="status" sx={adminView ? {
                                            textAlign: "center", p: 4, color: "text.secondary",
                                            border: "1px dashed", borderColor: "divider", borderRadius: 3,
                                        } : undefined}>
                                            {openFolder ? "Esta pasta ainda não possui materiais."
                                                : "Esta biblioteca ainda não possui pastas ou materiais."}
                                        </Typography>
                                    )}
                                </Stack>
                            )}
                        </>
                    )}
                </>
            )}

            <Dialog open={dialog === "library"} onClose={closeDialog} fullWidth maxWidth="sm">
                <DialogTitle>Nova biblioteca</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ pt: 1 }}>
                        <TextField autoFocus label="Nome" value={newName}
                            onChange={(event) => setNewName(event.target.value)} />
                        <TextField label="Descrição" value={newDescription} multiline minRows={2}
                            onChange={(event) => setNewDescription(event.target.value)} />
                        {storageNeedsAction && (
                            <Alert severity="warning">
                                O armazenamento é compartilhado por todas as bibliotecas.
                                <Button size="small" disabled={provisioning || busy}
                                    onClick={() => void handleProvisionStorage()}>
                                    {provisioning ? "Configurando..." : storageState === "ATIVACAO_PENDENTE"
                                        ? "Tentar ativar" : "Provisionar"}
                                </Button>
                            </Alert>
                        )}
                        {formError && <Alert severity="error">{formError}</Alert>}
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button disabled={busy || provisioning} onClick={closeDialog}>Cancelar</Button>
                    <Button variant="contained" disabled={busy || provisioning} onClick={() => void handleCreateLibrary()}>
                        {busy ? "Salvando..." : "Salvar"}
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog open={dialog === "products"} onClose={closeDialog} fullWidth maxWidth="sm">
                <DialogTitle>Produtos que liberam {openLibrary?.nome}</DialogTitle>
                <DialogContent>
                    <Stack spacing={0}>
                        {productsLoading && <CircularProgress aria-label="Carregando produtos" />}
                        {products.map((product) => {
                            const id = Number(product.id);
                            if (!Number.isSafeInteger(id) || id < 1) return null;
                            return (
                                <FormControlLabel key={id} sx={{ display: "flex", ml: 0, py: 0.5 }}
                                    control={<Checkbox checked={libraryProductDraft.includes(id)}
                                        onChange={() => setLibraryProductDraft((current) => toggle(current, id))} />}
                                    label={`${product.nome} (${id})`} />
                            );
                        })}
                    </Stack>
                    {formError && <Alert severity="error" sx={{ mt: 2 }}>{formError}</Alert>}
                </DialogContent>
                <DialogActions>
                    <Button disabled={busy} onClick={closeDialog}>Cancelar</Button>
                    <Button variant="contained" disabled={busy} onClick={() => void handleSaveLibraryProducts()}>
                        {busy ? "Salvando..." : "Salvar"}
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog open={dialog === "concessions"} onClose={closeDialog} fullWidth maxWidth="sm">
                <DialogTitle>Concessões de clientes</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ pt: 1 }}>
                        <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                            <TextField fullWidth label="ID do cliente" value={clientInput}
                                inputProps={{ inputMode: "numeric" }}
                                onChange={(event) => {
                                    clientRequest.current += 1;
                                setValidatingClient(false);
                                setClientInput(event.target.value);
                                    setClient(null);
                                    setClientAccesses([]);
                                    setClientProductDraft([]);
                                    setSalesReconciled(false);
                                    setFormError("");
                                }} />
                            <Button disabled={validatingClient || busy} onClick={() => void validateClient()}>
                                {validatingClient ? "Buscando..." : "Buscar"}
                            </Button>
                        </Stack>
                        {client && <Typography>{client.nome} (ID {client.id})</Typography>}
                        {client && (
                            <>
                                <Typography variant="subtitle1">Produtos e situação</Typography>
                                <Stack spacing={0}>
                                        {productsLoading && <CircularProgress aria-label="Carregando produtos" />}
                                        {products.map((product) => {
                                        const id = Number(product.id);
                                        if (!Number.isSafeInteger(id) || id < 1) return null;
                                        const access = clientAccesses.find((entry) => entry.produtoId === id);
                                        const checked = clientProductDraft.includes(id);
                                        return (
                                            <Box key={id} sx={{ borderBottom: "1px solid rgba(0,0,0,.08)", py: 0.75 }}>
                                                <FormControlLabel sx={{ display: "flex", ml: 0 }}
                                                    control={<Checkbox checked={checked} disabled={busy || reconciling}
                                                        onChange={() => setClientProductDraft((current) => toggle(current, id))} />}
                                                    label={`${product.nome} (${id})${product.duracaoAcessoQuantidade
                                                        ? ` · prazo padrão: ${formatDuracaoAcesso(product.duracaoAcessoQuantidade, product.duracaoAcessoUnidade)}`
                                                        : ""}`} />
                                                {access && (
                                                    <Typography variant="body2" color="text.secondary" sx={{ pl: 4.5 }}>
                                                        Status: {statusAcesso(access.status)} · Início: {dataAcesso(access.inicio, "sem início")}
                                                        {" · "}Fim: {dataAcesso(access.fim, "sem expiração")}
                                                    </Typography>
                                                )}
                                            </Box>
                                        );
                                    })}
                                </Stack>
                                <Button variant="outlined" disabled={busy || reconciling}
                                    onClick={() => void handleReconcileSales()}>
                                    {reconciling ? "Conciliando vendas..." : "Conciliar vendas do cliente"}
                                </Button>
                                {salesReconciled && <Alert severity="success">Conciliação de vendas concluída.</Alert>}
                            </>
                        )}
                        {formError && <Alert severity="error">{formError}</Alert>}
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button disabled={busy || validatingClient || reconciling} onClick={closeDialog}>Cancelar</Button>
                    <Button variant="contained" disabled={!client || busy || validatingClient || reconciling}
                        onClick={() => void handleSaveClientProducts()}>
                        {busy ? "Salvando..." : "Salvar"}
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog open={dialog === "file" || dialog === "replace"} onClose={closeDialog} fullWidth maxWidth="sm">
                <DialogTitle>{dialog === "replace" ? "Substituir arquivo" : `Publicar arquivo · ${modalTitle}`}</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ pt: 1 }}>
                        {dialog === "replace" && <TextField autoFocus label="Título" value={fileTitle}
                            onChange={(event) => setFileTitle(event.target.value)} />}
                        <Button component="label" variant="outlined" disabled={busy}>
                            {dialog === "replace"
                                ? selectedFile?.name ?? "Selecionar arquivo"
                                : uploadFiles.length > 0 ? `Selecionar outros arquivos (${uploadFiles.length})` : "Selecionar arquivos"}
                            {dialog === "replace" ? (
                                <input hidden type="file" accept={acceptedFileInputTypes}
                                    onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)} />
                            ) : (
                                <input hidden multiple type="file" accept={acceptedFileInputTypes}
                                    onChange={(event) => {
                                        handleSelectUploadFiles(event.target.files);
                                        event.target.value = "";
                                    }} />
                            )}
                        </Button>
                        {dialog === "file" && uploadFiles.length > 0 && (
                            <Stack component="ul" spacing={1} aria-label="Arquivos selecionados" sx={{ m: 0, pl: 2.5 }}>
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
                        {formError && <Alert severity="error">{formError}</Alert>}
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button disabled={busy} onClick={closeDialog}>Cancelar</Button>
                    <Button variant="contained" disabled={busy || (dialog === "file" && !uploadFiles.some((entry) =>
                        entry.status === "pending" || (entry.status === "failed" && entry.retryable)))}
                        onClick={() => void (dialog === "replace" ? handleReplaceFile() : handleUpload())}>
                        {busy ? "Publicando..." : dialog === "replace" ? "Substituir versão" :
                            uploadFiles.some((entry) => entry.status === "failed" && entry.retryable)
                                ? "Tentar novamente" : `Publicar${uploadFiles.length > 1 ? ` ${uploadFiles.length} arquivos` : ""}`}
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog open={dialog === "link" || dialog === "edit-link"} onClose={closeDialog} fullWidth maxWidth="sm">
                <DialogTitle>{dialog === "edit-link" ? "Editar link" : `Publicar link · ${modalTitle}`}</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ pt: 1 }}>
                        <TextField autoFocus label="Título do link" value={linkTitle}
                            onChange={(event) => setLinkTitle(event.target.value)} />
                        <TextField label="URL do link" value={linkUrl}
                            placeholder="https://exemplo.com"
                            onChange={(event) => setLinkUrl(event.target.value)} />
                        <Alert severity="info">O link abre fora do sistema. Verifique as permissões de acesso no site de destino.</Alert>
                        {formError && <Alert severity="error">{formError}</Alert>}
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button disabled={busy} onClick={closeDialog}>Cancelar</Button>
                    <Button variant="contained" disabled={busy}
                        onClick={() => void (dialog === "edit-link" ? handleUpdateLink() : handleAddLink())}>
                        {busy ? "Salvando..." : dialog === "edit-link" ? "Salvar link" : "Publicar"}
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog open={dialog === "folder"} onClose={closeDialog} fullWidth maxWidth="sm">
                <DialogTitle>Criar pasta · {openLibrary?.nome}</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ pt: 1 }}>
                        <TextField autoFocus label="Nome da pasta" value={folderName}
                            onChange={(event) => setFolderName(event.target.value)} />
                        {formError && <Alert severity="error">{formError}</Alert>}
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button disabled={busy} onClick={closeDialog}>Cancelar</Button>
                    <Button variant="contained" disabled={busy} onClick={() => void handleCreateFolder()}>
                        {busy ? "Criando..." : "Criar"}
                    </Button>
                </DialogActions>
            </Dialog>

            <RenameFolderDialog
                open={folderAction?.type === "rename"}
                currentName={folderAction ? folderAction.folder.nome : ""}
                busy={busy}
                error={folderActionError}
                onCancel={closeFolderAction}
                onSubmit={(nome) => void handleRenameFolder(nome)}
            />
            <DeleteFolderDialog
                open={folderAction?.type === "delete"}
                folderName={folderAction ? folderAction.folder.nome : ""}
                busy={busy}
                error={folderActionError}
                onCancel={closeFolderAction}
                onConfirm={() => void handleDeleteFolder()}
            />

            <Dialog open={dialog === "deactivate"} onClose={closeDialog} fullWidth maxWidth="xs">
                <DialogTitle>Desativar biblioteca?</DialogTitle>
                <DialogContent>
                    <Typography>{deactivatingLibrary?.nome} deixará de aparecer para os clientes.</Typography>
                    {formError && <Alert severity="error" sx={{ mt: 2 }}>{formError}</Alert>}
                </DialogContent>
                <DialogActions>
                    <Button disabled={busy} onClick={closeDialog}>Cancelar</Button>
                    <Button color="error" disabled={busy} onClick={() => void handleDeactivateLibrary()}>
                        {busy ? "Desativando..." : "Desativar"}
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog open={!!previewItem} onClose={closePreview} fullWidth maxWidth="lg">
                <DialogTitle>{previewItem?.titulo}</DialogTitle>
                <DialogContent sx={{ height: { xs: "65vh", md: "75vh" }, p: 1 }}>
                    {previewLoading ? (
                        <CircularProgress aria-label="Carregando pré-visualização" />
                    ) : previewUrl && previewItem?.contentType === "application/pdf" ? (
                        <iframe title={`Pré-visualização de ${previewItem.titulo}`} src={previewUrl}
                            style={{ width: "100%", height: "100%", border: 0 }} />
                    ) : previewUrl && previewItem?.contentType?.startsWith("image/") ? (
                        <Box component="img" src={previewUrl} alt={previewItem.titulo}
                            sx={{ maxWidth: "100%", maxHeight: "100%", display: "block", mx: "auto" }} />
                    ) : previewUrl && isOfficeItem(previewItem) ? (
                        <Stack spacing={1} sx={{ height: "100%" }}>
                            <Typography variant="body2" color="text.secondary">
                                Visualização somente leitura. Se o navegador não exibir este formato, baixe o arquivo
                                para abri-lo em um aplicativo compatível.
                            </Typography>
                            <Box component="iframe" title={`Pré-visualização de ${previewItem?.titulo}`}
                                src={previewUrl} sx={{ width: "100%", flex: 1, border: 0 }} />
                            <Button component="a" href={previewUrl} download={previewItem?.titulo} size="small">
                                Baixar arquivo
                            </Button>
                        </Stack>
                    ) : null}
                </DialogContent>
                <DialogActions>
                    <Button onClick={closePreview}>Fechar visualização</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
