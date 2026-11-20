export default interface ITaxa {
    id: string | number | null;
    fornecedor: string,
    tipo: string,
    bandeira: string,
    parcela: number,
    valormaximo: number,
    porcentagem: boolean,
    valortaxa: number
}