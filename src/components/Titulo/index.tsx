import avaliacao from './assets/avaliacao.png';
import grafico from './assets/grafico.png';
import consulta from './assets/consulta.png';
import styled, { css } from 'styled-components';

//interrogação quer dizer que não é obrigatorio
interface Props {
    imagem?: string,
    children?: React.ReactNode
    icone?: React.ReactNode
}

interface IImagens{
    avaliacao: string,
    grafico: string,
    consulta: string
}

const SpanEstilizado = styled.span<Props>`
background-repeat: no-repeat;
background-position: center;
background-size: cover;
width: 25px;
height: 25px;
background-image: ${props => props.imagem ? `url(${props.imagem})` : 'none'}
`

const TituloEstilizado = styled.h2`
    color: var(--cinza-claro);
    ${({ theme }) => theme.palette?.mode === "light" && css`
        color: #55081d;
        font-size: clamp(24px, 3vw, 32px);
        letter-spacing: -0.025em;
        margin: 0 0 24px;
    `}
`

const ContainerEstilizado = styled.div`
    display: flex;
    align-items: center;
    gap: 12px;
    color: ${({ theme }) => theme.palette?.mode === "light" ? "#55081d" : "inherit"};
    > svg { margin-bottom: 24px; }
`

function Titulo({ imagem, icone, children }: Props) {

    const listaDeImagens: IImagens = {
        avaliacao: avaliacao,
        grafico: grafico,
        consulta: consulta
    }

    return (
        <ContainerEstilizado>
            {icone}
            {imagem && <SpanEstilizado imagem={listaDeImagens[imagem as keyof IImagens]} />}
            <TituloEstilizado>{children}</TituloEstilizado>
        </ContainerEstilizado>
    )
}

export default Titulo;