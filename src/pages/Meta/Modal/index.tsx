import { useState } from "react";
import { Checkbox, FormControlLabel, Grid, Modal, Box } from '@mui/material';
import styled from "styled-components";
import Botao from "../../../components/Botao";
import autenticaStore from "../../../stores/autentica.store";
import { Controller, useForm } from "react-hook-form";
import http from "../../../http";
import ICategoriasFinanceiro from "../../../types/ICategoriasFinanceiro";
import { GridRowId } from "@mui/x-data-grid";
import IMeta from "../../../types/IMeta";
import ReactInputMask from "react-input-mask";
import { NumericFormat } from "react-number-format";
import { transformDate, transformDateBR } from "../../../customFunctions/mascarasFormatacao";
import { mostrarMensagem } from "../../../stores/mensagem.store";

const BoxCustomizado = styled(Box)`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: min(480px, calc(100vw - 32px));
  max-height: 90vh;
  overflow-y: auto;
  box-sizing: border-box;
  background-color: #ffffff;
  color: #242424;
  border: 1px solid rgba(20, 20, 20, 0.12);
  border-radius: 20px;
  box-shadow: 0 24px 64px rgba(36, 36, 36, 0.24);
  padding: 28px 32px;

  &:focus {
    outline: none;
  }

  @media (max-width: 600px) {
    padding: 24px 20px;
  }
`;

const TituloModal = styled.h2`
  margin: 0 0 4px;
  color: #141414;
  font-size: 22px;
  font-weight: 700;
`;

const Subtitulo = styled.p`
  margin: 0 0 24px;
  color: #666666;
  font-size: 14px;
`;

const InputMaskCustomizado = styled(ReactInputMask)`
    font-size: 15px;
    color: #242424;
    background: #ffffff;
    margin-top: 6px;
    margin-bottom: 28px;
    box-sizing: border-box;
    border: 1px solid rgba(20, 20, 20, 0.2);
    border-radius: 10px;
    width: 100%;
    padding: 12px 14px;
    transition: border-color 160ms ease, box-shadow 160ms ease;

    &:hover {
        border-color: rgba(20, 20, 20, 0.45);
    }

    &:focus {
        outline: none;
        border-color: #141414;
        box-shadow: 0 0 0 3px rgba(20, 20, 20, 0.15);
    }
`
const ContainerInput = styled.div`
    width: 100%
`
const Campo = styled.input`
    font-size: 15px;
    color: #242424;
    background: #ffffff;
    margin-top: 6px;
    margin-bottom: 28px;
    box-sizing: border-box;
    border: 1px solid rgba(20, 20, 20, 0.2);
    border-radius: 10px;
    width: 100%;
    padding: 12px 14px;
    transition: border-color 160ms ease, box-shadow 160ms ease;

    &:hover {
        border-color: rgba(20, 20, 20, 0.45);
    }

    &:focus {
        outline: none;
        border-color: #141414;
        box-shadow: 0 0 0 3px rgba(20, 20, 20, 0.15);
    }
`
const Container = styled.div`
text-align: left;
`
const BotaoCustomizado = styled(Botao)`
    width: 100%;
    display: block;
    margin: 4px 0 0;
    padding: 12px 16px;
    border: none;
    border-radius: 10px;
    background-color: #141414;
    color: #ffffff;
    font-size: 15px;
    cursor: pointer;

    &:hover {
        background-color: #383838;
    }

    &:focus-visible {
        outline: 3px solid rgba(20, 20, 20, 0.35);
        outline-offset: 2px;
    }

    &:active {
        border: none;
    }
`

const Rotulo = styled.label`
    display: block;
    font-weight: 700;
    font-size: 14px;
    line-height: 19px;
    color: #141414;
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
`
const SpanErro = styled.span`
    float: left;
    color: #303030;
    font-size: 13px;
    margin-top: -24px;
    margin-bottom: 12px;
`

