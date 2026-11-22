import { useEffect, useMemo, useState } from "react";
import { Avatar, Box, Button, Chip, CircularProgress, Stack, Typography } from "@mui/material";
import SupervisorAccountOutlinedIcon from "@mui/icons-material/SupervisorAccountOutlined";
import OpenInNewOutlinedIcon from "@mui/icons-material/OpenInNewOutlined";
import http from "../../http";
import autenticaStore from "../../stores/autentica.store";
import ICard from "../../types/ICard";
import IColumn from "../../types/IColumn";
import IClifor from "../../types/IClifor";
import IUser from "../../types/IUser";
import ModalCRM from "../../pages/Crm/Modal";
import fotoPadrao from "../../pages/MeuPerfil/perfil.png";
import { mostrarMensagem } from "../../stores/mensagem.store";

const bucketName = "https://rhsc-bucket-public.s3.us-east-1.amazonaws.com/";

const panelSx = {
    p: { xs: 2, md: 3 },
    borderRadius: "20px",
    bgcolor: "rgba(255, 255, 255, 0.78)",
    border: "1px solid rgba(20, 20, 20, 0.1)",
    boxShadow: "0 16px 48px rgba(20, 20, 20, 0.06)",
    backdropFilter: "blur(6px)",
    minWidth: 0,
};

const chipSx = { bgcolor: "rgba(20, 20, 20, 0.07)", color: "#141414", fontWeight: 700 };

interface MentoradosHomeProps {
    cards: ICard[];
    colunas: IColumn[];
    loading: boolean;
    onCardsChanged?: () => void;
}

const capitalizar = (valor: string) => (valor ? valor.charAt(0).toUpperCase() + valor.slice(1) : valor);

