import styled from "styled-components";

const Marca = styled.span`
    display: inline-block;
    color: inherit;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    font-size: 32px;
    font-weight: 850;
    letter-spacing: -0.09em;
    line-height: 1;

    span { color: #888; }
`;

export default function LogoProxiUs({ className }: { className?: string }) {
    return <Marca className={className} role="img" aria-label="ProxiUs">P<span>.</span></Marca>;
}
