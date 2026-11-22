import { managementDialogStyles, managementFieldStyles } from "../../styles/managementStyles";
import { AccountCircleOutlined } from "@mui/icons-material";
import React, { useEffect, useState } from "react";
import { Box, CircularProgress } from "@mui/material";
import Titulo from "../../components/Titulo";
import styled from "styled-components";
import CampoDigitacao from "../../components/CampoDigitacao";
import Botao from "../../components/Botao";
import autenticaStore from "../../stores/autentica.store";
import http from "../../http";
import foto from './perfil.png';
import AlertPortal from "../../components/AlertPortal";
import axios from "axios";

const PageWrapper = styled.div`
    display: flex;
    justify-content: center;
    width: 100%;
    box-sizing: border-box;
    padding: 88px 16px 48px;
`;

const BoxCustomizado = styled(Box)`
    margin-top: 1rem;
    position: relative;
    width: min(700px, 92vw);
    background-color: #ffffff;
    border: none;
    border-radius: 12px;
    padding: clamp(1.25rem, 3vw, 2.5rem);
    box-shadow: 2px 2px 12px rgba(0, 0, 0, 0.15);
    max-height: calc(100vh - 4rem);
    overflow-y: auto;
    ${managementDialogStyles}
`;

const Header = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
    text-align: center;
`;

const FormContent = styled.div`
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    width: 100%;
    margin-top: 1rem;
`;

const BotaoCustomizado = styled(Botao)`
    width: 100%;
    max-width: 280px;
    display: block;
    margin: 0.5rem auto 0;
    @media (min-width: 640px) {
        width: 50%;
    }
`;
const User = styled.div`
img{
        width: clamp(96px, 28vw, 120px);
        height: clamp(96px, 28vw, 120px);
    border-radius: 100%;
    object-fit: cover;
}    
`
const Campo = styled.input`
    color: #242424;
    font-size: 15px;
    background:rgba(240, 240, 240, 0.08);
    margin-top: 3px;
    margin-bottom: 0px;
    box-sizing: border-box;
    box-shadow: none;
    border-radius: 12px;
    border: none;
    width: 100%;
    padding: 10px;
    ${managementFieldStyles}
