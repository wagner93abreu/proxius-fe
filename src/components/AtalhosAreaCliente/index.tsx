import React, { useMemo, useState } from "react";
import {
    Box,
    Dialog,
    DialogContent,
    DialogTitle,
    IconButton,
    Stack,
    Typography,
} from "@mui/material";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import CloseIcon from "@mui/icons-material/Close";
import AgendarSessao from "../AgendarSessao";
import PastasCliente from "../PastasCliente";
import Comentarios from "../Comentarios";

interface AtalhosAreaClienteProps {
    atendenteId: number | null;
    atendente: string;
    fotoAtendente: string;
    linkCliente?: string | null;
    cliforId?: string | number | null;
    sharePointEmbeddedEnabled?: boolean;
    cardId: string | null;
    usuarioNome: string;
    usuarioId: string | number;
}

type ModalKey = "agendar" | "pastas" | "comentarios" | null;

export default function AtalhosAreaCliente({
    atendenteId,
    atendente,
    fotoAtendente,
    linkCliente,
    cliforId,
    sharePointEmbeddedEnabled = false,
    cardId,
    usuarioNome,
    usuarioId,
}: AtalhosAreaClienteProps) {
    const [openModal, setOpenModal] = useState<ModalKey>(null);

    const canOpenAgendar = useMemo(() => Boolean(atendenteId), [atendenteId]);
    const canOpenPastas = true;
    const canOpenComentarios = useMemo(() => Boolean(cardId), [cardId]);

    const handleOpen = (key: ModalKey) => {
        if (key === "agendar" && !canOpenAgendar) return;
        if (key === "pastas" && !canOpenPastas) return;
        if (key === "comentarios" && !canOpenComentarios) return;
        setOpenModal(key);
    };

    const handleClose = () => setOpenModal(null);

    return (
        <Box
            sx={{
                backgroundColor: "rgba(255,255,255,0.6)",
                border: "1px solid rgba(20, 20, 20, 0.16)",
                borderRadius: 2,
                padding: 2,
                color: "#141414",
                width: "95%",
            }}
        >
            <Typography variant="h6" align="left" gutterBottom sx={{ color: "#141414", marginBottom: 1 }}>
                Atalhos
            </Typography>
            <Stack direction="row" spacing={2} justifyContent="space-around" alignItems="center">
                <Stack alignItems="center" spacing={0.5} sx={{ width: 96 }}>
                    <IconButton
                        aria-label="Agendar sessao"
                        onClick={() => handleOpen("agendar")}
                        disabled={!canOpenAgendar}
                        sx={{
                            color: "#141414",
                            border: "1px solid rgba(20, 20, 20, 0.4)",
                            borderRadius: "50%",
                        }}
                    >
                        <EventAvailableIcon />
                    </IconButton>
                    <Typography variant="caption" color="#141414" align="center">
                        Agendar
                    </Typography>
                </Stack>
                <Stack alignItems="center" spacing={0.5} sx={{ width: 96 }}>
                    <IconButton
                        aria-label="Pastas do cliente"
                        onClick={() => handleOpen("pastas")}
                        disabled={!canOpenPastas}
                        sx={{
                            color: "#141414",
                            border: "1px solid rgba(20, 20, 20, 0.4)",
                            borderRadius: "50%",
                        }}
                    >
                        <FolderOpenIcon />
                    </IconButton>
                    <Typography variant="caption" color="#141414" align="center">
                        Pastas
                    </Typography>
                </Stack>
                <Stack alignItems="center" spacing={0.5} sx={{ width: 96 }}>
                    <IconButton
                        aria-label="Comentarios"
                        onClick={() => handleOpen("comentarios")}
                        disabled={!canOpenComentarios}
                        sx={{
                            color: "#141414",
                            border: "1px solid rgba(20, 20, 20, 0.4)",
                            borderRadius: "50%",
                        }}
                    >
                        <ChatBubbleOutlineIcon />
                    </IconButton>
                    <Typography variant="caption" color="#141414" align="center">
                        Comentarios
                    </Typography>
                </Stack>
            </Stack>

            <Dialog
                open={openModal === "agendar"}
                onClose={handleClose}
                fullWidth
                maxWidth="sm"
                PaperProps={{ sx: { backgroundColor: "#f5f5f5", color: "#141414" } }}
            >
                <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    Agendar sessao
                    <IconButton aria-label="Fechar" onClick={handleClose} sx={{ color: "#141414" }}>
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent>
                    <AgendarSessao
                        atendenteId={atendenteId}
                        atendente={atendente}
                        fotoAtendente={fotoAtendente}
                    />
                </DialogContent>
            </Dialog>

            <Dialog
                open={openModal === "pastas"}
                onClose={handleClose}
                fullWidth
                maxWidth="sm"
                PaperProps={{ sx: { backgroundColor: "#f5f5f5", color: "#141414" } }}
            >
                <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    Pastas do cliente
                    <IconButton aria-label="Fechar" onClick={handleClose} sx={{ color: "#141414" }}>
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent>
                    <PastasCliente linkCliente={linkCliente} cliforId={cliforId} sharePointEmbeddedEnabled={sharePointEmbeddedEnabled} />
                </DialogContent>
            </Dialog>

            <Dialog
                open={openModal === "comentarios"}
                onClose={handleClose}
                fullWidth
                maxWidth="sm"
                PaperProps={{ sx: { backgroundColor: "#f5f5f5", color: "#141414" } }}
            >
                {/* <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <IconButton aria-label="Fechar" onClick={handleClose} sx={{ color: "#cfcfcf" }}>
                        <CloseIcon />
                    </IconButton>
                </DialogTitle> */}
                <DialogContent sx={{ paddingLeft: 0, paddingRight: 1, py: 15, overflowX: "hidden" }}>
                    <Box sx={{ width: "100%", overflowX: "hidden" }}>
                        <Comentarios cardId={cardId} usuarioNome={usuarioNome} usuarioId={usuarioId} $light />
                    </Box>
                </DialogContent>
            </Dialog>
        </Box>
    );
}
