export const FOLDER_DELETE_CONFIRMATION = "excluir" as const;

export interface IFolderRenameRequest {
    nome: string;
}

export interface IFolderDeleteRequest {
    confirmacao: typeof FOLDER_DELETE_CONFIRMATION;
}

export const folderDeleteRequest = (): IFolderDeleteRequest => ({ confirmacao: FOLDER_DELETE_CONFIRMATION });