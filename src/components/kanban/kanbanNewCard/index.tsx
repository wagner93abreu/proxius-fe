import styled, { createGlobalStyle } from 'styled-components';
import React, { useEffect, useRef } from 'react';
import { useForm } from "react-hook-form";
import autenticaStore from "../../../stores/autentica.store";
import http from '../../../http';
import { mostrarMensagem } from "../../../stores/mensagem.store";

const GlobalStyle = createGlobalStyle`
    .dragging {
        opacity: 0.5;
    }

    .cards-hover {
    background-color: rgba(20, 20, 20, 0.08);
    border-radius: 8px;
}
`

const KanbanCardStyle = styled.div`
    display: flex;
    flex-direction: column;
    gap: 8px;
    position: relative;
    background-color: #ffffff;
    border: 1px solid rgba(20, 20, 20, 0.18);
    border-radius: 14px;
    padding: 14px;
    box-shadow: 0 8px 24px rgba(20, 20, 20, 0.06);
`
const Badge = styled.div`
    color: #141414;
    background-color: rgba(20, 20, 20, 0.07);
    width: fit-content;
    font-size: 12px;
    padding: 4px 8px;
    border-radius: 7px;
    margin-top: 3px;
`

const BotaoCustomizado = styled.button`
    width: 50%!important;
    background-color: #141414;
    border-radius: 10px;
    padding: 5px 16px;
    color: var(--branco);
    border: solid transparent;
    margin-top: 1em;
    margin-bottom: 0.5em;
    font-weight: 700;
    line-height: 19px;
    margin-right: 2em;
    &:hover {
        background-color: #383838;
    }
    &:active{
        border: solid #141414;
    }
`
const Close = styled.button`
    top: 12px;
    right: 12px;
    align-self: flex-end;
    position: absolute;
    width: 24px;
    height: 24px;
    background-color: rgba(20, 20, 20, 0.06);
    border-radius: 3px;
    color: #141414;
    border: solid transparent;
    font-weight: 700;
    line-height: 19px;
    padding: 0;
    &:hover {
        background-color: rgba(20, 20, 20, 0.12);
    }
    &:active{
        border: solid #141414;
    }
`

const Campo = styled.input`
    color: #242424;
    font-size: 15px;
    background: #ffffff;
    margin-top: 3px;
    margin-bottom: 0px;
    box-sizing: border-box;
    border-radius: 10px;
    border: 1px solid rgba(20, 20, 20, 0.2);
    &:focus-visible { outline: 2px solid #141414; }
    width: 100%;
    padding: 10px;
`

interface KanbanNewCardProps {
    onClose: () => void;
    onCardAdded: () => void;
    columnId: number;
    withLoading: <T>(fn: () => Promise<T>) => Promise<T | undefined>;
}

const KanbanNewCard: React.FC<KanbanNewCardProps> = ({ onClose, onCardAdded, columnId, withLoading }) => {
    const {register, handleSubmit} = useForm({ mode: 'onSubmit' });
    const ref = useRef<HTMLDivElement>(null);
    const {usuario} = autenticaStore;

    const axiosConfig = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${usuario.token}`,
        },
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
        if (ref.current && !ref.current.contains(event.target as Node)) {
            onClose();
        }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [onClose]);

    const addCard = (data: any) => {      
        const cardAtualizado = {
            nome: data.novonome,
            statusId: columnId
        }

        withLoading(async () => {
            try {
                await http.post(`card`, cardAtualizado, axiosConfig);
                onCardAdded();
                onClose();
            } catch (erro) {
                erro && mostrarMensagem('Erro ao cadastrar card', "error");
            }
        });
    }

    return (
        <>
        <GlobalStyle />               
        <KanbanCardStyle className="kanban-card" ref={ref}>
            <Badge>
                <span>Novo Card</span>
            </Badge>    
            <Close onClick={onClose} aria-label="Fechar novo card">X</Close>
            <Campo aria-label="Nome do LEAD" type="text" placeholder="Nome do LEAD" maxLength={100} {...register('novonome',{
                required: 'Campo obrigatório',
                minLength: {
                    value: 3,
                    message: 'Deve ter no mínimo 3 caracteres'
                },
                maxLength: {
                    value: 100,
                    message: 'Deve ter no máximo 100 caracteres'
                }
            })} />      
            <BotaoCustomizado onClick={handleSubmit(addCard)}>Adicionar</BotaoCustomizado>        
        </KanbanCardStyle>
        </> 
    )
}

export default KanbanNewCard;