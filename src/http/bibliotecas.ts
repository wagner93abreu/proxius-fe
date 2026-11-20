import http from ".";
import { isLocalHost, isRhscSharePointTestEnabled } from "./localSharePoint";
import { folderDeleteRequest, IFolderDeleteRequest, IFolderRenameRequest } from "../types/IFolderActions";

export interface IBiblioteca {
    id: number;
    nome: string;
    descricao: string;
    produtoIds: number[];
}

export interface IPastaBiblioteca {
    id: number;
    bibliotecaId: number;
    nome: string;
}

export type EstadoStorageBiblioteca = "NAO_PROVISIONADO" | "ATIVACAO_PENDENTE" | "PRONTO";

export type TipoItemBiblioteca = "ARQUIVO" | "LINK_EXTERNO";

export interface IItemBiblioteca {
    id: number;
    titulo: string;
    tipo: TipoItemBiblioteca;
    contentType?: string;
    linkExterno?: string;
    pastaId?: number | null;
}

export interface IProdutosClifor {
    acessos: IAcessoProduto[];
}

export type StatusAcessoProduto = "ACTIVE" | "EXPIRED" | "REVOKED" | "ATIVO" | "EXPIRADO" | "REVOGADO";

export interface IAcessoProduto {
    produtoId: number;
    ativo: boolean;
    inicio: string | null;
    fim: string | null;
    status: StatusAcessoProduto;
    origem: string;
}

export interface IAcessoProdutoInput {
    produtoId: number;
    fim?: string;
}

