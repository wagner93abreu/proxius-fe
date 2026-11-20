import http from ".";
import { libraryAuthHeaders } from "./bibliotecas";
import { isLocalHost, isRhscSharePointTestEnabled } from "./localSharePoint";
import { ISharePointFile } from "../types/ISharePointFile";
import { folderDeleteRequest, IFolderDeleteRequest, IFolderRenameRequest } from "../types/IFolderActions";

export interface IModeloArquivo {
    id: string | number;
    nome: string;
    descricao?: string | null;
    ativo: boolean;
}

export interface IOperacaoCopiaModelo {
    id: string;
    estado: "PENDENTE" | "EM_ANDAMENTO" | "CONCLUIDA" | "FALHOU";
    progresso?: number | null;
    pastaDestinoId?: string | null;
    nomePastaDestino?: string | null;
    erro?: string | null;
}

export function parseModeloOperation(data: unknown): IOperacaoCopiaModelo {
    if (!data || typeof data !== "object" || !("id" in data) || typeof data.id !== "string" ||
        !data.id || !("estado" in data) ||
        (data.estado !== "PENDENTE" && data.estado !== "EM_ANDAMENTO" &&
            data.estado !== "CONCLUIDA" && data.estado !== "FALHOU")) {
        throw new Error("A API retornou um estado de cópia inválido.");
    }
    // Keep only application status metadata; never retain Graph monitor URLs or tokens.
    return {
        id: data.id,
        estado: data.estado,
        progresso: "progresso" in data && typeof data.progresso === "number" && Number.isFinite(data.progresso) ? data.progresso : null,
        pastaDestinoId: "pastaDestinoId" in data && typeof data.pastaDestinoId === "string" ? data.pastaDestinoId : null,
        nomePastaDestino: "nomePastaDestino" in data && typeof data.nomePastaDestino === "string" ? data.nomePastaDestino : null,
        erro: "erro" in data && typeof data.erro === "string" ? data.erro : null,
    };
}

const headers = libraryAuthHeaders;
const modelosPath = "sharepoint/modelos";

export const isModelCatalogEnabled = () => process.env.REACT_APP_MODEL_CATALOG_ENABLED === "true"
    && (!isLocalHost() || isRhscSharePointTestEnabled());

export async function listModelos(): Promise<IModeloArquivo[]> {
    const { data } = await http.get<IModeloArquivo[]>(modelosPath, { headers: headers() });
    return data;
}

export async function createModelo(nome: string, descricao: string): Promise<IModeloArquivo> {
    const { data } = await http.post<IModeloArquivo>(modelosPath, { nome, descricao }, { headers: headers() });
    return data;
}

export async function updateModelo(id: string | number, nome: string, descricao: string): Promise<IModeloArquivo> {
    const { data } = await http.put<IModeloArquivo>(
        `${modelosPath}/${encodeURIComponent(String(id))}`,
        { nome, descricao },
        { headers: headers() }
    );
    return data;
}

export async function deactivateModelo(id: string | number): Promise<void> {
    await http.post(`${modelosPath}/${encodeURIComponent(String(id))}/desativar`, null, { headers: headers() });
}

export async function listModeloContents(id: string | number, parentId?: string | null): Promise<ISharePointFile[]> {
    const { data } = await http.get<ISharePointFile[]>(
        `${modelosPath}/${encodeURIComponent(String(id))}/arquivos`,
        {
            headers: headers(),
            ...(parentId == null ? {} : { params: { parentId } }),
        }
    );
    return data;
}

export async function createModeloFolder(
    id: string | number,
    nome: string,
    parentId?: string | null
): Promise<ISharePointFile> {
    const { data } = await http.post<ISharePointFile>(
        `${modelosPath}/${encodeURIComponent(String(id))}/pastas`,
        { nome },
        {
            headers: headers(),
            ...(parentId == null ? {} : { params: { parentId } }),
        }
    );
    return data;
}

const modeloFolderPath = (id: string | number, itemId: string) =>
    `${modelosPath}/${encodeURIComponent(String(id))}/pastas/${encodeURIComponent(itemId)}`;

export async function renameModeloFolder(
    id: string | number,
    itemId: string,
    nome: string
): Promise<ISharePointFile | null> {
    const body: IFolderRenameRequest = { nome };
    const { data } = await http.put<ISharePointFile | "">(modeloFolderPath(id, itemId), body, { headers: headers() });
    return data && typeof data === "object" ? data : null;
}

export async function deleteModeloFolder(id: string | number, itemId: string): Promise<void> {
    await http.delete<void, unknown, IFolderDeleteRequest>(modeloFolderPath(id, itemId), {
        headers: headers(),
        data: folderDeleteRequest(),
    });
}

export async function uploadModeloFile(
    id: string | number,
    file: File,
    parentId?: string | null
): Promise<ISharePointFile> {
    const form = new FormData();
    form.append("file", file, file.name);
    const { data } = await http.post<ISharePointFile>(
        `${modelosPath}/${encodeURIComponent(String(id))}/arquivos`,
        form,
        {
            headers: headers(),
            ...(parentId == null ? {} : { params: { parentId } }),
        }
    );
    return data;
}

export async function getModeloFileContent(id: string | number, itemId: string): Promise<Blob> {
    const { data } = await http.get<Blob>(
        `${modelosPath}/${encodeURIComponent(String(id))}/arquivos/${encodeURIComponent(itemId)}/conteudo`,
        { headers: headers(), responseType: "blob" }
    );
    return data;
}

export async function withdrawModeloFile(id: string | number, itemId: string): Promise<void> {
    await http.post(
        `${modelosPath}/${encodeURIComponent(String(id))}/arquivos/${encodeURIComponent(itemId)}/retirar`,
        null,
        { headers: headers() }
    );
}

export async function deleteModeloFile(id: string | number, itemId: string): Promise<void> {
    await http.delete(
        `${modelosPath}/${encodeURIComponent(String(id))}/arquivos/${encodeURIComponent(itemId)}`,
        { headers: headers() }
    );
}

export async function startModeloCopy(
    cliforId: string | number,
    modeloId: string | number,
    idempotencyKey: string
): Promise<IOperacaoCopiaModelo> {
    const { data, status } = await http.post<IOperacaoCopiaModelo>(
        `sharepoint/clifor/${encodeURIComponent(String(cliforId))}/copias-modelo`,
        { modeloId },
        {
            headers: { ...headers(), "Idempotency-Key": idempotencyKey },
        }
    );
    if (status !== 202 || !data?.id) {
        throw new Error("A API não confirmou o início da cópia no formato esperado.");
    }
    return parseModeloOperation(data);
}

export async function getModeloCopy(operationId: string): Promise<IOperacaoCopiaModelo> {
    const { data } = await http.get<unknown>(
        `sharepoint/copias-modelo/${encodeURIComponent(operationId)}`,
        { headers: headers() }
    );
    const operation = parseModeloOperation(data);
    if (operation.id !== operationId) throw new Error("A API retornou outra operação de cópia.");
    return operation;
}
