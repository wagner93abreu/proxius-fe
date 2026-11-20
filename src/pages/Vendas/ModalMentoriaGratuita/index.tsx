import { managementDialogStyles, managementFieldStyles } from "../../../styles/managementStyles";
import createCrmSelectStyles from "../../../styles/crmSelectStyles";
import React from "react";
import { Box, Grid, Modal } from "@mui/material";
import styled from "styled-components";
import Select from "react-select";
import ReactInputMask from "react-input-mask";
import { Controller, useForm } from "react-hook-form";
import autenticaStore from "../../../stores/autentica.store";
import http from "../../../http";
import IBodyRequest from "../../../types/IBodyRequest";
import IClifor from "../../../types/IClifor";
import IProduto from "../../../types/IProduto";
import IPrecificacao from "../../../types/IPrecificacao";
import IVenda from "../../../types/IVenda";
import IItem from "../../../types/IItem";
import Titulo from "../../../components/Titulo";
import Botao from "../../../components/Botao";
import { transformDate } from "../../../customFunctions/mascarasFormatacao";
import { mostrarMensagem } from "../../../stores/mensagem.store";

const BoxCustomizado = styled(Box)`
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 80vw;
    max-width: 900px;
    max-height: 90vh;
    overflow-y: auto;
    background-color: #fffdfa;
    border: none;
    border-radius: 12px;
    padding: 1em 5em;
    ${managementDialogStyles}
`;

const SelectCustomizado = styled(Select)`
    background: #f0f0f0;
    margin-top: 3px;
    margin-bottom: 25px;
    box-sizing: border-box;
    box-shadow: none;
    border-radius: 12px;
    border: none;
    width: 100%;
`;

const InputMaskCustomizado = styled(ReactInputMask)`
    font-size: 15px;
    background: #f0f0f0;
    margin-top: 3px;
    margin-bottom: 25px;
    box-sizing: border-box;
    box-shadow: none;
    border-radius: 12px;
    border: none;
    width: 100%;
    padding: 10px;
    ${managementFieldStyles}
`;

const Rotulo = styled.label`
    display: block;
    font-weight: 700;
    font-size: 16px;
    line-height: 19px;
    color: #35252b;
`;

const SpanErro = styled.span`
    float: left;
    color: #b3261e;
    font-size: 14px;
    margin-top: -25px;
`;

const BotaoCustomizado = styled(Botao)`
    width: 220px;
    display: block;
    margin: 0 auto;
`;

type SelectOption = {
    value: string | number | null;
    label: string;
};

type FormularioMentoriaGratuita = {
    cliente: SelectOption | null;
    produto: SelectOption | null;
    precificacao: SelectOption | null;
    datavenda: string;
};

