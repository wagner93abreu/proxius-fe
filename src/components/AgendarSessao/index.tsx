import React from "react";
import { Box, Button, Stack, Typography } from "@mui/material";

interface AtendenteProps {
    atendenteId: number | null;
    atendente: string;
    fotoAtendente: string;
}

export default function AgendarSessao({ atendenteId, atendente, fotoAtendente }: AtendenteProps) {
    const bucketName = "https://rhsc-bucket-public.s3.us-east-1.amazonaws.com/";

    const atendimentoLinks: Record<number, string> = {
        2: "https://outlook.office365.com/book/RHsemComplicaes1@rhsemcomplicacoes.onmicrosoft.com/s/Ba2mBsXoR06HqNu2Z8u7tQ2", // Bella
        16: "https://outlook.office.com/book/RHsemComplicaes1@rhsemcomplicacoes.onmicrosoft.com/s/LyqMhAQSckG7n3j0L5M4CA2?ismsaljsauthenabled", // Clara
        14: "https://outlook.office.com/book/RHsemComplicaes1@rhsemcomplicacoes.onmicrosoft.com/s/zGcUHyH1zkamHoj_7-MWHg2?ismsaljsauthenabled", // Thamires
        3: "https://outlook.office365.com/book/RHsemComplicaes1@rhsemcomplicacoes.onmicrosoft.com/s/c1j7ANJtpEWky7cvmAS-yw2", // Maria Alice
        40: "https://outlook.office.com/book/RHsemComplicaes1@rhsemcomplicacoes.onmicrosoft.com/s/SWfYvZG1dEKIZrIkFIuatg2?ismsaljsauthenabled", // Caroline Rosa
    };

    const staticLink = atendenteId ? atendimentoLinks[atendenteId] : undefined;

    const handleOpen = (url?: string | null) => {
        if (!url) return;
        window.open(url, "_blank");
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
                {fotoAtendente && (
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
                        onClick={() => handleOpen(staticLink)}
                        title="Aqui você encontra os arquivos para consulta."
                        sx={{ borderColor: "#141414", color: "#141414", fontWeight: 700, "&:hover": { borderColor: "#383838", color: "#383838" } }}
                    >
                        Agende aqui!
                    </Button>
                </Stack>
            </Stack>
        </Box>
    );
}
