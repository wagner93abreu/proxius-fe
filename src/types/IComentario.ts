export default interface IComentario {
    id: string;
    origemTipo: string;
    origemId: string;
    descricao: string;
    createdAt: string;
    estimatedDate: string | null;
    conclusionDate: string | null;
    done: boolean;
    usuario: string;
    usuarioId: number | string;
}