export default function ModalMentoriaGratuita({
    open,
    handleClose,
}: {
    open: boolean;
    handleClose: () => void;
}) {
    const { usuario } = autenticaStore;
    const [clientes, setClientes] = React.useState<IClifor[]>([]);
    const [produtos, setProdutos] = React.useState<IProduto[]>([]);
    const [precificacoes, setPrecificacoes] = React.useState<IPrecificacao[]>([]);
    const { control, register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormularioMentoriaGratuita>({
        mode: "onSubmit",
        defaultValues: {
            cliente: null,
            produto: null,
            precificacao: null,
            datavenda: "",
        },
    });

    const axiosConfig = {
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${usuario.token}`,
        },
    };

    const selectMenuProps = {
        menuPortalTarget: typeof document !== "undefined" ? document.body : null,
        menuPosition: "fixed" as const,
        styles: {
            ...createCrmSelectStyles(),
            menuPortal: (base: Record<string, unknown>) => ({
                ...base,
                zIndex: 9999,
            }),
        },
    };

    React.useEffect(() => {
        http.get<IBodyRequest<IProduto>>("produtos?size=500", axiosConfig)
            .then(resposta => {
                setProdutos(
                    resposta.data.content.filter(produto => produto.active && produto.origem === "GRATUITO")
                );
            })
            .catch(erro => {
                mostrarMensagem(erro, "error");
            });

        http.get<IBodyRequest<IPrecificacao>>("precificacao?size=500", axiosConfig)
            .then(resposta => {
                setPrecificacoes(resposta.data.content.filter(precificacao => precificacao.active));
            })
            .catch(erro => {
                mostrarMensagem(erro, "error");
            });

        http.get<IBodyRequest<IClifor>>("clifor?size=500", axiosConfig)
            .then(resposta => {
                setClientes(resposta.data.content.filter(cliente => cliente.active));
            })
            .catch(erro => {
                mostrarMensagem(erro, "error");
            });
    }, []);

    React.useEffect(() => {
        if (!open) {
            reset({
                cliente: null,
                produto: null,
                precificacao: null,
                datavenda: "",
            });
        }
    }, [open, reset]);

    const produtoSelecionado = watch("produto");

    React.useEffect(() => {
        if (!produtoSelecionado) {
            setValue("precificacao", null);
            return;
        }

        const precificacoesDoProduto = precificacoes
            .filter(precificacao => precificacao.idproduto === produtoSelecionado.value)
            .map(precificacao => ({
                value: precificacao.id,
                label: `${precificacao.cupom} - ${formataValor(precificacao.moeda, precificacao.valor)}`,
            }));

        if (precificacoesDoProduto.length === 1) {
            setValue("precificacao", precificacoesDoProduto[0]);
            return;
        }

        setValue("precificacao", null);
    }, [produtoSelecionado, precificacoes, setValue]);

    const clientesFormatados = clientes.map(cliente => ({
        value: cliente.cpfcnpj,
        label: `${cliente.cpfcnpj} - ${cliente.nomecomercial} ${cliente.nomesocial}`,
    }));

    const produtosFormatados = produtos.map(produto => ({
        value: produto.id,
        label: `${produto.origem} - ${produto.nome}`,
    }));

    const precificacoesFormatadas = produtoSelecionado
        ? precificacoes
            .filter(precificacao => precificacao.idproduto === produtoSelecionado.value)
            .map(precificacao => ({
                value: precificacao.id,
                label: `${precificacao.cupom} - ${formataValor(precificacao.moeda, precificacao.valor)}`,
            }))
        : [];

    function formataValor(moeda: string, valor: string | number) {
        if (moeda === "REAL") {
            return `R$ ${Number(valor).toLocaleString("pt-br", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        }
        if (moeda === "DOLAR") {
            return `U$ ${Number(valor).toLocaleString("pt-br", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        }
        if (moeda === "EURO") {
            return `€ ${Number(valor).toLocaleString("pt-br", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        }

        return Number(valor).toLocaleString("pt-br", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    function fecharModal() {
        reset({
            cliente: null,
            produto: null,
            precificacao: null,
            datavenda: "",
        });
        handleClose();
    }

    function cadastrarMentoriaGratuita(data: FormularioMentoriaGratuita) {
        const itens: IItem[] = [
            {
                idproduct: data.produto?.value ?? null,
                product: data.produto?.label ?? "",
                pricing: 0,
                quantity: 1,
                itemOrder: 1,
                unitPrice: 0,
                discountType: "VALUE",
                discountValue: 0,
                finalPrice: 0,
            },
        ];

        const venda: IVenda = {
            id: null,
            statusvenda: "FINALIZADA",
            idproduto: itens[0].idproduct as string,
            produto: itens[0].product,
            datavenda: transformDate(data.datavenda),
            documentocliente: data.cliente?.value as string,
            pagamento: [
                {
                    id: null,
                    moeda: "BRL",
                    meiopagamento: "GRATUITO",
                    tipopagamento: "GRATUITO",
                    parcelas: 1,
                    valorcomprador: 0.00,
                    valorbase: 0.00,
                    taxas: 0.00,
                    comissao: 0.00,
                    datapagamento: transformDate(data.datavenda) + "T00:00:00",
                    cupom: "GRATUITO",
                },
            ],
            itens: itens,
        };

        http.post("venda", venda, axiosConfig)
            .then(() => {
                mostrarMensagem("Mentoria gratuita cadastrada com sucesso!", "success");
                fecharModal();
            })
            .catch(erro => {
                mostrarMensagem("ERRO:" + erro, "error");
            });
    }

    return (
        <Modal
            open={open}
            onClose={fecharModal}
            aria-labelledby="modal-mentoria-gratuita-title"
            aria-describedby="modal-mentoria-gratuita-description"
        >
            <BoxCustomizado>
                <form onSubmit={handleSubmit(cadastrarMentoriaGratuita)}>
                    <Titulo>Cadastro de Mentoria Gratuita</Titulo>
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                            <Rotulo>Cliente *</Rotulo>
                            <Controller
                                name="cliente"
                                control={control}
                                rules={{ required: "Campo obrigatório" }}
                                render={({ field }) => (
                                    <SelectCustomizado
                                        {...field}
                                        options={clientesFormatados}
                                        isSearchable
                                        value={field.value}
                                        onChange={field.onChange}
                                        {...selectMenuProps}
                                    />
                                )}
                            />
                            {errors.cliente && <SpanErro>{errors.cliente.message}</SpanErro>}
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Rotulo>Produto *</Rotulo>
                            <Controller
                                name="produto"
                                control={control}
                                rules={{ required: "Campo obrigatório" }}
                                render={({ field }) => (
                                    <SelectCustomizado
                                        {...field}
                                        options={produtosFormatados}
                                        isSearchable
                                        value={field.value}
                                        onChange={value => {
                                            field.onChange(value);
                                        }}
                                        {...selectMenuProps}
                                    />
                                )}
                            />
                            {errors.produto && <SpanErro>{errors.produto.message}</SpanErro>}
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Rotulo>Precificação *</Rotulo>
                            <Controller
                                name="precificacao"
                                control={control}
                                rules={{ required: "Campo obrigatório" }}
                                render={({ field }) => (
                                    <SelectCustomizado
                                        {...field}
                                        options={precificacoesFormatadas}
                                        isSearchable
                                        value={field.value}
                                        onChange={field.onChange}
                                        {...selectMenuProps}
                                    />
                                )}
                            />
                            {errors.precificacao && <SpanErro>{errors.precificacao.message}</SpanErro>}
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Rotulo>Data *</Rotulo>
                            <InputMaskCustomizado
                                mask="99/99/9999"
                                maskChar={null}
                                {...register("datavenda", {
                                    required: "Campo obrigatório",
                                    pattern: {
                                        value: /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/(19|20)\d\d$/,
                                        message: "Favor digitar uma data válida",
                                    },
                                })}
                            />
                            {errors.datavenda && <SpanErro>{errors.datavenda.message}</SpanErro>}
                        </Grid>
                    </Grid>
                    <BotaoCustomizado>Cadastrar</BotaoCustomizado>
                </form>
            </BoxCustomizado>
        </Modal>
    );
}