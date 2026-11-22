import { useState } from "react";
import { Modal } from '@mui/material';
import { Box } from "@mui/material";
import Titulo from "../../../components/Titulo";
import styled from "styled-components";
import Botao from "../../../components/Botao";
import autenticaStore from "../../../stores/autentica.store";
import { Controller,useForm } from "react-hook-form";
import http from "../../../http";
import ICategoriasFinanceiro from "../../../types/ICategoriasFinanceiro";
import { GridRowId } from "@mui/x-data-grid";
import ITaxa from "../../../types/ITaxa";
import { NumericFormat } from 'react-number-format';
import { managementDialogStyles, managementFieldStyles } from "../../../styles/managementStyles";
import { mostrarMensagem } from "../../../stores/mensagem.store";

const BoxCustomizado = styled(Box)`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: min(560px, 90vw);
  max-height: 90vh;
  overflow-y: auto;
  background-color: var(--cinza);
  border: none;
  border-radius: 5px;
  padding: 1em 5em;
  ${managementDialogStyles}
`;

const Campo = styled.input`
    font-size: 15px;
    background: #f0f0f0;
    margin-top: 3px;
    margin-bottom: 25px;
    box-sizing: border-box;
    box-shadow: 2px 2px 6px rgba(0,0,0, 0.25);
    border-radius: 3px;
    border: none;
    width: 100%;
    padding: 10px;
    ${managementFieldStyles}
`
const Container = styled.div`
text-align: left;
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
    color: #242424;
`

const CampoSelect = styled.select`
    background: #F0F0F0;
    margin-top: 3px;
    margin-bottom: 25px;
    box-sizing: border-box;
    box-shadow: 2px 2px 6px rgba(0,0,0, 0.25);
    border-radius: 3px;
    border: none;
    width: 100%;
    padding: 10px;
    ${managementFieldStyles}
`
const SpanErro = styled.span`
    float: left;
    color: #303030;
    font-size: 14px;
    margin-top: -25px;
`

