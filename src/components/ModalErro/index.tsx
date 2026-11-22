import { useId } from "react";
import { Box, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, IconButton } from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";
import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { TipoMensagem } from "../../stores/mensagem.store";
import lightTheme from "../../styles/lightTheme";

interface ModalErroProps {
    open: boolean;
    message: string;
    onClose: () => void;
    title?: string;
    severity?: TipoMensagem;
}

const apresentacao = {
    error: { title: "Não foi possível continuar", icon: ErrorOutlineRoundedIcon },
    success: { title: "Tudo certo!", icon: CheckCircleOutlineRoundedIcon },
    warning: { title: "Atenção", icon: WarningAmberRoundedIcon },
    info: { title: "Informação", icon: InfoOutlinedIcon },
};

export default function ModalErro({ open, message, onClose, title, severity = "error" }: ModalErroProps) {
    const id = useId();
    const titleId = `${id}-title`;
    const messageId = `${id}-message`;
    const Icon = apresentacao[severity].icon;

    return (
        <ThemeProvider theme={lightTheme}>
            <Dialog
                open={open}
                onClose={onClose}
                fullWidth
                maxWidth="xs"
                sx={{ zIndex: 10000 }}
                aria-labelledby={titleId}
                aria-describedby={messageId}
                PaperProps={{ role: "alertdialog" }}
            >
                <DialogTitle id={titleId} sx={{ pr: 7 }}>
                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: 48,
                            height: 48,
                            mb: 2,
                            borderRadius: "50%",
                            bgcolor: "rgba(20, 20, 20, 0.08)",
                            color: "primary.main",
                        }}
                    >
                        <Icon fontSize="large" />
                    </Box>
                    {title || apresentacao[severity].title}
                </DialogTitle>
                <IconButton
                    aria-label={severity === "error" ? "Fechar mensagem de erro" : "Fechar mensagem"}
                    onClick={onClose}
                    sx={{ position: "absolute", right: 12, top: 12, color: "primary.main" }}
                >
                    <CloseRoundedIcon />
                </IconButton>
                <DialogContent>
                    <DialogContentText id={messageId} sx={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
                        {message}
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button autoFocus variant="contained" onClick={onClose}>Entendi</Button>
                </DialogActions>
            </Dialog>
        </ThemeProvider>
    );
}
