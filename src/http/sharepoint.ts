import axios, { AxiosProgressEvent } from "axios";
import http from ".";
import {
    ISharePointCapabilities,
    ISharePointFile,
    ISharePointPreview,
    IShareLink,
    SharePointLinkType,
} from "../types/ISharePointFile";
import { folderDeleteRequest, IFolderDeleteRequest, IFolderRenameRequest } from "../types/IFolderActions";
import { libraryAuthHeaders } from "./bibliotecas";
import { isLocalHost, isRhscSharePointTestEnabled } from "./localSharePoint";

export const isSharePointEnabled = () => isLocalHost()
    ? isRhscSharePointTestEnabled()
    : process.env.REACT_APP_SHAREPOINT_ENABLED === "true";

const authHeaders = libraryAuthHeaders;

const basePath = (cliforId: string | number) =>
    `sharepoint/clifor/${encodeURIComponent(String(cliforId))}/files`;

const itemPath = (cliforId: string | number, itemId: string) =>
    `${basePath(cliforId)}/${encodeURIComponent(itemId)}`;

export async function listFiles(cliforId: string | number, parentId?: string | null): Promise<ISharePointFile[]> {
    const { data } = await http.get<ISharePointFile[]>(basePath(cliforId), {
        headers: authHeaders(),
        ...(parentId == null ? {} : { params: { parentId } }),
    });
    return data;
}

export async function getCapabilities(cliforId: string | number): Promise<ISharePointCapabilities> {
    const { data } = await http.get<ISharePointCapabilities>(`${basePath(cliforId)}/capabilities`, {
        headers: authHeaders(),
    });
    return data;
}

export async function createFolder(
    cliforId: string | number,
    name: string,
    parentId?: string | null
): Promise<ISharePointFile> {
    const { data } = await http.post<ISharePointFile>(`${basePath(cliforId)}/folders`, { name }, {
        headers: authHeaders(),
        ...(parentId == null ? {} : { params: { parentId } }),
    });
    return data;
}

export async function uploadFile(
    cliforId: string | number,
    file: File,
    onProgress?: (percent: number) => void,
    parentId?: string | null
): Promise<ISharePointFile> {
    const form = new FormData();
    // The backend expects the multipart part to be named "file"; axios sets the boundary itself.
    form.append("file", file, file.name);
    const { data } = await http.post<ISharePointFile>(basePath(cliforId), form, {
        headers: authHeaders(),
        ...(parentId == null ? {} : { params: { parentId } }),
        onUploadProgress: (event: AxiosProgressEvent) => {
            if (onProgress && event.total) {
                onProgress(Math.round((event.loaded * 100) / event.total));
            }
        },
    });
    return data;
}

export function fileNameFromContentDisposition(header: string | undefined | null, fallback: string): string {
    if (!header) return fallback;
    const encoded = /filename\*\s*=\s*(?:UTF-8'')?([^;]+)/i.exec(header);
    if (encoded) {
        try {
            return decodeURIComponent(encoded[1].trim().replace(/^"|"$/g, ""));
        } catch {
            // fall through to the plain filename
        }
    }
    const plain = /filename\s*=\s*"?([^";]+)"?/i.exec(header);
    return plain ? plain[1].trim() : fallback;
}

export async function downloadFile(
    cliforId: string | number,
    itemId: string,
    fallbackName = "arquivo"
): Promise<{ blob: Blob; fileName: string }> {
    const response = await http.get<Blob>(`${itemPath(cliforId, itemId)}/content`, {
        headers: authHeaders(),
        responseType: "blob",
    });
    return {
        blob: response.data,
        fileName: fileNameFromContentDisposition(response.headers["content-disposition"], fallbackName),
    };
}

export function saveBlob(blob: Blob, fileName: string) {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function deleteFile(cliforId: string | number, itemId: string): Promise<void> {
    await http.delete(itemPath(cliforId, itemId), { headers: authHeaders() });
}

const folderPath = (cliforId: string | number, itemId: string) =>
    `sharepoint/clifor/${encodeURIComponent(String(cliforId))}/pastas/${encodeURIComponent(itemId)}`;

export async function renameFolder(
    cliforId: string | number,
    itemId: string,
    nome: string
): Promise<ISharePointFile | null> {
    const body: IFolderRenameRequest = { nome };
    const { data } = await http.put<ISharePointFile | "">(folderPath(cliforId, itemId), body, {
        headers: authHeaders(),
    });
    return data && typeof data === "object" ? data : null;
}

export async function deleteFolder(cliforId: string | number, itemId: string): Promise<void> {
    await http.delete<void, unknown, IFolderDeleteRequest>(folderPath(cliforId, itemId), {
        headers: authHeaders(),
        data: folderDeleteRequest(),
    });
}

export async function createLink(
    cliforId: string | number,
    itemId: string,
    type: SharePointLinkType
): Promise<IShareLink> {
    const { data } = await http.post<IShareLink>(`${itemPath(cliforId, itemId)}/link`, null, {
        headers: authHeaders(),
        params: { type },
    });
    return data;
}

export async function previewFile(cliforId: string | number, itemId: string): Promise<ISharePointPreview> {
    const { data } = await http.post<ISharePointPreview>(`${itemPath(cliforId, itemId)}/preview`, null, {
        headers: authHeaders(),
    });
    return data;
}

const statusMessages: Record<number, string> = {
    400: "Requisição inválida. Verifique o arquivo selecionado.",
    401: "Sua sessão expirou. Faça login novamente.",
    403: "Você não tem permissão para esta ação.",
    404: "Arquivo ou pasta não encontrado.",
    409: "Já existe um item com este nome ou há uma operação conflitante. Atualize a pasta antes de tentar novamente.",
    413: "O arquivo excede o tamanho máximo permitido.",
    415: "Formato de envio não suportado.",
    502: "Falha ao comunicar com o SharePoint. Tente novamente em instantes.",
    503: "Serviço de arquivos temporariamente indisponível. Tente novamente em instantes.",
};

export function sharePointErrorMessage(error: unknown): string {
    if (axios.isAxiosError(error)) {
        if (!error.response) return "Não foi possível conectar ao servidor.";
        const data: unknown = error.response.data;
        if (data && typeof data === "object" && "details" in data &&
            typeof data.details === "string" && data.details.trim()) {
            return data.details;
        }
        return statusMessages[error.response.status] ?? "Erro inesperado ao acessar os arquivos.";
    }
    return "Erro inesperado ao acessar os arquivos.";
}
