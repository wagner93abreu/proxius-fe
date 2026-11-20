export default interface ITask {
    id: string;
    cardId: string;
    description: string;
    createdAt: string;
    estimatedDate: string | null;
    conclusionDate: string | null;
    assignedTo: string | null;
    assignedToId: number | string | null;
    done: boolean;
    visible: number;
    sessao: string | null;

}