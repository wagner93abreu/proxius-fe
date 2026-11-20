import React, { useEffect, useMemo, useState } from "react";
import { Box, Button, CircularProgress, TextField, Typography, Divider, Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Checkbox } from "@mui/material";
import styled from "styled-components";
import autenticaStore from "../../stores/autentica.store";
import http from "../../http";
import IComentario from "../../types/IComentario";
import IUser from "../../types/IUser";
import { mostrarMensagem } from "../../stores/mensagem.store";

const Container = styled(Box)<{ $light?: boolean }>`
    flex: 1;
    min-width: 320px;
    max-width: 95%;
    width: 95%;
    max-height: 45vh;
    overflow-y: auto;
    margin-top: 16px;
    padding: 16px;
    background: ${({ $light }) => ($light ? "rgba(255,255,255,0.6)" : "#290511ff")};
    border: ${({ $light }) => ($light ? "1px solid rgba(85, 8, 29, 0.16)" : "none")};
    border-radius: 6px;
    color: ${({ $light }) => ($light ? "#55081d" : "white")};

    /* Ensure scrollbar colors apply across browsers */
    scrollbar-color: ${({ $light }) => ($light ? "rgba(85, 8, 29, 0.35) #efe5d8" : "rgba(225, 169, 95, 0.4) #290511ff")};
    scrollbar-width: thin;

    @media (max-width: 1024px) {
        max-width: 95%;
        width: 95%;
    }

    /* Scrollbar styling scoped to this container (increased specificity) */
    &&::-webkit-scrollbar {
        width: 12px;
    }

    &&::-webkit-scrollbar-track {
        background: ${({ $light }) => ($light ? "#efe5d8" : "#290511ff")};
        border-radius: 10px;
        margin: 4px 2px;
    }

    &&::-webkit-scrollbar-thumb {
        background: ${({ $light }) => ($light ? "rgba(85, 8, 29, 0.35)" : "rgba(225, 169, 95, 0.4)")};
        border-radius: 10px;
        border: 2px solid ${({ $light }) => ($light ? "#efe5d8" : "#290511ff")};
    }

    &&::-webkit-scrollbar-thumb:hover {
        background: ${({ $light }) => ($light ? "rgba(85, 8, 29, 0.5)" : "rgba(225, 169, 95, 0.6)")};
    }
`;

const CommentRow = styled(Box)`
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 8px 0;
`;

const Meta = styled(Typography)<{ $light?: boolean }>`
    font-size: 12px;
    color: ${({ $light }) => ($light ? "rgba(85, 8, 29, 0.65)" : "#cfcfcf")};
`;

interface ComentariosProps {
    cardId: string | null;
    usuarioNome: string;
    usuarioId: string | number;
    origemTipo?: string;
    $light?: boolean;
}

