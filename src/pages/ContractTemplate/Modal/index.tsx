import { managementDialogStyles, managementFieldStyles } from "../../../styles/managementStyles";
import React, { useState } from "react";
import { Grid, Modal } from '@mui/material';
import { Box } from "@mui/material";
import Titulo from "../../../components/Titulo";
import styled from "styled-components";
import Botao from "../../../components/Botao";
import autenticaStore from "../../../stores/autentica.store";
import { useForm } from "react-hook-form";
import http from "../../../http";
import { GridRowId } from "@mui/x-data-grid";
import IContractTemplate from "../../../types/IContractTemplate";
import VersoesContractTemplate from "../Versoes";
import { mostrarMensagem } from "../../../stores/mensagem.store";

const BoxCustomizado = styled(Box)`
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 80vw;
    max-height: 90vh;
    overflow-y: auto;
    background-color: #ffffff;
    border: none;
    border-radius: 12px;
    padding: 1em 5em;
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
`

const BotaoCustomizado = styled(Botao)`
    width: 50%;
    display: block;
    margin: 0 auto;
`

const Rotulo = styled.label`
    display: block;
    font-weight: 700;
    font-size: 16px;
    line-height: 19px;
    color: #242424
`

const SpanErro = styled.span`
    float: left;
    color: #303030;
    font-size: 14px;
    margin-top: -25px;
`

const VersoesWrapper = styled.div`
    margin-top: 8px;
`;

interface IContractTemplatePost {
    id: string,
    name: string,
    description: string,
    createdBy: string | number | null,
}

export default function ModalContractTemplate({ open, handleClose, templates, id, tipo }: { open: boolean, handleClose: () => void, templates: IContractTemplate[], id: GridRowId[], tipo: string }) {
    const [idTemplate, setIdTemplate] = useState("");
    const { register, handleSubmit, reset, formState: { errors }, setValue } = useForm();
    const [preencheu, setPreencheu] = useState(false);
    const { usuario } = autenticaStore;

    const axiosConfig = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${usuario.token}`,
        },
    };

    if (open && !preencheu && tipo === 'edita') {
        const template = templates.find(item => item.id === id[0]);
        setIdTemplate(template?.id ? template.id.toString() : "")
        setValue('name', template?.name ? template.name : "")
        setValue('description', template?.description ? template.description : "")
        setPreencheu(true)
    } else if (open && !preencheu && tipo === 'cadastra') {
        reset()
        setPreencheu(true)
    }

    if (!open && preencheu) {
        reset()
        setPreencheu(false)
    }

    function postContractTemplate(data: any) {
        const template: IContractTemplatePost = {
            id: idTemplate,
            name: data.name,
            description: data.description,
            createdBy: localStorage.getItem('userID'),
        }

        if (tipo === 'cadastra') {
            http.post(`contract-template`, template, axiosConfig)
                .then(() => {
                    mostrarMensagem("registro cadastrado com SUCESSO!", "success")
                    reset()
                    handleClose()
                })
                .catch(erro => {
                    mostrarMensagem("ERRO:" + erro, "error")
                })
        } else {
            http.put("contract-template", template, axiosConfig)
                .then(() => {
                    mostrarMensagem("Alteração efetuada com sucesso!", "success")
                    reset()
                    handleClose()
                })
                .catch(erro => {
                    mostrarMensagem("ERRO:" + erro, "error")
                })
        }
    }

    const Close = () => {
        reset()
        handleClose()
    }

    return (
        <>
            <Modal
                open={open}
                onClose={() => Close()}
                aria-labelledby="modal-modal-title"
                aria-describedby="modal-modal-description"

            >
                <BoxCustomizado role="dialog" aria-label="Template de Contrato">
                    <form onSubmit={handleSubmit(postContractTemplate)}>
                        <Titulo>{`${tipo === 'cadastra' ? "Cadastrar" : "Editar"} Template de Contrato`}</Titulo>
                        <Grid container spacing={2}>
                            <Grid item xs={12} md={4}>
                                <Rotulo>Nome</Rotulo>
                                <Campo type="text" placeholder="" maxLength={150} {...register('name', { required: "Campo obrigatório" })} />
                                {errors.name && typeof errors.name.message === 'string' && <SpanErro>{errors.name.message}</SpanErro>}
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Rotulo>Descrição</Rotulo>
                                <Campo type="text" placeholder="" maxLength={255} {...register('description')} />
                                {errors.description && typeof errors.description.message === 'string' && <SpanErro>{errors.description.message}</SpanErro>}
                            </Grid>
                            <Grid item xs={12} md={2}>
                                <Rotulo>&nbsp;</Rotulo>
                                <BotaoCustomizado style={{
                                    marginBottom: "40px",
                                    marginTop: "-3px",
                                    marginLeft: "0px"
                                }}>
                                    {`${tipo === 'cadastra' ? "Cadastrar" : "Salvar"}`}</BotaoCustomizado>
                            </Grid>
                        </Grid>
                    </form>
                    {tipo === 'cadastra' ? "" : (
                        <VersoesWrapper>
                            <VersoesContractTemplate idTemplate={idTemplate} />
                        </VersoesWrapper>
                    )}
                </BoxCustomizado>
            </Modal >
        </>
    );
}
