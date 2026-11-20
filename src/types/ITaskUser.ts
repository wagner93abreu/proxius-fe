export default interface ITaskUser {
    id: string;
    cardId: string;
    cardNome: string;
    cardStatusId: string;
    description: string;
    createdAt: string;
    estimatedDate: string | null;
    conclusionDate: string | null;
    assignedTo: string | null;
    assignedToId: number | string | null;
    done: boolean;
    visible: number;
    sessao: string | null;
    sessaoTitulo?: string | null;
    sessaoConclusionDate?: string | null;

}