export default function ModalCadastro({ open, handleClose, metas, id, tipo }: { open: boolean, handleClose: () => void, metas: IMeta[], id: GridRowId[], tipo: string}) {
    const [idMeta, setIdMeta] = useState("");
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
    const metaEdita = metas.find(item => item.id === id[0]);
    setIdMeta(metaEdita?.id ? metaEdita.id.toString() : "")
    setValue('data', metaEdita?.data ? transformDateBR(metaEdita.data) : "")
    setValue('valorMinimo', metaEdita?.valorMinimo ? metaEdita.valorMinimo : "")
    setValue('valorPadrao', metaEdita?.valorPadrao ? metaEdita.valorPadrao : "")
    setValue('valorMaximo', metaEdita?.valorMaximo ? metaEdita.valorMaximo : "")
    setPreencheu(true)
    }else if(open && !preencheu && tipo === 'cadastra'){
        reset()
        setPreencheu(true)
    }

    if(!open && preencheu){
        reset()
        setPreencheu(false)
    } 

    function createMeta(data: any){
        /* setOutput(JSON.stringify(data, null, 2)); */
        const meta: IMeta = {
            id: idMeta,
            data: transformDate(data.data),
            valorMinimo: data.valorMinimo,
            valorPadrao: data.valorPadrao,
            valorMaximo: data.valorMaximo   
        }
        if(tipo === 'cadastra'){
        http.post(`meta`,meta ,axiosConfig)
        .then(resposta => {
            mostrarMensagem("registro cadastrado com SUCESSO!", "success")
            reset()
            handleClose()
        })
        .catch(erro => {            
            mostrarMensagem("ERRO:" + erro, "error")
        })  
    }else{
        http.put("meta",meta ,axiosConfig)
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
                <BoxCustomizado>
                    <TituloModal id="modal-modal-title">{`${tipo === 'cadastra' ? "Cadastrar" : "Editar"} Meta`}</TituloModal>
                    <Subtitulo id="modal-modal-description">Informe a data e os valores de cada faixa da meta.</Subtitulo>
                    <form onSubmit={handleSubmit(createMeta)}>
                        <Container>
                        
                            <Grid item xs={12} md={2}>
                                <ContainerInput>
                                    <Rotulo>Data *</Rotulo>
                                    <InputMaskCustomizado mask="99/99/9999" maskChar={null} {...register(`data`, {
                                        pattern: {
                                            value: /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/(19|20)\d\d$/,
                                            message: 'Favor digitar uma data válida'
                                        }
                                    })} />
                                    {errors.data && typeof errors.data.message === 'string' && <SpanErro>{errors.data.message}</SpanErro>}  
                                </ContainerInput>
                            </Grid>  

                            <Grid item xs={12} md={2}>
                                        <Rotulo>Valor 80%</Rotulo>                                        
                                        <Controller
                                            name={`valorMinimo`}
                                            control={control}
                                            rules={{ required: "Campo obrigatório" }}
                                            defaultValue=""
                                            render={({ field: { onChange, value } }) => {                                                                                
                                                return (
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
                                                        onBlur={() => {                                                             
                                                        }}                       
                                                        customInput={Campo}                                    
                                                    />
                                                );
                                            }}
                                        />
                                        {errors.valorMinimo && typeof errors.valorMinimo.message === 'string' && <SpanErro>{errors.valorMinimo.message}</SpanErro>}
                                </Grid>

                                <Grid item xs={12} md={2}>
                                        <Rotulo>Valor 100%</Rotulo>                                        
                                        <Controller
                                            name={`valorPadrao`}
                                            control={control}
                                            rules={{ required: "Campo obrigatório" }}
                                            defaultValue=""
                                            render={({ field: { onChange, value } }) => {                                                                                
                                                return (
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
                                                        onBlur={() => {                                                             
                                                        }}                       
                                                        customInput={Campo}                                    
                                                    />
                                                );
                                            }}
                                        />
                                        {errors.valorPadrao && typeof errors.valorPadrao.message === 'string' && <SpanErro>{errors.valorPadrao.message}</SpanErro>}
                                </Grid>

                                <Grid item xs={12} md={2}>
                                        <Rotulo>Valor 120%</Rotulo>                                        
                                        <Controller
                                            name={`valorMaximo`}
                                            control={control}
                                            rules={{ required: "Campo obrigatório" }}
                                            defaultValue=""
                                            render={({ field: { onChange, value } }) => {                                                                                
                                                return (
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
                                                        onBlur={() => {                                                             
                                                        }}                       
                                                        customInput={Campo}                                    
                                                    />
                                                );
                                            }}
                                        />
                                        {errors.valorMaximo && typeof errors.valorMaximo.message === 'string' && <SpanErro>{errors.valorMaximo.message}</SpanErro>}
                                </Grid>

                            

                             

                        </Container>
                        
                        <BotaoCustomizado>{`${tipo === 'cadastra' ? "Cadastrar" : "Salvar"}`}</BotaoCustomizado>
                        <pre>{output}</pre>
                    </form>
                </BoxCustomizado>
            </Modal >
        </>
    );
}