import React, { useId, useState } from "react";
import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Stack, Typography } from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import CloseIcon from "@mui/icons-material/Close";
import ArquivosCliente from "../ArquivosCliente";
import BibliotecaCliente from "../BibliotecaCliente";
import { isLibraryEnabled } from "../../http/bibliotecas";
import { isSharePointEnabled } from "../../http/sharepoint";
import { isLocalHost } from "../../http/localSharePoint";
import lightTheme from "../../styles/lightTheme";

interface PastasClienteProps {
    linkCliente?: string | null;
    cliforId?: string | number | null;
    sharePointEmbeddedEnabled?: boolean;
}

export default function PastasCliente({ linkCliente, cliforId, sharePointEmbeddedEnabled = false }: PastasClienteProps) {
    const usarSharePoint = sharePointEmbeddedEnabled === true && isSharePointEnabled();
    const clienteIdentificado = cliforId != null && cliforId !== "";
    const usarBiblioteca = sharePointEmbeddedEnabled === true && isLibraryEnabled();
    const [modal, setModal] = useState<"biblioteca" | "editaveis" | null>(null);
    const modalTitleId = useId();
    const fecharModal = () => setModal(null);
    const staticLink = "https://rhsemcomplicacoes.sharepoint.com/:f:/s/RHsemComplicaes/IgBpUq4xTwTzS4piLxfF3VMOAbj-v4RLlpVyEsUl8vSv3yw";
    const allowLegacyLinks = !isLocalHost();
    

    const handleOpen = (url?: string | null) => {
        if (!url) return;
        window.open(url, "_blank");
    };

    return (
        <Box
            sx={{
                backgroundColor: "rgba(255,255,255,0.6)",
                border: "1px solid rgba(85, 8, 29, 0.16)",
                borderRadius: 2,
                padding: 2,
                color: "#55081d",
                width: "95%",
            }}
        >
            <Typography variant="h6" align="left" gutterBottom style={{ color: "#55081d", marginBottom: 10 }}>
                Arquivos
            </Typography>
            
            <Stack
                direction="row"
                flexWrap="wrap"
                justifyContent="flex-start"
                alignItems="flex-start"
                sx={{ columnGap: 1.5, rowGap: 1.5 }}
            >
                <Button
                    variant="outlined"
                    onClick={() => usarBiblioteca ? setModal("biblioteca") : handleOpen(allowLegacyLinks ? staticLink : null)}
                    disabled={!usarBiblioteca && !allowLegacyLinks}
                    aria-haspopup={usarBiblioteca ? "dialog" : undefined}
                    title="Aqui você encontra os arquivos para consulta."
                    sx={{ alignSelf: "flex-start", borderColor: "#55081d", color: "#55081d", fontWeight: 700, "&:hover": { borderColor: "#6f102a", color: "#6f102a" } }}
                >
                    Biblioteca RH sem Complicações
                </Button>
                <Button
                    variant="outlined"
                    onClick={() => usarSharePoint ? setModal("editaveis") : handleOpen(allowLegacyLinks ? linkCliente : null)}
                    disabled={!usarSharePoint && (!allowLegacyLinks || !linkCliente)}
                    aria-haspopup={usarSharePoint ? "dialog" : undefined}
                    title="Aqui você encontra todos os arquivos personalizados e exclusivos para você."
                    sx={{ alignSelf: "flex-start", borderColor: "#55081d", color: "#55081d", fontWeight: 700, "&:hover": { borderColor: "#6f102a", color: "#6f102a" } }}
                >
                    Arquivos Editáveis
                </Button>
            </Stack>
            <ThemeProvider theme={lightTheme}>
                <Dialog open={(modal === "biblioteca" && usarBiblioteca) || (modal === "editaveis" && usarSharePoint)} onClose={fecharModal} fullWidth maxWidth="lg"
                    aria-labelledby={modalTitleId}>
                    <DialogTitle id={`${modalTitleId}-heading`}
                        sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2 }}>
                        <Box component="span" id={modalTitleId}>
                            {modal === "biblioteca" ? "Biblioteca RH sem Complicações" : "Arquivos Editáveis"}
                        </Box>
                        <IconButton onClick={fecharModal} aria-label="Fechar arquivos" sx={{ color: "primary.main" }}>
                            <CloseIcon />
                        </IconButton>
                    </DialogTitle>
                    <DialogContent sx={{ p: { xs: 2, sm: 3 } }}>
                        {modal === "biblioteca" && usarBiblioteca && (cliforId != null && cliforId !== "" ? (
                            <BibliotecaCliente cliforId={cliforId} />
                        ) : (
                            <Alert severity="error">
                                Não foi possível identificar o cliente para carregar a biblioteca.
                            </Alert>
                        ))}
                        {modal === "editaveis" && usarSharePoint && (clienteIdentificado ? (
                            <ArquivosCliente cliforId={cliforId} titulo="Arquivos Editáveis" />
                        ) : (
                            <Alert severity="error">
                                Não foi possível identificar o cliente para carregar os arquivos editáveis.
                            </Alert>
                        ))}
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={fecharModal}>Fechar</Button>
                    </DialogActions>
                </Dialog>
            </ThemeProvider>
        </Box>
    );
}
