import React, { useEffect, useState } from "react";
import { Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from "@mui/material";
import styled from "styled-components";
import axios from "axios";
import autenticaStore from "../../stores/autentica.store";
import http from "../../http";
import AlertPortal from "../AlertPortal";
import fotoPadrao from "../../pages/MeuPerfil/perfil.png";
import { usePublicPhotoBaseUrl } from "../../PublicPhotoConfig";

type ModalPerfilAreaClienteProps = {
    open: boolean;
    onClose: () => void;
    onUpdated?: (user: { nome: string; foto: string }) => void;
    userId?: string | null;
};

interface IUsuarioPut {
    id: string;
    login: string;
    email: string;
    password: string | null;
    nome: string;
}

const User = styled.div`
    display: flex;
    justify-content: center;

    img {
        width: clamp(96px, 28vw, 120px);
        height: clamp(96px, 28vw, 120px);
        border-radius: 10px;
        object-fit: cover;
        border: 2px solid #141414;
    }
`;

const Campo = styled.input`
    color: #141414;
    font-size: 15px;
    background: rgba(255, 255, 255, 0.78);
    margin-top: 6px;
    box-sizing: border-box;
    box-shadow: 2px 2px 6px rgba(20, 20, 20, 0.1);
    border-radius: 3px;
    border: 1px solid rgba(20, 20, 20, 0.16);
    width: 100%;
    padding: 10px;
`;

const Rotulo = styled.label`
    display: block;
    font-weight: 700;
    font-size: 14px;
    line-height: 18px;
    color: #141414;
`;

const CampoWrapper = styled.div`
    margin-bottom: 12px;
`;

const UploadButton = styled.button`
    font-size: 14px;
    font-weight: 700;
    background-color: transparent;
    color: #141414;
    padding: 6px 16px;
    border: 2px solid #141414;
    border-radius: 4px;
    cursor: pointer;
`;

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
    z-index: 1500;
`;

export default function ModalPerfilAreaCliente({ open, onClose, onUpdated, userId }: ModalPerfilAreaClienteProps) {
    const { usuario } = autenticaStore;
    const [idUser, setIdUser] = useState("");
    const [login, setLogin] = useState("");
    const [email, setEmail] = useState("");
    const [nome, setNome] = useState("");
    const [password, setPassword] = useState("");
    const [senhaVerificada, setSenhaVerificada] = useState("");
    const [imageUrl, setImageUrl] = useState("");
    const [loading, setLoading] = useState(false);
    const [imageKey, setImageKey] = useState(Date.now());
    const [errorMessage, setErrorMessage] = useState("");
    const [showError, setShowError] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    const [showSuccess, setShowSuccess] = useState(false);

    const bucketName = usePublicPhotoBaseUrl();

    const axiosConfig = {
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${usuario.token}`,
        },
    };

    useEffect(() => {
        if (!open) return;
        const targetUserId = userId || localStorage.getItem("userID");
        if (!targetUserId) return;

        http
            .get(`usuarios/${targetUserId}`, axiosConfig)
            .then((resposta) => {
                setIdUser(resposta.data.id);
                setLogin(resposta.data.email);
                setEmail(resposta.data.email);
                setNome(resposta.data.nome);
                setImageUrl(resposta.data.foto || "");
                setImageKey(Date.now());
            })
            .catch((erro) => {
                showErrorAlert(getBackendErrorMessage(erro));
            });
    }, [open, userId]);

    const getBackendErrorMessage = (error: unknown) => {
        if (axios.isAxiosError(error)) {
            const data = error.response?.data;
            if (typeof data === "string") return data;
            if (data && typeof data === "object") {
                const dataRecord = data as Record<string, unknown>;
                const message = dataRecord.message;
                const erro = dataRecord.error || dataRecord.erro;
                if (typeof message === "string" && message.trim().length > 0) return message;
                if (typeof erro === "string" && erro.trim().length > 0) return erro;
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

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!event.target.files || event.target.files.length === 0) return;

        const file = event.target.files[0];
        if (file.size > 1048576) {
            showErrorAlert("O arquivo deve ter no maximo 1MB!");
            return;
        }

        if (file.type !== "image/jpeg" && file.type !== "image/png") {
            showErrorAlert("O arquivo deve ser uma imagem!");
            return;
        }

        const targetUserId = userId || localStorage.getItem("userID");
        if (!targetUserId) {
            showErrorAlert("Usuario nao identificado.");
            return;
        }

        const newFileName = `foto_perfil.${file.type.split("/")[1]}`;
        const newFile = new File([file], newFileName, { type: file.type });
        const formData = new FormData();
        formData.append("file", newFile);
        formData.append("user", targetUserId);

        setLoading(true);
        try {
            const response = await http.post(`/file/upload/perfil`, formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                    Authorization: `Bearer ${usuario.token}`,
                },
            });
            setImageUrl(response.data);
            setImageKey(Date.now());
            onUpdated?.({ nome, foto: response.data });
            showSuccessAlert("Foto atualizada com sucesso!");
        } catch (error) {
            showErrorAlert(getBackendErrorMessage(error));
        } finally {
            setLoading(false);
        }
    };

    const handleSalvar = () => {
        const passwordTrimmed = password.trim();
        const senhaVerificadaTrimmed = senhaVerificada.trim();

        if (passwordTrimmed.length > 0 || senhaVerificadaTrimmed.length > 0) {
            if (passwordTrimmed !== senhaVerificadaTrimmed) {
                showErrorAlert("As senhas nao conferem!");
                return;
            }
            if (passwordTrimmed.length < 8) {
                showErrorAlert("A senha deve ter no minimo 8 caracteres!");
                return;
            }
        }

        const payload: IUsuarioPut = {
            id: idUser,
            login,
            email,
            password: passwordTrimmed === "" ? null : passwordTrimmed,
            nome,
        };

        http
            .put("usuarios", payload, axiosConfig)
            .then(() => {
                onUpdated?.({ nome, foto: imageUrl });
                showSuccessAlert("Alteracao efetuada com sucesso!");
                setPassword("");
                setSenhaVerificada("");
            })
            .catch((erro) => {
                showErrorAlert(getBackendErrorMessage(erro));
            });
    };

    const handleClose = () => {
        setPassword("");
        setSenhaVerificada("");
        onClose();
    };

    return (
        <>
            <AlertPortal show={showError} message={errorMessage} severity="error" onClose={() => setShowError(false)} />
            <AlertPortal show={showSuccess} message={successMessage} severity="success" onClose={() => setShowSuccess(false)} />
            {loading && (
                <Overlay>
                    <CircularProgress color="warning" size="4rem" />
                </Overlay>
            )}
            <Dialog
                open={open}
                onClose={handleClose}
                fullWidth
                maxWidth="sm"
                PaperProps={{ sx: { backgroundColor: "#f5f5f5", color: "#141414", borderRadius: "8px" } }}
            >
                <DialogTitle sx={{ color: "#141414", fontWeight: 700 }}>Meu Perfil</DialogTitle>
                <DialogContent>
                    <Box display="flex" flexDirection="column" gap={1}>
                        <User>
                            {imageUrl && bucketName ? (
                                <img src={`${bucketName}${imageUrl.replaceAll(" ", "+")}?${imageKey}`} alt="Avatar" />
                            ) : (
                                <img src={fotoPadrao} alt="Avatar" />
                            )}
                        </User>
                        <Box display="flex" justifyContent="center" mb={1}>
                            <UploadButton as="label">
                                {`${imageUrl ? "Alterar" : "Adicionar"} Foto`}
                                <Campo type="file" style={{ display: "none" }} onChange={handleFileChange} />
                            </UploadButton>
                        </Box>

                        <CampoWrapper>
                            <Rotulo>Nome de exibição</Rotulo>
                            <Campo type="text" value={nome} placeholder="Digite seu nome" onChange={(e) => setNome(e.target.value)} />
                        </CampoWrapper>

                        <CampoWrapper>
                            <Rotulo>Email</Rotulo>
                            <Campo
                                type="email"
                                value={email}
                                placeholder="Digite seu email"
                                onChange={(e) => {
                                    setEmail(e.target.value);
                                    setLogin(e.target.value);
                                }}
                            />
                        </CampoWrapper>

                        <CampoWrapper>
                            <Rotulo>Alterar senha</Rotulo>
                            <Campo type="password" value={password} placeholder="******" onChange={(e) => setPassword(e.target.value)} />
                        </CampoWrapper>

                        <CampoWrapper>
                            <Rotulo>Repita a nova senha</Rotulo>
                            <Campo type="password" value={senhaVerificada} placeholder="******" onChange={(e) => setSenhaVerificada(e.target.value)} />
                        </CampoWrapper>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2, justifyContent: "space-between" }}>
                    <Typography variant="caption" color="rgba(20, 20, 20, 0.65)">
                        Atualize seus dados para manter o cadastro em dia.
                    </Typography>
                    <Box display="flex" gap={1}>
                        <Button onClick={handleClose} sx={{ color: "#141414" }}>
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleSalvar}
                            variant="outlined"
                            sx={{ borderColor: "#141414", color: "#141414", fontWeight: 700, "&:hover": { borderColor: "#383838", color: "#383838" } }}
                        >
                            Salvar
                        </Button>
                    </Box>
                </DialogActions>
            </Dialog>
        </>
    );
}
