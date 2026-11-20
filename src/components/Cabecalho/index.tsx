import styled from 'styled-components';
import perfil from './assets/perfil.png';
import pesquisa from './assets/search.png';
import autenticaStore from '../../stores/autentica.store';
import { useState } from 'react';
import { set } from 'mobx';
import Sidebar from '../SideBar';


const CabecalhoEstilizado = styled.header<{ $light: boolean }>`
    background-color: #efe5d8;
    ${({ $light }) => $light && `
        box-sizing: border-box;
        min-height: 48px;
        border-bottom: 1px solid rgba(85, 8, 29, 0.12);
        button:focus-visible { outline: 2px solid #55081d; outline-offset: 3px; }
    `}
    display:flex;
    align-items: center;
    justify-content: space-between;
    padding: 5px;
    position: relative;
    width: ${({ $light }) => $light ? "100%" : "97%"};
    z-index: ${({ $light }) => $light ? 1100 : 2000};
    top: 0;
    left: 0;
`

const Container = styled.div`
    display: flex;
    align-items: right;
    justify-content: space-around;
    flex-grow: .1;
`

const LinkEstilizado = styled.a`
 color: var(--cinza-claro);
 font-weight: 700;
 margin: 0px;
 margin-left: 5px;
`

const LinkEstilizadoDeslogado = styled(LinkEstilizado)`
font-weight: 400;
text-decoration: none;
color: var(--cinza-claro)
`

const ContainerPesquisa = styled.div`
  display: flex;
  align-items: center;
  background-color: #f2f2f2;
  border-radius: 20px;
  padding: 8px 16px;
`;

const InputCustomizado = styled.input`
  flex: 1;
  border: none;
  background: none;
  outline: none;
`;

const SpanCustomizado = styled.span`
  background-image: url(${pesquisa});
  background-repeat: no-repeat;
  width: 25px;
  height: 25px;
background-position: 10px;
`;

const BotaoEstilizado = styled.a`
background-color: var(--cinza-claro);
border-radius: 8px;
padding: 12px 16px;
color: var(--branco);
text-decoration: none;
`

const Dropdown = styled.div`
  position: absolute;
  top: 100%;
  right: 0;
  display: ${( isOpen ) => (isOpen ? 'block' : 'none')};
  background-color: #ffffff;
  box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1);
  padding: 10px;
`;

const Logo = styled.img`
    width: 23px;
`

const LogoButton = styled.button<{ $light: boolean }>`
    background: ${({ $light }) => $light ? "#f7f0e8" : "transparent"};
    border: none;
    padding: ${({ $light }) => $light ? "6px" : "0"};
    border-radius: ${({ $light }) => $light ? "8px" : "0"};
    margin-left: 5px;
    display: flex;
    align-items: center;
    cursor: pointer;
`



function Cabecalho({ light = false }: { light?: boolean }) {
    const handleLogout = () => {
        autenticaStore.logout();
    };

    const [sideBar, setSideBar] = useState(false);

    const showSideBar = () => setSideBar(!sideBar);    

    return (
        <CabecalhoEstilizado $light={light}>
            <div>
                <LogoButton $light={light} type="button" onClick={showSideBar} aria-label="Abrir menu">
                    <Logo src={`${process.env.PUBLIC_URL}/logo_vinho_192.png`} alt="logo RH" />
                </LogoButton>
                {sideBar && <Sidebar active={sideBar}  setActive={setSideBar} />} 
            </div>
            <Container>
                {autenticaStore.estaAutenticado
                    ? <>
                        
                    </>
                    : <>
                        <LinkEstilizado href="/" onClick={handleLogout}>Sair</LinkEstilizado>
                        <LinkEstilizadoDeslogado href="/sobre" >Sobre</LinkEstilizadoDeslogado>
                        <LinkEstilizadoDeslogado href="/cadastro">Cadastre-se</LinkEstilizadoDeslogado>
                        <ContainerPesquisa>
                            <InputCustomizado type="text" placeholder='Digite sua busca' />
                            <SpanCustomizado />
                        </ContainerPesquisa>
                        <BotaoEstilizado href="/login">Entrar</BotaoEstilizado>
                    </>
                }
            </Container>
        </CabecalhoEstilizado>
    )
}

export default Cabecalho;

/* <img src={perfil} alt="imagem de perfil do usuário" /> */