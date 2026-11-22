import { Outlet, useLocation } from "react-router-dom";
import Cabecalho from "../../components/Cabecalho";
import Rodape from "../../components/Rodape";
import styled from "styled-components";
import { ThemeProvider } from "@mui/material/styles";
import { ThemeProvider as StyledThemeProvider, css } from "styled-components";
import managementTheme from "../../styles/managementTheme";

const ContainerPrincipal = styled.div<{ $isClientArea: boolean; $isCrmPage: boolean; $light: boolean }>`
    background-color: ${({ $isClientArea, $light }) => ($light ? "#f6f6f6" : $isClientArea ? "#222222" : "#1b1b1b")};
    width: 100vw;
    height: 100vh;
    overflow: ${({ $isCrmPage }) => ($isCrmPage ? "hidden" : "auto")};
    ${({ $light }) => $light && css`
        scrollbar-color: #858585 #f5f5f5;
        &::-webkit-scrollbar-thumb { background-color: #858585; }
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
        <ContainerPrincipal $isCrmPage={isCrmPage} $isClientArea={isClientArea} $light={light}>
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