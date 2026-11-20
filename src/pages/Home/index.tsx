import * as React from "react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Stack, Typography } from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import autenticaStore from "../../stores/autentica.store";
import IClifor from "../../types/IClifor";
import IColumn from "../../types/IColumn";
import ICard from "../../types/ICard";
import IUser from "../../types/IUser";
import http from "../../http";
import lightTheme from "../../styles/lightTheme";
import AtividadesHome from "../../components/AtividadesHome";
import MentoradosHome from "../../components/MentoradosHome";
import fotoPadrao from "../MeuPerfil/perfil.png";
import { mostrarMensagem } from "../../stores/mensagem.store";

const bucketName = "https://rhsc-bucket-public.s3.us-east-1.amazonaws.com/";

function RelogioHome() {
  const [agora, setAgora] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setAgora(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const dataExtenso = agora.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });
  const data = dataExtenso.charAt(0).toUpperCase() + dataExtenso.slice(1);
  const hora = agora.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  return (
    <Stack
      direction="row"
      spacing={1.5}
      alignItems="center"
      aria-label="Data e hora atuais"
      sx={{
        px: 2,
        py: 1.25,
        borderRadius: "16px",
        bgcolor: "rgba(255, 255, 255, 0.78)",
        border: "1px solid rgba(85, 8, 29, 0.1)",
        boxShadow: "0 10px 30px rgba(85, 8, 29, 0.06)",
        backdropFilter: "blur(6px)",
      }}
    >
      <CalendarTodayOutlinedIcon aria-hidden="true" sx={{ color: "#55081d" }} />
      <Box sx={{ textAlign: "right" }}>
        <Typography component="time" dateTime={agora.toISOString()} sx={{ display: "block", fontSize: 26, fontWeight: 800, lineHeight: 1.1, color: "#55081d", fontVariantNumeric: "tabular-nums" }}>
          {hora}
        </Typography>
        <Typography sx={{ fontSize: 13, color: "#75656b" }}>{data}</Typography>
      </Box>
    </Stack>
  );
}

export default function Home() {
  const { usuario } = autenticaStore;
  const [nome, setNome] = useState<string | null>("");
  const [papel, setPapel] = useState<string | null>("");
  const [foto, setFoto] = useState("");
  const [colunas, setColunas] = useState<IColumn[]>([]);
  const [colunasCarregadas, setColunasCarregadas] = useState(false);
  const [cardsMentorados, setCardsMentorados] = useState<ICard[]>([]);
  const [mentoradosCarregando, setMentoradosCarregando] = useState(true);
  const [refreshCards, setRefreshCards] = useState(0);
  const navigate = useNavigate();
  const userId = localStorage.getItem("userID");

  const axiosConfig = useMemo(() => ({
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + usuario.token,
    },
  }), [usuario.token]);

  React.useEffect(() => {
    if (userId != null) {
      http.get<IClifor[]>(`clifor/filter?attribute=idusuario&value=${userId}`, axiosConfig).then(resposta => {
        setNome(resposta.data[0].nomecomercial);
      })
        .catch(erro => {
          mostrarMensagem(erro, "error");
        });

      http.get<IUser>(`usuarios/${userId}`, axiosConfig).then(resposta => {
        setPapel(resposta.data.papel);
        setFoto(resposta.data.foto || "");
      })
        .catch(erro => {
          mostrarMensagem(erro, "error");
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    if (papel === "CLIENTE") {
      navigate("/areaCliente", { replace: true });
    }
  }, [papel, navigate]);

  React.useEffect(() => {
    if (!userId || !papel || papel === "CLIENTE") return;
    let ativo = true;
    setMentoradosCarregando(true);
    http.get<IColumn[]>("column", axiosConfig)
      .then(async (resposta) => {
        const ativas = resposta.data.filter((coluna) => coluna.active).sort((a, b) => a.position - b.position);
        const colunasMentorados = ativas.filter((coluna) => coluna.tipo === "clientes" || coluna.tipo === "leads");
        if (!ativo) return;
        setColunas(ativas);
        setColunasCarregadas(true);
        if (colunasMentorados.length === 0) {
          setCardsMentorados([]);
          return;
        }
        const filtro = colunasMentorados.map((coluna) => `statusId=${coluna.id}`).join("&");
        const { data } = await http.get<ICard[]>(`card/get-cards-by-column?${filtro}`, axiosConfig);
        if (!ativo) return;
        setCardsMentorados((data || []).filter((card) => String(card.atendenteId) === String(userId)));
      })
      .catch(erro => {
        mostrarMensagem(erro, "error");
      })
      .finally(() => {
        if (ativo) setMentoradosCarregando(false);
      });
    return () => { ativo = false; };
  }, [papel, userId, axiosConfig, refreshCards]);

  const atualizarCards = () => setRefreshCards((valor) => valor + 1);
  const exibirMentorados = cardsMentorados.length > 0;
  const primeiroNome = (nome || "").trim();

  return (
    <ThemeProvider theme={lightTheme}>
      <Box
        component="section"
        aria-label="Início"
        sx={{
          px: { xs: 2, md: 4 },
          pt: { xs: 3, md: 4 },
          pb: { xs: 6, md: 8 },
          color: "#35252b",
        }}
      >
        <Box sx={{ maxWidth: 1600, mx: "auto" }}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            alignItems={{ xs: "flex-start", sm: "center" }}
            justifyContent="space-between"
            spacing={2}
            sx={{ mb: { xs: 3, md: 4 } }}
          >
            <Stack direction="row" spacing={2} alignItems="center" sx={{ minWidth: 0 }}>
              <Box
                component="img"
                src={foto ? `${bucketName}${foto.replaceAll(" ", "+")}` : fotoPadrao}
                alt="Sua foto de perfil"
                sx={{
                  width: { xs: 64, md: 80 },
                  height: { xs: 64, md: 80 },
                  borderRadius: "18px",
                  objectFit: "cover",
                  border: "3px solid #fffdfa",
                  boxShadow: "0 10px 30px rgba(85, 8, 29, 0.16)",
                  bgcolor: "#fffdfa",
                  flexShrink: 0,
                }}
              />
              <Box sx={{ minWidth: 0 }}>
                <Typography component="span" sx={{ display: "block", fontSize: 12, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#75656b" }}>
                  Bem-vindo(a) de volta
                </Typography>
                <Typography component="h1" sx={{ fontSize: { xs: 26, md: 32 }, fontWeight: 800, lineHeight: 1.15, color: "#55081d", wordBreak: "break-word" }}>
                  Olá, {primeiroNome}
                </Typography>
              </Box>
            </Stack>
            <Box sx={{ alignSelf: { xs: "stretch", sm: "center" }, display: "flex", justifyContent: { xs: "flex-start", sm: "flex-end" } }}>
              <RelogioHome />
            </Box>
          </Stack>

          <Box
            sx={{
              display: "grid",
              gap: 3,
              alignItems: "start",
              gridTemplateColumns: {
                xs: "minmax(0, 1fr)",
                lg: exibirMentorados ? "minmax(0, 7fr) minmax(320px, 3fr)" : "minmax(0, 1fr)",
              },
            }}
          >
            {papel && papel !== "CLIENTE" && <AtividadesHome colunas={colunas} colunasCarregadas={colunasCarregadas}             onCardsChanged={atualizarCards} />}
            {exibirMentorados && (
              <MentoradosHome cards={cardsMentorados} colunas={colunas} loading={mentoradosCarregando} onCardsChanged={atualizarCards} />
            )}
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
}
