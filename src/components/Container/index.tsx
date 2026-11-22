import styled, { css } from "styled-components";

const Container = styled.section`
/* background-color: #1b1b1b; */
margin: 0em;
margin-top: 38px;
border-radius: 3px;
padding: 1em;
height: 100%;
margin-bottom: 160px;
${({ theme }) => theme.palette?.mode === "light" && css`
    box-sizing: border-box;
    width: 100%;
    max-width: 1600px;
    height: auto;
    min-width: 0;
    margin: 72px auto 64px;
    padding: clamp(16px, 3vw, 40px);
    color: #242424;
`}
`

export default Container;