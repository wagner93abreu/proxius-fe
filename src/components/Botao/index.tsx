import styled, { css } from "styled-components";

const Botao = styled.button`
background-color: var(--amarelo);
border-radius: 3px;
padding: 5px 16px;
color: var(--branco);
border: solid transparent;
margin-top: 1em;
margin-bottom: 1em;
font-weight: 700;
line-height: 19px;
margin-right: 2em;

&:hover {
    background-color: var(--amarelo-escuro); /* Cor de fundo ao passar o mouse */
  }

&:active{
    border: solid var(--amarelo);
}
${({ theme }) => theme.palette?.mode === "light" && css`
    background-color: #141414;
    color: #ffffff;
    min-height: 42px;
    border-radius: 10px;
    padding: 10px 16px;
    margin-right: 12px;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    font-family: inherit;
    &:hover { background-color: #383838; }
    &:active { border-color: #858585; }
    &:focus-visible { outline: 3px solid #858585; outline-offset: 3px; }
    &:disabled { opacity: 0.5; cursor: not-allowed; }
    svg { width: 20px; height: 20px; flex-shrink: 0; }
`}
`

export default Botao;