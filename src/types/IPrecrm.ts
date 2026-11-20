interface IPrecrm {
    id?: string | number;
    dataHora?: string | null;
    responsavel?: string | null;
    canal?: string | null;
    campanhaLink?: string | null;
    observacao?: string | null;
    qtdAbordado?: number | null;
    qtdResposta?: number | null;
    qtdRespostaPositiva?: number | null;
}

export default IPrecrm;