export default function ModalCadastro({ open, handleClose, taxas, id, tipo }: { open: boolean, handleClose: () => void, taxas: ITaxa[], id: GridRowId[], tipo: string}) {
    const [idTaxa, setIdTaxa] = useState("");
    const { register, handleSubmit, reset, formState:{errors}, setValue, control} = useForm();
    const [output, setOutput] = useState("");
    const [preencheu, setPreencheu] = useState(false);
    const {usuario} = autenticaStore;
    
    const axiosConfig = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${usuario.token}`,
        },
    };

    if(open && !preencheu && tipo === 'edita'){
    const taxaEdita = taxas.find(item => item.id === id[0]);
    setIdTaxa(taxaEdita?.id ? taxaEdita.id.toString() : "")
    setValue('fornecedor', taxaEdita?.fornecedor ? taxaEdita.fornecedor : "")
    setValue('tipo', taxaEdita?.tipo ? taxaEdita.tipo : "")
    setValue('bandeira', taxaEdita?.bandeira ? taxaEdita.bandeira : "")
    setValue('parcela', taxaEdita?.parcela ? taxaEdita.parcela : "")
    setValue('valormaximo', taxaEdita?.valormaximo ? taxaEdita.valormaximo : "")
    let porcentagem = ''
    if(taxaEdita){
        if(taxaEdita.porcentagem){
            porcentagem = 'true'
        }else{
            porcentagem = 'false'
        }
    }
    setValue('porcentagem', porcentagem)
    setValue('valortaxa', taxaEdita?.valortaxa ? taxaEdita.valortaxa : "")
    setPreencheu(true)
    }else if(open && !preencheu && tipo === 'cadastra'){
        reset()
        setPreencheu(true)
    }

    if(!open && preencheu){
        reset()
        setPreencheu(false)
    } 

    function createTaxa(data: any){
        //setOutput(JSON.stringify(data, null, 2));
        const taxa: ITaxa = {
            id: idTaxa,
            fornecedor: data.fornecedor,
            tipo: data.tipo,
            bandeira: data.bandeira,
            parcela: data.parcela,   
            valormaximo: data.valormaximo,   
            porcentagem: data.porcentagem,   
            valortaxa: data.valortaxa   
        }
        if(tipo === 'cadastra'){
        http.post(`taxa`,taxa ,axiosConfig)
        .then(resposta => {
            mostrarMensagem("registro cadastrado com SUCESSO!", "success")
            /* reset()
            handleClose() */
        })
        .catch(erro => {            
            mostrarMensagem("ERRO:" + erro, "error")
        })  
    }else{
        http.put("taxa",taxa ,axiosConfig)
            .then(resposta => {
                reset()
                handleClose()
                mostrarMensagem("Alteração efetuada com sucesso!", "success")
                
            })
            .catch(erro => {            
                mostrarMensagem("ERRO:" + erro, "error")
            })   
    } 
    } 

    const Close =() => {
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
                <BoxCustomizado role="dialog" aria-label="Taxa">
                    <Titulo>{`${tipo === 'cadastra' ? "Cadastrar" : "Editar"} Taxa`}</Titulo>
                    <form onSubmit={handleSubmit(createTaxa)}>
                        <Container>
                            <Rotulo>Fornecedor *</Rotulo>
                            <Campo type="text" placeholder="" maxLength={100} {...register('fornecedor', {required: "Campo obrigatório"})} />
                            {errors.fornecedor && typeof errors.fornecedor.message === 'string' && <SpanErro>{errors.fornecedor.message}</SpanErro>}

                            <Rotulo>Tipo taxa *</Rotulo>
                            <Campo type="text" placeholder="" maxLength={100} {...register('tipo', {required: "Campo obrigatório"})} />
                            {errors.tipo && typeof errors.tipo.message === 'string' && <SpanErro>{errors.tipo.message}</SpanErro>}
                            
                            <Rotulo>Bandeira *</Rotulo>
                            <Campo type="text" placeholder="" maxLength={100} {...register('bandeira', {required: "Campo obrigatório"})} />
                            {errors.bandeira && typeof errors.bandeira.message === 'string' && <SpanErro>{errors.bandeira.message}</SpanErro>}

                            <Rotulo>Parcela *</Rotulo>
                            <Campo type="number" placeholder="" maxLength={100} {...register('parcela', {required: "Campo obrigatório"})} />
                            {errors.parcela && typeof errors.parcela.message === 'string' && <SpanErro>{errors.parcela.message}</SpanErro>}

                            <Rotulo>Valor Máximo</Rotulo>                   
                            <Controller
                                    name="valormaximo"
                                    control={control}                                    
                                    defaultValue=""
                                    render={({ field: { onChange, value } }) => (
                                        <NumericFormat                    
                                        value={value}
                                        prefix={"R$ "}
                                        thousandSeparator={"."}
                                        decimalScale={2}
                                        fixedDecimalScale={true}
                                        allowNegative={false}  
                                        decimalSeparator=","   
                                        allowedDecimalSeparators={[".", ","]}
                                        onValueChange={(values) => onChange(values.floatValue)}                               
                                        customInput={Campo}                                    
                                    />
                                    )}
                                />
                                {errors.valormaximo && typeof errors.valormaximo.message === 'string' && <SpanErro>{errors.valormaximo.message}</SpanErro>}  

                            <Rotulo>Valor da taxa em Porcentagem? *</Rotulo>                                
                            <CampoSelect {...register('porcentagem', {required: "Campo obrigatório"})}>
                                <option value="true">SIM</option>
                                <option value="false">NÃO, VALOR FIXO</option>
                            </CampoSelect>
                            {errors.tipo && typeof errors.tipo.message === 'string' && <SpanErro>{errors.tipo.message}</SpanErro>}

                            <Rotulo>Valor Taxa *</Rotulo>
                            <Controller
                                    name="valortaxa"
                                    control={control}
                                    rules={{ required: "Campo obrigatório" }}
                                    defaultValue=""
                                    render={({ field: { onChange, value } }) => (
                                        <NumericFormat                    
                                        value={value}
                                        decimalScale={2}
                                        fixedDecimalScale={true}
                                        allowNegative={false}  
                                        decimalSeparator=","   
                                        allowedDecimalSeparators={[".", ","]}
                                        onValueChange={(values) => onChange(values.floatValue)}                               
                                        customInput={Campo}                                    
                                    />
                                    )}
                                />
                                {errors.valortaxa && typeof errors.valortaxa.message === 'string' && <SpanErro>{errors.valortaxa.message}</SpanErro>}

                            

                        </Container>
                        
                        <BotaoCustomizado>{`${tipo === 'cadastra' ? "Cadastrar" : "Salvar"}`}</BotaoCustomizado>
                        <pre>{output}</pre>
                    </form>
                </BoxCustomizado>
            </Modal >
        </>
    );
}