import React, { useEffect, useMemo, useRef, useState } from 'react';
import autenticaStore from '../../stores/autentica.store';
import styled from "styled-components";
import IColumn from '../../types/IColumn';
import http from '../../http';
import KanbanColumn from '../../components/kanban/kanbanColumn';
import ICard from '../../types/ICard';
import Sidebar from '../../components/SideBar';
import ModalArquivados from './Arquivados';
import ModalAtividades from './Atividades';
import DropdownMenu from '../../components/MenuCRM';
import ModalEtiquetas from './Etiquetas';
import { CircularProgress } from '@mui/material';
import ModalCRM from './Modal';
import ITag from '../../types/ITag';
import { useSearchParams } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import lightTheme from '../../styles/lightTheme';
import wallpaper from '../Login/wallpaper.png';
import { mostrarMensagem } from "../../stores/mensagem.store";

interface SearchResult {
  id: string;
  nome: string;
  statusId: number;
}

interface AtendenteOption {
  value: string;
  label: string;
}


const CabecalhoEstilizado = styled.header`
    background-color: rgba(255, 253, 250, 0.94);
    border-bottom: 1px solid rgba(85, 8, 29, 0.12);
    box-shadow: 0 4px 20px rgba(85, 8, 29, 0.04);
    backdrop-filter: blur(12px);
    display:flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 16px;
    box-sizing: border-box;
    height: 72px;
    position: fixed;
    width: 100%;
    z-index: 1100;
    top: 0;
    left: 0;
`
const Container = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    flex-grow: .1;
    width: 100%;
`
const LinkEstilizado = styled.a`
 display: grid;
 place-items: center;
 width: 40px;
 height: 40px;
 border-radius: 12px;
 background: #efe5d8;
 color: #55081d;
 font-weight: 700;
 margin: 0px;
 margin-left: 5px;
