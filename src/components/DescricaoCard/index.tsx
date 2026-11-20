import React, { useEffect, useMemo, useState } from "react";
import { Box, Button, CircularProgress, TextField, Typography, Divider, Dialog, DialogTitle, DialogContent, DialogActions, IconButton } from "@mui/material";
import styled from "styled-components";
import autenticaStore from "../../stores/autentica.store";
import http from "../../http";
import IComentario from "../../types/IComentario";
import IUser from "../../types/IUser";
import { mostrarMensagem } from "../../stores/mensagem.store";

const Container = styled(Box)`
    flex: 1;
    min-width: 0;
    max-width: 100%;
    width: 100%;
    box-sizing: border-box;
    max-height: 45vh;
    overflow-y: auto;
    margin-top: 16px;
    padding: 16px;
    background: rgba(85, 8, 29, 0.025);
    border: 1px solid rgba(85, 8, 29, 0.1);
    border-radius: 14px;
    color: #35252b;

    /* Ensure scrollbar colors apply across browsers */
    scrollbar-color: rgba(85, 8, 29, 0.25) transparent;
    scrollbar-width: thin;

    @media (max-width: 1024px) {
        max-width: 100%;
        width: 100%;
    }

    /* Scrollbar styling scoped to this container (increased specificity) */
    &&::-webkit-scrollbar {
        width: 12px;
    }

    &&::-webkit-scrollbar-track {
        background: #f7f1e9;
        border-radius: 10px;
        margin: 4px 2px;
    }

    &&::-webkit-scrollbar-thumb {
        background: rgba(85, 8, 29, 0.25);
        border-radius: 10px;
        border: 2px solid #f7f1e9;
    }

    &&::-webkit-scrollbar-thumb:hover {
        background: rgba(85, 8, 29, 0.4);
    }
`;

const CommentRow = styled(Box)`
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 8px 0;
`;

const Meta = styled(Typography)`
    font-size: 12px;
    color: #75656b;
`;

interface DescricaoCardProps {
    cardId: string | null;
    usuarioNome: string;
    usuarioId: string | number;
}

