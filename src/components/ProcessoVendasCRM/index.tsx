import createCrmSelectStyles from "../../styles/crmSelectStyles";
import React, { useEffect, useMemo, useState } from "react";
import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    MenuItem,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    TextField,
    Typography,
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import Select from "react-select";

import autenticaStore from "../../stores/autentica.store";
import http from "../../http";

import IBodyRequest from "../../types/IBodyRequest";
import IPrecificacao from "../../types/IPrecificacao";
import IProduto from "../../types/IProduto";
import IContractTemplate from "../../types/IContractTemplate";
import IContractTemplateVersion from "../../types/IContractTemplateVersion";
import IItem from "../../types/IItem";
import ITaxa from "../../types/ITaxa";
import { mostrarMensagem } from "../../stores/mensagem.store";

const STATUS_SEM_EDICAO_EXCLUSAO = ["PAID", "USER_REGISTRATION", "COMPLETED"];

type ProcessoVendasCRMProps = {
    cardId: string | number;
};

const TIPOS_PAGAMENTO_ACEITAVEIS = ["CREDITO", "CREDITO - CLIENTE", "CREDITO - FORNECEDOR", "PIX", "BOLETO", "DEBITO"];

type StringOption = { value: string; label: string };

type PagamentoLinha = {
    id?: number | null;
    moeda: string;
    meiopagamento: StringOption | null;
    tipopagamento: StringOption | null;
    parcelas: string;
    tipoDesconto: string;
    valorDesconto: string;
    parcelaMaxDesconto: string;
};

const MEIO_PAGAMENTO_PADRAO: StringOption = { value: "ASAAS", label: "ASAAS" };

const novaLinhaPagamento = (): PagamentoLinha => ({
    id: null,
    moeda: "BRL",
    meiopagamento: MEIO_PAGAMENTO_PADRAO,
    tipopagamento: null,
    parcelas: "",
    tipoDesconto: "VALUE",
    valorDesconto: "0",
    parcelaMaxDesconto: "",
});

const novaLinhaPagamentoPadrao = (tipopagamento: string): PagamentoLinha => ({
    ...novaLinhaPagamento(),
    tipopagamento: { value: tipopagamento, label: tipopagamento },
});

const STATUS_VENDA_PADRAO = "ANDAMENTO";

type ItemLinha = {
    id?: number | null;
    produto: SelectOption | null;
    precificacao: SelectOption | null;
    quantidade: string;
    discountType: string;
    discountValue: string;
};

const novoItemLinha = (): ItemLinha => ({
    id: null,
    produto: null,
    precificacao: null,
    quantidade: "1",
    discountType: "VALUE",
    discountValue: "0",
});

type ItemProcesso = {
    id?: number;
    idproduct: number;
    product: string;
    quantity: number;
    unitPrice: number;
    discountType: string;
    discountValue: number;
    finalPrice: number;
};

type PagamentoProcesso = {
    id?: number;
    tipopagamento: string;
    statusPagamento: string | null;
    valorcomprador: number;
    valorbase: number;
    taxas: number;
    comissao: number;
    parcelas: number;
    datapagamento: string | null;
    datavencimento: string | null;
    cupom: string | null;
    tipoDesconto: string;
    valorDesconto: number;
    parcelaMaxDesconto: number | null;
    status: string | null;
    cobrancaUrl: string | null;
    pixQrcode: string | null;
};

type SalesProcess = {
    id: number;
    uuid: string;
    cardId: string;
    templateId?: number | null;
    sellerUserId: number;
    status: string;
    coupon: string | null;
    temporaryAccessUrl: string | null;
    createdAt: string;
    itens: ItemProcesso[];
    pagamento: PagamentoProcesso[];
};

type SelectOption = { value: number; label: string };


const formatDateDisplay = (value?: string | null) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleString("pt-BR");
};

