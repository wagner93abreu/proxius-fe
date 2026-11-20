export default interface IPrecificacao {
    id: string | number | null;
    idproduto: string |  number ,
    valor: string | number,
    moeda: string,
    data: string,
    cupom: string,
    linkpgto: string,
    active: boolean | null
}