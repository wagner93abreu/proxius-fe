import { managementDialogStyles, managementFieldStyles } from "../../../../styles/managementStyles";
import { useState } from "react";
import { Box, Grid, Modal } from '@mui/material';
import styled from "styled-components";
import { GridRowId } from "@mui/x-data-grid";
import { useForm } from "react-hook-form";
import Botao from "../../../../components/Botao";
import Titulo from "../../../../components/Titulo";
import autenticaStore from "../../../../stores/autentica.store";
import http from "../../../../http";
import IContractTemplateVersion from "../../../../types/IContractTemplateVersion";
import { mostrarMensagem } from "../../../../stores/mensagem.store";

const BoxCustomizado = styled(Box)`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 65vw;
  max-height: 90vh;
  overflow-y: auto;
  background-color: #fffdfa;
  border: none;
  border-radius: 12px;
  padding: 1em 3em;
    ${managementDialogStyles}
`;

const Campo = styled.input`
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

const CampoTextarea = styled.textarea`
    font-size: 15px;
    background: #f0f0f0;
    margin-top: 3px;
    margin-bottom: 25px;
    box-sizing: border-box;
    box-shadow: none;
    border-radius: 12px;
    border: none;
    width: 100%;
    min-height: 140px;
    padding: 10px;
    resize: vertical;
    font-family: Consolas, monospace;
    ${managementFieldStyles}
`;

const BotaoCustomizado = styled(Botao)`
    width: 50%;
    display: block;
    margin: 0 auto;
`;

const Rotulo = styled.label`
    display: block;
    font-weight: 700;
    font-size: 16px;
    line-height: 19px;
    color: #35252b
`;

const SpanErro = styled.span`
    float: left;
    color: #b3261e;
    font-size: 14px;
    margin-top: -25px;
`;

const InstrucaoPlaceholders = styled.div`
    background: #f7f1e9;
    border: 1px dashed rgba(85, 8, 29, 0.2);
    border-radius: 12px;
    padding: 10px 14px;
    margin-top: 3px;
    margin-bottom: 12px;
    font-size: 13px;
    color: #35252b;
    line-height: 1.8;

    code {
        font-family: Consolas, monospace;
        background: #fffdfa;
        padding: 1px 5px;
        border-radius: 12px;
        margin-right: 6px;
        display: inline-block;
    }