export default function Comentarios({ cardId, usuarioNome, usuarioId, origemTipo = "CARD", $light = false }: ComentariosProps) {
    const light = $light;
    const corTexto = light ? "#55081d" : "white";
    const corMuted = light ? "rgba(85, 8, 29, 0.65)" : "#cfcfcf";
    const corDestaque = light ? "#55081d" : "#e1a95f";
    const corDestaqueHover = light ? "#6f102a" : "#c98c44";
    const corCampoBg = light ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.06)";
    const corDialogBg = light ? "#f7efe4" : "#290511ff";
    const corDivider = light ? "rgba(85, 8, 29, 0.15)" : "rgba(255,255,255,0.08)";
    const { usuario } = autenticaStore;
    const usuarioLogadoId = localStorage.getItem("userID") || "";
    const autorComentarioId = origemTipo === "PLANEJAMENTO" ? usuarioId : usuarioLogadoId;
    const [comentarios, setComentarios] = useState<IComentario[]>([]);
    const [usuarioLogadoNome, setUsuarioLogadoNome] = useState(usuario.login || localStorage.getItem("user") || "");
    const [loading, setLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [novoComentario, setNovoComentario] = useState("");
    const [novoDone, setNovoDone] = useState(false);
    const [novoConclusionDate, setNovoConclusionDate] = useState<string>("");
    const [papel, setPapel] = useState<string | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<IComentario | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [editTarget, setEditTarget] = useState<IComentario | null>(null);
    const [editText, setEditText] = useState("");
    const [editDone, setEditDone] = useState(false);
    const [editConclusionDate, setEditConclusionDate] = useState<string>("");
    const [isEditing, setIsEditing] = useState(false);
    const autorComentarioNome = origemTipo === "PLANEJAMENTO" ? usuarioNome : usuarioLogadoNome;

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

    const formatDateOnly = (iso?: string) => {
        if (!iso) return "";
        const d = new Date(iso);
        if (Number.isNaN(d.getTime())) return "";
        const dia = String(d.getDate()).padStart(2, "0");
        const mes = String(d.getMonth() + 1).padStart(2, "0");
        const ano = d.getFullYear();
        return `${dia}/${mes}/${ano}`;
    };

    const ordenarComentarios = (lista: IComentario[]) => {
        const asc = origemTipo === "PLANEJAMENTO";
        return lista.slice().sort((a, b) => {
            const aTime = new Date(a.createdAt).getTime();
            const bTime = new Date(b.createdAt).getTime();
            return asc ? aTime - bTime : bTime - aTime;
        });
    };

    const fetchComentarios = async () => {
        if (!cardId) return;
        setLoading(true);
        try {
            const { data } = await http.get<IComentario[]>(`comentario/filter?origemTipo=${origemTipo}&origemId=${cardId}`, axiosConfig);
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
        const payload = {
            origemTipo,
            origemId: cardId,
            usuario: autorComentarioNome,
            usuarioId: autorComentarioId,
            descricao: novoComentario.trim(),
            estimatedDate: null,
            conclusionDate: novoConclusionDate ? buildConclusionISO(novoConclusionDate) : null,
            done: Boolean(novoConclusionDate),
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
            setNovoDone(false);
            setNovoConclusionDate("");
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
        setEditDone(Boolean(comentario.done || comentario.conclusionDate));
        setEditConclusionDate(toInputDate(comentario.conclusionDate));
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
        const descricao = editText.trim();
        if (!descricao) return;
        setIsEditing(true);
        try {
            const payload: IComentario = {
                id: editTarget.id,
                origemTipo: editTarget.origemTipo || origemTipo,
                origemId: editTarget.origemId,
                descricao,
                createdAt: editTarget.createdAt,
                usuario: editTarget.usuario || autorComentarioNome,
                usuarioId: editTarget.usuarioId ?? autorComentarioId,
                estimatedDate: null,
                done: Boolean(editConclusionDate),
                conclusionDate: editConclusionDate ? buildConclusionISO(editConclusionDate) : null,
                
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
    }, [cardId, origemTipo]);

    const toInputDate = (iso?: string | null) => {
        if (!iso) return "";
        const d = new Date(iso);
        if (Number.isNaN(d.getTime())) return "";
        const offset = d.getTimezoneOffset();
        const local = new Date(d.getTime() - offset * 60000);
        return local.toISOString().slice(0, 10);
    };

    const buildConclusionISO = (dateStr: string) => {
        if (!dateStr) return null;
        const normalized = dateStr.includes("T") ? dateStr : `${dateStr}T00:01`;
        return `${normalized}:00`;
    };

    if (!cardId) return null;

    return (
        <Container $light={light}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="h6" color={corTexto}>{origemTipo === "PLANEJAMENTO" ? "Planejamento Estratégico" : "Comentários"}</Typography>
                <Button
                    variant="contained"
                    onClick={() => setShowForm((v) => !v)}
                    sx={{ backgroundColor: corDestaque, color: light ? "#fff" : "#000", fontWeight: 700, px: "7px", "&:hover": { backgroundColor: corDestaqueHover } }}
                >
                    {showForm ? "Fechar" : origemTipo === "PLANEJAMENTO" ? "Adicionar" : "Adicionar novo"}
                </Button>
            </Box>

            {showForm && (
                <Box display="flex" flexDirection="column" gap={1} mb={2}>
                    {origemTipo === "PLANEJAMENTO" ? (
                        <>
                            <Box display="flex" gap={1} alignItems="flex-start">
                                <Checkbox
                                    checked={novoDone}
                                    disabled
                                    sx={{ color: corDestaque, mt: 0.5, "&.Mui-checked": { color: corDestaque } }}
                                />
                                <TextField
                                    multiline
                                    minRows={3}
                                    maxRows={6}
                                    value={novoComentario}
                                    onChange={(e) => setNovoComentario(e.target.value)}
                                    placeholder="Digite seu comentário"
                                    InputProps={{ style: { color: corTexto } }}
                                    sx={{ background: corCampoBg, flex: 1 }}
                                />
                                <TextField
                                    type="date"
                                    label="Data de conclusão"
                                    value={novoConclusionDate}
                                    onChange={(e) => {
                                        const v = e.target.value;
                                        setNovoConclusionDate(v);
                                        setNovoDone(Boolean(v));
                                    }}
                                    InputLabelProps={{ shrink: true, sx: { color: corDestaque, "&.Mui-focused": { color: corDestaque } } }}
                                    InputProps={{
                                        sx: {
                                            color: corTexto,
                                            "& .MuiSvgIcon-root": { color: corDestaque },
                                        },
                                    }}
                                    sx={{
                                        background: corCampoBg,
                                        width: 220,
                                        "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
                                            borderColor: corDestaque,
                                        },
                                    }}
                                />
                            </Box>
                            {novoDone && novoConclusionDate && (
                                <Typography variant="body2" color={corMuted} sx={{ ml: 6.5 }}>
                                    Conclusão prevista: {formatDateOnly(novoConclusionDate)}
                                </Typography>
                            )}
                        </>
                    ) : (
                        <TextField
                            multiline
                            minRows={3}
                            maxRows={6}
                            value={novoComentario}
                            onChange={(e) => setNovoComentario(e.target.value)}
                            placeholder="Digite seu comentário"
                            InputProps={{ style: { color: corTexto } }}
                            sx={{ background: corCampoBg }}
                        />
                    )}
                    <Button
                        variant="contained"
                        onClick={handleAddComentario}
                        disabled={isSaving}
                        sx={{ alignSelf: "flex-end", backgroundColor: corDestaque, color: light ? "#fff" : "#000", fontWeight: 700, "&:hover": { backgroundColor: corDestaqueHover } }}
                    >
                        {isSaving ? "Salvando..." : "Salvar"}
                    </Button>
                </Box>
            )}

            {loading ? (
                <Box display="flex" justifyContent="center" py={3}>
                    <CircularProgress sx={{ color: corDestaque }} />
                </Box>
            ) : (
                <Box display="flex" flexDirection="column" gap={1}>
                    {comentarios.length === 0 && (
                        <Typography variant="body2" color={corMuted}>Nenhum comentário ainda.</Typography>
                    )}
                    {comentarios.map((c, idx) => (
                        <React.Fragment key={c.id}>
                            <CommentRow>
                                <Box display="flex" gap={1} alignItems="flex-start">
                                    {origemTipo === "PLANEJAMENTO" && (
                                        <Checkbox
                                            checked={Boolean(c.done)}
                                            disabled
                                            sx={{ color: corDestaque, p: 0.5, mt: -0.5, "&.Mui-checked": { color: corDestaque } }}
                                        />
                                    )}
                                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" gap={1} flex={1}>
                                        <Typography variant="body1" color={corTexto} sx={{ fontWeight: 500, flex: 1 }}>
                                            {c.descricao}
                                        </Typography>
                                        <Box display="flex" gap={1}>
                                            {canEdit(c) && (
                                                <IconButton size="small" aria-label="Editar comentário" onClick={() => handleRequestEdit(c)} sx={{ color: corMuted }}>
                                                    ✎
                                                </IconButton>
                                            )}
                                            {canDelete(c) && (
                                                <IconButton size="small" aria-label="Excluir comentário" onClick={() => handleRequestDelete(c)} sx={{ color: corMuted }}>
                                                    x
                                                </IconButton>
                                            )}
                                        </Box>
                                    </Box>
                                </Box>
                                {origemTipo !== "PLANEJAMENTO" && (
                                    <Meta $light={light}>
                                        {formatDate(c.createdAt)} • {c.usuario}
                                    </Meta>
                                )}
                                {origemTipo === "PLANEJAMENTO" && (
                                    <Typography variant="body2" color={corMuted} sx={{ ml: 4.5 }}>
                                        {c.conclusionDate ? `Conclusão: ${formatDateOnly(c.conclusionDate)}` : "Conclusão pendente"}
                                    </Typography>
                                )}
                            </CommentRow>
                            {idx < comentarios.length - 1 && <Divider sx={{ borderColor: corDivider }} />}
                        </React.Fragment>
                    ))}
                    
                </Box>
            )}

            <Dialog
                open={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                fullWidth
                maxWidth="xs"
                PaperProps={{ sx: { backgroundColor: corDialogBg, color: corTexto } }}
            >
                <DialogTitle sx={{ color: corTexto }}>Confirmar exclusão</DialogTitle>
                <DialogContent>
                    <Typography color={corTexto}>Deseja remover este comentário?</Typography>
                </DialogContent>
                <DialogActions sx={{ display: "flex", gap: 1 }}>
                    <Button onClick={() => setDeleteTarget(null)} disabled={isDeleting} sx={{ color: corTexto }}>Cancelar</Button>
                    <Button onClick={handleConfirmDelete} disabled={isDeleting} sx={{ fontWeight: 700, color: corDestaque }}>
                        {isDeleting ? "Removendo..." : "Remover"}
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog
                open={!!editTarget}
                onClose={() => setEditTarget(null)}
                fullWidth
                maxWidth="sm"
                PaperProps={{ sx: { backgroundColor: corDialogBg, color: corTexto } }}
            >
                <DialogTitle sx={{ color: corTexto }}>Editar comentário</DialogTitle>
                <DialogContent>
                    <TextField
                        fullWidth
                        multiline
                        minRows={3}
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        autoFocus
                        InputProps={{ style: { color: corTexto } }}
                        sx={{ background: corCampoBg }}
                    />
                    {origemTipo === "PLANEJAMENTO" && (
                        <Box display="flex" flexDirection="column" gap={1} mt={2}>
                            <TextField
                                type="date"
                                label="Data de conclusão"
                                value={editConclusionDate}
                                onChange={(e) => setEditConclusionDate(e.target.value)}
                                InputLabelProps={{ shrink: true, sx: { color: corDestaque, "&.Mui-focused": { color: corDestaque } } }}
                                InputProps={{
                                    sx: {
                                        color: corTexto,
                                        "& .MuiSvgIcon-root": { color: corDestaque },
                                    },
                                }}
                                sx={{
                                    background: corCampoBg,
                                    "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
                                        borderColor: corDestaque,
                                    },
                                }}
                            />
                            
                            
                        </Box>
                    )}
                </DialogContent>
                <DialogActions sx={{ display: "flex", gap: 1 }}>
                    <Button onClick={() => setEditTarget(null)} disabled={isEditing} sx={{ color: corTexto }}>Cancelar</Button>
                    <Button onClick={handleConfirmEdit} disabled={isEditing || !editText.trim()} sx={{ fontWeight: 700, color: corDestaque }}>
                        {isEditing ? "Salvando..." : "Salvar"}
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
}
