import IPagamento from "./IPagamento";
import IItem from "./IItem";

export default interface IVenda
 {
    id: string | number | null;
    statusvenda: string;
    idproduto: string;
    produto: string;
    datavenda: string;
    documentocliente: string;
    idvendaapi?: string | number | null;
    payid?: string | number | null;
    salesProcessId?: string | number | null;
    pagamento: IPagamento[];
    itens?: IItem[];

  }

  