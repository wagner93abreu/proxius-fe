import { useState } from "react";
import { Modal } from '@mui/material';
import { Box } from "@mui/material";
import Titulo from "../../../components/Titulo";
import styled from "styled-components";
import Botao from "../../../components/Botao";
import http from "../../../http";
import { useForm } from "react-hook-form";
import InputMask from "react-input-mask";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod"
import IUsuario from "../../../types/IUsuario";
import { managementDialogStyles, managementFieldStyles } from "../../../styles/managementStyles";
import { mostrarMensagem } from "../../../stores/mensagem.store";
import axios from "axios";
import { centralRegistrationPreviewEnabled } from "../../../centralIdentity";
import autenticaStore from "../../../stores/autentica.store";

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
const Container = styled.div`
    text-align: left;
`
const BotaoCustomizado = styled(Botao)`
    width: 50%;
    display: block;
    margin: 0 auto;
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
const InputMaskCustomizado = styled(InputMask)`
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
    color: #242424;
`
const ContainerInput = styled.div`
    width: 100%
`

const SpanErro = styled.span`
    float: left;
    color: #303030;
    font-size: 14px;
    margin-top: -25px;
`

const createUserFromSchema = z.object({
    /* cpf: z.string().min(14, { message: "Esse campo é obrigatório" }), */
    login: z.string().min(3, { message: "Esse campo deve ser preenchido no minimo 3 caracteres" }).max(100, { message: "Esse campo deve ser preenchido no minimo 100 caracteres" }),
    nome: z.string().min(3, { message: "Esse campo deve ser preenchido no minimo 3 caracteres" }).max(100, { message: "Esse campo deve ser preenchido no minimo 100 caracteres" }).transform(name => {return name.trim().split(' ').map(word => {
            return word[0].toLocaleUpperCase().concat(word.substring(1))
        }).join(' ')
    }),
    email: z.string().min(8, { message: "Esse campo deve ser preenchido no minimo 8 caracteres" }).max(150, { message: "Esse campo deve ser preenchido no minimo 150 caracteres" }).email('Formato de email inválido').toLowerCase(),
    senha: z.string().max(255).optional(),
    senhaVerificada: z.string().max(255).optional(),
    papel: z.string().min(1, { message: "Favor selecionar um papel" }),
  })
  .superRefine((data, context) => {
    if (!centralRegistrationPreviewEnabled()) {
        if (!data.senha || data.senha.length < 8) {
            context.addIssue({ code: z.ZodIssueCode.custom, message: "A senha deve ter no mínimo 8 caracteres", path: ["senha"] });
        }
        if (!data.senhaVerificada || data.senhaVerificada.length < 8) {
            context.addIssue({ code: z.ZodIssueCode.custom, message: "Confirme a senha com no mínimo 8 caracteres", path: ["senhaVerificada"] });
        }
        if (data.senha !== data.senhaVerificada) {
            context.addIssue({ code: z.ZodIssueCode.custom, message: "As senhas devem ser iguais", path: ["senhaVerificada"] });
        }
    }
  });
  
  type CreateUserFromData = z.infer<typeof createUserFromSchema>;
  
export default function ModalCadastro({ open, handleClose }: { open: boolean, handleClose: () => void }) {
    const [pendingIdentityId, setPendingIdentityId] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const centralRegistration = centralRegistrationPreviewEnabled();
    const { register, handleSubmit, reset, formState:{errors}} = useForm<CreateUserFromData>({
        resolver: zodResolver(createUserFromSchema),
    });
    const { usuario } = autenticaStore;

    const axiosConfig = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${usuario.token}`,
        },
      };    

    function pendingIdentityFromError(error: unknown): string | null {
        if (!axios.isAxiosError(error)) return null;
        const identityId = error.response?.data?.identityId;
        return typeof identityId === "string" ? identityId : null;
    }

    async function createUser(data: CreateUserFromData) {
        setSubmitting(true);
        try {
            if (centralRegistration) {
                await http.post("central-users", {
                    login: data.login,
                    email: data.email,
                    name: data.nome,
                    role: data.papel,
                }, axiosConfig);
                mostrarMensagem("Usuário cadastrado e convite enviado.", "success");
            } else {
                const user: IUsuario = {
                    login: data.login,
                    email: data.email,
                    password: data.senha ?? "",
                    nome: data.nome,
                    papel: data.papel,
                    active: true
                };
                await http.post("usuarios", user, axiosConfig);
                mostrarMensagem("Usuário cadastrado com SUCESSO!", "success");
            }
            reset();
            setPendingIdentityId(null);
            handleClose();
        } catch (error) {
            const identityId = pendingIdentityFromError(error);
            if (identityId) {
                setPendingIdentityId(identityId);
                mostrarMensagem("Usuário criado, mas o convite não foi enviado. Reemita o convite antes de tentar novo cadastro.", "warning");
            } else if (axios.isAxiosError(error) && error.response?.status === 409) {
                mostrarMensagem("Login ou e-mail já cadastrado nesta empresa.", "error");
            } else if (axios.isAxiosError(error) && error.response?.status === 403) {
                mostrarMensagem("Somente administradores podem cadastrar usuários.", "error");
            } else {
                mostrarMensagem("Não foi possível cadastrar o usuário. Verifique a conexão e tente novamente.", "error");
            }
        } finally {
            setSubmitting(false);
        }
    }

    async function retryInvitation() {
        if (!pendingIdentityId) return;
        setSubmitting(true);
        try {
            await http.post(`central-users/${pendingIdentityId}/retry`, {}, axiosConfig);
            mostrarMensagem("Convite reenviado com sucesso.", "success");
            reset();
            setPendingIdentityId(null);
            handleClose();
        } catch (error) {
            mostrarMensagem("Não foi possível reenviar o convite. O usuário continua pendente.", "error");
        } finally {
            setSubmitting(false);
        }
    }

    const Close =() => {
        reset()
        setPendingIdentityId(null);
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
                <BoxCustomizado role="dialog" aria-label="Cadastro de Usuário">
                    <Titulo>Cadastro de Usuário:</Titulo>
                    {centralRegistration && <p>O usuário receberá um convite para definir a senha e ativar o acesso.</p>}
                    <form onSubmit={handleSubmit(createUser)}>
                        <Container>
                            {/* <ContainerInput>
                                <Rotulo>CPF</Rotulo>
                                <InputMaskCustomizado mask="999.999.999-99" maskChar={null} {...register('cpf')} />
                                {errors.cpf && <SpanErro>{errors.cpf.message}</SpanErro>}
                            </ContainerInput> */}
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
                            {!centralRegistration && <ContainerInput>
                                <Rotulo>Senha</Rotulo>
                                <Campo type="password" placeholder="Digite sua senha" {...register('senha')} />
                                {errors.senha && <SpanErro>{errors.senha.message}</SpanErro>}
                            </ContainerInput>}
                            {!centralRegistration && <ContainerInput>
                                <Rotulo>Repita a senha</Rotulo>
                                <Campo type="password" placeholder="Digite sua senha novamente" {...register('senhaVerificada')} />
                                {errors.senhaVerificada && <SpanErro>{errors.senhaVerificada.message}</SpanErro>}
                            </ContainerInput>}
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
                        <BotaoCustomizado disabled={submitting || !!pendingIdentityId}>
                            {pendingIdentityId ? "Cadastro pendente" : submitting ? "Processando..." : "Cadastrar"}
                        </BotaoCustomizado>
                    </form>
                    {pendingIdentityId && <BotaoCustomizado onClick={retryInvitation} disabled={submitting}>
                        {submitting ? "Processando..." : "Reemitir convite"}
                    </BotaoCustomizado>}
                </BoxCustomizado>
            </Modal >
        </>
    );
}