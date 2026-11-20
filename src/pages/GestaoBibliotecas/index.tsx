import React, { useEffect, useState } from "react";
import { Alert, Box, CircularProgress, Stack, Typography } from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import FolderCopyOutlinedIcon from "@mui/icons-material/FolderCopyOutlined";
import styled from "styled-components";
import Container from "../../components/Container";
import BibliotecaCliente from "../../components/BibliotecaCliente";
import { isLibraryEnabled, libraryAuthHeaders } from "../../http/bibliotecas";
import http from "../../http";
import IUser from "../../types/IUser";
import lightTheme from "../../styles/lightTheme";

const ContainerClaro = styled(Container)`
    background: linear-gradient(180deg, #efe5d8 0%, #e2d8cc 100%);
    color: #55081d;
    min-height: calc(100dvh - 48px);
    box-sizing: border-box;
    margin: 0;
    padding: 40px 32px 64px;

    @media (max-width: 600px) {
        padding: 24px 16px 48px;
    }
`;

export default function GestaoBibliotecas() {
    const [role, setRole] = useState<string | null>(null);
    const [error, setError] = useState("");

    useEffect(() => {
        let active = true;
        const userId = localStorage.getItem("userID");
        if (!userId || !localStorage.getItem("authToken")) {
            setRole("");
            setError("Sua sessão expirou. Faça login novamente.");
            return () => { active = false; };
        }
        http.get<IUser>(`usuarios/${encodeURIComponent(userId)}`, {
            headers: libraryAuthHeaders(),
        }).then(({ data }) => {
            if (active) setRole(data.papel);
        }).catch(() => {
            if (active) {
                setRole("");
                setError("Não foi possível verificar o perfil. Faça login novamente.");
            }
        });
        return () => { active = false; };
    }, []);

    return (
        <ThemeProvider theme={lightTheme}>
            <ContainerClaro aria-labelledby="gestao-bibliotecas-title">
                <Box sx={{ maxWidth: 1280, mx: "auto" }}>
                    <Stack component="header" direction="row" alignItems="center" spacing={2} sx={{ mb: 4 }}>
                        <Box sx={{
                            display: { xs: "none", sm: "grid" }, placeItems: "center", width: 64, height: 64,
                            bgcolor: "rgba(255,255,255,0.65)", border: "1px solid", borderColor: "divider",
                            borderRadius: 3, flexShrink: 0,
                        }}>
                            <FolderCopyOutlinedIcon sx={{ fontSize: 32 }} aria-hidden="true" />
                        </Box>
                        <Box>
                            <Typography variant="overline" sx={{ letterSpacing: "0.12em", color: "text.secondary" }}>
                                Gestão documental
                            </Typography>
                            <Typography id="gestao-bibliotecas-title" component="h1" variant="h5"
                                sx={{ fontSize: { xs: 26, sm: 32 }, mb: 0.75 }}>
                                Gestão de bibliotecas
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Organize materiais, publique conteúdos e gerencie o acesso dos clientes.
                            </Typography>
                        </Box>
                    </Stack>
                    {role === null ? <Stack direction="row" alignItems="center" spacing={2} role="status">
                        <CircularProgress size={24} aria-label="Verificando acesso" />
                        <Typography color="text.secondary">Verificando acesso...</Typography>
                    </Stack> :
                        role !== "ADMIN" ? <Alert severity="error">{error || "Acesso restrito a administradores."}</Alert> :
                            !isLibraryEnabled() ? <Alert severity="warning">Habilite REACT_APP_LIBRARY_ENABLED para usar a gestão.</Alert> :
                                <BibliotecaCliente mode="admin" />}
                </Box>
            </ContainerClaro>
        </ThemeProvider>
    );
}
