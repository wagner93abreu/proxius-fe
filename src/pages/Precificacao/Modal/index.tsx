import { managementDialogStyles, managementFieldStyles } from "../../../styles/managementStyles";
import { useState, useEffect } from "react";
import { Modal } from '@mui/material';
import { Box } from "@mui/material";
import Titulo from "../../../components/Titulo";
import styled from "styled-components";
import Botao from "../../../components/Botao";
import autenticaStore from "../../../stores/autentica.store";
import { useForm, Controller } from "react-hook-form";
import http from "../../../http";
import { GridRowId } from "@mui/x-data-grid";
import IPrecificacao from "../../../types/IPrecificacao";
import { getCurrentDate } from "../../../customFunctions/mascarasFormatacao";
import { NumericFormat } from 'react-number-format';
import { mostrarMensagem } from "../../../stores/mensagem.store";

const BoxCustomizado = styled(Box)`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 30vw;
  max-height: 90vh;
  overflow-y: auto;
  background-color: #fffdfa;
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
    color: #35252b
`

const CampoSelect = styled.select`
    background: #F0F0F0;
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
const SpanErro = styled.span`
    float: left;
    color: #b3261e;
    font-size: 14px;
    margin-top: -25px;
`

export default function ModalPrecificacao({ openP, handleCloseP, precificacao, id, tipo, idProduto }: { openP: boolean, handleCloseP: () => void, precificacao: IPrecificacao[], id: GridRowId[], tipo: string, idProduto: string}) {
    const [idPrecifica, setIdPrecifica] = useState("");
    const { register, handleSubmit, reset, formState:{errors}, setValue, control, watch} = useForm();
    const [output, setOutput] = useState("");
    const [preencheu, setPreencheu] = useState(false);
    const {usuario} = autenticaStore;

    const watchMoeda = watch('moeda');
    const [moeda, setMoeda] = useState("R$ ");
    //console.log(moeda)
    useEffect(() => {
        if(watchMoeda === 'REAL'){
            setMoeda("R$ ");
            
        }else if(watchMoeda === 'DOLAR'){
            setMoeda("U$ ");;            
        }else if(watchMoeda === 'EURO'){
            setMoeda("€ ");;            
        }
    }, [watchMoeda]);


    const axiosConfig = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${usuario.token}`,
        },
    };

    if(openP && !preencheu && tipo === 'edita'){
    const precificacaoEdita = precificacao.find(item => item.id === id[0]);
    setIdPrecifica(precificacaoEdita?.id ? precificacaoEdita.id.toString() : "")
    setValue('cupom', precificacaoEdita?.cupom ? precificacaoEdita.cupom : "")
    setValue('moeda', precificacaoEdita?.moeda ? precificacaoEdita.moeda : "")
    setValue('valor', precificacaoEdita?.valor ? precificacaoEdita.valor : "")
    setValue('data', precificacaoEdita?.data ? precificacaoEdita.data : "")
    setValue('linkpgto', precificacaoEdita?.linkpgto ? precificacaoEdita.linkpgto : "")
    setPreencheu(true)
    }else if(openP && !preencheu && tipo === 'cadastra'){
        reset()
        setPreencheu(true)
    }

    if(!openP && preencheu){
        reset()
        setPreencheu(false)
    } 

    function integracao(data: any){
        //setOutput(JSON.stringify(data, null, 2));
        
        const precifica: IPrecificacao = {
            id: idPrecifica,
            idproduto: idProduto,
            valor: convertDouble(data.valor),
            moeda: data.moeda,
            cupom: data.cupom,
            data: getCurrentDate(),
            linkpgto: data.linkpgto,    
            active: null   
        }
        if(tipo === 'cadastra'){
            http.post(`precificacao`,precifica ,axiosConfig)
            .then(resposta => {
                reset()
                handleCloseP()
                mostrarMensagem("registro cadastrado com SUCESSO!", "success")
            })
            .catch(erro => {            
                mostrarMensagem("ERRO:" + erro, "error")
            })  
        }else{
            http.put("precificacao",precifica ,axiosConfig)
            .then(resposta => {
                reset()
                handleCloseP()
                mostrarMensagem("Alteração efetuada com sucesso!", "success")
                
            })
            .catch(erro => {            
                mostrarMensagem("ERRO:" + erro, "error")
            })   
        } 
             
    } 
    function convertDouble(value: string){

        if(typeof value === 'number'){
            return value;
        }
        if(value.indexOf("R$ ") != -1){
            value = value.replace("R$ ", "");
            value = value.replaceAll(".", "");
            value = value.replace(",", ".");
        }else if(value.indexOf("U$ ") != -1){  
            value = value.replace("U$ ", "");
            value = value.replaceAll(".", "");
            value = value.replace(",", ".");
        }else if(value.indexOf("€ ") != -1){
            value = value.replace("€ ", "");
            value = value.replaceAll(".", "");
            value = value.replace(",", ".");
        }

        return parseFloat(value);
    }

    return (
        <>
            <Modal
                open={openP}
                onClose={handleCloseP}
                aria-labelledby="modal-modal-title"
                aria-describedby="modal-modal-description"
            >
                <BoxCustomizado>
                    <Titulo>{`${tipo === 'cadastra' ? "Cadastrar" : "Editar"} Precificação`}</Titulo>
                    <form onSubmit={handleSubmit(integracao)}>
                        <Container>
                        
                            <Rotulo>Cupom</Rotulo>
                            <Campo type="text" placeholder="" maxLength={100} {...register('cupom', {required: "Campo obrigatório"})} />
                            {errors.cupom && typeof errors.cupom.message === 'string' && <SpanErro>{errors.cupom.message}</SpanErro>}
                            
                        
                            <Rotulo>Moeda</Rotulo>                                
                            <CampoSelect {...register('moeda', {required: "Campo obrigatório"})}>
                                <option value="REAL">REAL</option>
                                <option value="DOLAR">DOLAR</option>
                                <option value="EURO">EURO</option>
                            </CampoSelect>
                            {errors.moeda && typeof errors.moeda.message === 'string' && <SpanErro>{errors.moeda.message}</SpanErro>}

                            <Rotulo>Valor</Rotulo>
                            <Controller
                                name="valor"
                                control={control}
                                rules={{ required: "Campo obrigatório" }}
                                defaultValue=""
                                render={({ field: { onChange, value } }) => (
                                    <NumericFormat                    
                                    value={value}
                                    prefix={moeda}
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
                            {errors.valor && typeof errors.valor.message === 'string' && <SpanErro>{errors.valor.message}</SpanErro>}

                            <Rotulo>Link de Pagamento ASAAS</Rotulo>
                            <Campo type="text" placeholder="" maxLength={255} {...register('linkpgto')} />
                                                                
                        </Container>                        
                        <BotaoCustomizado>{`${tipo === 'cadastra' ? "Cadastrar" : "Salvar"}`}</BotaoCustomizado>
                        {/* <pre>{output}</pre> */}
                    </form>
                </BoxCustomizado>
            </Modal >
        </>
    );
}