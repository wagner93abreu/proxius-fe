export default interface IFinanceiro {
    id: string | number | null;
    tipo: string,
    descricao: string,
    idcategoria: string,
    dataprevista: string,
    dataexecutada: string | null,
    moeda: string,
    valor: string | number 

}