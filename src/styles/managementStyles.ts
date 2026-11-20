import { css } from "styled-components";

export const managementFieldStyles = css`
    background: #fff;
    color: #35252b;
    border: 1px solid rgba(85, 8, 29, 0.2);
    border-radius: 10px;
    box-shadow: none;
    min-height: 42px;
    font-family: inherit;

    &:focus-visible {
        outline: 3px solid rgba(85, 8, 29, 0.12);
        outline-offset: 1px;
        border-color: #55081d;
    }

    &::placeholder { color: #75656b; opacity: 1; }
    &:read-only { background-color: #f7f1e9; }
`;

export const managementDialogStyles = css`
    background-color: #fffdfa;
    color: #35252b;
    border: 1px solid rgba(85, 8, 29, 0.12);
    border-radius: 20px;
    box-shadow: 0 24px 60px rgba(85, 8, 29, 0.18);
    box-sizing: border-box;
    max-width: calc(100vw - 32px);
    padding: clamp(20px, 3vw, 40px);
    scrollbar-width: thin;
    scrollbar-color: #b78c9a #f7f1e9;
    &:focus-visible { outline: 3px solid #b78c9a; outline-offset: 2px; }

    &::-webkit-scrollbar { width: 8px; height: 8px; }
    &::-webkit-scrollbar-thumb { background: #b78c9a; border-radius: 8px; }
    &::-webkit-scrollbar-track { background: #f7f1e9; }
    select {
        ${managementFieldStyles}
        width: 100%;
        box-sizing: border-box;
        padding: 10px;
    }
    input[type="checkbox"], input[type="radio"] { accent-color: #55081d; }

    @media (max-width: 768px) { width: calc(100vw - 32px); }
`;
