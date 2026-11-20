import whatsapp from './assets/whatsapp.png';
import instagram from './assets/instagram.png';
import google from './assets/google.png';
import facebook from './assets/facebook.png';
import styled from 'styled-components';

const RodapeEstilizado = styled.footer<{ $light: boolean }>`
height: 25px;
color: ${({ $light }) => $light ? "#55081d" : "white"};
padding: 0.5px;
background-color: ${({ $light }) => $light ? "#f7f1e9" : "rgb(20, 3, 9)"};
${({ $light }) => $light && "border-top: 1px solid rgba(85, 8, 29, 0.12);"}
text-align: center;
position: fixed;
width: 100%;
z-index: 1;
bottom: 0;
right: 0;
`

const ListaEstilizada = styled.ul`
display: flex;
justify-content: space-around;
width: 10%;
margin: 1em auto;
`

const ItemEstilizado = styled.li`
list-style-type: none;
`

const Paragrafo = styled.p`
margin: 5px;
font-size: 10px;
`


function Rodape({ light = false }: { light?: boolean }) {
    return (
        <RodapeEstilizado $light={light}>
{/*             <ListaEstilizada>
                <ItemEstilizado>
                    <a href="#">
                        <img src={facebook} alt="logo do facebook" />
                    </a>
                </ItemEstilizado>
                <ItemEstilizado>
                    <a href="#">
                        <img src={whatsapp} alt="logo do whatsapp" />
                    </a>
                </ItemEstilizado>
                <ItemEstilizado>
                    <a href="#">
                        <img src={google} alt="logo do google" />
                    </a>
                </ItemEstilizado>
                <ItemEstilizado>
                    <a href="#">
                        <img src={instagram} alt="logo do instagram" />
                    </a>
                </ItemEstilizado>
            </ListaEstilizada> */}
            <Paragrafo>2024 © Desenvolvido por RH sem Complicações.</Paragrafo>
        </RodapeEstilizado>
    )
}


export default Rodape;