import * as React from 'react';
import { DataGrid, GridColDef, GridRowId, ptBR } from '@mui/x-data-grid';
import { Box, Button, Chip, Stack, Typography } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import TrackChangesOutlinedIcon from '@mui/icons-material/TrackChangesOutlined';
import styled from 'styled-components';
import autenticaStore from '../../stores/autentica.store';
import IBodyRequest from '../../types/IBodyRequest';
import http from '../../http';
import { useState } from "react";
import Container from "../../components/Container";
import ModalCadastro from './Modal';
import IMeta from '../../types/IMeta';
import lightTheme from '../../styles/lightTheme';
import { mostrarMensagem } from "../../stores/mensagem.store";

const ContainerClaro = styled(Container)`
  background: linear-gradient(180deg, #efe5d8 0%, #e2d8cc 100%);
  color: #55081d;
  min-height: calc(100dvh - 48px);
  box-sizing: border-box;
  margin: 0;
  padding: 40px 32px 64px;

  @media (max-width: 600px) {
    padding: 24px 16px 48px;
  }
`;

const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const formatarMoeda = (value: unknown) => typeof value === 'number' ? moeda.format(value) : value ?? '';
const formatarData = (value: unknown) => {
  const match = typeof value === 'string' ? /^(\d{4})-(\d{2})-(\d{2})/.exec(value) : null;
  return match ? `${match[3]}/${match[2]}/${match[1]}` : value ?? '';
};




