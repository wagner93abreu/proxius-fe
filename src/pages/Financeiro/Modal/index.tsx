import { managementDialogStyles, managementFieldStyles } from "../../../styles/managementStyles";
import createCrmSelectStyles from "../../../styles/crmSelectStyles";
import React, { useRef, useState } from "react";
import { Grid, Modal } from '@mui/material';
import { Box } from "@mui/material";
import Titulo from "../../../components/Titulo";
import styled from "styled-components";
import Select from 'react-select';
import Botao from "../../../components/Botao";
import autenticaStore from "../../../stores/autentica.store";
import { Controller,useForm } from "react-hook-form";
import http from "../../../http";
import ICategoriasFinanceiro from "../../../types/ICategoriasFinanceiro";
import { GridRowId } from "@mui/x-data-grid";
import ITaxa from "../../../types/ITaxa";
import { NumericFormat } from 'react-number-format';
import ReactInputMask from "react-input-mask";


import CampoDigitacao from "../../../components/CampoDigitacao";
import IFinanceiro from "../../../types/IFinanceiro";
import IBodyRequest from "../../../types/IBodyRequest";
import { set } from "mobx";
import { transformDate, transformDateBR } from "../../../customFunctions/mascarasFormatacao";
import { mostrarMensagem } from "../../../stores/mensagem.store";

const BoxCustomizado = styled(Box)`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 50vw;
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

const SelectCustomizado = styled(Select)`
    background: #F0F0F0;
    margin-top: 3px;
    margin-bottom: 25px;
    box-sizing: border-box;
    box-shadow: none;
    border-radius: 12px;
    border: none;
    width: 100%;
`
const ContainerInput = styled.div`
    width: 100%
`

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
`