export default function DescricaoCard({ cardId, usuarioNome, usuarioId }: DescricaoCardProps) {
    const { usuario } = autenticaStore;
    const usuarioLogadoId = localStorage.getItem("userID") || "";
    const autorComentarioId = usuarioLogadoId;
    const [comentarios, setComentarios] = useState<IComentario[]>([]);
    const [usuarioLogadoNome, setUsuarioLogadoNome] = useState(usuario.login || localStorage.getItem("user") || "");
    const [loading, setLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [novoComentario, setNovoComentario] = useState("");
    const [papel, setPapel] = useState<string | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<IComentario | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [editTarget, setEditTarget] = useState<IComentario | null>(null);
    const [editText, setEditText] = useState("");
    const [isEditing, setIsEditing] = useState(false);
    const autorComentarioNome = usuarioLogadoNome || usuarioNome;

    const axiosConfig = useMemo(() => ({
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${usuario.token}`,
        },
    }), [usuario.token]);

    const formatDate = (iso?: string) => {
        if (!iso) return "";
        const d = new Date(iso);
        if (Number.isNaN(d.getTime())) return "";
        const dia = String(d.getDate()).padStart(2, "0");
        const mes = String(d.getMonth() + 1).padStart(2, "0");
        const ano = d.getFullYear();
        const hora = String(d.getHours()).padStart(2, "0");
        const min = String(d.getMinutes()).padStart(2, "0");
        return `${dia}/${mes}/${ano} ${hora}:${min}`;
    };

    const ordenarComentarios = (lista: IComentario[]) => {
        return lista.slice().sort((a, b) => {
            const aTime = new Date(a.createdAt).getTime();
            const bTime = new Date(b.createdAt).getTime();
            return bTime - aTime;
        });
    };

    const fetchComentarios = async () => {
        if (!cardId) return;
        setLoading(true);
        try {
            const { data } = await http.get<IComentario[]>(`comentario/filter?origemTipo=DESCRICAO&origemId=${cardId}`, axiosConfig);
            setComentarios(ordenarComentarios(data || []));
        } catch (erro) {
            mostrarMensagem(erro, "error");
        } finally {
            setLoading(false);
        }
    };

    const fetchPapel = async () => {
        if (!usuarioLogadoId) return;
        try {
            const { data } = await http.get<IUser>(`usuarios/${usuarioLogadoId}`, axiosConfig);
            setUsuarioLogadoNome(data.nome || usuario.login || localStorage.getItem("user") || "");
            setPapel(data.papel || null);
        } catch (erro) {
            // Mantém sem papel se falhar
        }
    };

    const handleAddComentario = async () => {
        if (!cardId) return;
        if (!novoComentario.trim()) return;
        const payload = {
            origemTipo: "DESCRICAO",
            origemId: cardId,
            usuario: autorComentarioNome,
            usuarioId: autorComentarioId,
            descricao: novoComentario,
            estimatedDate: null,
            conclusionDate: null,
            done: false,
        };
        setIsSaving(true);
        try {
            const { data } = await http.post<IComentario>("comentario", payload, axiosConfig);
            const merged = {
                ...payload,
                ...data,
                createdAt: data?.createdAt || new Date().toISOString(),
            } as IComentario;
            setComentarios((prev) => [merged, ...prev]);
            setNovoComentario("");
            setShowForm(false);
        } catch (erro) {
            mostrarMensagem(erro, "error");
        } finally {
            setIsSaving(false);
        }
    };

    const canDelete = (comentario: IComentario) => {
        const allowed = ["ATENDIMENTO", "ADMIN", "COLABORADOR"];
        if (papel && allowed.includes(papel)) return true;
        return String(comentario.usuarioId) === String(usuarioLogadoId);
    };

    const canEdit = (comentario: IComentario) => canDelete(comentario);

    const handleRequestDelete = (comentario: IComentario) => {
        if (!canDelete(comentario)) return;
        setDeleteTarget(comentario);
    };

    const handleRequestEdit = (comentario: IComentario) => {
        if (!canEdit(comentario)) return;
        setEditTarget(comentario);
        setEditText(comentario.descricao);
    };

    const handleConfirmDelete = async () => {
        if (!deleteTarget) return;
        setIsDeleting(true);
        try {
            await http.delete(`comentario/${deleteTarget.id}`, axiosConfig);
            setComentarios((prev) => prev.filter((c) => c.id !== deleteTarget.id));
            setDeleteTarget(null);
        } catch (erro) {
            mostrarMensagem(erro, "error");
        } finally {
            setIsDeleting(false);
        }
    };

    const handleConfirmEdit = async () => {
        if (!editTarget) return;
        if (!editText.trim()) return;
        setIsEditing(true);
        try {
            const payload: IComentario = {
                id: editTarget.id,
                origemTipo: editTarget.origemTipo || "DESCRICAO",
                origemId: editTarget.origemId,
                descricao: editText,
                createdAt: editTarget.createdAt,
                usuario: editTarget.usuario || autorComentarioNome,
                usuarioId: editTarget.usuarioId ?? autorComentarioId,
                estimatedDate: null,
                done: false,
                conclusionDate: null,
                
            };

            const { data } = await http.put<IComentario>(`comentario`, payload, axiosConfig);
            const updated = {
                ...payload,
                ...data,
            } as IComentario;
            setComentarios((prev) => ordenarComentarios(prev.map((c) => (c.id === editTarget.id ? updated : c))));
            setEditTarget(null);
        } catch (erro) {
            mostrarMensagem(erro, "error");
        } finally {
            setIsEditing(false);
        }
    };

    useEffect(() => {
        fetchComentarios();
        fetchPapel();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cardId]);

    if (!cardId) return null;

    return (
        <Container>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="h6" color="primary">Descrição</Typography>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={() => setShowForm((v) => !v)}
                    sx={{ backgroundColor: "#55081d", color: "#fff", fontWeight: 700, px: "7px", "&:hover": { backgroundColor: "#6f102a" } }}
                >
                    {showForm ? "Fechar" : "Adicionar novo"}
                </Button>
            </Box>

            {showForm && (
                <Box display="flex" flexDirection="column" gap={1} mb={2}>
                    <TextField
                        multiline
                        minRows={3}
                        maxRows={6}
                        value={novoComentario}
                        onChange={(e) => setNovoComentario(e.target.value)}
                        placeholder="Digite seu comentário"
                        InputProps={{ style: { color: "#35252b" } }}
                        sx={{ background: "rgba(255,255,255,0.06)" }}
                    />
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={handleAddComentario}
                        disabled={isSaving}
                        sx={{ alignSelf: "flex-end", backgroundColor: "#55081d", color: "#fffdfa", fontWeight: 700, "&:hover": { backgroundColor: "#6f102a" } }}
                    >
                        {isSaving ? "Salvando..." : "Salvar"}
                    </Button>
                </Box>
            )}

            {loading ? (
                <Box display="flex" justifyContent="center" py={3}>
                    <CircularProgress sx={{ color: "#55081d" }} />
                </Box>
            ) : (
                <Box display="flex" flexDirection="column" gap={1}>
                    {comentarios.length === 0 && (
                        <Typography variant="body2" color="#75656b">Nenhum comentário ainda.</Typography>
                    )}
                    {comentarios.map((c, idx) => (
                        <React.Fragment key={c.id}>
                            <CommentRow>
                                <Box display="flex" justifyContent="space-between" alignItems="flex-start" gap={1}>
                                    <Typography
                                        variant="body1"
                                        color="text.primary"
                                        sx={{ fontWeight: 500, flex: 1, whiteSpace: "pre-wrap", wordBreak: "break-word" }}
                                    >
                                        {c.descricao}
                                    </Typography>
                                    <Box display="flex" gap={1}>
                                        {canEdit(c) && (
                                            <IconButton size="small" aria-label="Editar comentário" onClick={() => handleRequestEdit(c)} sx={{ color: "#75656b" }}>
                                                ✎
                                            </IconButton>
                                        )}
                                        {canDelete(c) && (
                                            <IconButton size="small" aria-label="Excluir comentário" onClick={() => handleRequestDelete(c)} sx={{ color: "#75656b" }}>
                                                x
                                            </IconButton>
                                        )}
                                    </Box>
                                </Box>
                                <Meta>
                                    {formatDate(c.createdAt)} • {c.usuario}
                                </Meta>
                            </CommentRow>
                            {idx < comentarios.length - 1 && <Divider sx={{ borderColor: "rgba(85, 8, 29, 0.04)" }} />}
                        </React.Fragment>
                    ))}
                    
                </Box>
            )}

            <Dialog
                open={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                fullWidth
                maxWidth="xs"
                PaperProps={{ sx: { backgroundColor: "#fffdfa", color: "#35252b" } }}
            >
                <DialogTitle sx={{ color: "#35252b" }}>Confirmar exclusão</DialogTitle>
                <DialogContent>
                    <Typography color="text.primary">Deseja remover este comentário?</Typography>
                </DialogContent>
                <DialogActions sx={{ display: "flex", gap: 1 }}>
                    <Button onClick={() => setDeleteTarget(null)} disabled={isDeleting} sx={{ color: "#35252b" }}>Cancelar</Button>
                    <Button onClick={handleConfirmDelete} color="primary" disabled={isDeleting} sx={{ fontWeight: 700, color: "#55081d" }}>
                        {isDeleting ? "Removendo..." : "Remover"}
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog
                open={!!editTarget}
                onClose={() => setEditTarget(null)}
                fullWidth
                maxWidth="sm"
                PaperProps={{ sx: { backgroundColor: "#fffdfa", color: "#35252b" } }}
            >
                <DialogTitle sx={{ color: "#35252b" }}>Editar comentário</DialogTitle>
                <DialogContent>
                    <TextField
                        fullWidth
                        multiline
                        minRows={3}
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        autoFocus
                        InputProps={{ style: { color: "#35252b" } }}
                        sx={{ background: "rgba(255,255,255,0.06)" }}
                    />
                </DialogContent>
                <DialogActions sx={{ display: "flex", gap: 1 }}>
                    <Button onClick={() => setEditTarget(null)} disabled={isEditing} sx={{ color: "#35252b" }}>Cancelar</Button>
                    <Button onClick={handleConfirmEdit} color="primary" disabled={isEditing || !editText.trim()} sx={{ fontWeight: 700, color: "#55081d" }}>
                        {isEditing ? "Salvando..." : "Salvar"}
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
}