export default function MentoradosHome({ cards, colunas, loading, onCardsChanged }: MentoradosHomeProps) {
    const { usuario } = autenticaStore;
    const [fotos, setFotos] = useState<Record<string, string>>({});
    const [selectedCard, setSelectedCard] = useState<ICard | null>(null);
    const [abrindoId, setAbrindoId] = useState<string | null>(null);

    const axiosConfig = useMemo(() => ({
        headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + usuario.token,
        },
    }), [usuario.token]);

    const colunaPorId = useMemo(() => new Map(colunas.map((coluna) => [coluna.id, coluna])), [colunas]);

    const mentorados = useMemo(
        () => [...cards].sort((a, b) => (a.nome || "").localeCompare(b.nome || "", "pt-BR")),
        [cards],
    );

    useEffect(() => {
        let ativo = true;
        const clientes = Array.from(new Set(cards.map((card) => card.cliente).filter((id): id is number => id != null)))
            .filter((id) => fotos[String(id)] === undefined);
        if (clientes.length === 0) return;

        Promise.allSettled(clientes.map(async (clienteId) => {
            const { data: clifor } = await http.get<IClifor>(`clifor/${clienteId}`, axiosConfig);
            if (!clifor?.idusuario) return [clienteId, ""] as const;
            const { data: user } = await http.get<IUser>(`usuarios/${clifor.idusuario}`, axiosConfig);
            return [clienteId, user?.foto || ""] as const;
        })).then((resultados) => {
            if (!ativo) return;
            const novas: Record<string, string> = {};
            resultados.forEach((resultado, index) => {
                novas[String(clientes[index])] = resultado.status === "fulfilled" ? resultado.value[1] : "";
            });
            setFotos((prev) => ({ ...prev, ...novas }));
        });
        return () => { ativo = false; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cards, axiosConfig]);

    const fotoDoCard = (card: ICard) => {
        const foto = card.cliente != null ? fotos[String(card.cliente)] : "";
        return foto ? `${bucketName}${foto.replaceAll(" ", "+")}` : fotoPadrao;
    };

    const handleOpenCard = async (cardId: string) => {
        try {
            setAbrindoId(cardId);
            const { data } = await http.get<ICard>(`card/${cardId}`, axiosConfig);
            setSelectedCard(data);
        } catch (erro) {
            mostrarMensagem(erro, "error");
        } finally {
            setAbrindoId(null);
        }
    };

    const handleCloseCardModal = () => {
        setSelectedCard(null);
        onCardsChanged?.();
    };

    return (
        <Box component="section" aria-labelledby="mentorados-titulo" sx={panelSx}>
            <Stack direction="row" spacing={1.5} alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0 }}>
                    <Box sx={{ width: 44, height: 44, flexShrink: 0, borderRadius: "14px", display: "grid", placeItems: "center", bgcolor: "rgba(20, 20, 20, 0.07)", color: "#141414" }}>
                        <SupervisorAccountOutlinedIcon aria-hidden="true" />
                    </Box>
                    <Box sx={{ minWidth: 0 }}>
                        <Typography component="span" sx={{ display: "block", fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#666666" }}>
                            Meus mentorados
                        </Typography>
                        <Typography id="mentorados-titulo" component="h2" variant="h6" sx={{ color: "#141414", lineHeight: 1.2 }}>
                            Cliente/Lead
                        </Typography>
                    </Box>
                </Stack>
                <Chip label={mentorados.length} sx={chipSx} aria-label={`${mentorados.length} mentorados`} />
            </Stack>

            {loading && mentorados.length === 0 ? (
                <Box display="flex" justifyContent="center" py={6}>
                    <CircularProgress sx={{ color: "#141414" }} aria-label="Carregando mentorados" />
                </Box>
            ) : mentorados.length === 0 ? (
                <Box sx={{ py: 4, px: 2, textAlign: "center", borderRadius: "14px", border: "1px dashed rgba(20, 20, 20, 0.2)", color: "#666666" }}>
                    <Typography variant="body2">Nenhum cliente ou lead ativo sob sua mentoria.</Typography>
                </Box>
            ) : (
                <Stack
                    component="ul"
                    spacing={1}
                    sx={{ listStyle: "none", m: 0, p: 0, maxHeight: { lg: 620 }, overflowY: "auto", pr: { lg: 0.5 } }}
                >
                    {mentorados.map((card) => {
                        const coluna = colunaPorId.get(card.statusId);
                        return (
                            <Box
                                component="li"
                                key={card.id}
                                sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1.5,
                                    p: 1.25,
                                    borderRadius: "14px",
                                    bgcolor: "#ffffff",
                                    border: "1px solid rgba(20, 20, 20, 0.08)",
                                    transition: "border-color 160ms ease, box-shadow 160ms ease",
                                    "&:hover": { borderColor: "rgba(20, 20, 20, 0.22)", boxShadow: "0 6px 18px rgba(20, 20, 20, 0.06)" },
                                }}
                            >
                                <Avatar
                                    src={fotoDoCard(card)}
                                    alt={`Foto de ${card.nome}`}
                                    variant="rounded"
                                    sx={{ width: 44, height: 44, borderRadius: "12px", border: "2px solid rgba(20, 20, 20, 0.18)" }}
                                />
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Typography sx={{ fontWeight: 700, fontSize: 14, color: "#242424", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={card.nome}>
                                        {card.nome}
                                    </Typography>
                                    <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mt: 0.25, minWidth: 0 }}>
                                        {coluna?.tipo && (
                                            <Chip size="small" label={capitalizar(coluna.tipo)} sx={{ ...chipSx, height: 20, fontSize: 11 }} />
                                        )}
                                        <Typography sx={{ fontSize: 12, color: "#666666", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={coluna?.name}>
                                            {coluna?.name || "Etapa não encontrada"}
                                        </Typography>
                                    </Stack>
                                </Box>
                                <Button
                                    variant="outlined"
                                    size="small"
                                    onClick={() => handleOpenCard(card.id)}
                                    disabled={abrindoId === card.id}
                                    aria-label={`Abrir card de ${card.nome}`}
                                    sx={{ minHeight: 32, minWidth: 0, px: 1.25, flexShrink: 0, fontSize: 12 }}
                                    startIcon={abrindoId === card.id ? <CircularProgress size={14} sx={{ color: "#141414" }} /> : <OpenInNewOutlinedIcon fontSize="small" />}
                                >
                                    Abrir
                                </Button>
                            </Box>
                        );
                    })}
                </Stack>
            )}

            {selectedCard && (
                <ModalCRM
                    open={Boolean(selectedCard)}
                    handleClose={handleCloseCardModal}
                    dados={selectedCard}
                    colunas={colunas}
                    arquivado={false}
                />
            )}
        </Box>
    );
}
