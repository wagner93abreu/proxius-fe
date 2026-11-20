import React, { useState } from "react";
import { Modal } from '@mui/material';
import { Box } from "@mui/material";
import Titulo from "../../../components/Titulo";
import styled from "styled-components";
import Botao from "../../../components/Botao";
import autenticaStore from "../../../stores/autentica.store";
import http from "../../../http";
import { GridRowId } from "@mui/x-data-grid";
import IUser from "../../../types/IUser";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod"
import { managementDialogStyles, managementFieldStyles } from "../../../styles/managementStyles";
import { mostrarMensagem } from "../../../stores/mensagem.store";

const Container = styled.div`
text-align: left;
`
const BotaoCustomizado = styled(Botao)`
    width: 50%;
    display: block;
    margin: 0 auto;
`
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
`
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
const Rotulo = styled.label`
    display: block;
    font-weight: 700;
    font-size: 16px;
    line-height: 19px;
    color: #35252b;
`
const ContainerInput = styled.div`
    width: 100%
`

const SpanErro = styled.span`
    float: left;
    color: #b3261e;
    font-size: 14px;
    margin-top: -25px;
`
interface IUsuarioPut {
    id: string,
    login: string,
    email: string,
    password: string | null,
    nome: string,
    papel:string,
}

const createUserFromSchema = z.object({
    login: z.string().min(3, { message: "Esse campo deve ser preenchido no minimo 3 caracteres" }).max(100, { message: "Esse campo deve ser preenchido no minimo 100 caracteres" }),
    nome: z.string().min(3, { message: "Esse campo deve ser preenchido no minimo 3 caracteres" }).max(100, { message: "Esse campo deve ser preenchido no minimo 100 caracteres" }).transform(name => {return name.trim().split(' ').map(word => {
            return word[0].toLocaleUpperCase().concat(word.substring(1))
        }).join(' ')
    }),
    email: z.string().min(8, { message: "Esse campo deve ser preenchido no minimo 8 caracteres" }).max(150, { message: "Esse campo deve ser preenchido no minimo 150 caracteres" }).email('Formato de email inválido').toLowerCase(),
    senha: z.string().refine((value) => {
        if (value.length === 0) return true; // Permitir senha em branco
        return value.length >= 8 && value.length <= 255; // Verificar regras de comprimento
      }, {
        message: "Esse campo deve ser preenchido no mínimo 8 caracteres e no máximo 255 caracteres",
      }),
      senhaVerificada: z.string().refine((value) => {
        if (value.length === 0) return true; // Permitir senha em branco
        return value.length >= 8 && value.length <= 255; // Verificar regras de comprimento
      }, {
        message: "Esse campo deve ser preenchido no mínimo 8 caracteres e no máximo 255 caracteres",
      }),
    papel: z.string().min(1, { message: "Favor selecionar um papel" }),
  })
  .refine(data => data.senha === data.senhaVerificada,
    { message: "As senhas devem ser iguais", path: ["senhaVerificada"] 
  });
  
  type CreateUserFromData = z.infer<typeof createUserFromSchema>;
  

export default function ModalEdita({ editaOpen, editaHandleClose, user, id }: { editaOpen: boolean, editaHandleClose: () => void, user: IUser[], id: GridRowId[] }) {
    const [idUser, setIdUser] = useState("");
    const [output, setOutput] = useState("");
    const { register, handleSubmit, reset, setValue, formState:{errors}} = useForm<CreateUserFromData>({
        resolver: zodResolver(createUserFromSchema),
    });
    const [preencheu, setPreencheu] = useState(false);
    const {usuario} = autenticaStore;

    const axiosConfig = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${usuario.token}`,
        },
    };

    if(editaOpen && !preencheu){
        const usuarioEdita = user.find(item => item.id === id[0]);
        setIdUser(usuarioEdita?.id ? usuarioEdita.id.toString() : "")
        setValue('login', usuarioEdita?.login ? usuarioEdita.login : "");
        setValue('nome', usuarioEdita?.nome ? usuarioEdita.nome : "");
        setValue('email', usuarioEdita?.email ? usuarioEdita.email : "");
        setValue('papel', usuarioEdita?.papel ? usuarioEdita.papel : "");
        setPreencheu(true)
    }
    
    if(!editaOpen && preencheu){
        setValue('login', '');
        setPreencheu(false)
    }    
    function editUser(data: any){
        //setOutput(JSON.stringify(data, null, 2));
        const user: IUsuarioPut = {
            id: idUser,
            login: data.login,
            email: data.email,
            password: data.senha == "" ? null : data.senha,
            nome: data.nome,
            papel: data.papel,
 
        }
        //console.log("o que ta enviando:")
        //console.log(JSON.stringify(user))
        http.put("usuarios",user ,axiosConfig)
        .then(resposta => {
            mostrarMensagem("Alteração efetuada com sucesso!", "success")
        })
        .catch(erro => {            
            //console.log(erro)
            mostrarMensagem("ERRO:" + JSON.stringify(erro), "error")
        })  

    }    

    return (
        <>
            <Modal
                open={editaOpen}
                onClose={editaHandleClose}
                aria-labelledby="modal-modal-title"
                aria-describedby="modal-modal-description"
            >
                <BoxCustomizado role="dialog" aria-label="Editar Usuário">
                    <Titulo>Editar Usuário:</Titulo>
                    <form onSubmit={handleSubmit(editUser)}>
                        <Container>
                        <ContainerInput>
                                <Rotulo>Login</Rotulo>                                
                                <Campo type="text" placeholder="Digite seu login" {...register('login')} />
                                {errors.login && <SpanErro>{errors.login.message}</SpanErro>}
                            </ContainerInput>
                            <ContainerInput>
                                <Rotulo>Nome</Rotulo>
                                <Campo type="text" placeholder="Digite seu nome" {...register('nome')} maxLength={100}/>
                                {errors.nome && <SpanErro>{errors.nome.message}</SpanErro>}
                            </ContainerInput>
                            <ContainerInput>
                                <Rotulo>Email</Rotulo>
                                <Campo type="text" placeholder="Digite seu email" {...register('email')} />
                                {errors.email && <SpanErro>{errors.email.message}</SpanErro>}
                            </ContainerInput>
                            <ContainerInput>
                                <Rotulo>Senha</Rotulo>
                                <Campo type="password" placeholder="Digite sua senha" {...register('senha')} />
                                {errors.senha && <SpanErro>{errors.senha.message}</SpanErro>}
                            </ContainerInput>
                            <ContainerInput>
                                <Rotulo>Repita a senha</Rotulo>
                                <Campo type="password" placeholder="Digite sua senha novamente" {...register('senhaVerificada')} />
                                {errors.senhaVerificada && <SpanErro>{errors.senhaVerificada.message}</SpanErro>}
                            </ContainerInput>  
                            <ContainerInput>
                                <Rotulo>Papel</Rotulo>
                                <CampoSelect {...register('papel')}>
                                        <option key=""></option>
                                        <option key="CLIENTE">CLIENTE</option>
                                        <option key="COLABORADOR">COLABORADOR</option>
                                        <option key="ATENDIMENTO">ATENDIMENTO</option>
                                        <option key="ADMIN">ADMIN</option>
                                </CampoSelect>
                                {errors.papel && <SpanErro>{errors.papel.message}</SpanErro>}
                            </ContainerInput>                                                    
                        </Container>
                        <BotaoCustomizado>Atualizar</BotaoCustomizado>
                    </form>
                </BoxCustomizado>
            </Modal >
        </>
    );
}