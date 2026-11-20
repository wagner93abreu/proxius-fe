export type UnidadeDuracaoAcesso = "DIA" | "MES" | "ANO";

export function formatDuracaoAcesso(
    quantidade: number | null,
    unidade: UnidadeDuracaoAcesso | null
): string {
    if (quantidade == null || unidade == null) return "Sem expiração";
    const nomeUnidade = {
        DIA: quantidade === 1 ? "dia" : "dias",
        MES: quantidade === 1 ? "mês" : "meses",
        ANO: quantidade === 1 ? "ano" : "anos",
    }[unidade];
    return `${quantidade} ${nomeUnidade}`;
}

export default interface IProduto {
    id: string | number | null;
    origem: string;
    nome: string;
    descricao: string;
    regras: string;
    active?: boolean;
    videoUrl?: string;
    detalhes?: string;
    fotoDisponivel?: boolean;
    duracaoAcessoQuantidade: number | null;
    duracaoAcessoUnidade: UnidadeDuracaoAcesso | null;
}