const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem("authToken") ?? ""}` });

export const isLibraryEnabled = () => process.env.REACT_APP_LIBRARY_ENABLED === "true"
    && (!isLocalHost() || isRhscSharePointTestEnabled());

export { authHeaders as libraryAuthHeaders };

export async function listLibraries(cliforId?: string | number): Promise<IBiblioteca[]> {
    const { data } = await http.get<IBiblioteca[]>("bibliotecas", {
        headers: authHeaders(),
        ...(cliforId == null ? {} : { params: { cliforId } }),
    });
    return data;
}

export async function listLibraryItems(
    libraryId: number,
    cliforId?: string | number,
    pastaId?: number
): Promise<IItemBiblioteca[]> {
    const { data } = await http.get<IItemBiblioteca[]>(`bibliotecas/${libraryId}/itens`, {
        headers: authHeaders(),
        ...((cliforId == null && pastaId == null) ? {} : {
            params: {
                ...(cliforId == null ? {} : { cliforId }),
                ...(pastaId == null ? {} : { pastaId }),
            },
        }),
    });
    return data;
}

export async function listLibraryFolders(
    libraryId: number,
    cliforId?: string | number
): Promise<IPastaBiblioteca[]> {
    const { data } = await http.get<IPastaBiblioteca[]>(`bibliotecas/${libraryId}/pastas`, {
        headers: authHeaders(),
        ...(cliforId == null ? {} : { params: { cliforId } }),
    });
    return data;
}

export async function getLibraryItemContent(
    libraryId: number,
    itemId: number,
    cliforId?: string | number
): Promise<Blob> {
    const { data } = await http.get<Blob>(`bibliotecas/${libraryId}/itens/${itemId}/conteudo`, {
        headers: authHeaders(),
        ...(cliforId == null ? {} : { params: { cliforId } }),
        responseType: "blob",
    });
    return data;
}

export async function createLibrary(nome: string, descricao: string): Promise<IBiblioteca> {
    const { data } = await http.post<IBiblioteca>(
        "bibliotecas",
        { nome, descricao },
        { headers: authHeaders() }
    );
    return data;
}

export async function deactivateLibrary(libraryId: number): Promise<void> {
    await http.delete(`bibliotecas/${libraryId}`, { headers: authHeaders() });
}

export async function provisionLibraryStorage(): Promise<void> {
    await http.post("bibliotecas/provision", null, { headers: authHeaders() });
}

export async function getLibraryStorageStatus(): Promise<EstadoStorageBiblioteca> {
    const { data } = await http.get<{ estado: EstadoStorageBiblioteca }>("bibliotecas/storage/status", {
        headers: authHeaders(),
    });
    return data.estado;
}

export async function createLibraryFolder(libraryId: number, nome: string): Promise<IPastaBiblioteca> {
    const { data } = await http.post<IPastaBiblioteca>(
        `bibliotecas/${libraryId}/pastas`,
        { nome },
        { headers: authHeaders() }
    );
    return data;
}

const libraryFolderPath = (libraryId: number, pastaId: number) =>
    `bibliotecas/${encodeURIComponent(String(libraryId))}/pastas/${encodeURIComponent(String(pastaId))}`;

export async function renameLibraryFolder(
    libraryId: number,
    pastaId: number,
    nome: string
): Promise<IPastaBiblioteca | null> {
    const body: IFolderRenameRequest = { nome };
    const { data } = await http.put<IPastaBiblioteca | "">(libraryFolderPath(libraryId, pastaId), body, {
        headers: authHeaders(),
    });
    return data && typeof data === "object" ? data : null;
}

export async function deleteLibraryFolder(libraryId: number, pastaId: number): Promise<void> {
    await http.delete<void, unknown, IFolderDeleteRequest>(libraryFolderPath(libraryId, pastaId), {
        headers: authHeaders(),
        data: folderDeleteRequest(),
    });
}

export async function setLibraryProducts(
    libraryId: number,
    produtoIds: number[],
    motivo?: string
): Promise<void> {
    await http.put(
        `bibliotecas/${libraryId}/produtos`,
        { produtoIds, ...(motivo == null ? {} : { motivo }) },
        { headers: authHeaders() }
    );
}

export async function getClientProducts(cliforId: string | number): Promise<IProdutosClifor> {
    const { data } = await http.get<IProdutosClifor>(`bibliotecas/clifor/${encodeURIComponent(String(cliforId))}/produtos`, {
        headers: authHeaders(),
    });
    return data;
}

export async function setClientProducts(
    cliforId: string | number,
    acessos: IAcessoProdutoInput[],
    motivo?: string
): Promise<IProdutosClifor> {
    const { data } = await http.put<IProdutosClifor>(
        `bibliotecas/clifor/${encodeURIComponent(String(cliforId))}/produtos`,
        { acessos, ...(motivo == null ? {} : { motivo }) },
        { headers: authHeaders() }
    );
    return data;
}

export async function uploadLibraryFile(
    libraryId: number,
    file: File,
    titulo: string,
    pastaId?: number
): Promise<void> {
    const form = new FormData();
    form.append("file", file, file.name);
    form.append("titulo", titulo);
    await http.post(`bibliotecas/${libraryId}/arquivos`, form, {
        headers: authHeaders(),
        ...(pastaId == null ? {} : { params: { pastaId } }),
    });
}

export async function replaceLibraryFile(
    libraryId: number,
    itemId: number,
    file: File,
    titulo: string
): Promise<void> {
    const form = new FormData();
    form.append("file", file, file.name);
    form.append("titulo", titulo);
    await http.put(`bibliotecas/${libraryId}/itens/${itemId}/arquivo`, form, {
        headers: authHeaders(),
    });
}

export async function reconcileClientSales(cliforId: string | number): Promise<void> {
    await http.post(`bibliotecas/clifor/${encodeURIComponent(String(cliforId))}/conciliar`, null, {
        headers: authHeaders(),
    });
}

export async function addLibraryLink(
    libraryId: number,
    titulo: string,
    linkExterno: string,
    pastaId?: number
): Promise<void> {
    await http.post(
        `bibliotecas/${libraryId}/links`,
        { titulo, linkExterno },
        {
            headers: authHeaders(),
            ...(pastaId == null ? {} : { params: { pastaId } }),
        }
    );
}

export async function updateLibraryLink(
    libraryId: number,
    itemId: number,
    titulo: string,
    linkExterno: string
): Promise<void> {
    await http.put(
        `bibliotecas/${libraryId}/itens/${itemId}/link`,
        { titulo, linkExterno },
        { headers: authHeaders() }
    );
}

export async function withdrawLibraryItem(libraryId: number, itemId: number): Promise<void> {
    await http.delete(`bibliotecas/${libraryId}/itens/${itemId}`, { headers: authHeaders() });
}
