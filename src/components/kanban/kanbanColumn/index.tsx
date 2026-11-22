import KanbanCard from '../kanbanCard'; // Adjust the import path as necessary
import React, { useEffect, useState } from 'react';
import styled, { createGlobalStyle } from 'styled-components'
import ModalCRM from '../../../pages/Crm/Modal';
import autenticaStore from "../../../stores/autentica.store";
import ICard from '../../../types/ICard';
import http from '../../../http';
import KanbanNewCard from '../kanbanNewCard';
import IColumn from '../../../types/IColumn';
import ITag from '../../../types/ITag';
import { mostrarMensagem } from "../../../stores/mensagem.store";

const GlobalStyle = createGlobalStyle`
    .dragging {
        opacity: 0.5;
    }

    .cards-hover {
    background-color: rgba(20, 20, 20, 0.08);
    border-radius: 8px;
}
`;

const Column = styled.div`
    display: flex;
    flex-direction: column;
    gap: 18px;
    height: 100%;
    box-sizing: border-box;
    flex: 0 0 320px;
    background-color: rgba(255, 255, 255, 0.65);
    border: 1px solid rgba(20, 20, 20, 0.1);
    border-radius: 18px;
    box-shadow: 0 10px 30px rgba(20, 20, 20, 0.04);
    padding: 14px;
    overflow: hidden;
    position: relative;
    min-width: 300px;
    @media (max-width: 768px) { flex-basis: 300px; }
    :after {
        position: absolute;
        content: '';
        height: 5px;
        width: 100%;
        top: 0;
        left: 0;
    }
`
const Title = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
    padding: 0 2px 12px;
    border-bottom: 1px solid rgba(20, 20, 20, 0.1);
    h2 {
        font-size: 16px;
        color: #141414;
        font-weight: 700;
        margin: 0;
        flex: 1;
    }
    span { color: #666666; background: rgba(20, 20, 20, 0.06); border-radius: 8px; padding: 3px 8px; font-size: 12px; font-weight: 700; }
`

const AddCard = styled.button`
    background-color: rgba(20, 20, 20, 0.06);
    border: 1px solid rgba(20, 20, 20, 0.14);
    width: 36px;
    height: 36px;
    border-radius: 10px;
    cursor: pointer;
    &:hover { background: rgba(20, 20, 20, 0.12); }
    &:focus-visible { outline: 2px solid #141414; outline-offset: 2px; }
    i {
        font-size: 30px;
        color: #141414;
        font-style: normal;
        line-height: 1;
    }
    
`
const KanbanCards = styled.div`
    display: flex;
    flex-direction: column;
    gap: 8px;
    height: 100%;
    min-height: 0;
    overflow-y: auto;
    overflow-x: hidden;
    scrollbar-width: thin;
    scrollbar-color: rgba(20, 20, 20, 0.22) transparent;
    padding: 2px;
`
interface ICardStatus{
    id: string;
    statusId: number;
}

interface KanbanColumnProps {
    name: string;
    cards: ICard[];
    id: number;
    refreshCards: () => void;
    colunas: IColumn[];
    withLoading: <T>(fn: () => Promise<T>) => Promise<T | undefined>;
    tagsDisponiveis: ITag[];
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({ name, cards, id, refreshCards, colunas, withLoading, tagsDisponiveis }) => {
    const [newCard, setNewCard] = useState(false);
    const {usuario} = autenticaStore;

    //console.log("CARDS DENTRO DE KANBANCOLUMN")
    //console.log(cards)

    const axiosConfig = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${usuario.token}`,
        },
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>, columnId: number) => {
        e.preventDefault();
        const cardId = e.dataTransfer.getData('text');        
        const cardAtualizado: ICardStatus = {
            id: cardId,
            statusId: columnId
        }

        withLoading(async () => {
            try {
                await http.put(`card`, cardAtualizado, axiosConfig);
                refreshCards(); // força re-render para refletir a nova coluna
            } catch (erro) {
                erro && mostrarMensagem('Erro ao cadastrar os dados', "error");
            }
        });
    };

    const handleCloseNewCard = () => {
    setNewCard(false);
    };

    const AdicionarCard = () => {        
    setNewCard(true);
    };

    const handleCardAdded = () => {
    setNewCard(false);
    refreshCards();
    }

    const handleCardUpdate = () => {
        refreshCards();
      };

    
    return (
        <>
            <GlobalStyle />
            <Column 
                key={id}
                role="region"
                aria-label={name}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDrop(e, id)}
                >
                <Title>
                <h2>{name}</h2>
                    <span aria-label={`${cards.length} cards`}>{cards.length}</span>
                    <AddCard aria-label={`Adicionar card em ${name}`} onClick={() => AdicionarCard()}>
                        <i> + </i>
                    </AddCard>
                </Title>
                <KanbanCards className="kanban-cards" draggable="false">
                    {newCard && <KanbanNewCard onClose={handleCloseNewCard} onCardAdded={handleCardAdded} columnId={id} withLoading={withLoading}/>}
                    {cards.map((card, index) => {
                        return <KanbanCard key={index} nome={card.nome} data={card} colunas={colunas} onCardUpdate={handleCardUpdate} tagsDisponiveis={tagsDisponiveis}/>;
                    })}

                </KanbanCards>
            </Column>
        </>
        
    )
}

export default KanbanColumn;