`
const LinkEstilizado2 = styled(LinkEstilizado)`
font-weight: 500;
text-decoration: none;
color: var(--cinza-claro);
margin: 10px;
cursor: pointer;
`
const InputCustomizado = styled.input`
  flex: 1;
  border: none;
  background: none;
  outline: none;
  color: #35252b;
  min-width: 0;
  font: inherit;
  &::placeholder { color: #75656b; }
`
const SpanCustomizado = styled.button`
  display: grid;
  place-items: center;
  padding: 0;
  border: none;
  background: transparent;
  color: #55081d;
  width: 28px;
  height: 28px;
  flex-shrink: 0;
  cursor: pointer;
  &:focus-visible { outline: 2px solid #55081d; border-radius: 6px; }
`
const Logo = styled.img`
  width: 23px;
`
const Kanban = styled.div`
  display: flex;
  gap: 14px;
  position: fixed;
  top: 72px;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 20px;
  width: 100%;
  box-sizing: border-box;
  height: auto;
  overflow-x: auto;
  overflow-y: auto;
  background: linear-gradient(180deg, rgba(239, 229, 216, 0.85) 0%, rgba(226, 216, 204, 0.85) 100%), url(${wallpaper}) center / cover;
  scrollbar-color: rgba(85, 8, 29, 0.25) transparent;
  @media (max-width: 768px) { padding: 12px; }
`
const LoadingOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(255, 253, 250, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  backdrop-filter: blur(2px);
  color: #55081d;
`;
const Titulo = styled.h2`
  color: #55081d;
  font-weight: 700;
  text-align: left;
  font-size: 22px;
  padding-left: 20px;
  flex: 1; /* Permite que o título ocupe o espaço disponível */
  margin: 5px;
  @media (max-width: 768px) {
    display: none;
  }
`
const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  gap: 12px;
  min-width: 0;
`
const ContainerPesquisa = styled.div`
  display: flex;
  align-items: center;
  background-color: #fffdfa;
  border: 1px solid rgba(85, 8, 29, 0.16);
  border-radius: 12px;
  padding: 6px 12px;
  gap: 8px;
  &:focus-within { border-color: #55081d; box-shadow: 0 0 0 3px rgba(85, 8, 29, 0.08); }
`
const SearchWrapper = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  min-width: 0;
  max-width: 360px;
  width: 100%;
  gap: 8px;

  @media (max-width: 768px) {
    min-width: 0;
    max-width: 100%;
  }
`
const SearchResults = styled.ul`
  position: absolute;
  top: calc(100% + 4px);
  right: 0;
  left: auto;
  min-width: 420px;
  width: max-content;
  max-width: 640px;
  list-style: none;
  margin: 0;
  padding: 8px 0;
  background: #fffdfa;
  border-radius: 14px;
  border: 1px solid rgba(85, 8, 29, 0.12);
  box-shadow: 0 12px 32px rgba(85, 8, 29, 0.14);
  max-height: 320px;
  overflow-y: auto;
  z-index: 3;

  @media (max-width: 768px) {
    left: 0;
    right: 0;
    min-width: 100%;
    width: 100%;
    max-width: 100%;
  }
`
const SearchResultItem = styled.li`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 14px;
  border-bottom: 1px solid rgba(85, 8, 29, 0.08);
  cursor: pointer;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: rgba(85, 8, 29, 0.05);
  }
`
const ResultName = styled.span`
  color: #35252b;
  font-weight: 700;
`
const ResultStage = styled.span`
  color: #75656b;
  font-size: 0.9rem;
`
const SearchStatus = styled.span`
  color: #75656b;
  font-size: 0.9rem;
  padding: 10px 14px;
  display: block;
`

export default function Crm(){
  const {usuario} = autenticaStore;
  const [searchParams, setSearchParams] = useSearchParams();
  const [columns, setColumns] = useState<IColumn[]>([]);
  const [activeColumns, setActiveColumns] = useState<IColumn[]>([]);
  const [columnsDisbled, setColumnDisbled] = useState<IColumn[] | undefined>();
  const [cards, setCards] = useState<ICard[]>([]);
  const [cardsDisbled, setCardsDisbled] = useState<ICard[] | undefined>();
  const [refreshCards, setRefreshCards] = useState(false);
  const [sideBar, setSideBar] = useState(false);
  const [selectedPanel, setSelectedPanel] = useState(() => searchParams.get('panel') || 'leads');
  const [Arquivados, setArquivados] = useState(false);
  const [Atividades, setAtividades] = useState(false);
  const [Etiquetas, setEtiquetas] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [selectedCard, setSelectedCard] = useState<ICard | null>(null);
  const [searchCardModalOpen, setSearchCardModalOpen] = useState(false);
  const [tagsDisponiveis, setTagsDisponiveis] = useState<ITag[]>([]);
  const [selectedAtendente, setSelectedAtendente] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const searchTimeoutRef = useRef<number | undefined>(undefined);
  const searchWrapperRef = useRef<HTMLDivElement | null>(null);
  const withLoading = async <T,>(fn: () => Promise<T>): Promise<T | undefined> => {
    setIsLoading(true);
    try {
      return await fn();
    } finally {
      setIsLoading(false);
    }
  };
  const showSideBar = () => setSideBar(!sideBar);    
  const handleLogout = () => {
    autenticaStore.logout();
  }
  const axiosConfig = {
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${usuario.token}`,
    },
  } 

  useEffect(() => {
    const fetchTags = async () => {
      try {
        const { data } = await http.get<ITag[]>(`tag`, axiosConfig);
        setTagsDisponiveis(data || []);
      } catch (erro) {
        mostrarMensagem(erro, "error");
      }
    };
    fetchTags();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const panel = (searchParams.get('panel') || '').trim();
    if (!panel && selectedPanel !== 'leads') {
      setSelectedPanel('leads');
      return;
    }

    if (panel && panel !== selectedPanel) {
      setSelectedPanel(panel);
    }
  }, [searchParams, selectedPanel]);

  useEffect(() => {
    setIsLoading(true);
    http.get<IColumn[]>('column', axiosConfig)
      .then(resposta => {

        const activeColumns = resposta.data.filter((column: IColumn) => column.active);
        const disabledColumns = resposta.data.filter((column: IColumn) => !column.active);
        const columnsByType = resposta.data.filter((column: IColumn) => column.active && column.tipo === selectedPanel);

        columnsByType.sort((a: IColumn, b: IColumn) => a.position - b.position);
        activeColumns.sort((a: IColumn, b: IColumn) => a.position - b.position);
        setActiveColumns(activeColumns);
        setColumns(columnsByType);
        setColumnDisbled(disabledColumns);

        let cardsByColumn = "card/get-cards-by-column?"
        cardsByColumn += activeColumns.sort((a: IColumn, b: IColumn) => a.position - b.position).map((column: IColumn) => `statusId=${column.id}`).join('&');

        //console.log("CARDS BY COLUMN FILTRO")
        //console.log(cardsByColumn)
        return http.get<ICard[]>(cardsByColumn, axiosConfig)
          .then(resposta => {
            const sorted = [...resposta.data].sort((a, b) => {
              const aDate = a.lastStatusUpdate ? new Date(a.lastStatusUpdate).getTime() : 0;
              const bDate = b.lastStatusUpdate ? new Date(b.lastStatusUpdate).getTime() : 0;
              return bDate - aDate; // mais recentes primeiro
            });
            setCards(sorted);
          })
          .catch(erro => {
            mostrarMensagem(erro, "error");
          });

        //console.log("COLUNAS ativas")
        //console.log(activeColumns)
        //console.log("COLUNAS desativadas")
        //console.log(disabledColumns)
      })
      .catch(erro => {
        mostrarMensagem(erro, "error");
      })
      .finally(() => setIsLoading(false));
  }, [refreshCards, selectedPanel, Arquivados]);

  useEffect(() => {
    const term = searchTerm.trim();

    if (!term) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = window.setTimeout(() => {
      performSearch(term);
    }, 2000);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchWrapperRef.current && !searchWrapperRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (columns.length === 0 || cards.length === 0) return;
    const cleanup = movimentoCards();
    return () => {
      cleanup && cleanup();
    };
  }, [columns, cards]);

  function movimentoCards () {
    const cards = document.querySelectorAll('.kanban-card');
    const columns = document.querySelectorAll('.kanban-cards');

    cards.forEach(card => {
        card.addEventListener('dragstart', (e) => {
            (e.currentTarget as HTMLElement).classList.add('dragging');
        });

        card.addEventListener('dragend', (e) => {
            (e.currentTarget as HTMLElement).classList.remove('dragging');
        });
    });

    columns.forEach(column => {
        column.addEventListener('dragover', (e) => {
            e.preventDefault();
            (e.currentTarget as HTMLElement).classList.add('cards-hover');
        });

        column.addEventListener('dragleave', (e) => {
            (e.currentTarget as HTMLElement).classList.remove('cards-hover');
        });

        column.addEventListener('drop', (e) => {
          (e.currentTarget as HTMLElement).classList.remove('cards-hover');
        });
    });

    return () => {
        cards.forEach(card => {
            card.removeEventListener('dragstart', () => {});
            card.removeEventListener('dragend', () => {});
        });

        columns.forEach(column => {
            column.removeEventListener('dragover', () => {});
            column.removeEventListener('dragleave', () => {});
            column.removeEventListener('drop', () => {});
        });
    };
  }

  function handleRefreshCards() {
    setRefreshCards(!refreshCards);
  }  

  const ArquivadosOpen = () => {
    setArquivados(true);
  };

  const ArquivadosClose = () => {
    setArquivados(false);
  };

  const EtiquetasOpen = () => {
    setEtiquetas(true);
  }

  const EtiquetasClose = () => {
    setEtiquetas(false);
  }

  const AtividadesOpen = () => {
    setAtividades(true);
  };

  const AtividadesClose = () => {
    setAtividades(false);
  };

  const handleMenuSelect = (value: string) => {
    if (value === 'arquivados') {
      ArquivadosOpen();
      return;
    }
    if (value === 'etiquetas') {
      EtiquetasOpen()
      return
    }
    if (value === 'atividades') {
      AtividadesOpen();
      return;
    }
    setSelectedPanel(value);
    setSearchParams({ panel: value });
  };

  const capitalizeFirstLetter = (string: string): string => {
    if (!string) return string;
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  const getStageName = (statusId: number): string => {
    const column = activeColumns.find((item) => item.id === statusId);
    if (!column) return 'Etapa não encontrada';
    return `${column.tipo} - ${column.name}`;
  };

  const performSearch = (term: string) => {
    const value = term.trim();
    if (!value) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    setSearchLoading(true);
    setShowSearchResults(true);

    http.get<ICard[]>(`card/filter-by-nome-and-atendente?nome=${encodeURIComponent(value)}&page=0&size=10`, axiosConfig)
      .then(resposta => {
        const payload = Array.isArray(resposta.data) ? resposta.data : (resposta.data as any)?.content ?? [];
        const normalized = (payload as ICard[]).map((card) => ({
          id: card.id,
          nome: card.nome,
          statusId: card.statusId,
        }));
        setSearchResults(normalized);
        setShowSearchResults(true);
      })
      .catch(() => {
        setSearchResults([]);
        setShowSearchResults(true);
      })
      .finally(() => setSearchLoading(false));
  };

  const handleOpenSearchCard = async (cardId: string) => {
    if (!cardId) return;

    await withLoading(async () => {
      const { data } = await http.get<ICard>(`card/${cardId}`, axiosConfig);
      setSelectedCard(data);
      setSearchCardModalOpen(true);
      setShowSearchResults(false);
    });
  };

  const handleCloseSearchCard = () => {
    setSearchCardModalOpen(false);
    setSelectedCard(null);
    handleRefreshCards();
  };

  const getAtendenteKey = (card: ICard): string => {
    if (card.atendenteId !== null && card.atendenteId !== undefined) {
      return `id:${card.atendenteId}`;
    }
    return `name:${card.atendente || ''}`;
  };

  const parseTagIds = (tags: string | null): number[] => {
    if (!tags) return [];
    try {
      const parsed = JSON.parse(tags);
      return Array.isArray(parsed) ? parsed.map((id: any) => Number(id)) : [];
    } catch {
      return [];
    }
  };

  const panelCards = useMemo(() => {
    const statusIds = new Set(columns.map((column) => column.id));
    return cards.filter((card) => statusIds.has(card.statusId));
  }, [cards, columns]);

  const atendenteOptions = useMemo<AtendenteOption[]>(() => {
    const uniqueAtendentes = new Map<string, string>();

    panelCards.forEach((card) => {
      const nomeAtendente = (card.atendente || '').trim();
      if (!nomeAtendente) return;

      uniqueAtendentes.set(getAtendenteKey(card), nomeAtendente);
    });

    return Array.from(uniqueAtendentes.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [panelCards]);

  const filteredPanelCards = useMemo(() => {
    let result = panelCards;
    if (selectedAtendente) {
      result = result.filter((card) => getAtendenteKey(card) === selectedAtendente);
    }
    if (selectedTag) {
      const tagId = Number(selectedTag);
      result = result.filter((card) => parseTagIds(card.tags).includes(tagId));
    }
    return result;
  }, [panelCards, selectedAtendente, selectedTag]);

  useEffect(() => {
    const atendenteSelecionadoExiste = atendenteOptions.some((option) => option.value === selectedAtendente);
    if (!atendenteSelecionadoExiste && selectedAtendente) {
      setSelectedAtendente('');
    }
  }, [atendenteOptions, selectedAtendente]);

  useEffect(() => {
    const tagSelecionadaExiste = tagsDisponiveis.some((tag) => String(tag.id) === selectedTag);
    if (!tagSelecionadaExiste && selectedTag) {
      setSelectedTag('');
    }
  }, [tagsDisponiveis, selectedTag]);

  return (
    <ThemeProvider theme={lightTheme}>
      {isLoading && (
        <LoadingOverlay>
          <CircularProgress size={64} thickness={4} color="inherit" />
        </LoadingOverlay>
      )}
      <CabecalhoEstilizado>          
          <Container>
            <Header>
            <div onClick={showSideBar}>
                <LinkEstilizado href="#" aria-label="Abrir menu"><Logo src={`${process.env.PUBLIC_URL}/logo_vinho_192.png`} alt="logo RH" /></LinkEstilizado>
                {sideBar && <Sidebar active={sideBar}  setActive={setSideBar} />} 
            </div>
              <Titulo>Gestão de {capitalizeFirstLetter(selectedPanel)}</Titulo>
              <SearchWrapper ref={searchWrapperRef}>
                <ContainerPesquisa>
                  <InputCustomizado
                    placeholder="Buscar cliente..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onFocus={() => {
                      if (searchResults.length > 0) {
                        setShowSearchResults(true);
                      }
                    }}
                  />
                  <SpanCustomizado aria-label="Buscar cliente" onClick={() => performSearch(searchTerm)}>
                    <SearchOutlinedIcon fontSize="small" />
                  </SpanCustomizado>
                </ContainerPesquisa>
                {showSearchResults && (
                  <SearchResults>
                    {searchLoading && <SearchStatus>Buscando...</SearchStatus>}
                    {!searchLoading && searchResults.length === 0 && (
                      <SearchStatus>Nenhum cliente encontrado</SearchStatus>
                    )}
                    {!searchLoading && searchResults.map((result) => (
                      <SearchResultItem
                        key={result.id}
                        onClick={() => handleOpenSearchCard(result.id)}
                      >
                        <ResultName>{result.nome}</ResultName>
                        <ResultStage>{getStageName(result.statusId)}</ResultStage>
                      </SearchResultItem>
                    ))}
                  </SearchResults>
                )}
              </SearchWrapper>
              <DropdownMenu
                onSelect={handleMenuSelect}
                atendenteValue={selectedAtendente}
                atendenteOptions={atendenteOptions}
                onAtendenteChange={setSelectedAtendente}
                tagValue={selectedTag}
                tagOptions={tagsDisponiveis.map((tag) => ({ value: String(tag.id), label: tag.name }))}
                onTagChange={setSelectedTag}
              />
            </Header>
          </Container>
          
      </CabecalhoEstilizado>
      {searchCardModalOpen && selectedCard && (
        <ModalCRM
          open={searchCardModalOpen}
          handleClose={handleCloseSearchCard}
          dados={selectedCard}
          colunas={activeColumns}
          arquivado={false}
        />
      )}
      <ModalArquivados open={Arquivados} handleClose={ArquivadosClose} refreshCards={handleRefreshCards} colunas={activeColumns} />
      <ModalEtiquetas open={Etiquetas} handleClose={EtiquetasClose} />
      <ModalAtividades open={Atividades} handleClose={AtividadesClose} refreshCards={handleRefreshCards} colunas={activeColumns}/>
      <Kanban>      
        {columns.map((prop, index) => (
          prop.position !== 0 && (
          <KanbanColumn 
            key={index} 
            name={prop.name} 
            id={prop.id} 
            refreshCards={handleRefreshCards} 
            colunas={activeColumns}
            cards={Array.isArray(filteredPanelCards) ? filteredPanelCards.filter((card: ICard) => card.statusId === prop.id) : []}
            withLoading={withLoading}
            tagsDisponiveis={tagsDisponiveis}
          /> 
        )             
        ))}        
      </Kanban>
    </ThemeProvider>
  );
}
