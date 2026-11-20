import React, { useState, useEffect, useRef } from 'react';
import SidebarItem from '../SideBarItem';
import styled from 'styled-components';
import autenticaStore from '../../stores/autentica.store';
import http from '../../http';
import {
  AccountBalanceWalletOutlined,
  AdminPanelSettingsOutlined,
  BusinessOutlined,
  DashboardOutlined,
  DescriptionOutlined,
  FilterAltOutlined,
  GroupsOutlined,
  HandshakeOutlined,
  HomeOutlined,
  HubOutlined,
  Inventory2Outlined,
  LogoutOutlined,
  MenuOpenOutlined,
  PaidOutlined,
  PersonOutline,
  PersonSearchOutlined,
  PlaylistAddCheckOutlined,
  ReceiptLongOutlined,
  ShoppingCartOutlined,
} from '@mui/icons-material';
import { mostrarMensagem } from "../../stores/mensagem.store";


const Container = styled.div<{ active: boolean }>`
  background: linear-gradient(180deg, #fffdfa 0%, #f7f0e8 100%);
  display: flex;
  flex-direction: column;
  position: fixed;
  height: 100dvh;
  max-height: 100vh;
  top: 0px;
  left: ${({ active }) => (active ? '0' : '-100%')};
  width: 300px;
  max-width: 85vw;
  animation: showSidebar .3s ease-out;
  z-index: 1999;
  border-right: 1px solid rgba(85, 8, 29, 0.12);
  box-shadow: 12px 0 40px rgba(85, 8, 29, 0.12);
  color: #35252b;

  @keyframes showSidebar {
    from {
      opacity: 0;
      transform: translateX(-24px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

const Topo = styled.div`
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 24px 24px 18px;
  border-bottom: 1px solid rgba(85, 8, 29, 0.1);
`;

const TopoIcone = styled.div`
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: #55081d;
  color: #fffdfa;

  > svg {
    font-size: 22px;
  }
`;

const TopoTexto = styled.div`
  display: flex;
  flex-direction: column;
  line-height: 1.2;

  > span {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #75656b;
  }

  > strong {
    font-size: 16px;
    color: #35252b;
  }
`;

const Content = styled.nav`
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  padding: 4px 0 16px;

  scrollbar-width: thin;
  scrollbar-color: rgba(85, 8, 29, 0.22) transparent;

  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(85, 8, 29, 0.22);
    border-radius: 10px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: rgba(85, 8, 29, 0.36);
  }
`;

const Secao = styled.div`
  margin: 16px 24px 6px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #75656b;
`;

const Submenu = styled.div`
  position: relative;

  &::before {
    content: '';
    position: absolute;
    left: 33px;
    top: 4px;
    bottom: 6px;
    width: 1px;
    background: rgba(85, 8, 29, 0.14);
  }
`;

const Rodape = styled.div`
  flex: 0 0 auto;
  padding: 12px;
  border-top: 1px solid rgba(85, 8, 29, 0.1);
`;

const LinkEstilizado = styled.a`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 10px;
  color: #55081d;
  font-weight: 700;
  font-size: 15px;
  text-decoration: none;
  margin: 0px;
  cursor: pointer;
  transition: background-color 160ms ease;

  > svg {
    font-size: 20px;
  }

  &:hover {
    background-color: rgba(85, 8, 29, 0.06);
  }

  &:focus-visible {
    outline: 2px solid #55081d;
    outline-offset: 2px;
  }
