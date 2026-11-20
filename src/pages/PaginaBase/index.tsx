import { Outlet, useLocation } from "react-router-dom";
import Cabecalho from "../../components/Cabecalho";
import Rodape from "../../components/Rodape";
import styled from "styled-components";
import wallpaper from "./wallpaper.png"
import wallpaperLogin from "../Login/wallpaper.png"
import { ThemeProvider } from "@mui/material/styles";
import { ThemeProvider as StyledThemeProvider, css } from "styled-components";
import managementTheme from "../../styles/managementTheme";

const ContainerPrincipal = styled.div<{ $isClientArea: boolean; $isCrmPage: boolean; $light: boolean; $loginWallpaper: boolean }>`
    background-image: ${({ $isClientArea, $light, $loginWallpaper }) => ($loginWallpaper
        ? `linear-gradient(180deg, rgba(239, 229, 216, 0.72) 0%, rgba(226, 216, 204, 0.72) 100%), url(${wallpaperLogin})`
        : $isClientArea || $light ? "none" : `url(${wallpaper})`)};
    background-position: center center;
    background-color: ${({ $isClientArea, $light }) => ($light ? "#efe5d8" : $isClientArea ? "#370617" : "#1b1b1b")};
    background-size: cover;
    width: 100vw;
    height: 100vh;
    overflow: ${({ $isCrmPage }) => ($isCrmPage ? "hidden" : "auto")};
    ${({ $light }) => $light && css`
        scrollbar-color: #b78c9a #f7f1e9;
        &::-webkit-scrollbar-thumb { background-color: #b78c9a; }
    `}

`

export default function PaginaBase(){
    
    const location = useLocation();
    
    const isCrmPage = location.pathname.includes('/crm');
    const isLibraryPage = ['/painelDeControle', '/painelDeControle/bibliotecas', '/painelDeControle/modelos-arquivo', '/painelDeControle/integracoes/asaas', '/meta']
        .includes(location.pathname.replace(/\/+$/, ''));
    const isAttendantClientArea = /^\/AreaClienteAtendente\/[^/]+\/?$/i.test(location.pathname);
    const isHomePage = location.pathname.replace(/\/+$/, "").toLowerCase() === "/home";
    const isManagementPage = [
        "/meuperfil", "/comissao", "/precrm", "/dashboardresumo", "/metricasvendas",
        "/clifor", "/vendas", "/produtos", "/precificacao", "/templatescontrato", "/painelnf", "/financeiro",
        "/usuarios", "/taxas", "/categoriasfinanceiro",
    ].includes(location.pathname.replace(/\/+$/, "").toLowerCase());
    const light = isLibraryPage || isAttendantClientArea || isHomePage || isManagementPage;
    const isClientArea = (location.pathname.includes('/areaCliente') || location.pathname.includes('/AreaCliente')) && !location.pathname.includes('/AreaClienteAtendente');
    const isAreaClientePage = (location.pathname.includes('/areaCliente') || location.pathname.includes('/AreaCliente')) && !location.pathname.includes('/AreaClienteAtendente');

    return(
        <>
        <ContainerPrincipal $isCrmPage={isCrmPage} $isClientArea={isClientArea} $light={light} $loginWallpaper={isHomePage}>
        {!isCrmPage && !isClientArea && <Cabecalho light={light} />}
        <main>
            {isManagementPage ? (
                <ThemeProvider theme={managementTheme}>
                    <StyledThemeProvider theme={managementTheme}>
                        <Outlet />
                    </StyledThemeProvider>
                </ThemeProvider>
            ) : <Outlet />}
        </main>
        {!isCrmPage && !isAreaClientePage && !isClientArea && <Rodape light={light} />}
        </ContainerPrincipal>
                
        </>
    )
}