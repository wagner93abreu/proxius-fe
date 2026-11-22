import styled from "styled-components";
import Container from "../../components/Container";
import { useNavigate } from "react-router-dom";
import autenticaStore from "../../stores/autentica.store";
import http from '../../http';
import * as React from 'react';
import { useMemo, useState } from "react";
import { Box, ButtonBase, Stack, Typography } from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import { SvgIconComponent } from "@mui/icons-material";
import AdminPanelSettingsOutlinedIcon from "@mui/icons-material/AdminPanelSettingsOutlined";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import CategoryOutlinedIcon from "@mui/icons-material/CategoryOutlined";
import FolderCopyOutlinedIcon from "@mui/icons-material/FolderCopyOutlined";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import PercentOutlinedIcon from "@mui/icons-material/PercentOutlined";
import SnippetFolderOutlinedIcon from "@mui/icons-material/SnippetFolderOutlined";
import TrackChangesOutlinedIcon from "@mui/icons-material/TrackChangesOutlined";
import PaymentsOutlinedIcon from "@mui/icons-material/PaymentsOutlined";
import StorageOutlinedIcon from "@mui/icons-material/StorageOutlined";
import { isLibraryEnabled } from "../../http/bibliotecas";
import lightTheme from "../../styles/lightTheme";
import { mostrarMensagem } from "../../stores/mensagem.store";

const ContainerClaro = styled(Container)`
  background: linear-gradient(180deg, #f6f6f6 0%, #e8e8e8 100%);
  color: #141414;
  min-height: calc(100dvh - 48px);
  box-sizing: border-box;
  margin: 0;
  padding: 40px 32px 64px;

  @media (max-width: 600px) {
    padding: 24px 16px 48px;
  }
`;

interface Atalho {
  label: string;
  description: string;
  path: string;
  icon: SvgIconComponent;
}

interface GrupoAtalhos {
  id: string;
  title: string;
  description: string;
  items: Atalho[];
}

function CartaoAtalho({ atalho, onClick }: { atalho: Atalho; onClick: () => void }) {
  const Icon = atalho.icon;
  const descriptionId = `atalho-${atalho.path.replace(/\W+/g, "-")}-descricao`;
  return (
    <ButtonBase onClick={onClick} aria-label={atalho.label} aria-describedby={descriptionId} focusRipple sx={{
      display: "flex", alignItems: "flex-start", justifyContent: "flex-start", gap: 2, width: "100%", height: "100%",
      p: 2.5, textAlign: "left", borderRadius: "16px", border: "1px solid", borderColor: "divider",
      bgcolor: "background.paper", color: "text.primary",
      transition: "border-color 160ms ease, box-shadow 160ms ease, transform 160ms ease",
      "&:hover": { borderColor: "primary.main", boxShadow: "0 10px 28px rgba(20, 20, 20, 0.1)", transform: "translateY(-2px)" },
      "&:hover .atalho-seta": { color: "primary.main", transform: "translateX(2px)" },
      "&.Mui-focusVisible": { outline: "3px solid rgba(20, 20, 20, 0.35)", outlineOffset: 2 },
      "@media (prefers-reduced-motion: reduce)": { transition: "none", "&:hover": { transform: "none" } },
    }}>
      <Box sx={{
        display: "grid", placeItems: "center", width: 48, height: 48, flexShrink: 0,
        borderRadius: 3, bgcolor: "rgba(20, 20, 20, 0.07)", color: "primary.main",
      }}>
        <Icon aria-hidden="true" />
      </Box>
      <Box sx={{ minWidth: 0, flexGrow: 1 }}>
        <Typography component="span" sx={{ display: "block", fontWeight: 700, fontSize: 17, color: "primary.main" }}>
          {atalho.label}
        </Typography>
        <Typography id={descriptionId} component="span" variant="body2" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
          {atalho.description}
        </Typography>
      </Box>
      <ArrowForwardIcon className="atalho-seta" fontSize="small" aria-hidden="true"
        sx={{ alignSelf: "center", color: "text.secondary", transition: "transform 160ms ease, color 160ms ease" }} />
    </ButtonBase>
  );
}