`;

export default function ModalContractTemplateVersion({ openVersao, handleCloseVersao, versoes, id, tipo, idTemplate }: { openVersao: boolean, handleCloseVersao: () => void, versoes: IContractTemplateVersion[], id: GridRowId[], tipo: string, idTemplate: string }) {
    const [preencheu, setPreencheu] = useState(false);
    const { register, handleSubmit, reset, formState: { errors }, setValue, getValues } = useForm();
    const { usuario } = autenticaStore;

    const axiosConfig = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${usuario.token}`,
        },
    };

    if (openVersao && !preencheu && tipo === 'edita') {
        const versaoEdita = versoes.find(item => item.id === id[0]);
        setValue('version', versaoEdita?.version ? versaoEdita.version : "");
        setValue('description', versaoEdita?.description ? versaoEdita.description : "");
        setValue('htmlTemplate', versaoEdita?.htmlTemplate ? versaoEdita.htmlTemplate : "");
        setPreencheu(true);
    } else if (openVersao && !preencheu && tipo === 'cadastra') {
        reset();
        setValue('version', '1.0');
        setPreencheu(true);
    }

    if (!openVersao && preencheu) {
        reset();
        setPreencheu(false);
    }

    function salvarVersao(data: any) {
        // Cadastro cria um registro novo (POST). Edição atualiza o registro
        // existente no lugar (PUT), sem gerar uma nova versão.
        if (tipo === 'cadastra') {
            const payload: IContractTemplateVersion = {
                id: null,
                templateId: idTemplate,
                version: data.version,
                active: true,
                htmlTemplate: data.htmlTemplate,
                description: data.description || "",
                createdAt: new Date().toISOString(),
                updatedAt: null,
                createdBy: localStorage.getItem('userID'),
            };

            http.post('contract-template-version', payload, axiosConfig)
                .then(() => {
                    reset();
                    handleCloseVersao();
                    mostrarMensagem('registro cadastrado com SUCESSO!', "success");
                })
                .catch(erro => {
                    mostrarMensagem('ERRO:' + erro, "error");
                });
            return;
        }

        const versaoOriginal = versoes.find(item => item.id === id[0]);

        const payload: IContractTemplateVersion = {
            id: id[0],
            templateId: idTemplate,
            version: data.version,
            active: versaoOriginal?.active ?? true,
            htmlTemplate: data.htmlTemplate,
            description: data.description || "",
            createdAt: versaoOriginal?.createdAt ?? null,
            updatedAt: new Date().toISOString(),
            createdBy: versaoOriginal?.createdBy ?? localStorage.getItem('userID'),
        };

        http.put('contract-template-version', payload, axiosConfig)
            .then(() => {
                reset();
                handleCloseVersao();
                mostrarMensagem('Alteração efetuada com sucesso!', "success");
            })
            .catch(erro => {
                mostrarMensagem('ERRO:' + erro, "error");
            });
    }

    function visualizarVersao() {
        const htmlTemplateAtual = getValues('htmlTemplate');

        if (!htmlTemplateAtual) {
            mostrarMensagem('Preencha o HTML do template antes de visualizar.', "warning");
            return;
        }

        const novaAba = window.open('', '_blank');

        if (!novaAba) {
            mostrarMensagem('Não foi possível abrir a pré-visualização. Verifique se o navegador bloqueou a nova aba.', "error");
            return;
        }

        novaAba.document.open();
        novaAba.document.write(htmlTemplateAtual);
        novaAba.document.close();
        novaAba.document.title = 'Pré-visualização do template';
    }

    return (
        <Modal
            open={openVersao}
            onClose={handleCloseVersao}
            aria-labelledby="modal-modal-title"
            aria-describedby="modal-modal-description"
        >
            <BoxCustomizado>
                <Titulo>{`${tipo === 'cadastra' ? 'Cadastrar' : 'Editar'} Versão de Template`}</Titulo>
                <form onSubmit={handleSubmit(salvarVersao)}>
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={4}>
                            <Rotulo>Versão</Rotulo>
                            <Campo type="text" maxLength={20} {...register('version', { required: 'Campo obrigatório' })} />
                            {errors.version && typeof errors.version.message === 'string' && <SpanErro>{errors.version.message}</SpanErro>}
                        </Grid>
                        <Grid item xs={12} md={8}>
                            <Rotulo>Descrição</Rotulo>
                            <Campo type="text" maxLength={255} {...register('description')} />
                        </Grid>
                        <Grid item xs={12}>
                            <Rotulo>HTML do Template</Rotulo>
                            <InstrucaoPlaceholders>
                                O sistema espera que o HTML contenha os seguintes campos (placeholders), que serão substituídos automaticamente pelos dados do cliente e da venda:
                                <br />
                                <code>{'{{cliente_nome}}'}</code>
                                <code>{'{{cliente_cpf}}'}</code>
                                <code>{'{{cliente_email}}'}</code>
                                <code>{'{{cliente_telefone}}'}</code>
                                <code>{'{{cliente_endereco}}'}</code>
                                <code>{'{{sales_process_uuid}}'}</code>
                                <code>{'{{itens}}'}</code>
                                <code>{'{{valor_total}}'}</code>
                                <code>{'{{pagamento}}'}</code>
                            </InstrucaoPlaceholders>
                            <CampoTextarea {...register('htmlTemplate', { required: 'Campo obrigatório' })} />
                            {errors.htmlTemplate && typeof errors.htmlTemplate.message === 'string' && <SpanErro>{errors.htmlTemplate.message}</SpanErro>}
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <BotaoCustomizado type="button" onClick={visualizarVersao}>Pré-visualizar</BotaoCustomizado>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <BotaoCustomizado>{`${tipo === 'cadastra' ? 'Cadastrar' : 'Salvar'}`}</BotaoCustomizado>
                        </Grid>
                    </Grid>
                </form>
            </BoxCustomizado>
        </Modal>
    );
}