export default function Meta(){
  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 80 },
    { field: 'data', headerName: 'Data', minWidth: 120, flex: 0.8, valueFormatter: ({ value }) => formatarData(value) },
    { field: 'valorMinimo', headerName: 'Meta 80%', minWidth: 150, flex: 1, type: 'number', align: 'left', headerAlign: 'left', valueFormatter: ({ value }) => formatarMoeda(value) },
    { field: 'valorPadrao', headerName: 'Meta 100%', minWidth: 150, flex: 1, type: 'number', align: 'left', headerAlign: 'left', valueFormatter: ({ value }) => formatarMoeda(value) },
    { field: 'valorMaximo', headerName: 'Meta 120%', minWidth: 150, flex: 1, type: 'number', align: 'left', headerAlign: 'left', valueFormatter: ({ value }) => formatarMoeda(value) }

  ];
  
  
  
    const [metas, setMetas] = useState<IMeta[]>([]);
    const [selectedRows, setSelectedRows] = useState<GridRowId[]>([]);
    const [atulizarTabela, setAtulizarTabela] = useState(false);
    const [open, setOpen ] = useState(false);
    const [editaOpen, setEditaOpen ] = useState(false);
    const [tipo, setTipo] = useState("");
    const {usuario} = autenticaStore;
  
    
    const axiosConfig = {
      headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${usuario.token}`,
      },
    };
    
    React.useEffect(() => {
        http.get<IBodyRequest<IMeta>>('meta?size=500', axiosConfig)
        .then(resposta => {
            setMetas(resposta.data.content)
            //console.log("Ta atualizando")
            //console.log(resposta.data.content)
        })
        .catch(erro => {
            mostrarMensagem(erro, "error")
        })
  
    }, [atulizarTabela, open, editaOpen]);
  
    const handleOpen = (tipo: string) => {
      if(tipo === "cadastra"){
        setTipo("cadastra")
        setOpen(true)
      }else if(tipo === "edita"){       
        if(selectedRows.length == 0){
          mostrarMensagem("nenhum registro selecionado!", "warning")
        }else if(selectedRows.length > 1){
          mostrarMensagem("Favor selecionar um unico registro!", "warning")
        }else{
          setTipo("edita")
          setOpen(true)
        }
      }
    }

    const handleClose =() => {
      setOpen(false)    
    }

    const excluir = () => {
      
      if(selectedRows.length == 0){
        mostrarMensagem("nenhum registro selecionado!", "warning")
      }else if(selectedRows.length > 1){
        mostrarMensagem("Favor selecionar um unico registro!", "warning")
      }else{
        let id = selectedRows[0]
  
        http.delete(`meta/${id}`, axiosConfig)
        .then(resposta => {
            mostrarMensagem("meta excluida!", "success")
            //console.log(resposta)
            setAtulizarTabela(!atulizarTabela)
        })
        .catch(erro => {
          mostrarMensagem(erro, "error")
        })   
      }
    }


  return (
    <ThemeProvider theme={lightTheme}>
      <ContainerClaro aria-labelledby="meta-vendas-title">
        <Box sx={{ maxWidth: 1280, mx: "auto" }}>
          <Stack component="header" direction="row" alignItems="center" spacing={2} sx={{ mb: 4 }}>
            <Box sx={{
              display: { xs: "none", sm: "grid" }, placeItems: "center", width: 64, height: 64,
              bgcolor: "rgba(255,255,255,0.65)", border: "1px solid", borderColor: "divider",
              borderRadius: 3, flexShrink: 0,
            }}>
              <TrackChangesOutlinedIcon sx={{ fontSize: 32 }} aria-hidden="true" />
            </Box>
            <Box>
              <Typography variant="overline" sx={{ letterSpacing: "0.12em", color: "text.secondary" }}>
                Administração
              </Typography>
              <Typography id="meta-vendas-title" component="h1" variant="h5" sx={{ fontSize: { xs: 26, sm: 32 }, mb: 0.75 }}>
                Meta de Vendas
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Defina as faixas de 80%, 100% e 120% das metas comerciais.
              </Typography>
            </Box>
          </Stack>
          <Box component="section" aria-labelledby="metas-cadastradas-title" sx={{
            p: { xs: 2, sm: 3 }, border: "1px solid rgba(85, 8, 29, 0.16)", borderRadius: "20px",
            bgcolor: "rgba(255,255,255,0.72)", boxShadow: "0 16px 48px rgba(85, 8, 29, 0.06)",
          }}>
            <Stack direction={{ xs: "column", md: "row" }} alignItems={{ xs: "stretch", md: "center" }}
              justifyContent="space-between" gap={2} sx={{ mb: 3 }}>
              <Box>
                <Stack direction="row" alignItems="center" spacing={1.5} flexWrap="wrap" useFlexGap>
                  <Typography id="metas-cadastradas-title" component="h2" variant="h6">Metas cadastradas</Typography>
                  <Chip size="small" label={`${metas.length} ${metas.length === 1 ? "meta" : "metas"}`}
                    sx={{ bgcolor: "rgba(85, 8, 29, 0.06)", color: "primary.main" }} />
                  {selectedRows.length > 0 && (
                    <Chip size="small" color="primary" variant="outlined"
                      label={`${selectedRows.length} ${selectedRows.length === 1 ? "selecionada" : "selecionadas"}`} />
                  )}
                </Stack>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  Selecione uma meta na tabela para editar ou excluir.
                </Typography>
              </Box>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpen("cadastra")}>Cadastrar meta</Button>
                <Button variant="outlined" startIcon={<EditOutlinedIcon />} onClick={() => handleOpen("edita")}>Editar meta</Button>
                <Button variant="outlined" color="error" startIcon={<DeleteOutlineIcon />} onClick={() => excluir()}>Excluir</Button>
              </Stack>
            </Stack>
            <ModalCadastro open={open} handleClose={handleClose} metas={metas} id={selectedRows} tipo={tipo}/>
            <Box sx={{ width: "100%", minWidth: 0 }}>
              <DataGrid
                autoHeight
                localeText={ptBR.components.MuiDataGrid.defaultProps.localeText}
                sx={{
                  bgcolor: "background.paper", color: "text.primary", borderColor: "divider", borderRadius: "12px",
                  "& .MuiDataGrid-columnHeaders": { bgcolor: "rgba(85, 8, 29, 0.04)", borderColor: "divider" },
                  "& .MuiDataGrid-columnHeaderTitle": { fontWeight: 700, color: "primary.main" },
                  "& .MuiDataGrid-cell": { borderColor: "divider" },
                  "& .MuiDataGrid-row:hover": { bgcolor: "rgba(85, 8, 29, 0.03)" },
                  "& .MuiDataGrid-row.Mui-selected": { bgcolor: "rgba(85, 8, 29, 0.07)" },
                  "& .MuiDataGrid-row.Mui-selected:hover": { bgcolor: "rgba(85, 8, 29, 0.1)" },
                  "& .MuiCheckbox-root.Mui-checked, & .MuiCheckbox-indeterminate": { color: "primary.main" },
                  "& .MuiDataGrid-footerContainer": { borderColor: "divider" },
                  "& .MuiDataGrid-cell:focus, & .MuiDataGrid-columnHeader:focus": { outline: "2px solid rgba(85, 8, 29, 0.35)", outlineOffset: -2 },
                }}
                rows={metas}
                columns={columns}
                initialState={{
                  pagination: {
                    paginationModel: { page: 0, pageSize: 10 },
                  },
                }}
                pageSizeOptions={[10, 20]}
                checkboxSelection
                disableRowSelectionOnClick
                onRowSelectionModelChange={(ids) => {setSelectedRows(ids)}}
              />
            </Box>
          </Box>
        </Box>
      </ContainerClaro>
    </ThemeProvider>
  );
}
