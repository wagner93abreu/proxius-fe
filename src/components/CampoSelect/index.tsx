import styled from "styled-components";

const Campo = styled.select`
background: #F0F0F0;
margin: 1em 0;
box-sizing: border-box;
box-shadow: 2px 2px 6px rgba(0,0,0, 0.25);
border-radius: 3px;
border: none;
width: 100%;
padding: 10px;
`

const Rotulo = styled.label`
display: block;
font-weight: 700;
font-size: 16px;
line-height: 19px;
color: var(--cinza-claro)
`

const Container = styled.div`
width: 100%
`

interface Props {
    valor: string,
    itens: string[],
    onChange: (value: string) => void,
    label?: string,
    required: boolean
}

export default function CampoSelect({ valor, itens, onChange, label, required} : Props) {

    
    return (
        <Container>
            <Rotulo>{label}</Rotulo>
            <Campo required={required} onChange={e => onChange(e.target.value)} value={valor}>
                    {itens.map(item => <option key={item}>{item}</option>)}
            </Campo>
        </Container>
    )
}