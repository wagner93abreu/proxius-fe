import ICard from "./ICard";

export default interface IColumn {
    id: number;
    name: string;
    position: number;
    active: boolean;
    tipo: string;
    cards: ICard[];
}