`

const BotaoCustom = styled.button`
  font-size: 14px;
  font-weight: 500;
  background-color: #f5f5f5;
  color: #141414;
  padding: 10px 16px;
  border: 1px solid rgba(20, 20, 20, 0.2);
  border-radius: 12px;
  cursor: pointer;
  box-shadow: none;
    width: 100%;
    max-width: 200px;
    &:hover { background-color: #f6f6f6; }
    &:focus-visible { outline: 3px solid #858585; outline-offset: 3px; }
`

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

interface IUsuarioPut {
    id: string,
    login: string,
    email: string,
    password: string | null,
    nome: string
}

export default function MeuPerfil() {
    const [idUser, setIdUser] = useState("");
    const [login, setLogin] = useState("");
    const [email, setEmail] = useState("");
    const [nome, setNome] = useState("");
    const [password, setPassword] = useState("");
    const [senhaVerificada, setSenhaVerificada] = useState("");
    const {usuario} = autenticaStore;
    const [erro, setErro] = useState(false);
    const [imageUrl, setImageUrl] = useState("");
    const [loading, setLoading] = useState(false);
    const [imageKey, setImageKey] = useState(Date.now());
    const [errorMessage, setErrorMessage] = useState("");
    const [showError, setShowError] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    const [showSuccess, setShowSuccess] = useState(false);
    const bucketName = "https://rhsc-bucket-public.s3.us-east-1.amazonaws.com/";
    const axiosConfig = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${usuario.token}`,
        },
    };

    useEffect(() => {
        if (localStorage.getItem('userID') != null ) {
            http.get(`usuarios/${localStorage.getItem('userID')}`, axiosConfig)
            .then(resposta => {          
                setIdUser(resposta.data.id)
                setLogin(resposta.data.login)
                setEmail(resposta.data.email)
                setNome(resposta.data.nome)  
                setImageUrl(resposta.data.foto)          
            })
            .catch(erro => {            
                showErrorAlert(getBackendErrorMessage(erro));
            })
        }
    }, [erro, imageUrl, loading]);

    const getBackendErrorMessage = (error: unknown) => {
        if (axios.isAxiosError(error)) {
            const data = error.response?.data;

            if (typeof data === "string") {
                return data;
            }

            if (data && typeof data === "object") {
                const dataRecord = data as Record<string, unknown>;
                const message = dataRecord.message;
                const errorMessage = dataRecord.error || dataRecord.erro;

                if (typeof message === "string" && message.trim().length > 0) {
                    return message;
                }

                if (typeof errorMessage === "string" && errorMessage.trim().length > 0) {
                    return errorMessage;
                }
            }

            return error.message || "Erro ao processar sua solicitacao.";
        }

        return "Erro inesperado ao processar sua solicitacao.";
    };

    const showErrorAlert = (message: string) => {
        setErrorMessage(message);
        setShowError(true);
    };

    const showSuccessAlert = (message: string) => {
        setSuccessMessage(message);
        setShowSuccess(true);
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            if(file.size > 1048576){
                showErrorAlert("O arquivo deve ter no maximo 1MB!");
                return
            }else if(file.type != "image/jpeg" && file.type != "image/png"){
                showErrorAlert("O arquivo deve ser uma imagem!");
                return

            }else{
                // Alterar o nome do arquivo
                const newFileName = `foto_perfil.${file.type.split('/')[1]}`;
                const newFile = new File([file], newFileName, { type: file.type });
                const formData = new FormData();
                const userID = localStorage.getItem('userID');
                formData.append('file', newFile);
                formData.append('user', userID!);
                setLoading(true);
                try{
                    const response = await http.post(`/file/upload/perfil`, formData, {
                        headers: {
                            'Content-Type': 'multipart/form-data',
                            'Authorization': `Bearer ${usuario.token}`,
                        },
                    })
                    setImageUrl(response.data);
                    setImageKey(Date.now());
                }catch(error){
                    showErrorAlert(getBackendErrorMessage(error));
                }finally {
                    setLoading(false);
                  }
            }   
        }
    };

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const passwordTrimmed = password.trim();
        const senhaVerificadaTrimmed = senhaVerificada.trim();

        if (passwordTrimmed.length > 0 || senhaVerificadaTrimmed.length > 0) {
            if(passwordTrimmed != senhaVerificadaTrimmed){
                showErrorAlert("As senhas nao conferem!");
                return
            }
            if(passwordTrimmed.length < 8){
                showErrorAlert("A senha deve ter no minimo 8 caracteres!");
                return
            }
        }
        const user: IUsuarioPut = {
            id: idUser,
            login: login,
            email: email,
            password: passwordTrimmed == "" ? null : passwordTrimmed,
            nome: nome
        }        
        http.put("usuarios",user ,axiosConfig)
        .then(resposta => {       
            showSuccessAlert("Alteracao efetuada com sucesso!");
            
        })
        .catch(erro => {            
            showErrorAlert(getBackendErrorMessage(erro));
            setErro(!erro)
        })     
    }

    return (
        <PageWrapper>
            <AlertPortal show={showError} message={errorMessage} severity="error" onClose={() => setShowError(false)} />
            <AlertPortal show={showSuccess} message={successMessage} severity="success" onClose={() => setShowSuccess(false)} />
            {loading && (
            <Overlay>
                <CircularProgress color="warning" size="5rem"/>
            </Overlay>
            )}
            <BoxCustomizado>
                <Header>
                    <Titulo icone={<AccountCircleOutlined />}>Meu Perfil</Titulo>
                    <User>
                    {imageUrl == '' || imageUrl == null ? <img src={foto} alt="Avatar"/> : <img src={`${bucketName}${imageUrl.replaceAll(" ", "+")}?${imageKey}`} alt="Avatar"/>}
                    </User>
                    <BotaoCustom as="label">
                        {`${imageUrl == '' ? "Adicionar" : "Alterar"} Foto`}
                        <Campo type="file" style={{ display: 'none' }} onChange={handleFileChange} />
                    </BotaoCustom>
                </Header>
                <form onSubmit={handleSubmit}>
                    <FormContent>
                        <CampoDigitacao required={true} tipo="text" label="Login" valor={login} placeholder="Digite seu login" onChange={setLogin} />
                        <CampoDigitacao required={true} tipo="text" label="Nome" valor={nome} placeholder="Digite seu nome" onChange={setNome} />
                        <CampoDigitacao required={true} tipo="email" label="Email" valor={email} placeholder="Digite seu email" onChange={setEmail} />
                        <CampoDigitacao required={false} tipo="password" label="Alterar senha" valor={password} placeholder="******" onChange={setPassword} />
                        <CampoDigitacao required={false} tipo="password" label="Repita a nova senha" valor={senhaVerificada} placeholder="******" onChange={setSenhaVerificada} />
                        <BotaoCustomizado>Atualizar</BotaoCustomizado>
                    </FormContent>
                </form>
            </BoxCustomizado>
        </PageWrapper>
    )
}
