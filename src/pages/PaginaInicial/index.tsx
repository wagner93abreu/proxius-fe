import * as React from 'react';
import styled from "styled-components";
import Atividades from "./Atividades";
import Banner from "./Banner";
import Depoimentos from "./Depoimentos";
import Pesquisa from "./Pesquisa";
import { useNavigate } from "react-router-dom";

const Container = styled.section`
display: flex;
flex-direction: column;
align-items: center;
`

export default function PaginaInicial() {
    const navigate = useNavigate();
    React.useEffect(() => {
        navigate('/Login')        
    }, []);

    
    return (
        <>
            {/* <Banner />
            <Container>
                <Pesquisa />
                <Atividades />
                <Depoimentos />
            </Container > */}
        </>
    )
}