const formataValor = (moeda: string, valor: string | number) => {
    const numeric = Number(valor || 0);
    if (moeda === "REAL") return `R$ ${numeric.toLocaleString("pt-br", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    if (moeda === "DOLAR") return `U$ ${numeric.toLocaleString("pt-br", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    if (moeda === "EURO") return `€ ${numeric.toLocaleString("pt-br", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    return String(valor);
};

export default function ProcessoVendasCRM({ cardId }: ProcessoVendasCRMProps) {
    const { usuario } = autenticaStore;

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [openModal, setOpenModal] = useState(false);

    const [processos, setProcessos] = useState<SalesProcess[]>([]);
    const [produtos, setProdutos] = useState<IProduto[]>([]);
    const [precificacoes, setPrecificacoes] = useState<IPrecificacao[]>([]);
    const [contractTemplates, setContractTemplates] = useState<IContractTemplate[]>([]);
    const [taxas, setTaxas] = useState<ITaxa[]>([]);

    const [itensVenda, setItensVenda] = useState<ItemLinha[]>([novoItemLinha()]);

    const [templateSelecionado, setTemplateSelecionado] = useState<SelectOption | null>(null);
    const [templateVersionId, setTemplateVersionId] = useState<number | null>(null);
    const [buscandoVersaoTemplate, setBuscandoVersaoTemplate] = useState(false);

    const [pagamentos, setPagamentos] = useState<PagamentoLinha[]>([
        novaLinhaPagamentoPadrao("CREDITO - FORNECEDOR"),
        novaLinhaPagamentoPadrao("PIX"),
    ]);

    const [modoEdicao, setModoEdicao] = useState(false);
    const [modoSomenteLeitura, setModoSomenteLeitura] = useState(false);
    const [uuidEmEdicao, setUuidEmEdicao] = useState<string | null>(null);
    const [carregandoDetalhes, setCarregandoDetalhes] = useState(false);
    const [editStatus, setEditStatus] = useState("");
    const [editCoupon, setEditCoupon] = useState("");
    const [excluindoId, setExcluindoId] = useState<number | null>(null);

    const axiosConfig = {
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${usuario.token}`,
        },
    };

    const sellerUserId = Number(localStorage.getItem("userID") || 0);

    const fetchBaseData = async () => {
        try {
            const [produtosResponse, precificacaoResponse, templatesResponse, taxasResponse] = await Promise.all([
                http.get<IBodyRequest<IProduto>>("produtos?size=500", axiosConfig),
                http.get<IBodyRequest<IPrecificacao>>("precificacao?size=500", axiosConfig),
                http.get<IBodyRequest<IContractTemplate>>("contract-template?size=500", axiosConfig),
                http.get<IBodyRequest<ITaxa>>("taxa?size=500", axiosConfig),
            ]);

            setProdutos((produtosResponse.data?.content || []).filter((produto) => produto.active));
            setPrecificacoes((precificacaoResponse.data?.content || []).filter((precifica) => !!precifica.active));
            setContractTemplates(templatesResponse.data?.content || []);
            setTaxas(taxasResponse.data?.content || []);
        } catch (erro) {
            mostrarMensagem(erro, "error");
        }
    };

    const fetchProcessos = async () => {
        if (!cardId) return;
        setLoading(true);
        try {
            const { data } = await http.get<SalesProcess[]>(`sales-process?cardId=${encodeURIComponent(String(cardId))}`, axiosConfig);
            setProcessos(data || []);
        } catch (erro) {
            mostrarMensagem(erro, "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!usuario.token) return;
        fetchBaseData();
        fetchProcessos();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [usuario.token, cardId]);

    const produtoOptions = useMemo(
        () =>
            produtos.map((produto) => ({
                value: Number(produto.id),
                label: produto.nome,
            })),
        [produtos]
    );

    const precificacaoOptionsPara = (produtoId: number | undefined) => {
        if (!produtoId) return [];
        return precificacoes
            .filter((precificacao) => Number(precificacao.idproduto) === produtoId)
            .map((precificacao) => ({
                value: Number(precificacao.id),
                label: `${precificacao.cupom} - ${formataValor(precificacao.moeda, precificacao.valor)}`,
            }));
    };

    const calcularLinha = (linha: ItemLinha) => {
        const precificacaoObj = precificacoes.find((p) => Number(p.id) === linha.precificacao?.value);
        const unitPrice = Number(precificacaoObj?.valor || 0);
        const quantity = Number(linha.quantidade) || 0;
        const totalBase = unitPrice * quantity;
        const valorDesconto = Number(linha.discountValue) || 0;
        const finalPrice = linha.discountType === "PERCENT" ? totalBase - (totalBase * valorDesconto) / 100 : totalBase - valorDesconto;
        return { unitPrice, quantity, finalPrice: Number(finalPrice.toFixed(2)) };
    };

    const templateOptions = useMemo(
        () =>
            contractTemplates.map((template) => ({
                value: Number(template.id),
                label: template.name,
            })),
        [contractTemplates]
    );

    const tipopagamentoOptions = (meiopagamento: string | undefined): StringOption[] => {
        if (!meiopagamento) return [];
        return taxas
            .filter((taxa) => taxa.fornecedor === meiopagamento)
            .reduce((unicos: ITaxa[], taxa) => {
                if (!unicos.some((item) => item.tipo === taxa.tipo) && TIPOS_PAGAMENTO_ACEITAVEIS.includes(taxa.tipo)) {
                    unicos.push(taxa);
                }
                return unicos;
            }, [])
            .map((taxa) => ({ value: taxa.tipo, label: taxa.tipo }));
    };

    const getTotalItensValor = (processo: SalesProcess) => {
        return (processo.itens || []).reduce((soma, item) => soma + Number(item.finalPrice || 0), 0);
    };

    const getPagamentoStatus = (processo: SalesProcess) => {
        const pagamentos = processo.pagamento || [];
        if (pagamentos.length === 0) return "PENDENTE";

        const todosCancelados = pagamentos.every((pagamento) => pagamento.status === "CANCELADO");
        if (todosCancelados) return "CANCELADO";

        const todosPendentes = pagamentos.every((pagamento) => !pagamento.datapagamento && !pagamento.status);
        if (todosPendentes) return "PENDENTE";

        const totalItens = getTotalItensValor(processo);
        const totalPago = pagamentos
            .filter((pagamento) => !!pagamento.datapagamento)
            .reduce((soma, pagamento) => soma + Number(pagamento.valorcomprador || 0) + Number(pagamento.valorDesconto || 0), 0);

        if (totalPago > 0 && totalPago >= totalItens - 0.01) return "CONFIRMADO";
        if (totalPago > 0) return "PARCIAL";

        return "PENDENTE";
    };

    const handleErroBloqueio = (erro: any, acao: "editar" | "excluir") => {
        if (erro?.response?.status === 409) {
            mostrarMensagem(`Nao e possivel ${acao}: existe pagamento com status RECEIVED ou CONFIRMED.`, "warning");
            return;
        }
        mostrarMensagem(erro, "error");
    };

    const resolveTemplateOption = async (templateId?: number | null): Promise<SelectOption | null> => {
        if (!templateId) return null;
        for (const template of contractTemplates) {
            try {
                const { data } = await http.get<IContractTemplateVersion[]>(
                    `contract-template-version/template/${template.id}`,
                    axiosConfig
                );
                if ((data || []).some((versao) => Number(versao.id) === Number(templateId))) {
                    return { value: Number(template.id), label: template.name };
                }
            } catch {
                // versao nao encontrada para este template, tenta o proximo
            }
        }
        return null;
    };

    const encontrarPrecificacaoOption = (item: ItemProcesso): SelectOption | null => {
        const candidatas = precificacoes.filter((p) => Number(p.idproduto) === Number(item.idproduct));
        const correspondente = candidatas.find((p) => Number(p.valor) === Number(item.unitPrice)) || candidatas[0];
        if (!correspondente) return null;
        return { value: Number(correspondente.id), label: `${correspondente.cupom} - ${formataValor(correspondente.moeda, correspondente.valor)}` };
    };

    const handleOpenEditModal = async (processo: SalesProcess, somenteLeitura: boolean = false) => {
        setModoEdicao(true);
        setModoSomenteLeitura(somenteLeitura);
        setUuidEmEdicao(processo.uuid);
        setOpenModal(true);
        setCarregandoDetalhes(true);
        try {
            const { data } = await http.get<SalesProcess>(`sales-process/${processo.uuid}/detalhes`, axiosConfig);

            setEditStatus(data.status || "");
            setEditCoupon(data.coupon || "");

            const itensMapeados: ItemLinha[] = (data.itens || []).map((item) => ({
                id: item.id ?? null,
                produto: produtoOptions.find((option) => option.value === Number(item.idproduct)) || null,
                precificacao: encontrarPrecificacaoOption(item),
                quantidade: String(item.quantity ?? 1),
                discountType: item.discountType || "VALUE",
                discountValue: String(item.discountValue ?? "0"),
            }));
            setItensVenda(itensMapeados.length ? itensMapeados : [novoItemLinha()]);

            const pagamentosMapeados: PagamentoLinha[] = (data.pagamento || []).map((pagamento) => ({
                id: pagamento.id ?? null,
                moeda: "BRL",
                meiopagamento: MEIO_PAGAMENTO_PADRAO,
                tipopagamento: pagamento.tipopagamento ? { value: pagamento.tipopagamento, label: pagamento.tipopagamento } : null,
                parcelas: pagamento.parcelas ? String(pagamento.parcelas) : "",
                tipoDesconto: pagamento.tipoDesconto || "VALUE",
                valorDesconto: pagamento.valorDesconto != null ? String(pagamento.valorDesconto) : "0",
                parcelaMaxDesconto: pagamento.parcelaMaxDesconto != null ? String(pagamento.parcelaMaxDesconto) : "",
            }));
            setPagamentos(pagamentosMapeados.length ? pagamentosMapeados : [novaLinhaPagamento()]);

            setTemplateSelecionado(await resolveTemplateOption(data.templateId));
            setTemplateVersionId(data.templateId ?? null);
        } catch (erro) {
            mostrarMensagem(erro, "error");
            setOpenModal(false);
        } finally {
            setCarregandoDetalhes(false);
        }
    };

    const handleExcluirProcesso = async (processo: SalesProcess) => {
        if (!window.confirm("Deseja realmente excluir este processo de venda?")) return;

        setExcluindoId(processo.id);
        try {
            await http.delete(`sales-process/${processo.uuid}`, axiosConfig);
            await fetchProcessos();
        } catch (erro) {
            handleErroBloqueio(erro, "excluir");
        } finally {
            setExcluindoId(null);
        }
    };

    const handleSelecionarTemplate = async (option: SelectOption | null) => {
        setTemplateSelecionado(option);
        setTemplateVersionId(null);
        if (!option) return;

        setBuscandoVersaoTemplate(true);
        try {
            const { data } = await http.get<IContractTemplateVersion[]>(`contract-template-version/template/${option.value}`, axiosConfig);
            const versaoAtiva = (data || [])
                .filter((versao) => versao.active)
                .reduce((maisRecente: IContractTemplateVersion | null, versao) => {
                    if (!maisRecente) return versao;
                    return parseFloat(versao.version) > parseFloat(maisRecente.version) ? versao : maisRecente;
                }, null);

            if (!versaoAtiva) {
                mostrarMensagem("Este template nao possui uma versao ativa no momento.", "warning");
                return;
            }

            setTemplateVersionId(Number(versaoAtiva.id));
        } catch (erro) {
            mostrarMensagem(erro, "error");
        } finally {
            setBuscandoVersaoTemplate(false);
        }
    };

    const atualizarPagamento = (indice: number, alteracoes: Partial<PagamentoLinha>) => {
        setPagamentos((linhas) => linhas.map((linha, i) => (i === indice ? { ...linha, ...alteracoes } : linha)));
    };

    const adicionarPagamento = () => {
        setPagamentos((linhas) => [...linhas, novaLinhaPagamento()]);
    };

    const atualizarItem = (indice: number, alteracoes: Partial<ItemLinha>) => {
        setItensVenda((linhas) => linhas.map((linha, i) => (i === indice ? { ...linha, ...alteracoes } : linha)));
    };

    const adicionarItem = () => {
        setItensVenda((linhas) => [...linhas, novoItemLinha()]);
    };

    const removerItem = (indice: number) => {
        setItensVenda((linhas) => linhas.filter((_, i) => i !== indice));
    };

    const removerPagamento = (indice: number) => {
        setPagamentos((linhas) => linhas.filter((_, i) => i !== indice));
    };

    const handleOpenModal = () => {
        setModoEdicao(false);
        setModoSomenteLeitura(false);
        setUuidEmEdicao(null);
        setEditStatus("");
        setEditCoupon("");
        setItensVenda([novoItemLinha()]);
        setTemplateSelecionado(null);
        setTemplateVersionId(null);
        setPagamentos([
            novaLinhaPagamentoPadrao("CREDITO - FORNECEDOR"),
            novaLinhaPagamentoPadrao("PIX"),
        ]);
        setOpenModal(true);
    };

    const handleSave = async () => {
        if (!templateVersionId) {
            mostrarMensagem("Selecione um template de contrato com versao ativa.", "warning");
            return;
        }
        if (!sellerUserId) {
            mostrarMensagem("Usuario vendedor nao encontrado.", "error");
            return;
        }

        const itensPreenchidos = itensVenda.filter((linha) => linha.produto && linha.precificacao);
        if (itensPreenchidos.length === 0) {
            mostrarMensagem("Adicione ao menos um produto.", "warning");
            return;
        }

        const pagamentoPreenchido = pagamentos.filter((linha) => linha.meiopagamento && linha.tipopagamento);
        if (pagamentoPreenchido.length === 0) {
            mostrarMensagem("Adicione ao menos uma opcao de pagamento.", "warning");
            return;
        }

        const pagamentoSemParcelas = pagamentoPreenchido.find(
            (linha) => linha.tipopagamento?.value !== "PIX" && !linha.parcelas
        );
        if (pagamentoSemParcelas) {
            mostrarMensagem("Informe a quantidade de parcelas para todas as opcoes de pagamento (exceto PIX).", "warning");
            return;
        }

        const itens: IItem[] = itensPreenchidos.map((linha, indice) => {
            const { unitPrice, quantity, finalPrice } = calcularLinha(linha);
            return {
                id: linha.id ?? undefined,
                idproduct: linha.produto!.value,
                product: linha.produto!.label,
                pricing: unitPrice,
                quantity,
                itemOrder: indice + 1,
                unitPrice,
                discountType: linha.discountType,
                discountValue: Number(linha.discountValue) || 0,
                finalPrice,
            };
        });

        const pagamento = pagamentoPreenchido.map((linha) => {
            const ehPix = linha.tipopagamento?.value === "PIX";
            const entrada: Record<string, unknown> = {
                id: linha.id ?? undefined,
                moeda: linha.moeda,
                meiopagamento: linha.meiopagamento?.value,
                tipopagamento: linha.tipopagamento?.value,
                tipoDesconto: linha.tipoDesconto,
                valorDesconto: Number(linha.valorDesconto) || 0,
                parcelas: ehPix ? 1 : Number(linha.parcelas),
            };
            if (!ehPix && linha.parcelaMaxDesconto) entrada.parcelaMaxDesconto = Number(linha.parcelaMaxDesconto);
            return entrada;
        });

        if (modoEdicao) {
            if (!uuidEmEdicao) return;

            const payloadEdicao = {
                cardId: String(cardId),
                sellerUserId,
                templateId: templateVersionId,
                coupon: editCoupon || null,
                status: editStatus,
                venda: {
                    statusvenda: STATUS_VENDA_PADRAO,
                    datavenda: new Date().toISOString().slice(0, 10),
                    itens,
                    pagamento,
                },
            };

            setSaving(true);
            try {
                await http.put(`sales-process/${uuidEmEdicao}`, payloadEdicao, axiosConfig);
                setOpenModal(false);
                await fetchProcessos();
                mostrarMensagem("Processo de vendas alterado com sucesso!", "success");
            } catch (erro) {
                handleErroBloqueio(erro, "editar");
            } finally {
                setSaving(false);
            }
            return;
        }

        const payload = {
            cardId: String(cardId),
            sellerUserId,
            templateId: templateVersionId,
            venda: {
                statusvenda: STATUS_VENDA_PADRAO,
                datavenda: new Date().toISOString().slice(0, 10),
                itens,
                pagamento,
            },
        };

        setSaving(true);
        try {
            await http.post("sales-process", payload, axiosConfig);

            setOpenModal(false);
            await fetchProcessos();
            mostrarMensagem("Processo de vendas criado com sucesso!", "success");
        } catch (erro) {
            mostrarMensagem(erro, "error");
        } finally {
            setSaving(false);
        }
    };

    return (
        <Box
            sx={{
                backgroundColor: "#ffffff",
                borderRadius: "14px",
                border: "1px solid rgba(20, 20, 20, 0.1)",
                padding: "12px",
            }}
        >
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="h6" align="left" gutterBottom style={{ color: "#242424", margin: 0 }}>
                    Processo de Vendas
                </Typography>
                <Button
                    onClick={handleOpenModal}
                    disabled={loading}
                    sx={{
                        backgroundColor: "transparent",
                        border: "2px solid #141414",
                        color: "#141414",
                        boxShadow: "none",
                        padding: "5px 16px",
                        fontWeight: 700,
                        textTransform: "none",
                        "&:hover": { backgroundColor: "rgba(20, 20, 20, 0.06)" },
                    }}
                >
                    Cadastrar processo
                </Button>
            </Box>

            <Box sx={{ width: "100%", overflowX: "auto" }}>
                <Table
                    size="small"
                    sx={{
                        backgroundColor: "rgba(0, 0, 0, 0)",
                        color: "#242424",
                        borderCollapse: "collapse",
                        tableLayout: "fixed",
                        width: "100%",
                        minWidth: "1120px",
                        "& td, & th": { borderBottom: "1px solid rgba(20, 20, 20, 0.16)", fontSize: "13px" },
                        "& th": { borderBottom: "1px solid rgba(20, 20, 20, 0.16)", fontSize: "13px" },
                    }}
                >
                    <TableHead>
                        <TableRow>
                            <TableCell style={{ color: "#242424", width: "20%" }}>Precificacao</TableCell>
                            <TableCell style={{ color: "#242424", width: "10%" }}>Status</TableCell>
                            <TableCell style={{ color: "#242424", width: "10%" }}>Coupon</TableCell>
                            <TableCell style={{ color: "#242424", width: "26%" }}>Link temporario</TableCell>
                            <TableCell align="center" style={{ color: "#242424", width: "12%" }}>
                                Pagamento Status
                            </TableCell>
                            <TableCell align="center" style={{ color: "#242424", width: "12%" }}>
                                Criado em
                            </TableCell>
                            <TableCell align="center" style={{ color: "#242424", width: "10%" }}>
                                Ações
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {processos.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} sx={{ color: "#666666" }}>
                                    {loading ? "Carregando..." : "Nenhum processo de venda cadastrado."}
                                </TableCell>
                            </TableRow>
                        ) : (
                            processos.map((processo) => (
                                <TableRow key={processo.id} sx={{ "& td": { color: "#242424" } }}>
                                    <TableCell>{formataValor("REAL", getTotalItensValor(processo))}</TableCell>
                                    <TableCell>{processo.status || "-"}</TableCell>
                                    <TableCell>{processo.coupon || "-"}</TableCell>
                                    <TableCell>
                                        {processo.temporaryAccessUrl ? (
                                            <a
                                                href={processo.temporaryAccessUrl}
                                                target="_blank"
                                                rel="noreferrer"
                                                style={{ color: "#141414", wordBreak: "break-all" }}
                                            >
                                                {processo.temporaryAccessUrl}
                                            </a>
                                        ) : (
                                            "-"
                                        )}
                                    </TableCell>
                                    <TableCell align="center">{getPagamentoStatus(processo)}</TableCell>
                                    <TableCell align="center">{formatDateDisplay(processo.createdAt)}</TableCell>
                                    <TableCell align="center">
                                        <IconButton onClick={() => handleOpenEditModal(processo, true)} sx={{ color: "#141414" }}>
                                            <VisibilityOutlinedIcon fontSize="small" />
                                        </IconButton>
                                        {!STATUS_SEM_EDICAO_EXCLUSAO.includes((processo.status || "").toUpperCase()) && (
                                            <>
                                                <IconButton onClick={() => handleOpenEditModal(processo)} sx={{ color: "#141414" }}>
                                                    <EditOutlinedIcon fontSize="small" />
                                                </IconButton>
                                                <IconButton
                                                    onClick={() => handleExcluirProcesso(processo)}
                                                    disabled={excluindoId === processo.id}
                                                    sx={{ color: "#303030" }}
                                                >
                                                    <DeleteOutlineIcon fontSize="small" />
                                                </IconButton>
                                            </>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </Box>

            <Dialog
                open={openModal}
                onClose={() => setOpenModal(false)}
                maxWidth={false}
                PaperProps={{ sx: { backgroundColor: "#ffffff", color: "#242424", width: { xs: "95vw", md: "75vw" }, maxWidth: { xs: "95vw", md: "75vw" }, m: 1 } }}
            >
                <DialogTitle sx={{ color: "#242424" }}>
                    {modoSomenteLeitura ? "Visualizar processo de vendas" : modoEdicao ? "Editar processo de vendas" : "Cadastrar processo de vendas"}
                </DialogTitle>
                <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    {carregandoDetalhes ? (
                        <Typography sx={{ color: "#666666" }}>Carregando detalhes...</Typography>
                    ) : (
                    <>
                    {modoEdicao && (
                        <Box display="flex" gap={2}>
                            <TextField
                                label="Status"
                                value={editStatus}
                                onChange={(e) => setEditStatus(e.target.value)}
                                disabled={modoSomenteLeitura}
                                InputLabelProps={{ sx: { color: "#141414" } }}
                                InputProps={{ sx: { color: "#242424" } }}
                                sx={{ background: "rgba(255,255,255,0.06)", flex: 1 }}
                            />
                            <TextField
                                label="Coupon"
                                value={editCoupon}
                                onChange={(e) => setEditCoupon(e.target.value)}
                                disabled={modoSomenteLeitura}
                                InputLabelProps={{ sx: { color: "#141414" } }}
                                InputProps={{ sx: { color: "#242424" } }}
                                sx={{ background: "rgba(255,255,255,0.06)", flex: 1 }}
                            />
                        </Box>
                    )}

                    <Box>
                        <Typography variant="body2" sx={{ color: "#141414", mb: 0.5 }}>
                            Template de contrato
                        </Typography>
                        <Select
                            value={templateSelecionado}
                            options={templateOptions}
                            onChange={handleSelecionarTemplate}
                            isSearchable
                            isDisabled={modoSomenteLeitura}
                            styles={createCrmSelectStyles()}
                            placeholder="Selecione"
                            menuPortalTarget={document.body}
                            menuPosition="fixed"
                        />
                        {buscandoVersaoTemplate && (
                            <Typography variant="caption" sx={{ color: "#666666" }}>
                                Buscando versao ativa do template...
                            </Typography>
                        )}
                        {!buscandoVersaoTemplate && templateSelecionado && templateVersionId && (
                            <Typography variant="caption" sx={{ color: "#666666" }}>
                                Versao ativa selecionada: #{templateVersionId}
                            </Typography>
                        )}
                    </Box>

                    <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="body2" sx={{ color: "#141414" }}>
                            Produtos
                        </Typography>
                        {!modoSomenteLeitura && (
                            <Button onClick={adicionarItem} sx={{ color: "#141414" }}>
                                + Adicionar produto
                            </Button>
                        )}
                    </Box>

                    <Table
                        size="small"
                        sx={{
                            color: "#242424",
                            "& td, & th": { borderBottom: "1px solid rgba(20, 20, 20, 0.16)", fontSize: "13px", color: "#242424" },
                        }}
                    >
                        <TableHead>
                            <TableRow>
                                <TableCell style={{ color: "#242424" }}>Produto</TableCell>
                                <TableCell style={{ color: "#242424" }}>Precificacao</TableCell>
                                <TableCell style={{ color: "#242424", width: "110px" }}>Quantidade</TableCell>
                                <TableCell style={{ color: "#242424", width: "150px" }}>Tipo desconto</TableCell>
                                <TableCell style={{ color: "#242424", width: "120px" }}>Desconto</TableCell>
                                <TableCell style={{ color: "#242424", width: "120px" }}>Total</TableCell>
                                <TableCell style={{ color: "#242424", width: "48px" }} />
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {itensVenda.map((linha, indice) => {
                                const { finalPrice } = calcularLinha(linha);
                                return (
                                    <TableRow key={indice}>
                                        <TableCell sx={{ minWidth: "180px" }}>
                                            <Select
                                                value={linha.produto}
                                                options={produtoOptions}
                                                onChange={(option: any) => atualizarItem(indice, { produto: option, precificacao: null })}
                                                isSearchable
                                                isDisabled={modoSomenteLeitura}
                                                styles={createCrmSelectStyles()}
                                                placeholder="Selecione"
                                                menuPortalTarget={document.body}
                                                menuPosition="fixed"
                                            />
                                        </TableCell>
                                        <TableCell sx={{ minWidth: "200px" }}>
                                            <Select
                                                value={linha.precificacao}
                                                options={precificacaoOptionsPara(linha.produto?.value)}
                                                onChange={(option: any) => atualizarItem(indice, { precificacao: option })}
                                                isSearchable
                                                styles={createCrmSelectStyles()}
                                                placeholder={linha.produto ? "Selecione" : "Selecione um produto primeiro"}
                                                isDisabled={modoSomenteLeitura || !linha.produto}
                                                menuPortalTarget={document.body}
                                                menuPosition="fixed"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <TextField
                                                type="number"
                                                inputProps={{ min: 1 }}
                                                value={linha.quantidade}
                                                onChange={(e) => atualizarItem(indice, { quantidade: e.target.value })}
                                                disabled={modoSomenteLeitura}
                                                InputProps={{ sx: { color: "#242424" } }}
                                                sx={{ background: "rgba(255,255,255,0.06)" }}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <TextField
                                                select
                                                value={linha.discountType}
                                                onChange={(e) => atualizarItem(indice, { discountType: e.target.value })}
                                                disabled={modoSomenteLeitura}
                                                SelectProps={{ sx: { color: "#242424" } }}
                                                sx={{ background: "rgba(255,255,255,0.06)" }}
                                            >
                                                <MenuItem value="VALUE">Valor</MenuItem>
                                                <MenuItem value="PERCENT">Percentual</MenuItem>
                                            </TextField>
                                        </TableCell>
                                        <TableCell>
                                            <TextField
                                                type="number"
                                                value={linha.discountValue}
                                                onChange={(e) => atualizarItem(indice, { discountValue: e.target.value })}
                                                disabled={modoSomenteLeitura}
                                                InputProps={{ sx: { color: "#242424" } }}
                                                sx={{ background: "rgba(255,255,255,0.06)" }}
                                            />
                                        </TableCell>
                                        <TableCell>{formataValor("REAL", finalPrice)}</TableCell>
                                        <TableCell>
                                            {!modoSomenteLeitura && (
                                                <IconButton onClick={() => removerItem(indice)} disabled={itensVenda.length === 1} sx={{ color: "#303030" }}>
                                                    <DeleteOutlineIcon />
                                                </IconButton>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                            <TableRow>
                                <TableCell colSpan={2} align="right" sx={{ fontWeight: 700 }}>
                                    Totais
                                </TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>
                                    {itensVenda.reduce((soma, linha) => soma + (Number(linha.quantidade) || 0), 0)}
                                </TableCell>
                                <TableCell colSpan={2} />
                                <TableCell sx={{ fontWeight: 700 }}>
                                    {formataValor("REAL", itensVenda.reduce((soma, linha) => soma + calcularLinha(linha).finalPrice, 0))}
                                </TableCell>
                                <TableCell />
                            </TableRow>
                        </TableBody>
                    </Table>

                    <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="body2" sx={{ color: "#141414" }}>
                            Opcoes de pagamento
                        </Typography>
                        {!modoSomenteLeitura && (
                            <Button onClick={adicionarPagamento} sx={{ color: "#141414" }}>
                                + Adicionar pagamento
                            </Button>
                        )}
                    </Box>

                    {pagamentos.map((linha, indice) => (
                        <Box
                            key={indice}
                            sx={{ backgroundColor: "rgba(20, 20, 20, 0.03)", border: "1px solid rgba(20, 20, 20, 0.1)", borderRadius: "14px", padding: "12px", display: "flex", flexDirection: "column", gap: 1.5 }}
                        >
                            <Box display="flex" gap={2} alignItems="center">
                                <Box flex={1}>
                                    <Typography variant="body2" sx={{ color: "#141414", mb: 0.5 }}>
                                        Tipo de pagamento
                                    </Typography>
                                    <Select
                                        value={linha.tipopagamento}
                                        options={tipopagamentoOptions(MEIO_PAGAMENTO_PADRAO.value)}
                                        onChange={(option: any) =>
                                            atualizarPagamento(indice, {
                                                tipopagamento: option,
                                                parcelas: option?.value === "PIX" ? "1" : linha.parcelas,
                                                parcelaMaxDesconto: option?.value === "PIX" ? "" : linha.parcelaMaxDesconto,
                                            })
                                        }
                                        isSearchable
                                        isDisabled={modoSomenteLeitura}
                                        styles={createCrmSelectStyles()}
                                        placeholder="Selecione"
                                        menuPortalTarget={document.body}
                                        menuPosition="fixed"
                                    />
                                </Box>

                                {!modoSomenteLeitura && (
                                    <IconButton onClick={() => removerPagamento(indice)} disabled={pagamentos.length === 1} sx={{ color: "#303030" }}>
                                        <DeleteOutlineIcon />
                                    </IconButton>
                                )}
                            </Box>

                            <Box display="flex" gap={2}>
                                <TextField
                                    label="Parcelas"
                                    type="number"
                                    inputProps={{ min: 1 }}
                                    value={linha.tipopagamento?.value === "PIX" ? "1" : linha.parcelas}
                                    onChange={(e) => atualizarPagamento(indice, { parcelas: e.target.value })}
                                    disabled={modoSomenteLeitura || linha.tipopagamento?.value === "PIX"}
                                    InputLabelProps={{ sx: { color: "#141414" } }}
                                    InputProps={{ sx: { color: "#242424" } }}
                                    sx={{ background: "rgba(255,255,255,0.06)", flex: 1 }}
                                />
                                <TextField
                                    select
                                    label="Tipo desconto"
                                    value={linha.tipoDesconto}
                                    onChange={(e) => atualizarPagamento(indice, { tipoDesconto: e.target.value })}
                                    disabled={modoSomenteLeitura}
                                    InputLabelProps={{ sx: { color: "#141414" } }}
                                    SelectProps={{ sx: { color: "#242424" } }}
                                    sx={{ background: "rgba(255,255,255,0.06)", flex: 1 }}
                                >
                                    <MenuItem value="VALUE">Valor</MenuItem>
                                    <MenuItem value="PERCENT">Percentual</MenuItem>
                                </TextField>
                                <TextField
                                    label="Valor desconto"
                                    type="number"
                                    value={linha.valorDesconto}
                                    onChange={(e) => atualizarPagamento(indice, { valorDesconto: e.target.value })}
                                    disabled={modoSomenteLeitura}
                                    InputLabelProps={{ sx: { color: "#141414" } }}
                                    InputProps={{ sx: { color: "#242424" } }}
                                    sx={{ background: "rgba(255,255,255,0.06)", flex: 1 }}
                                />
                                <TextField
                                    label="Parcela max. desconto"
                                    type="number"
                                    inputProps={{ min: 1 }}
                                    value={linha.tipopagamento?.value === "PIX" ? "" : linha.parcelaMaxDesconto}
                                    onChange={(e) => atualizarPagamento(indice, { parcelaMaxDesconto: e.target.value })}
                                    disabled={modoSomenteLeitura || linha.tipopagamento?.value === "PIX"}
                                    InputLabelProps={{ sx: { color: "#141414" } }}
                                    InputProps={{ sx: { color: "#242424" } }}
                                    sx={{ background: "rgba(255,255,255,0.06)", flex: 1 }}
                                />
                            </Box>
                        </Box>
                    ))}
                    </>
                    )}
                </DialogContent>
                <DialogActions sx={{ display: "flex", gap: 1 }}>
                    <Button onClick={() => setOpenModal(false)} sx={{ color: "#242424" }}>
                        {modoSomenteLeitura ? "Fechar" : "Cancelar"}
                    </Button>
                    {!modoSomenteLeitura && (
                        <Button
                            onClick={handleSave}
                            color="primary"
                            disabled={
                                saving ||
                                carregandoDetalhes ||
                                !templateVersionId ||
                                !itensVenda.some((linha) => linha.produto && linha.precificacao)
                            }
                            sx={{ fontWeight: 700, color: "#141414" }}
                        >
                            {saving ? "Salvando..." : "Salvar"}
                        </Button>
                    )}
                </DialogActions>
            </Dialog>
        </Box>
    );
}