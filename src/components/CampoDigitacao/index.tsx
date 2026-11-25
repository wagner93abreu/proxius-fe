import styled from "styled-components";
import { managementFieldStyles } from "../../styles/managementStyles";

const Campo = styled.input`
font-size: 15px;
background: #f0f0f0;
margin: 1em 0;
box-sizing: border-box;
box-shadow: 2px 2px 6px rgba(0,0,0, 0.25);
border-radius: 3px;
border: none;
width: 100%;
padding: 10px;
${({ theme }) => theme.palette?.mode === "light" && managementFieldStyles}
`

const Rotulo = styled.label`
display: block;
font-weight: 700;
font-size: 16px;
line-height: 19px;
color: ${({ theme }) => theme.palette?.mode === "light" ? "#242424" : "var(--cinza-claro)"};
`

const Container = styled.div`
width: 100%
`

interface Props {
    valor: string,
    tipo: string,
    placeholder: string,
    onChange: (value: string) => void,
    label?: string,
    required: boolean,
    maxLength?: number
}

export default function CampoDigitacao({ valor, tipo, placeholder, onChange, label, required, maxLength = 50} : Props) {
    return (
        <Container>
        <Rotulo>{label}</Rotulo>
        <Campo
        type={tipo}
        value={valor}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        maxLength={maxLength}
        />
        </Container>
    )
}