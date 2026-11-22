import React, { useState, useEffect } from "react";
import { Grid, Modal } from '@mui/material';
import { Box } from "@mui/material";
import autenticaStore from "../../../stores/autentica.store";
import { useForm} from "react-hook-form";
import ICard from "../../../types/ICard";
import styled, { createGlobalStyle } from 'styled-components'
import IColumn from "../../../types/IColumn";
import KanbanCardList from "../../../components/kanban/kanbanCardList";
import http from "../../../http";
import ITag from "../../../types/ITag";
import { ThemeProvider } from "@mui/material/styles";
import IconButton from "@mui/material/IconButton";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import lightTheme from "../../../styles/lightTheme";
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
    box-sizing: border-box;
    width: 100%;
    overflow-y: auto;
    background-color: #ffffff;
    border-radius: 14px;
    box-shadow: 0px 10px 15px -3px rgba(0, 0, 0, 0.1);
    padding: 12px;
    overflow: hidden;
    position: relative;
    min-width: 0;
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
    margin-left: 10px;
    margin-botton: -14px;
    h2 {
        font-size: 22px;
        color: #666666;
        font-weight: 600;
    }
`

const AddCard = styled.button`
    background-color:rgb(34, 34, 34);
    height: 36px;
    border-radius: 4px;
    cursor: pointer;
    margin-top: 15px;
    i {
        font-size: 30px;
        color: #666666;
    }
    
`
const KanbanCards = styled.div`
    display: flex;
    flex-direction: column;
    gap: 8px;
    height: 100%;
    overflow-y: auto;
    overflow-x: hidden;
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
}


const BoxCustomizado = styled(Box)`
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 50vw; 
    max-height: 90vh;
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: rgba(20, 20, 20, 0.25) #ffffff;
    background-color: #ffffff;
    border: none;
    border-radius: 20px;
    padding: 24px;
    box-sizing: border-box;
    border: 1px solid rgba(20, 20, 20, 0.12);
    box-shadow: 0 24px 60px rgba(20, 20, 20, 0.18);
    color: #242424;

    @media (max-width: 768px) {
        width: 95vw; 
    }
`
export default function ModalArquivados({ open, handleClose, colunas, refreshCards}: { open: boolean, handleClose: () => void, colunas: IColumn[], refreshCards: () => void}) {
    const {handleSubmit} = useForm({ mode: 'onSubmit' });
    const {usuario} = autenticaStore;
    const [cards, setCards] = useState<ICard[]>([]); 
    const [refresh, setRefresh] = useState(false);
    const [tagsDisponiveis, setTagsDisponiveis] = useState<ITag[]>([]);

    const axiosConfig = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${usuario.token}`,
        },
    };

    useEffect(() => {
        const fetchTags = async () => {
            try {
                const { data } = await http.get<ITag[]>(`tag`, axiosConfig);
                setTagsDisponiveis(data || []);
            } catch (erro) {
                mostrarMensagem(erro, "error");
            }
        };

        if(open){
            fetchTags();
            const arquivadasId = colunas.filter(c => c.tipo === "arquivado")[0]?.id;
            if (!arquivadasId) return;
            http.get<ICard[]>(`card/get-cards-by-column?statusId=${arquivadasId}`, axiosConfig)
            .then(resposta => {
                setCards(resposta.data);
            })
            .catch(erro => {
                mostrarMensagem(erro, "error");
            });
        }
    
    }, [open, refresh, colunas]);

    const onSubmit = (data: any) => {
    //console.log(data);
    };   

    const handleCardUpdate = () => {
        refreshCards();
        setRefresh(!refresh);
      };


    return (
        <ThemeProvider theme={lightTheme}>
            {<Modal
                open={open}
                onClose={handleClose}
                aria-labelledby="crm-arquivados-titulo"
            >
                <BoxCustomizado role="dialog" aria-labelledby="crm-arquivados-titulo">
                    <form onSubmit={handleSubmit(onSubmit)}>
                        <Grid item xs={12}>
                            <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                                <h2 id="crm-arquivados-titulo" style={{ color: "#141414", margin: 0 }}>Arquivados</h2>
                                <IconButton aria-label="Fechar arquivados" onClick={handleClose} sx={{ color: "#141414" }}>
                                    <CloseOutlinedIcon />
                                </IconButton>
                            </Box>
                        </Grid>
                        <Grid container spacing={1}>
                            <GlobalStyle />
                            <Column>
                                <KanbanCards className="kanban-cards" draggable="false">
                                    {cards.map((card, index) => {
                                        return <KanbanCardList key={index} nome={card.nome} data={card} colunas={colunas} onCardUpdate={handleCardUpdate} tagsDisponiveis={tagsDisponiveis}/>;
                                    })}

                                </KanbanCards>
                            </Column> 
                        </Grid>    
              
                    </form>
                </BoxCustomizado>
            </Modal >}
        </ThemeProvider>
    );
}