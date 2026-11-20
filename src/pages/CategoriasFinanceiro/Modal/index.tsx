import { useState } from "react";
import { Modal } from '@mui/material';
import { Box } from "@mui/material";
import Titulo from "../../../components/Titulo";
import styled from "styled-components";
import Botao from "../../../components/Botao";
import autenticaStore from "../../../stores/autentica.store";
import { useForm } from "react-hook-form";
import http from "../../../http";
import ICategoriasFinanceiro from "../../../types/ICategoriasFinanceiro";
import { GridRowId } from "@mui/x-data-grid";
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
    color: #35252b;
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
    color: #b3261e;
    font-size: 14px;
    margin-top: -25px;
`

interface ICategoriaPost {
    id: string,
    tipo: string,
    denominacao: string,
    categoria: string,
    exemplo: string
}

export default function ModalCadastro({ open, handleClose, categorias, id, tipo }: { open: boolean, handleClose: () => void, categorias: ICategoriasFinanceiro[], id: GridRowId[], tipo: string}) {
    const [idCategoria, setIdCategoria] = useState("");
    const { register, handleSubmit, reset, formState:{errors}, setValue} = useForm();
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
    const categoriaEdita = categorias.find(item => item.id === id[0]);
    setIdCategoria(categoriaEdita?.id ? categoriaEdita.id.toString() : "")
    setValue('tipo', categoriaEdita?.tipo ? categoriaEdita.tipo : "")
    setValue('denominacao', categoriaEdita?.denominacao ? categoriaEdita.denominacao : "")
    setValue('categoria', categoriaEdita?.categoria ? categoriaEdita.categoria : "")
    setValue('exemplo', categoriaEdita?.exemplo ? categoriaEdita.exemplo : "")
    setPreencheu(true)
    }else if(open && !preencheu && tipo === 'cadastra'){
        reset()
        setPreencheu(true)
    }

    if(!open && preencheu){
        reset()
        setPreencheu(false)
    } 

    function createUser(data: any){
        //setOutput(JSON.stringify(data, null, 2));
        const categoriaFinanceiro: ICategoriaPost = {
            id: idCategoria,
            tipo: data.tipo,
            denominacao: data.denominacao,
            categoria: data.categoria,
            exemplo: data.exemplo   
        }
        if(tipo === 'cadastra'){
        http.post(`categoriafinanceiro`,categoriaFinanceiro ,axiosConfig)
        .then(resposta => {
            mostrarMensagem("registro cadastrado com SUCESSO!", "success")
            reset()
            handleClose()
        })
        .catch(erro => {            
            mostrarMensagem("ERRO:" + erro, "error")
        })  
    }else{
        http.put("categoriafinanceiro",categoriaFinanceiro ,axiosConfig)
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
                <BoxCustomizado role="dialog" aria-label="Categoria Financeiro">
                    <Titulo>{`${tipo === 'cadastra' ? "Cadastrar" : "Editar"} Categoria`}</Titulo>
                    <form onSubmit={handleSubmit(createUser)}>
                        <Container>
                        
                            <Rotulo>Entrada/Saída</Rotulo>                                
                            <CampoSelect {...register('tipo', {required: "Campo obrigatório"})}>
                                <option value=""></option>
                                <option value="E">ENTRADA</option>
                                <option value="S">SAIDA</option>
                            </CampoSelect>
                            {errors.tipo && typeof errors.tipo.message === 'string' && <SpanErro>{errors.tipo.message}</SpanErro>}

                            <Rotulo>Denominação</Rotulo>
                            <Campo type="text" placeholder="" maxLength={100} {...register('denominacao', {required: "Campo obrigatório"})} />
                            {errors.denominacao && typeof errors.denominacao.message === 'string' && <SpanErro>{errors.denominacao.message}</SpanErro>}

                            <Rotulo>Categoria</Rotulo>
                            <Campo type="text" placeholder="" maxLength={100} {...register('categoria', {required: "Campo obrigatório"})} />
                            {errors.categoria && typeof errors.categoria.message === 'string' && <SpanErro>{errors.categoria.message}</SpanErro>}

                            <Rotulo>Exemplo</Rotulo>                                
                            <Campo type="text" placeholder="" maxLength={300} {...register('exemplo')} />  

                        </Container>
                        
                        <BotaoCustomizado>{`${tipo === 'cadastra' ? "Cadastrar" : "Salvar"}`}</BotaoCustomizado>
                        <pre>{output}</pre>
                    </form>
                </BoxCustomizado>
            </Modal >
        </>
    );
}