export default function PainelDeControle() {
    const navigate = useNavigate();
    const {usuario} = autenticaStore;
    const [papel, setPapel] = useState<string | null>('')
    const axiosConfig = useMemo(() => ({
      headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${usuario.token}`,
      },
    }), []);

    React.useEffect(() => {
      http.get(`usuarios/${localStorage.getItem('userID')}`, axiosConfig).then(resposta => {
        //console.log(resposta)
        setPapel(resposta.data.papel)
      })
      .catch(erro => {
          mostrarMensagem(erro, "error")
      });
  
    }, [axiosConfig])

    const grupos: GrupoAtalhos[] = [
      ...(/^[a-z0-9](?:[a-z0-9-]{0,48}[a-z0-9])?\.localhost$/.test(window.location.hostname) ? [{
        id: "integracoes",
        title: "Integrações e armazenamento",
        description: "Configurações locais da empresa e acompanhamento simulado de armazenamento.",
        items: [
          { label: "Integração Asaas", description: "Cadastre a chave da API e o token de webhook.", path: "/painelDeControle/integracoes/asaas", icon: PaymentsOutlinedIcon },
          { label: "Armazenamento", description: "Consulte o uso medido e o histórico de coletas.", path: "/painelDeControle/armazenamento", icon: StorageOutlinedIcon },
        ],
      }] : []),
      {
        id: "administracao",
        title: "Administração e financeiro",
        description: "Cadastros, parâmetros financeiros e metas comerciais.",
        items: [
          { label: "Usuários", description: "Gerencie acessos e perfis da equipe.", path: "/usuarios", icon: PeopleAltOutlinedIcon },
          { label: "Taxas", description: "Configure as taxas aplicadas nas vendas.", path: "/taxas", icon: PercentOutlinedIcon },
          { label: "Categorias Financeiro", description: "Organize as categorias de lançamentos.", path: "/categoriasFinanceiro", icon: CategoryOutlinedIcon },
          { label: "Meta de Vendas", description: "Defina e acompanhe as metas comerciais.", path: "/meta", icon: TrackChangesOutlinedIcon },
        ],
      },
      {
        id: "documental",
        title: "Gestão documental",
        description: "Materiais de consulta e modelos editáveis entregues aos clientes.",
        items: [
          ...(isLibraryEnabled() ? [{ label: "Bibliotecas", description: "Publique materiais e gerencie acessos.", path: "/painelDeControle/bibliotecas", icon: FolderCopyOutlinedIcon }] : []),
          { label: "Modelos de arquivos", description: "Mantenha o acervo mestre de originais.", path: "/painelDeControle/modelos-arquivo", icon: SnippetFolderOutlinedIcon },
        ],
      },
    ];

    return (
      <React.Fragment>
        {papel === 'ADMIN' && (
          <ThemeProvider theme={lightTheme}>
            <ContainerClaro aria-labelledby="painel-controle-title">
              <Box sx={{ maxWidth: 1280, mx: "auto" }}>
                <Stack component="header" direction="row" alignItems="center" spacing={2} sx={{ mb: 4 }}>
                  <Box sx={{
                    display: { xs: "none", sm: "grid" }, placeItems: "center", width: 64, height: 64,
                    bgcolor: "rgba(255,255,255,0.65)", border: "1px solid", borderColor: "divider",
                    borderRadius: 3, flexShrink: 0,
                  }}>
                    <AdminPanelSettingsOutlinedIcon sx={{ fontSize: 32 }} aria-hidden="true" />
                  </Box>
                  <Box>
                    <Typography variant="overline" sx={{ letterSpacing: "0.12em", color: "text.secondary" }}>
                      Administração
                    </Typography>
                    <Typography id="painel-controle-title" component="h1" variant="h5"
                      sx={{ fontSize: { xs: 26, sm: 32 }, mb: 0.75 }}>
                      Painel de Controle
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Acesse rapidamente as configurações e os acervos do sistema.
                    </Typography>
                  </Box>
                </Stack>
                <Stack spacing={3}>
                  {grupos.map((grupo) => (
                    <Box key={grupo.id} component="section" aria-labelledby={`painel-${grupo.id}`} sx={{
                      p: { xs: 2, sm: 3 }, border: "1px solid rgba(20, 20, 20, 0.16)", borderRadius: "20px",
                      bgcolor: "rgba(255,255,255,0.72)", boxShadow: "0 16px 48px rgba(20, 20, 20, 0.06)",
                    }}>
                      <Typography id={`painel-${grupo.id}`} component="h2" variant="h6">{grupo.title}</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 2.5 }}>
                        {grupo.description}
                      </Typography>
                      <Box component="ul" sx={{
                        listStyle: "none", m: 0, p: 0, display: "grid", gap: 2,
                        gridTemplateColumns: { xs: "minmax(0, 1fr)", sm: "repeat(2, minmax(0, 1fr))", lg: "repeat(4, minmax(0, 1fr))" },
                      }}>
                        {grupo.items.map((atalho) => (
                          <li key={atalho.path}>
                            <CartaoAtalho atalho={atalho} onClick={() => navigate(atalho.path)} />
                          </li>
                        ))}
                      </Box>
                    </Box>
                  ))}
                </Stack>
              </Box>
            </ContainerClaro>
          </ThemeProvider>
        )}
      </React.Fragment>
    )
}
