import { css } from "styled-components";

export const managementFieldStyles = css`
    background: #fff;
    color: #242424;
    border: 1px solid rgba(20, 20, 20, 0.2);
    border-radius: 10px;
    box-shadow: none;
    min-height: 42px;
    font-family: inherit;

    &:focus-visible {
        outline: 3px solid rgba(20, 20, 20, 0.12);
        outline-offset: 1px;
        border-color: #141414;
    }

    &::placeholder { color: #666666; opacity: 1; }
    &:read-only { background-color: #f5f5f5; }
`;

export const managementDialogStyles = css`
    background-color: #ffffff;
    color: #242424;
    border: 1px solid rgba(20, 20, 20, 0.12);
    border-radius: 20px;
    box-shadow: 0 24px 60px rgba(20, 20, 20, 0.18);
    box-sizing: border-box;
    max-width: calc(100vw - 32px);
    padding: clamp(20px, 3vw, 40px);
    scrollbar-width: thin;
    scrollbar-color: #858585 #f5f5f5;
    &:focus-visible { outline: 3px solid #858585; outline-offset: 2px; }

    &::-webkit-scrollbar { width: 8px; height: 8px; }
    &::-webkit-scrollbar-thumb { background: #858585; border-radius: 8px; }
    &::-webkit-scrollbar-track { background: #f5f5f5; }
    select {
        ${managementFieldStyles}
        width: 100%;
        box-sizing: border-box;
        padding: 10px;
    }
    input[type="checkbox"], input[type="radio"] { accent-color: #141414; }

    @media (max-width: 768px) { width: calc(100vw - 32px); }
`;