export default function ModalFinanceiro({ open, handleClose, financeiro, id, tipo }: { open: boolean, handleClose: () => void, financeiro: IFinanceiro[], id: GridRowId[], tipo: string}) {
    const [idFinanceiro, setIdFinanceiro] = useState("");
    const[categoriasFinanceiro, setCategoriasFinanceiro] = useState<ICategoriasFinanceiro[]>([]);
    const {register, handleSubmit, reset, formState:{errors}, setValue, control, getValues, trigger, watch} = useForm({ mode: 'onSubmit' });
    const [output, setOutput] = useState("");
    const [preencheu, setPreencheu] = useState(false);
    const {usuario} = autenticaStore;
    const financeiroRef = useRef({"entradasaida": {value: '', label: ''}, "denominacao": {value: '', label: ''}, "categoriafinanceiro": {value: '', label: ''}})
        
    const watchMoeda = watch('moeda');
    const [moedaFin, setMoedaFin] = useState("R$ ");

    if(open && !preencheu && tipo === 'edita'){
        const financeiroEdita = financeiro.find(item => item.id === id[0]);
        setIdFinanceiro(financeiroEdita?.id ? financeiroEdita.id.toString() : "")   
        setValue('descricao',financeiroEdita?.descricao ? financeiroEdita.descricao : "")
        setValue('entradasaida', {value: financeiroEdita?.tipo, label: financeiroEdita?.tipo === 'E' ? 'Entrada' : 'Saída'})
        
        const catFin = categoriasFinanceiro.find(catFin => catFin.id === financeiroEdita?.idcategoria);
        if (catFin) {
            setValue('denominacao', {value: catFin.denominacao, label: catFin.denominacao})
            const entradasaida = {value: financeiroEdita?.tipo, label: financeiroEdita?.tipo === 'E' ? 'Entrada' : 'Saída'};
            const denominacao = {value: catFin.denominacao, label: catFin.denominacao};
            catFinFiltrada(entradasaida, denominacao)
            
        }
        setValue('moeda', financeiroEdita?.moeda ? financeiroEdita.moeda : "")
        setValue('valor', financeiroEdita?.valor ? String(financeiroEdita.valor) : "")
        setValue('dataprevista', financeiroEdita?.dataprevista ? transformDateBR(financeiroEdita.dataprevista) : "")
        setValue('dataexecutada', financeiroEdita?.dataexecutada ? transformDateBR(financeiroEdita.dataexecutada) : "")
        if (catFin) {
            setValue('categoriafinanceiro', {value: catFin.id, label: catFin.categoria + (catFin.exemplo ? " - " + catFin.exemplo : "")})
        }
        setPreencheu(true)
    }else if(open && !preencheu && tipo === 'cadastra'){
        reset()
        setPreencheu(true)
    }

    if(!open && preencheu){
        reset()
        setPreencheu(false)
    } 


    //console.log(moeda)
    React.useEffect(() => {
        if(watchMoeda === 'BRL'){
            setMoedaFin("R$ ");
            
        }else if(watchMoeda === 'USD'){
            setMoedaFin("U$ ");;            
        }else if(watchMoeda === 'EUR'){
            setMoedaFin("€ ");;            
        }
    }, [watchMoeda]);

    
    const axiosConfig = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${usuario.token}`,
        },
    };

    React.useEffect(() => {

        http.get<IBodyRequest<ICategoriasFinanceiro>>('categoriafinanceiro?size=200&page=0', axiosConfig)
        .then(resposta => {
            setCategoriasFinanceiro(resposta.data.content.filter(categoriasFinanceiro => categoriasFinanceiro.active))            
        })
        .catch(erro => {
            mostrarMensagem(erro, "error")
        })        
    }, []);

    

    function denominacaoFormatados(entradasaida: any){ 
        //console.log("BANDEIRA FILTRADA")
        if(entradasaida === "" || entradasaida == undefined || entradasaida == null) return []

        let catFinFiltradas = categoriasFinanceiro.filter(catFin => catFin.tipo === entradasaida.value).reduce((unique: ICategoriasFinanceiro[], o) => {
            if (!unique.some((obj: ICategoriasFinanceiro) => obj.denominacao === o.denominacao)) {
                unique.push(o);
            }
            return unique;
        }, []).map(catFin => ({
            value: catFin.denominacao,
            label: catFin.denominacao
        })) 

       if(entradasaida.value !== financeiroRef.current.entradasaida.value){
            financeiroRef.current.entradasaida = entradasaida; 
            if(getValues('denominacao') === undefined){
                if(catFinFiltradas.length == 1){
                    setValue('denominacao', catFinFiltradas[0])                    
                }
            }else{
                if(catFinFiltradas.length == 1 && getValues('denominacao').value !== catFinFiltradas[0].value){
                    //console.log("VAI SETAR O VALOR TIPO PAGAMENTO!!!")
                    setValue('denominacao', catFinFiltradas[0])                    
                }else if(catFinFiltradas.length != 1 && getValues('denominacao') !== ""){
                    //console.log("RESET TIPO PAGAMENTO")
                    financeiroRef.current.denominacao = {value: '', label: ''}; 
                    financeiroRef.current.categoriafinanceiro = {value: '', label: ''}; 
                    setValue('denominacao', "")                      
                    setValue('categoriafinanceiro', "")                      
                            
                }
            } 
    }

        return catFinFiltradas
    } 

    function catFinFiltrada(entradasaida: any, denominacao: any){ 

        if(entradasaida === "" || entradasaida == undefined || entradasaida == null ||
            denominacao === "" || denominacao == undefined || denominacao == null) return []

        let catFinFiltradas = categoriasFinanceiro.filter(catFin => catFin.tipo === entradasaida.value && catFin.denominacao === denominacao.value).map(catFin => ({
            value: catFin.id,
            label: catFin.categoria + (catFin.exemplo ? " - Ex: " + catFin.exemplo : "")
        })) 
        
        if(denominacao.value !== financeiroRef.current.denominacao.value){
            financeiroRef.current.denominacao = denominacao;
            if(getValues(`categoriafinanceiro`) === undefined){
                if(catFinFiltradas.length == 1){
                    setValue(`categoriafinanceiro`, catFinFiltradas[0])                                        
                }
            }else{
                if(catFinFiltradas.length == 1){
                    setValue(`categoriafinanceiro`, catFinFiltradas[0])                          

                }else if(catFinFiltradas.length != 1){

                    financeiroRef.current.categoriafinanceiro = {value: '', label: ''};
                    setValue(`categoriafinanceiro`, "")                
                         
                }
            } 
        }    
        return catFinFiltradas
    } 

    

    function createUser(data: any){
        //setOutput(JSON.stringify(data, null, 2));
    
        //console.log("CADASTRA")
        const financeiro: IFinanceiro = {
            id: id[0] ? id[0] : null,
            tipo: data.entradasaida.value[0],
            descricao: data.descricao,
            idcategoria: data.categoriafinanceiro.value,
            dataprevista: transformDate(data.dataprevista),
            dataexecutada: data.dataexecutada ? transformDate(data.dataexecutada) : null,
            moeda: data.moeda,
            valor: parseFloat(data.valor)      
        }
        let cadastro = []
        cadastro.push(financeiro)
        //setOutput(JSON.stringify(cadastro, null, 2));
        if(tipo === 'cadastra'){
            http.post(`financeiro`,cadastro ,axiosConfig)
            .then(resposta => {
                mostrarMensagem("registro cadastrado com SUCESSO!", "success")
                /* reset()
                handleClose() */
            })
            .catch(erro => {            
                mostrarMensagem("ERRO:" + erro, "error")
            })  
        }else{
            http.put("financeiro",financeiro ,axiosConfig)
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

    const entradaSaidaOptions = [
        { value: 'E', label: 'Entrada' },
        { value: 'S', label: 'Saída' },
      ];

    return (
        <>
            <Modal
                open={open}
                onClose={() => Close()}
                aria-labelledby="modal-modal-title"
                aria-describedby="modal-modal-description"
            >
                <BoxCustomizado role="dialog" aria-label="Lançamento Financeiro">
                    <Titulo>{`${tipo === 'cadastra' ? "Cadastrar" : "Editar"} Lançamento Financeiro`}</Titulo>
                    <form onSubmit={handleSubmit(createUser)}>
                    <Grid container spacing={2}>

                        <Grid item xs={12} md={2}>
                            <Rotulo>Entrada/Saída *</Rotulo>
                            <Controller
                                name={'entradasaida'}
                                control={control}
                                render={({ field }) => {
                    
                                    return (
                                        <SelectCustomizado styles={createCrmSelectStyles()}
                                            {...field}
                                            options={entradaSaidaOptions}
                                            isSearchable
                                            onChange={(e) => {
                                                field.onChange(e);                                                            
                                                trigger('denominacao')
                                                }}                                            
                                        />
                                    );
                                }}
                            />
                        {errors.entradasaida && typeof errors.entradasaida.message === 'string' && <SpanErro>{errors.entradasaida.message}</SpanErro>}                      
                        </Grid>

                        <Grid item xs={12} md={3}>
                            <Rotulo>Denominação *</Rotulo>
                            <Controller
                                name={'denominacao'}
                                control={control}
                                render={({ field }) => {
                                    const entradasaida = getValues('entradasaida');
                                    const denominacaoFiltered = denominacaoFormatados(entradasaida)

                                    return (
                                        <SelectCustomizado styles={createCrmSelectStyles()}
                                            {...field}
                                            options={denominacaoFiltered.length > 1 ? denominacaoFiltered : []}                                                        
                                            isSearchable
                                            onChange={(e) => {
                                                field.onChange(e);
                                                trigger('categoriafinanceiro')
                                                }}
                                        />
                                    );
                                }}
                            />
                        {errors.denominacao && typeof errors.denominacao.message === 'string' && <SpanErro>{errors.denominacao.message}</SpanErro>}
                        </Grid>

                        <Grid item xs={12} md={7}>
                            <Rotulo>Categoria Financeiro</Rotulo>
                            <Controller
                                name={'categoriafinanceiro'}
                                control={control}
                                render={({ field }) => {
                                    const entradasaida = getValues('entradasaida');
                                    const denominacao = getValues('denominacao');
                                    const catFinFiltered =catFinFiltrada(entradasaida, denominacao)

                                    return (
                                        <SelectCustomizado styles={createCrmSelectStyles()}
                                            {...field}
                                            options={catFinFiltered.length > 1 ? catFinFiltered : []}                                                        
                                            isSearchable
                                            onChange={(e) => {
                                                field.onChange(e);
                                                }}
                                        />
                                    );
                                }}
                            />
                        {errors.categoriafinanceiro && typeof errors.categoriafinanceiro.message === 'string' && <SpanErro>{errors.categoriafinanceiro.message}</SpanErro>}
                        </Grid>

                        <Grid item xs={12} md={12}>
                        <Rotulo>Descrição</Rotulo>
                            <Campo type="text" placeholder="" maxLength={100} {...register('descricao', {required: "Campo obrigatório"})} />
                            {errors.descricao && typeof errors.descricao.message === 'string' && <SpanErro>{errors.descricao.message}</SpanErro>}
                        </Grid>

                        <Grid item xs={3} md={3}>
                            <Rotulo>Moeda *</Rotulo>                                
                            <CampoSelect {...register('moeda', {
                            required: 'Campo obrigatório'})}>
                                <option value="BRL">REAL</option>
                                <option value="USD">DOLAR</option>
                                <option value="EUR">EURO</option>
                            </CampoSelect>
                            {errors.moeda && typeof errors.moeda.message === 'string' && <SpanErro>{errors.moeda.message}</SpanErro>}
                        </Grid>  

                        <Grid item xs={12} md={3}>
                            <Rotulo>Valor *</Rotulo>                                        
                            <Controller
                                name={`valor`}
                                control={control}
                                rules={{ required: "Campo obrigatório" }}
                                defaultValue=""
                                render={({ field: { onChange, value } }) => {
                
                                    return (
                                        <NumericFormat                    
                                            value={value}
                                            prefix={moedaFin}
                                            thousandSeparator={"."}
                                            decimalScale={2}
                                            fixedDecimalScale={true}
                                            allowNegative={false}  
                                            decimalSeparator=","   
                                            allowedDecimalSeparators={[".", ","]}
                                            onValueChange={(values) => onChange(values.floatValue)}     
            
                                            customInput={Campo}                                    
                                        />
                                    );
                                }}
                            />
                            {errors.valor && typeof errors.valor.message === 'string' && <SpanErro>{errors.valor.message}</SpanErro>}
                        </Grid>

                        <Grid item xs={12} md={3}>
                            <ContainerInput>
                                <Rotulo>Data Prevista *</Rotulo>
                                <InputMaskCustomizado mask="99/99/9999" maskChar={null} {...register(`dataprevista`, {
                                    pattern: {
                                        value: /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/(19|20)\d\d$/,
                                        message: 'Favor digitar uma data válida'
                                    }
                                })} />
                                {errors.dataprevista && typeof errors.dataprevista.message === 'string' && <SpanErro>{errors.dataprevista.message}</SpanErro>}  
                            </ContainerInput>
                        </Grid> 

                        <Grid item xs={12} md={3}>
                            <ContainerInput>
                                <Rotulo>Data Executada *</Rotulo>
                                <InputMaskCustomizado mask="99/99/9999" maskChar={null} {...register(`dataexecutada`, {
                                    pattern: {
                                        value: /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/(19|20)\d\d$/,
                                        message: 'Favor digitar uma data válida'
                                    }
                                })} />
                                {errors.dataexecutada && typeof errors.dataexecutada.message === 'string' && <SpanErro>{errors.dataexecutada.message}</SpanErro>}  
                            </ContainerInput>
                        </Grid>                                                 
                         
                    </Grid>    
                    <BotaoCustomizado>{`${tipo === 'cadastra' ? "Cadastrar" : "Salvar"}`}</BotaoCustomizado>
                    <pre>{output}</pre>
                    </form>
                </BoxCustomizado>
            </Modal >
        </>
    );
}