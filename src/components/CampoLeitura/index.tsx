import styled from "styled-components";
import { managementFieldStyles } from "../../styles/managementStyles";

const Campo = styled.input`
font-size: 15px;
background: transparent;
margin: 1em 0;
margin-top: 0.2em;
box-sizing: border-box;
border-radius: 3px;
border: 1px solid var(--cinza-claro);
width: 100%;
padding: 10px;
color: var(--cinza-claro);
${({ theme }) => theme.palette?.mode === "light" && managementFieldStyles}
`

const Rotulo = styled.label`
display: block;
font-weight: 700;
font-size: 16px;
line-height: 19px;
color: ${({ theme }) => theme.palette?.mode === "light" ? "#35252b" : "var(--cinza-claro)"};
`

const Container = styled.div`
width: 100%
`

interface Props {
    valor: string | number,
    tipo: string,   
    label?: string,
    background?: string

}

export default function CampoLeitura({ valor, tipo, label, background} : Props) {
    return (
        <Container>
        <Rotulo>{label}</Rotulo>
        <Campo
        type={tipo}
        value={valor}
        readOnly={true}
        onChange={(e) => {}}
        style={{background: background}}
        />
        </Container>
    )
}