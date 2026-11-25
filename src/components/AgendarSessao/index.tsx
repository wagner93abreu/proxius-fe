import React, { useEffect, useState } from "react";
import { Box, Button, Stack, Typography } from "@mui/material";
import { usePublicPhotoBaseUrl } from "../../PublicPhotoConfig";
import http from "../../http";

interface AtendenteProps {
    atendenteId: number | null;
    atendente: string;
    fotoAtendente: string;
}

export default function AgendarSessao({ atendenteId, atendente, fotoAtendente }: AtendenteProps) {
    const bucketName = usePublicPhotoBaseUrl();
    const [agenda, setAgenda] = useState<{ atendenteId: number; url: string } | null>(null);
    const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
    const link = agenda?.atendenteId === atendenteId ? agenda.url : null;

    useEffect(() => {
        let active = true;
        setAgenda(null);
        if (!atendenteId) {
            setStatus("ready");
            return () => { active = false; };
        }
        setStatus("loading");
        http.get<{ linkAgenda: string | null }>(`usuarios/${atendenteId}/agenda`, {
            headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` },
        }).then(({ data }) => {
            if (!active) return;
            try {
                const url = data.linkAgenda ? new URL(data.linkAgenda) : null;
                setAgenda(url?.protocol === "https:" && !url.username && !url.password
                    ? { atendenteId, url: url.href } : null);
            } catch {
                setAgenda(null);
            }
            setStatus("ready");
        }).catch(() => {
            if (active) setStatus("error");
        });
        return () => { active = false; };
    }, [atendenteId]);

    const handleOpen = (url?: string | null) => {
        if (!url) return;
        window.open(url, "_blank", "noopener,noreferrer");
    };

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
            <Stack direction="row" spacing={1.5} alignItems="center" justifyContent="flex-start">
                {fotoAtendente && bucketName && (
                    <Box
                        component="img"
                        src={bucketName + fotoAtendente}
                        alt={"Foto da consultoria"}
                        sx={{ width: 72, height: 72, borderRadius: "50%", objectFit: "cover", border: "2px solid #141414" }}
                    />
                )}
                <Stack spacing={1} alignItems="flex-start">
                    <Typography variant="h6" align="left" gutterBottom sx={{ color: "#141414", marginBottom: 0 }}>
                        {`Agende sua sessão com ${atendente}`}
                    </Typography>
                    <Button
                        variant="outlined"
                        onClick={() => handleOpen(link)}
                        disabled={!link || status !== "ready"}
                        sx={{ borderColor: "#141414", color: "#141414", fontWeight: 700, "&:hover": { borderColor: "#383838", color: "#383838" } }}
                    >
                        Agende aqui!
                    </Button>
                    {status === "loading" && <Typography>Carregando agenda...</Typography>}
                    {status === "error" && <Typography role="alert">Não foi possível carregar a agenda.</Typography>}
                    {status === "ready" && !link && <Typography>Agenda não configurada.</Typography>}
                </Stack>
            </Stack>
        </Box>
    );
}
