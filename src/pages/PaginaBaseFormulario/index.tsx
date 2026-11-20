import { styled } from "styled-components"
import wallpaper from "../Login/wallpaper.png"
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
    background: linear-gradient(180deg, rgba(239, 229, 216, 0.72) 0%, rgba(226, 216, 204, 0.72) 100%), url(${wallpaper});
    background-size: cover;
    background-position: center center;
    background-repeat: no-repeat;
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
    color: rgba(85, 8, 29, 0.65);
`


export default function PaginaBaseFormulario(){
    return (
        <ContainerPrincipal>
            <ConteudoFormulario>
                <Outlet />
            </ConteudoFormulario>
            <Rodape>Um sistema desenvolvido por RH sem Complicações.</Rodape>
        </ContainerPrincipal>
    )
}