`;

interface Props {
  active: boolean;
  setActive: (active: boolean) => void;
}

const Sidebar = ({ active, setActive }: Props) => {
  const { usuario } = autenticaStore;
  const [papel, setPapel] = useState<string | null>('');
  const sidebarRef = useRef<HTMLDivElement>(null);

  const axiosConfig = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${usuario.token}`,
    },
  };

  useEffect(() => {
    http.get(`usuarios/${localStorage.getItem('userID')}`, axiosConfig)
      .then(resposta => {
        setPapel(resposta.data.papel);
      })
      .catch(erro => {
        mostrarMensagem(erro, "error");
      });
  }, [axiosConfig]);

  const handleLogout = () => {
    autenticaStore.logout();
  };
  const closeSidebar = () => setActive(false);

  const handleClickOutside = (event: MouseEvent) => {
    if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
      setActive(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <Container ref={sidebarRef} active={active}>
      <Topo>
        <TopoIcone><MenuOpenOutlined aria-hidden="true" /></TopoIcone>
        <TopoTexto>
          <span>RH Sem Complicações</span>
          <strong>Menu</strong>
        </TopoTexto>
      </Topo>
      <Content aria-label="Menu principal">
        <Secao>Geral</Secao>
        <SidebarItem onNavigate={closeSidebar} href={"home"} Text="Home" icon={HomeOutlined} />
        <SidebarItem onNavigate={closeSidebar} href={"meuPerfil"} Text="Meu Perfil" icon={PersonOutline} />
        {papel !== 'COLABORADOR' && papel !== 'CLIENTE' && <SidebarItem onNavigate={closeSidebar} href={"comissao"} Text="Comissões" icon={PaidOutlined} />}
        {papel !== 'CLIENTE' && (
          <>
            <Secao>Comercial</Secao>
            <SidebarItem onNavigate={closeSidebar} href={"precrm"} Text="PRECRM" icon={PlaylistAddCheckOutlined} />
            <SidebarItem onNavigate={closeSidebar} href={"crm"} Text="CRM" icon={HubOutlined} />
            <Submenu>
              <SidebarItem onNavigate={closeSidebar} href={"crm?panel=leads"} Text="Gestão de Leads" icon={PersonSearchOutlined} nested />
              <SidebarItem onNavigate={closeSidebar} href={"crm?panel=clientes"} Text="Gestão de Clientes" icon={GroupsOutlined} nested />
              <SidebarItem onNavigate={closeSidebar} href={"crm?panel=parceiros"} Text="Gestão de Parceiros" icon={HandshakeOutlined} nested />
            </Submenu>
          </>
        )}
        {papel === 'ADMIN' && <Secao>Gestão</Secao>}
        {papel === 'ADMIN' && <SidebarItem onNavigate={closeSidebar} href={"dashboardResumo"} Text="Faturamento" icon={DashboardOutlined} />}
        {papel === 'ADMIN' && <SidebarItem onNavigate={closeSidebar} href={"metricasVendas"} Text="Funil de Vendas" icon={FilterAltOutlined} />}
        {papel === 'ADMIN' && <SidebarItem onNavigate={closeSidebar} href={"cliFor"} Text="Cliente e Fornecedor" icon={BusinessOutlined} />}
        {papel === 'ADMIN' && <SidebarItem onNavigate={closeSidebar} href={"vendas"} Text="Vendas" icon={ShoppingCartOutlined} />}
        {papel === 'ADMIN' && <SidebarItem onNavigate={closeSidebar} href={"produtos"} Text="Produtos" icon={Inventory2Outlined} />}
        {papel === 'ADMIN' && <SidebarItem onNavigate={closeSidebar} href={"templatesContrato"} Text="Templates de Contratos" icon={DescriptionOutlined} />}
        {papel === 'ADMIN' && <SidebarItem onNavigate={closeSidebar} href={"painelNF"} Text="Painel de NF" icon={ReceiptLongOutlined} />}
        {usuario.login === 'llleroyy' && <SidebarItem onNavigate={closeSidebar} href={"painelNF"} Text="Painel de NF" icon={ReceiptLongOutlined} />}
        {papel === 'ADMIN' && <SidebarItem onNavigate={closeSidebar} href={"financeiro"} Text="Financeiro" icon={AccountBalanceWalletOutlined} />}
        {papel === 'ADMIN' && <SidebarItem onNavigate={closeSidebar} href={"painelDeControle"} Text="Painel de Controle" icon={AdminPanelSettingsOutlined} />}
      </Content>
      <Rodape>
        <LinkEstilizado href="/" onClick={handleLogout}>
          <LogoutOutlined aria-hidden="true" />
          Sair
        </LinkEstilizado>
      </Rodape>
    </Container>
  );
};

export default Sidebar;