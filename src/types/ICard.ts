import IArquivo from "./IArquivo";
import ITask from "./ITask";

export default interface ICard {
    id: string;
    atendenteId: number | null;
    atendente: string | null;
    fotoAtendente: string | null;
    nome: string;
    email: string | null;
    telefone: string | null;
    linkedin: string | null;
    instagram: string;
    objetivo: string | null;
    produtoId: number | null;
    produto: string | null;
    precoId: number | null;
    preco: string | null;
    descricao: string | null;
    statusId: number;
    lastStatusUpdate: string;
    tags: string | null;
    cliente: number | null;
    venda: number | null;
    linkPgto: string | null;
    linkCadastroPublico?: string | null;
    taskStatus: string | null;
    tasks: ITask[];
    arquivos: IArquivo[];
    comoConheceu: string;
    comoConheceuDetalhamento: string;
    createdAt: string;
}