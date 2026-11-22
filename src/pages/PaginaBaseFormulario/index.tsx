import { styled } from "styled-components"
import { Outlet } from "react-router-dom";

const ContainerPrincipal = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;
    min-height: 100vh;
    box-sizing: border-box;
    padding: 40px 24px;
    background: #f6f6f6;
`

const ConteudoFormulario = styled.div`
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
`

const Rodape = styled.footer`
    width: 100%;
    text-align: center;
    padding-top: 24px;
    font-size: 13px;
    color: rgba(20, 20, 20, 0.65);
`


export default function PaginaBaseFormulario(){
    return (
        <ContainerPrincipal>
            <ConteudoFormulario>
                <Outlet />
            </ConteudoFormulario>
            <Rodape>ProxiUs.</Rodape>
        </ContainerPrincipal>
    )
}