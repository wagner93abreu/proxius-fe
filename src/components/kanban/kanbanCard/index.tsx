import styled, { createGlobalStyle } from 'styled-components';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import CommentIcon from '@mui/icons-material/Comment';
import ModalCRM from '../../../pages/Crm/Modal';
import { useEffect, useState } from 'react';
import ICard from '../../../types/ICard';
import foto from './perfil.png';
import IColumn from '../../../types/IColumn';
import ITag from '../../../types/ITag';
import { Chip, Stack } from '@mui/material';


const GlobalStyle = createGlobalStyle`
    .dragging {
        opacity: 0.5;
    }

    .cards-hover {
    background-color: rgba(85, 8, 29, 0.08);
    border-radius: 8px;
}
`;

const KanbanCardStyle = styled.div`
    display: flex;
    flex-direction: column;
    gap: 8px;
    background-color: #fffdfa;
    color: #35252b;
    border: 1px solid rgba(85, 8, 29, 0.1);
    border-radius: 14px;
    padding: 14px;
    box-shadow: 0 4px 12px rgba(85, 8, 29, 0.04);
    cursor: pointer;
    transition: border-color 160ms ease, box-shadow 160ms ease;
    &:hover { border-color: rgba(85, 8, 29, 0.3); box-shadow: 0 8px 20px rgba(85, 8, 29, 0.09); }
    &:focus-visible { outline: 2px solid #55081d; outline-offset: 2px; }
`
const Badge = styled.div`
    color:rgb(255, 255, 255);
    background-color: #92a5fb;
    width: fit-content;
    font-size: 12px;
    padding: 4px 8px;
    border-radius: 7px;
    margin-top: 2px;
`

const CardTitle = styled.p`
    display: flex;
    justify-content: space-between;
    padding: 0 2px;
    margin: 2px 0 8px;
    font-weight: 700;
    font-size: 14px;
    line-height: 1.5;
    overflow-wrap: anywhere;
`

const CardInfos = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
`

const CardIcons = styled.div`
    display: flex;
    gap: 18px;
    color: #75656b;
    p { display: flex; align-items: center; gap: 4px; font-size: 12px; margin: 0; color: #75656b; }
    svg { font-size: 17px; color: #75656b; }
`

const User = styled.div`
img{
    width: 30px;
    height: 30px;
    border-radius: 100%;
    object-fit: cover;
    border: 2px solid rgba(85, 8, 29, 0.1);
}    
`

interface KanbanCardProps {
    nome: string;
    data: ICard;
    onCardUpdate: () => void;
    colunas: IColumn[];
    tagsDisponiveis: ITag[];
}

export default function KanbanCard({nome, data, onCardUpdate, colunas, tagsDisponiveis}: KanbanCardProps) {
    const [open, setOpen] = useState(false);
    const [tagsSelecionadas, setTagsSelecionadas] = useState<number[]>([]);
    const bucketName = "https://rhsc-bucket-public.s3.us-east-1.amazonaws.com/";
    const handleOpen = () => {
        setOpen(true);
    };

    const handleClose = () => {
      setOpen(false);
      onCardUpdate()
    };
    const parseTagsString = (tagsValue: any): number[] => {
        if (!tagsValue) return [];
        try {
            const parsed = JSON.parse(tagsValue);
            if (Array.isArray(parsed)) {
                return parsed.map((v) => Number(v)).filter((v) => !Number.isNaN(v));
            }
        } catch {
            return [];
        }
        return [];
    };

    useEffect(() => {
        setTagsSelecionadas(parseTagsString((data as any).tags));
    }, [data]);

    return (
        <>
         {open && (
            <ModalCRM open={open} handleClose={handleClose} dados={data} colunas={colunas} arquivado={false} />
        )}
        <GlobalStyle />               
        <KanbanCardStyle className="kanban-card" role="button" tabIndex={0} aria-label={`Abrir card de ${nome}`} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleOpen(); } }} draggable="true" onClick={() => handleOpen()} onDragStart={(e) => e.dataTransfer.setData('text', data.id)}>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {tagsSelecionadas.map((tagId) => {
                    const tag = tagsDisponiveis.find((t) => t.id === tagId);
                    const [bg = '#444', fg = '#fff'] = (tag?.color || '').split(';');
                    return (
                        
                        <Chip
                            key={tagId}
                            data-testid={`crm-tag-${tagId}`}
                            label={tag?.name || `Tag ${tagId}`}
                            sx={{
                                backgroundColor: bg,
                                color: fg,
                                borderRadius: '5px',
                                fontSize: 10,
                                fontWeight: 400,
                                height: 20,
                            }}
                            size="small"
                        />
                    );
                })}
            </Stack>
            <CardTitle>{nome}</CardTitle>
            <CardInfos>
                <CardIcons>
                    <p><CommentIcon/>{data.taskStatus}</p>
                    <p><AttachFileIcon/>{data.arquivos.length}</p>
                </CardIcons>                 
                <User>
                    {data.fotoAtendente == '' || data.fotoAtendente == null ? <img src={foto} alt="Avatar"/> : <img src={`${bucketName}${data.fotoAtendente!.replaceAll(" ", "+")}`} alt="Avatar"/>}
                </User>
            </CardInfos>                
        </KanbanCardStyle>
        </> 
    )
}