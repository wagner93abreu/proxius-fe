export default interface IPagamento {
    id: string | number | null;
    moeda: string;
    meiopagamento: string;
    tipopagamento: string;
    parcelas: number;
    valorcomprador: number;
    valorbase: number;
    taxas: number;
    comissao: number;
    datapagamento: string; 
    cupom: string;  
}