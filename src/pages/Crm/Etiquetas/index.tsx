import React, { useState, useEffect } from "react";
import { Grid, Modal, Button, TextField, Table, TableHead, TableRow, TableCell, TableBody, IconButton } from '@mui/material';
import { Box } from "@mui/material";
import styled from "styled-components";
import autenticaStore from "../../../stores/autentica.store";
import { useForm } from "react-hook-form";
import ITag from "../../../types/ITag";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import http from "../../../http";
import { ThemeProvider } from "@mui/material/styles";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import lightTheme from "../../../styles/lightTheme";
import { mostrarMensagem } from "../../../stores/mensagem.store";

const BoxCustomizado = styled(Box)`
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 50vw; 
    max-height: 90vh;
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: rgba(85, 8, 29, 0.25) #fffdfa;
    background-color: #fffdfa;
    border: none;
    border-radius: 20px;
    padding: 24px;
    box-sizing: border-box;
    border: 1px solid rgba(85, 8, 29, 0.12);
    box-shadow: 0 24px 60px rgba(85, 8, 29, 0.18);
    color: #35252b;

    @media (max-width: 768px) {
        width: 95vw; 
    }
`
export default function ModalEtiquetas({ open, handleClose}: { open: boolean, handleClose: () => void}) {
    const { register, handleSubmit, setValue, reset, watch } = useForm({ mode: 'onSubmit' });
    const {usuario} = autenticaStore;
    const [tags, setTags] = useState<ITag[]>([]);
    const [loading, setLoading] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const bgColor = watch("bgColor") || "#E33F30";
    const fontColor = watch("fontColor") || "#FFFFFF";
    
    const axiosConfig = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${usuario.token}`,
        },
    };

    const parseColor = (color?: string) => {
        const [bg = "#E33F30", fg = "#FFFFFF"] = (color || "").split(";");
        return { bg, fg };
    };

    useEffect(() => {
        if (open) {
            resetForm();
            fetchTags();
        }
    }, [open]);

    const onSubmit = async (formData: any) => {
        const color = `${formData.bgColor};${formData.fontColor}`;
        const payload = {
            name: formData.name,
            color,
        };

        setLoading(true);
        try {
            if (editingId !== null) {
                await http.put(`tag`, { id: editingId, ...payload }, axiosConfig);
            } else {
                await http.post(`tag`, payload, axiosConfig);
            }
            resetForm();
            fetchTags();
        } catch (erro) {
            mostrarMensagem(erro, "error");
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        reset({ name: "", bgColor: "#E33F30", fontColor: "#FFFFFF" });
        setEditingId(null);
    };

    const fetchTags = async () => {
        setLoading(true);
        try {
            const { data } = await http.get<ITag[]>(`tag`, axiosConfig);
            setTags(data || []);
        } catch (erro) {
            mostrarMensagem(erro, "error");
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (tag: ITag) => {
        const { bg, fg } = parseColor(tag.color);
        setValue("name", tag.name);
        setValue("bgColor", bg);
        setValue("fontColor", fg);
        setEditingId(tag.id);
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm("Remover esta tag?")) return;
        setLoading(true);
        try {
            await http.delete(`tag/${id}`, axiosConfig);
            fetchTags();
        } catch (erro) {
            mostrarMensagem(erro, "error");
        } finally {
            setLoading(false);
        }
    };

    const TagPreview = ({ name, color }: { name: string; color: string }) => {
        const { bg, fg } = parseColor(color);
        return (
            <Box
                sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    px: 1.5,
                    py: 0.5,
                    borderRadius: "12px",
                    fontWeight: 700,
                    backgroundColor: bg,
                    color: fg,
                    minWidth: "fit-content",
                }}
            >
                {name}
            </Box>
        );
    };

    return (
        <ThemeProvider theme={lightTheme}>
            {<Modal
                open={open}
                onClose={handleClose}
                aria-labelledby="crm-etiquetas-titulo"
            >
                <BoxCustomizado role="dialog" aria-labelledby="crm-etiquetas-titulo">
                    <form onSubmit={handleSubmit(onSubmit)}>
                        <Grid item xs={12}>
                            <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                                <h2 id="crm-etiquetas-titulo" style={{ color: "#55081d", margin: 0 }}>Etiquetas</h2>
                                <IconButton aria-label="Fechar etiquetas" onClick={handleClose} sx={{ color: "#55081d" }}>
                                    <CloseOutlinedIcon />
                                </IconButton>
                            </Box>
                        </Grid>
                        <Grid container spacing={2}>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    label="Nome da tag"
                                    fullWidth
                                    {...register("name", { required: true })}
                                    InputLabelProps={{ style: { color: "#55081d" } }}
                                    inputProps={{ style: { color: "#35252b" } }}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            '& fieldset': { borderColor: '#55081d' },
                                            '&:hover fieldset': { borderColor: '#55081d' },
                                            '&.Mui-focused fieldset': { borderColor: '#55081d' },
                                        },
                                        '& .MuiInputLabel-root.Mui-focused': { color: '#55081d' },
                                    }}
                                />
                            </Grid>

                            <Grid item xs={6} md={3}>
                                <Box display="flex" flexDirection="column" gap={1}>
                                    <label style={{ color: "#55081d" }}>Cor de fundo</label>
                                    <input type="color" {...register("bgColor", { required: true })} style={{ width: "100%", height: "40px", border: "none", padding: 0 }} />
                                    <TextField
                                        label="Hex fundo"
                                        fullWidth
                                        value={bgColor}
                                        onChange={(e) => setValue("bgColor", e.target.value)}
                                        InputLabelProps={{ style: { color: "#55081d" } }}
                                        inputProps={{ style: { color: "#35252b" } }}
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                '& fieldset': { borderColor: '#55081d' },
                                                '&:hover fieldset': { borderColor: '#55081d' },
                                                '&.Mui-focused fieldset': { borderColor: '#55081d' },
                                            },
                                            '& .MuiInputLabel-root.Mui-focused': { color: '#55081d' },
                                        }}
                                    />
                                </Box>
                            </Grid>

                            <Grid item xs={6} md={3}>
                                <Box display="flex" flexDirection="column" gap={1}>
                                    <label style={{ color: "#55081d" }}>Cor da fonte</label>
                                    <input type="color" {...register("fontColor", { required: true })} style={{ width: "100%", height: "40px", border: "none", padding: 0 }} />
                                    <TextField
                                        label="Hex fonte"
                                        fullWidth
                                        value={fontColor}
                                        onChange={(e) => setValue("fontColor", e.target.value)}
                                        InputLabelProps={{ style: { color: "#55081d" } }}
                                        inputProps={{ style: { color: "#35252b" } }}
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                '& fieldset': { borderColor: '#55081d' },
                                                '&:hover fieldset': { borderColor: '#55081d' },
                                                '&.Mui-focused fieldset': { borderColor: '#55081d' },
                                            },
                                            '& .MuiInputLabel-root.Mui-focused': { color: '#55081d' },
                                        }}
                                    />
                                </Box>
                            </Grid>

                            <Grid item xs={12}>
                                <Box display="flex" alignItems="center" gap={2}>
                                    <TagPreview name={watch("name") || "Pré-visualização"} color={`${bgColor};${fontColor}`} />
                                    <Box ml="auto" display="flex" gap={1}>
                                        <Button
                                            variant="contained"
                                            color="primary"
                                            onClick={handleSubmit(onSubmit)}
                                            disabled={loading}
                                        >
                                            {editingId ? "Salvar alterações" : "Salvar"}
                                        </Button>
                                        <Button variant="outlined" color="inherit" onClick={resetForm} disabled={loading}>
                                            Limpar
                                        </Button>
                                    </Box>
                                </Box>
                            </Grid>

                            <Grid item xs={12}>
                                <Table size="small" sx={{ backgroundColor: "#fffdfa", color: "#35252b" }}>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell style={{ color: "#55081d" }}>Nome</TableCell>
                                            <TableCell style={{ color: "#55081d" }}>Prévia</TableCell>
                                            <TableCell align="right" style={{ color: "#55081d" }}>Ações</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {tags.map((tag) => (
                                            <TableRow key={tag.id}>
                                                <TableCell style={{ color: "#35252b" }}>{tag.name}</TableCell>
                                                <TableCell>
                                                    <TagPreview name={tag.name} color={tag.color} />
                                                </TableCell>
                                                <TableCell align="right">
                                                    <IconButton size="small" onClick={() => handleEdit(tag)}>
                                                        <EditIcon sx={{ color: "#55081d" }} />
                                                    </IconButton>
                                                    <IconButton size="small" onClick={() => handleDelete(tag.id)}>
                                                        <DeleteIcon sx={{ color: "#55081d" }} />
                                                    </IconButton>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {tags.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={3} style={{ color: "#35252b", textAlign: "center" }}>
                                                    Nenhuma tag cadastrada.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </Grid>
                        </Grid>    
              
                    </form>
                </BoxCustomizado>
            </Modal >}
        </ThemeProvider>
    );
}